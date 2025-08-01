import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTravelRequestSchema, insertBookingSchema, insertBudgetTrackingSchema } from "@shared/schema";
import { zohoService } from "./zohoService";
import { realEmailService } from "./realEmailService";
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
        // Debug logging removed after investigation
        
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
      
      console.log(`Travel requests query - User: ${user?.email}, Role: ${user?.role}, needsApproval: ${req.query.needsApproval}`);
      
      let filters: any = {};
      
      // Role-based filtering
      if (user?.role === 'manager') {
        filters.requesterId = userId; // Managers see only their requests
      } else if (user?.role === 'pm' || user?.role === 'admin') {
        // PMs and admins see all requests but can filter by status
        if (req.query.needsApproval === 'true') {
          console.log(`${user?.role.toUpperCase()} filtering for pending approvals only (status=submitted)`);
          filters.status = 'submitted'; // Filter for submitted status only
        }
      }
      // Operations see all requests (no additional filters)

      if (req.query.projectId) filters.projectId = req.query.projectId;
      if (req.query.status) filters.status = req.query.status;

      console.log(`Applied filters:`, filters);
      const requests = await storage.getTravelRequests(filters);
      console.log(`Returned ${requests.length} requests, statuses: [${requests.map(r => r.status).join(', ')}]`);
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
        // Convert empty string projectId to null for database compatibility
        projectId: req.body.projectId === "" ? null : req.body.projectId,
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
            // Parse the name from Zoho data properly
            const nameParts = zohoTraveler.name?.split(' ') || [];
            const firstName = zohoTraveler.firstName || nameParts[0] || zohoTraveler.email?.split('@')[0] || 'User';
            const lastName = zohoTraveler.lastName || nameParts.slice(1).join(' ') || '';
            
            traveler = await storage.createUser({
              id: zohoTraveler.id,
              email: zohoTraveler.email || `${zohoTraveler.id}@magnoos.com`,
              firstName,
              lastName,
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

          const emailResult = await realEmailService.sendTravelRequestNotification(emailData, recipients);
          console.log(`Email notification result: ${emailResult ? 'SUCCESS' : 'FAILED'}`);
        } else {
          console.log("No email recipients found or missing user data");
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        console.error("Email error details:", emailError);
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
      
      // Send approval email notifications
      try {
        const request = await storage.getTravelRequest(id);
        if (request && request.traveler && request.requester) {
          const approver = await storage.getUser(req.userId);
          
          // Get notification recipients (requester, traveler, operations)
          const allUsers = await storage.getAllUsers();
          const recipients = [
            { email: request.requester.email, role: 'requester' },
            { email: request.traveler.email, role: 'traveler' },
            ...allUsers
              .filter(user => user.role === 'operations')
              .filter(user => user.email)
              .map(user => ({ email: user.email!, role: user.role }))
          ].filter(r => r.email);

          if (recipients.length > 0 && approver) {
            const emailData = {
              id: request.id,
              travelerName: `${request.traveler.firstName || ''} ${request.traveler.lastName || ''}`.trim() || request.traveler.email || 'Unknown',
              requesterName: `${request.requester.firstName || ''} ${request.requester.lastName || ''}`.trim() || request.requester.email || 'Unknown',
              destination: request.destination,
              origin: request.origin || 'Not specified',
              departureDate: new Date(request.departureDate).toISOString(),
              returnDate: new Date(request.returnDate).toISOString(),
              purpose: request.purpose,
              projectName: request.project?.name,
              pmApproverName: `${approver.firstName || ''} ${approver.lastName || ''}`.trim() || approver.email || 'Unknown'
            };

            await realEmailService.sendTravelRequestApprovalNotification(emailData, recipients);
          }
        }
      } catch (emailError) {
        console.error("Failed to send approval email notification:", emailError);
        // Don't fail the approval if email fails
      }
      
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
      console.log("Booking request body:", JSON.stringify(req.body, null, 2));
      
      // Transform cost to string if it's a number for decimal validation
      const transformedData = {
        ...req.body,
        cost: req.body.cost ? String(req.body.cost) : undefined
      };
      
      const validatedData = insertBookingSchema.parse(transformedData);
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
        console.log("Booking validation errors:", error.errors);
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
      
      // Send completion email notifications
      try {
        const request = await storage.getTravelRequest(id);
        if (request && request.traveler && request.requester) {
          const operationsUser = await storage.getUser(req.userId);
          
          // Get all bookings for this request to include in email
          const bookings = await storage.getBookings(id);
          const bookingDetails = bookings.map(booking => ({
            type: booking.type,
            provider: booking.provider,
            bookingReference: booking.bookingReference,
            cost: Number(booking.cost || 0)
          }));
          
          // Get notification recipients (requester, traveler, PM who approved)
          const recipients = [
            { email: request.requester.email, role: 'requester' },
            { email: request.traveler.email, role: 'traveler' }
          ];
          
          if (request.pmApprovedBy) {
            const pmUser = await storage.getUser(request.pmApprovedBy);
            if (pmUser?.email) {
              recipients.push({ email: pmUser.email, role: 'pm' });
            }
          }

          const validRecipients = recipients.filter(r => r.email);

          if (validRecipients.length > 0 && operationsUser) {
            const emailData = {
              id: request.id,
              travelerName: `${request.traveler.firstName || ''} ${request.traveler.lastName || ''}`.trim() || request.traveler.email || 'Unknown',
              requesterName: `${request.requester.firstName || ''} ${request.requester.lastName || ''}`.trim() || request.requester.email || 'Unknown',
              destination: request.destination,
              origin: request.origin || 'Not specified',
              departureDate: new Date(request.departureDate).toISOString(),
              returnDate: new Date(request.returnDate).toISOString(),
              purpose: request.purpose,
              projectName: request.project?.name,
              totalCost: totalCost,
              bookingDetails,
              operationsCompletedByName: `${operationsUser.firstName || ''} ${operationsUser.lastName || ''}`.trim() || operationsUser.email || 'Unknown'
            };

            await realEmailService.sendBookingCompletionNotification(emailData, validRecipients);
          }
        }
      } catch (emailError) {
        console.error("Failed to send completion email notification:", emailError);
        // Don't fail the completion if email fails
      }
      
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

  // Admin-only delete endpoints for testing
  const requireAdmin = (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user || user.email !== 'admin@magnoos.com') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Delete travel request (admin only)
  app.delete('/api/admin/travel-requests/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // First delete related bookings
      await storage.deleteBookingsByTravelRequestId(id);
      
      // Then delete the travel request
      const deleted = await storage.deleteTravelRequest(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Travel request not found" });
      }
      
      console.log(`🗑️ ADMIN DELETE: Travel request ${id} deleted by admin`);
      res.json({ message: "Travel request and related bookings deleted successfully" });
    } catch (error) {
      console.error("Error deleting travel request:", error);
      res.status(500).json({ message: "Failed to delete travel request" });
    }
  });

  // Delete booking (admin only)
  app.delete('/api/admin/bookings/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteBooking(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      console.log(`🗑️ ADMIN DELETE: Booking ${id} deleted by admin`);
      res.json({ message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Test email route (admin only)
  app.post('/api/test-email', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      console.log('\n🧪 TESTING EMAIL DELIVERY');
      const success = await realEmailService.sendEmail({
        to: 'e.radi@magnoos.com',
        subject: 'Test Email from Magnoos Travel System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0032FF;">🧪 Email Test</h2>
            <p>This is a test email to verify email delivery is working.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #0032FF;">
              <p style="margin: 0; color: #0032FF; font-weight: bold;">✅ If you receive this, email delivery is working!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Access Travel Management System
              </a>
            </div>
          </div>
        `
      });

      res.json({ success, message: success ? 'Test email sent successfully' : 'Test email failed' });
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ message: 'Test email failed', error: error.message });
    }
  });

  // Delete all test data (admin only) - nuclear option for complete cleanup
  app.delete('/api/admin/cleanup-test-data', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const counts = await storage.deleteAllTestData();
      
      console.log(`🗑️ ADMIN CLEANUP: Deleted ${counts.bookings} bookings and ${counts.travelRequests} travel requests`);
      res.json({ 
        message: "All test data deleted successfully",
        deleted: counts
      });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
      res.status(500).json({ message: "Failed to cleanup test data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
