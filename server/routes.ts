import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTravelRequestSchema, insertBookingSchema, insertBudgetTrackingSchema } from "@shared/schema";
import { zohoService } from "./zohoService";
import { z } from "zod";

// Middleware to check user role
const requireRole = (allowedRoles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Zoho integration endpoints
  app.get('/api/zoho/users', isAuthenticated, async (req: any, res) => {
    try {
      const zohoUsers = await zohoService.getUsers();
      // Transform to expected format for frontend
      const transformedUsers = zohoUsers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        status: user.status
      }));
      res.json(transformedUsers);
    } catch (error) {
      console.error("Error fetching Zoho users:", error);
      res.status(500).json({ message: "Failed to fetch users from Zoho" });
    }
  });

  app.get('/api/zoho/projects', isAuthenticated, async (req: any, res) => {
    try {
      const zohoProjects = await zohoService.getProjects();
      // Transform to expected format for frontend
      const transformedProjects = zohoProjects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        budget: project.budget,
        currency: project.currency
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
      const userId = req.user.claims.sub;
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

  // Travel request routes
  app.get('/api/travel-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

      const userId = req.user.claims.sub;
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
      const validatedData = insertTravelRequestSchema.parse(req.body);
      const requestData = {
        ...validatedData,
        requesterId: req.userId,
      };

      const newRequest = await storage.createTravelRequest(requestData);
      res.status(201).json(newRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stats = await storage.getDashboardStats(user.role, userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
