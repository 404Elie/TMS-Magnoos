import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTravelRequestSchema, insertBookingSchema, insertBudgetTrackingSchema } from "@shared/schema";
import { zohoService } from "./zohoService";
import { emailService } from "./emailService";
import { z } from "zod";

// Middleware to check user role
const requireRole = (allowedRoles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }

      // For admin users, use activeRole if set, otherwise use role
      const currentRole = user.role === 'admin' ? (user.activeRole || 'admin') : user.role;
      
      if (!allowedRoles.includes(currentRole)) {
        return res.status(403).json({ message: "Access denied for this role" });
      }

      req.userRole = currentRole;
      req.userId = userId;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

export function registerRoutes(app: Express): Server {
  // Auth middleware
  setupAuth(app);

  // Auth routes are now handled in setupAuth function

  // Zoho integration endpoints
  app.get('/api/zoho/users', isAuthenticated, async (req: any, res) => {
    try {
      const zohoUsers = await zohoService.getUsers();
      
      if (zohoUsers.length > 0) {
        // Transform Zoho users to expected format
        const transformedUsers = zohoUsers.map(user => ({
          id: user.id,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          role: user.role,
          status: user.status
        }));
        res.json(transformedUsers);
      } else {
        // Fallback: Try to get users from our local database
        console.log("No Zoho users found, falling back to local users");
        const localUsers = await storage.getAllUsers();
        const transformedLocalUsers = localUsers.map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: 'Active'
        }));
        res.json(transformedLocalUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Final fallback: return current user
      try {
        const currentUser = await storage.getUser(req.user.id);
        if (currentUser) {
          res.json([{
            id: currentUser.id,
            name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Current User',
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: currentUser.role,
            status: 'Active'
          }]);
        } else {
          res.json([]);
        }
      } catch (fallbackError) {
        console.error("Fallback user fetch failed:", fallbackError);
        res.status(500).json({ message: "Failed to fetch any user data" });
      }
    }
  });

  app.get('/api/zoho/projects', isAuthenticated, async (req: any, res) => {
    try {
      const zohoProjects = await zohoService.getProjects();
      // Transform to expected format for frontend - return only id and name for cleaner dropdown
      const transformedProjects = zohoProjects.map(project => ({
        id: project.id || project.id_string,
        name: project.name
      }));
      res.json(transformedProjects);
    } catch (error) {
      console.error("Error fetching Zoho projects:", error);
      res.status(500).json({ message: "Failed to fetch projects from Zoho" });
    }
  });

  // Admin role switching
  app.post("/api/admin/switch-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validRoles = ['manager', 'pm', 'operations'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json({ message: "Role switched successfully", user: updatedUser });
    } catch (error) {
      console.error("Error switching role:", error);
      res.status(500).json({ message: "Failed to switch role" });
    }
  });

  // User Management Routes (Admin only)
  app.get('/api/users', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userSchema = z.object({
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        role: z.enum(['manager', 'pm', 'operations', 'admin']),
        annualTravelBudget: z.string().optional()
      });

      const userData = userSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userSchema = z.object({
        email: z.string().email().optional(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        role: z.enum(['manager', 'pm', 'operations', 'admin']).optional(),
        annualTravelBudget: z.string().optional()
      });

      const updates = userSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.params.id, updates);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.user.id;
      
      // Prevent admin from deleting themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Travel request routes
  app.get('/api/travel-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let filters: any = {};
      
      // Role-based filtering
      if (user?.role === 'manager') {
        filters.requesterId = userId; // Managers see only their requests
      } else if (user?.role === 'pm') {
        // PMs see all requests but can filter by status
        if (req.query.needsApproval === 'true') {
          filters.pmId = userId; // This will filter for submitted status
        }
      }
      // Operations see all requests (no additional filters)

      if (req.query.projectId) filters.projectId = req.query.projectId;
      if (req.query.status) filters.status = req.query.status;

      const requests = await storage.getTravelRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching travel requests:", error);
      res.status(500).json({ message: "Failed to fetch travel requests" });
    }
  });

  app.get('/api/travel-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const request = await storage.getTravelRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Travel request not found" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);

      // Role-based access control
      if (user?.role === 'manager' && request.requesterId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching travel request:", error);
      res.status(500).json({ message: "Failed to fetch travel request" });
    }
  });

  app.post('/api/travel-requests', isAuthenticated, requireRole(['manager']), async (req: any, res) => {
    try {
      console.log("Received travel request data:", JSON.stringify(req.body, null, 2));
      
      // Parse and transform the data before validation
      const transformedData = {
        ...req.body,
        requesterId: req.user.id,
        departureDate: new Date(req.body.departureDate),
        returnDate: new Date(req.body.returnDate),
      };
      
      const validatedData = insertTravelRequestSchema.parse(transformedData);
      
      // Ensure the traveler exists in our local database
      let traveler = await storage.getUser(validatedData.travelerId);
      if (!traveler) {
        // Try to find the traveler in Zoho users and create local record
        try {
          const zohoUsers = await zohoService.getUsers();
          const zohoTraveler = zohoUsers.find(user => user.id === validatedData.travelerId);
          if (zohoTraveler) {
            // Create the user in our local database
            traveler = await storage.createUser({
              id: zohoTraveler.id,
              email: zohoTraveler.email || `${zohoTraveler.id}@magnoos.com`,
              firstName: zohoTraveler.firstName || 'Unknown',
              lastName: zohoTraveler.lastName || 'User',
              role: 'manager' // Default role for Zoho users
            });
          } else {
            return res.status(400).json({ message: "Selected traveler not found" });
          }
        } catch (zohoError) {
          console.error("Error fetching Zoho user:", zohoError);
          return res.status(400).json({ message: "Unable to verify traveler" });
        }
      }

      // Ensure the project exists in our local database (if projectId is provided)
      if (validatedData.projectId) {
        let project = await storage.getProject(validatedData.projectId);
        if (!project) {
          // Try to find the project in Zoho projects and create local record
          try {
            const zohoProjects = await zohoService.getProjects();
            const zohoProject = zohoProjects.find(p => String(p.id) === validatedData.projectId);
            if (zohoProject) {
              // Create the project in our local database
              project = await storage.createProject({
                id: String(zohoProject.id),
                zohoProjectId: String(zohoProject.id),
                name: zohoProject.name,
                description: zohoProject.description || '',
                budget: null,
                travelBudget: null,
                status: 'active'
              });
            } else {
              return res.status(400).json({ message: "Selected project not found" });
            }
          } catch (zohoError) {
            console.error("Error fetching Zoho project:", zohoError);
            return res.status(400).json({ message: "Unable to verify project" });
          }
        }
      }

      const requestData = validatedData;
      const newRequest = await storage.createTravelRequest(requestData);
      
      // Send email notifications
      try {
        const requester = await storage.getUser(req.user.id);
        // traveler is already fetched above
        
        // Get notification recipients (PMs and Operations)
        const allUsers = await storage.getAllUsers();
        const recipients = allUsers
          .filter(user => user.role === 'pm' || user.role === 'operations')
          .filter(user => user.email) // Only users with email addresses
          .map(user => ({ email: user.email!, role: user.role }));

        if (recipients.length > 0 && requester && traveler) {
          const emailData = {
            id: newRequest.id,
            travelerName: `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || traveler.email || 'Unknown',
            requesterName: `${requester.firstName || ''} ${requester.lastName || ''}`.trim() || requester.email || 'Unknown',
            destination: validatedData.destination,
            origin: validatedData.origin || 'Not specified',
            departureDate: new Date(validatedData.departureDate).toISOString(),
            returnDate: new Date(validatedData.returnDate).toISOString(),
            purpose: validatedData.purpose,
            projectName: validatedData.projectId ? 'Project specified' : undefined
          };

          await emailService.sendTravelRequestNotification(emailData, recipients);
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request creation if email fails
      }
      
      res.status(201).json(newRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating travel request:", error);
      res.status(500).json({ message: "Failed to create travel request" });
    }
  });

  // PM approval endpoints
  app.post('/api/travel-requests/:id/approve', isAuthenticated, requireRole(['pm']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = {
        status: "pm_approved" as const,
        pmApprovedBy: req.userId,
        pmApprovedAt: new Date(),
      };

      const updatedRequest = await storage.updateTravelRequest(id, updates);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving travel request:", error);
      res.status(500).json({ message: "Failed to approve travel request" });
    }
  });

  app.post('/api/travel-requests/:id/reject', isAuthenticated, requireRole(['pm']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const updates = {
        status: "pm_rejected" as const,
        pmApprovedBy: req.userId,
        pmApprovedAt: new Date(),
        pmRejectionReason: reason,
      };

      const updatedRequest = await storage.updateTravelRequest(id, updates);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting travel request:", error);
      res.status(500).json({ message: "Failed to reject travel request" });
    }
  });

  // Operations booking endpoints
  app.get('/api/bookings', isAuthenticated, requireRole(['operations']), async (req: any, res) => {
    try {
      const { requestId } = req.query;
      const bookings = await storage.getBookings(requestId as string);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, requireRole(['operations']), async (req: any, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const bookingData = {
        ...validatedData,
        bookedBy: req.userId,
        bookedAt: new Date(),
        status: "in_progress" as const,
      };

      const newBooking = await storage.createBooking(bookingData);
      res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.post('/api/travel-requests/:id/complete', isAuthenticated, requireRole(['operations']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { totalCost } = req.body;
      
      const updates = {
        status: "operations_completed" as const,
        operationsCompletedBy: req.userId,
        operationsCompletedAt: new Date(),
        actualTotalCost: totalCost,
      };

      const updatedRequest = await storage.updateTravelRequest(id, updates);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error completing travel request:", error);
      res.status(500).json({ message: "Failed to complete travel request" });
    }
  });

  // Budget tracking endpoints (Operations only)
  app.get('/api/budget-tracking', isAuthenticated, requireRole(['operations']), async (req: any, res) => {
    try {
      const { userId, projectId, year, month } = req.query;
      const filters: any = {};
      
      if (userId) filters.userId = userId as string;
      if (projectId) filters.projectId = projectId as string;
      if (year) filters.year = parseInt(year as string);
      if (month) filters.month = parseInt(month as string);

      const budgetData = await storage.getBudgetTracking(filters);
      res.json(budgetData);
    } catch (error) {
      console.error("Error fetching budget tracking:", error);
      res.status(500).json({ message: "Failed to fetch budget tracking" });
    }
  });

  app.get('/api/budget-tracking/user/:userId', isAuthenticated, requireRole(['operations']), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { year = new Date().getFullYear() } = req.query;
      
      const userBudgetSummary = await storage.getUserBudgetSummary(userId, parseInt(year as string));
      res.json(userBudgetSummary);
    } catch (error) {
      console.error("Error fetching user budget summary:", error);
      res.status(500).json({ message: "Failed to fetch user budget summary" });
    }
  });

  app.get('/api/budget-tracking/project/:projectId', isAuthenticated, requireRole(['operations']), async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { year = new Date().getFullYear() } = req.query;
      
      const projectBudgetSummary = await storage.getProjectBudgetSummary(projectId, parseInt(year as string));
      res.json(projectBudgetSummary);
    } catch (error) {
      console.error("Error fetching project budget summary:", error);
      res.status(500).json({ message: "Failed to fetch project budget summary" });
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stats = await storage.getDashboardStats(user.activeRole || user.role, userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
