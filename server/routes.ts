import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Import both auth systems - we'll choose which one to use based on environment
import { setupAuth as setupLocalAuth, isAuthenticated as isLocalAuthenticated } from "./auth";
import { setupAuth as setupReplitAuth, isAuthenticated as isReplitAuthenticated } from "./replitAuth";
import { insertTravelRequestSchema, insertBookingSchema, insertBudgetTrackingSchema } from "@shared/schema";
import { sql } from "drizzle-orm";
import { zohoService } from "./zohoService";
import { realEmailService } from "./realEmailService";
import { z } from "zod";
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fromZodError } from 'zod-validation-error';

// Validate email domain for company restriction
function validateCompanyEmail(email: string): boolean {
  const allowedDomains = ['@magnoos.com'];
  return allowedDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));
}

// Helper function to get or create default projects for sales and events
async function getOrCreateDefaultProject(type: string, name: string, description: string): Promise<string | null> {
  const projectId = `default-${type}`;
  
  try {
    // Check if project already exists
    let project = await storage.getProject(projectId);
    
    if (!project) {
      // Create the default project
      project = await storage.createProject({
        zohoProjectId: projectId, // Use same ID for Zoho reference
        name: name,
        description: description,
        budget: null,
        travelBudget: null,
        status: 'active'
      });
      console.log(`✅ Created default project: ${name} (${projectId})`);
    }
    
    return project.id;
  } catch (error) {
    console.error(`Failed to get/create default project ${type}:`, error);
    return null; // Return null if failed, will be handled by database constraints
  }
}

// Helper function to get role-based email recipients
async function getRoleBasedRecipients(eventType: 'request_submitted' | 'request_approved' | 'booking_completed', request?: any): Promise<{email: string, role: string}[]> {
  const allUsers = await storage.getAllUsers();
  const recipients: {email: string, role: string}[] = [];

  switch (eventType) {
    case 'request_submitted':
      // When PROJECT MANAGER (role: 'manager') submits request: BUSINESS UNIT MANAGERS (role: 'pm') get notified
      recipients.push(
        ...allUsers
          .filter(user => user.role === 'pm')
          .filter(user => user.email)
          .map(user => ({ email: user.email!, role: user.role }))
      );
      break;

    case 'request_approved':
      // When BUSINESS UNIT MANAGER approves request: ASSIGNED OPERATIONS TEAM gets notified
      if (request?.assignedOperationsTeam) {
        recipients.push(
          ...allUsers
            .filter(user => user.role === request.assignedOperationsTeam)
            .filter(user => user.email)
            .map(user => ({ email: user.email!, role: user.role }))
        );
      }
      break;

    case 'booking_completed':
      // When Operations completes booking: BOTH Business Unit Manager who approved AND Project Manager who created get notified
      if (request?.requester?.email) {
        recipients.push({ email: request.requester.email, role: 'requester' });
      }
      if (request?.pmApprovedBy) {
        const pmUser = await storage.getUser(request.pmApprovedBy);
        if (pmUser?.email) {
          recipients.push({ email: pmUser.email, role: 'pm' });
        }
      }
      break;
  }

  return recipients.filter(r => r.email); // Remove any without email
}

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

      // Admin always has access to everything
      if (user.role === 'admin') {
        req.userRole = user.activeRole || 'admin';
        req.userId = userId;
        next();
        return;
      }

      // For regular users, check role permissions
      const currentRole = user.role;
      
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
  // Choose authentication system based on environment
  // Use Replit Auth for published apps (.replit.app domains)
  // Use local auth for development (.replit.dev domains or localhost)
  const isPublishedApp = process.env.REPLIT_DEPLOYMENT === "1" || 
                        process.env.NODE_ENV === "production" ||
                        process.env.REPLIT_DOMAINS;
  
  console.log(`🔧 Environment check:`, {
    REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
    NODE_ENV: process.env.NODE_ENV,
    REPLIT_DOMAINS: !!process.env.REPLIT_DOMAINS,
    isPublishedApp
  });

  // Set up authentication and get the appropriate middleware
  let isAuthenticated: any;
  if (isPublishedApp) {
    console.log("🚀 Using Replit Auth for published app");
    setupReplitAuth(app);
    isAuthenticated = isReplitAuthenticated;
  } else {
    console.log("🔧 Using Local Auth for development");
    setupLocalAuth(app);
    isAuthenticated = isLocalAuthenticated;
  }

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
        id: project.id,
        name: project.name
      }));
      res.json(transformedProjects);
    } catch (error) {
      console.error("Error fetching Zoho projects:", error);
      res.status(500).json({ message: "Failed to fetch projects from Zoho" });
    }
  });

  // Fetch all projects from local database (for Projects page)
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const allProjects = await storage.getProjects();
      // Transform to include all project details for the Projects page
      const transformedProjects = allProjects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        created_date: project.createdAt?.toISOString(),
        end_date: null, // Add if needed in future
        zoho_project_id: project.zohoProjectId
      }));
      res.json(transformedProjects);
    } catch (error) {
      console.error("Error fetching projects from database:", error);
      res.status(500).json({ message: "Failed to fetch projects from database" });
    }
  });

  // Excel Project Import endpoint
  app.post('/api/projects/import-excel', isAuthenticated, requireRole(['pm', 'manager', 'admin']), async (req: any, res) => {
    try {
      const user = req.user;
      console.log('Excel project import initiated by:', user?.email);

      const filePath = path.join(process.cwd(), 'attached_assets', 'project_export_1520578000016496178_1758186486687.xlsx');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Excel file not found' });
      }

      // Read and parse Excel file securely
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validate and sanitize Excel data
      const projectSchema = z.object({
        'Project Name': z.string().min(1).max(500),
        'Project ID': z.union([z.string(), z.number()]).transform(val => String(val)),
        'Status': z.string().optional().default('Active'),
        'Description': z.string().optional().default(''),
        'Owner': z.string().optional().default(''),
        'Created Time': z.string().optional().default(''),
      });

      const validProjects = [];
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any;
          const validatedProject = projectSchema.parse(row);
          const projectId = parseInt(validatedProject['Project ID']);
          
          // Skip invalid project IDs
          if (isNaN(projectId)) {
            errors.push(`Row ${i + 2}: Invalid Project ID`);
            continue;
          }
          
          validProjects.push({
            id: projectId,
            name: validatedProject['Project Name'].trim(),
            status: validatedProject.Status || 'Active',
            description: validatedProject.Description?.trim() || '',
            owner: validatedProject.Owner?.trim() || '',
            createdTime: validatedProject['Created Time'] || ''
          });
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof z.ZodError ? fromZodError(error).toString() : 'Invalid data format'}`);
        }
      }

      if (errors.length > 0) {
        console.log('Excel parsing errors:', errors.slice(0, 10)); // Log first 10 errors
      }

      // Get existing projects from database
      const existingProjects = await storage.getProjects();
      const existingProjectIds = new Set(existingProjects.map(p => Number(p.zohoProjectId) || 0));

      // Find missing projects
      const missingProjects = validProjects.filter(project => !existingProjectIds.has(project.id));

      console.log(`Found ${validProjects.length} valid projects in Excel file`);
      console.log(`Found ${missingProjects.length} missing projects to add`);

      // Add missing projects to database
      const addedProjects = [];
      for (const project of missingProjects) {
        try {
          const newProject = await storage.createProject({
            zohoProjectId: String(project.id),
            name: project.name,
            description: project.description || `Imported from Excel - ${project.name}`,
            budget: null,
            travelBudget: null,
            status: project.status === 'Active' ? 'active' : 'inactive'
          });
          addedProjects.push(newProject);
        } catch (error) {
          console.error(`Error adding project ${project.id}:`, error);
          errors.push(`Failed to add project "${project.name}": ${error}`);
        }
      }

      res.json({
        success: true,
        totalProjectsInExcel: validProjects.length,
        existingProjects: existingProjects.length,
        missingProjectsFound: missingProjects.length,
        projectsAdded: addedProjects.length,
        addedProjects: addedProjects.map(p => ({ id: p.zohoProjectId, name: p.name })),
        errors: errors.length > 0 ? errors.slice(0, 20) : undefined // Limit error display
      });

    } catch (error) {
      console.error('Error importing projects from Excel:', error);
      res.status(500).json({ message: 'Failed to import projects from Excel file' });
    }
  });

  // Manual project sync from Zoho API
  app.post('/api/projects/sync-zoho', isAuthenticated, requireRole(['pm', 'manager', 'admin']), async (req: any, res) => {
    try {
      const user = req.user;
      console.log('Manual Zoho project sync initiated by:', user?.email);

      // Fetch projects from Zoho API using the existing zohoService
      const zohoProjects = await zohoService.getProjects();
      
      // Get existing projects from database
      const existingProjects = await storage.getProjects();
      const existingProjectIds = new Set(existingProjects.map(p => Number(p.zohoProjectId) || 0));
      
      // Find missing projects
      const missingProjects = zohoProjects.filter(project => !existingProjectIds.has(Number(project.id)));
      
      console.log(`Found ${zohoProjects.length} projects from Zoho API`);
      console.log(`Found ${missingProjects.length} missing projects to add`);
      
      // Add missing projects to database
      const addedProjects = [];
      for (const project of missingProjects) {
        try {
          const newProject = await storage.createProject({
            zohoProjectId: String(project.id),
            name: project.name,
            description: project.description || `Synced from Zoho - ${project.name}`,
            budget: null,
            travelBudget: null,
            status: project.status?.toLowerCase() === 'active' ? 'active' : 'inactive'
          });
          addedProjects.push(newProject);
        } catch (error) {
          console.error(`Error adding project ${project.id}:`, error);
        }
      }
      
      res.json({
        success: true,
        totalZohoProjects: zohoProjects.length,
        existingProjects: existingProjects.length,
        missingProjectsFound: missingProjects.length,
        projectsAdded: addedProjects.length,
        addedProjects: addedProjects.map(p => ({ id: p.zohoProjectId, name: p.name }))
      });
      
    } catch (error) {
      console.error('Error syncing projects from Zoho:', error);
      res.status(500).json({ message: 'Failed to sync projects from Zoho API' });
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

      const validRoles = ['manager', 'pm', 'operations_ksa', 'operations_uae'];
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
        role: z.enum(['manager', 'pm', 'operations_ksa', 'operations_uae', 'admin']),
        annualTravelBudget: z.string().optional()
      });

      const userData = userSchema.parse(req.body);
      
      // Validate company email domain - TEMPORARILY DISABLED FOR TESTING
      // if (!validateCompanyEmail(userData.email)) {
      //   return res.status(400).json({ message: "User creation is restricted to company email addresses only" });
      // }
      
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
        role: z.enum(['manager', 'pm', 'operations_ksa', 'operations_uae', 'admin']).optional(),
        annualTravelBudget: z.string().optional()
      });

      const updates = userSchema.parse(req.body);
      
      // Validate company email domain if email is being updated
      if (updates.email && !validateCompanyEmail(updates.email)) {
        return res.status(400).json({ message: "Email updates are restricted to company email addresses only" });
      }
      
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
      
      console.log(`Travel requests query - User: ${user?.email}, Role: ${user?.role}, needsApproval: ${req.query.needsApproval}, myRequestsOnly: ${req.query.myRequestsOnly}`);
      
      let filters: any = {};
      
      // Role-based filtering
      if (user?.role === 'manager') {
        filters.requesterId = userId; // Managers see only their requests
      } else if (user?.role === 'pm' || user?.role === 'admin') {
        // PMs and admins can see all requests OR only their own requests
        if (req.query.myRequestsOnly === 'true') {
          filters.requesterId = userId; // Show only their own requests
          console.log(`${user?.role.toUpperCase()} filtering for own requests only (requesterId=${userId})`);
        } else if (req.query.needsApproval === 'true') {
          console.log(`${user?.role.toUpperCase()} filtering for pending approvals only (status=submitted)`);
          filters.status = 'submitted'; // Filter for submitted status only
        }
        // If neither myRequestsOnly nor needsApproval is specified, show all requests
      } else if (user?.role === 'operations_ksa' || user?.role === 'operations_uae') {
        // Operations teams see only requests assigned to their team
        filters.assignedOperationsTeam = user.role;
        
        // Special handling for completed-rejected status query
        if (req.query.status === 'completed-rejected') {
          // Show both completed and rejected requests
          filters.status = 'completed-rejected';
          console.log(`${user?.role.toUpperCase()} filtering for completed/rejected requests (assignedOperationsTeam=${user.role})`);
        } else {
          // Default: show only approved requests waiting for operations
          filters.status = 'pm_approved';
          console.log(`${user?.role.toUpperCase()} filtering for assigned requests (assignedOperationsTeam=${user.role}, status=pm_approved)`);
        }
      }

      if (req.query.projectId) filters.projectId = req.query.projectId;
      if (req.query.status && req.query.status !== 'completed-rejected') {
        filters.status = req.query.status;
      } else if (req.query.status === 'completed-rejected') {
        // Pass the special flag to storage but don't set status filter
        filters.status = 'completed-rejected'; 
      }

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

  app.post('/api/travel-requests', isAuthenticated, requireRole(['manager', 'pm']), async (req: any, res) => {
    try {
      console.log("Received travel request data:", JSON.stringify(req.body, null, 2));
      
      // Parse and transform the data before validation
      let projectId = req.body.projectId === "" ? null : req.body.projectId;
      
      // Auto-assign project for sales and events purposes
      if (req.body.purpose === "sales" && !projectId) {
        projectId = await getOrCreateDefaultProject("sales", "Sales Activities", "All sales-related travel expenses");
      } else if (req.body.purpose === "event" && !projectId) {
        projectId = await getOrCreateDefaultProject("events", "Events & Conferences", "All event and conference-related travel expenses");
      }
      
      const transformedData = {
        ...req.body,
        requesterId: req.user.id,
        departureDate: new Date(req.body.departureDate),
        returnDate: new Date(req.body.returnDate),
        projectId: projectId,
      };
      
      const validatedData = insertTravelRequestSchema.parse(transformedData);
      
      // Ensure the traveler exists in our local database
      let traveler = await storage.getUserByZohoId(validatedData.travelerId);
      if (!traveler) {
        // Try to find the traveler in Zoho users and create local record
        try {
          const zohoUsers = await zohoService.getUsers();
          const zohoTraveler = zohoUsers.find(user => user.id === validatedData.travelerId);
          if (zohoTraveler) {
            // Check if user already exists by email or zohoUserId to prevent duplicates
            const existingUserByEmail = await storage.getUserByEmail(zohoTraveler.email || `${zohoTraveler.id}@magnoos.com`);
            const existingUserByZohoId = await storage.getUserByZohoId(String(zohoTraveler.id));
            
            if (existingUserByEmail) {
              traveler = existingUserByEmail;
            } else if (existingUserByZohoId) {
              traveler = existingUserByZohoId;
            } else {
              // Create the user in our local database
              // Parse the name from Zoho data properly
              const nameParts = zohoTraveler.name?.split(' ') || [];
              const firstName = nameParts[0] || zohoTraveler.email?.split('@')[0] || 'User';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              traveler = await storage.createUser({
                email: zohoTraveler.email || `${zohoTraveler.id}@magnoos.com`,
                firstName,
                lastName,
                role: 'manager', // Default role for Zoho users
                zohoUserId: String(zohoTraveler.id)
              });
            }
          } else {
            return res.status(400).json({ message: "Selected traveler not found" });
          }
        } catch (zohoError) {
          console.error("Error fetching Zoho user:", zohoError);
          return res.status(400).json({ message: "Unable to verify traveler" });
        }
      }

      // Handle project mapping and creation (if projectId is provided)
      let localProjectId = null;
      if (validatedData.projectId) {
        // First try to find project by Zoho ID
        let project = await storage.getProjectByZohoId(validatedData.projectId);
        if (!project) {
          // Try to find the project in Zoho projects and create local record
          try {
            const zohoProjects = await zohoService.getProjects();
            const zohoProject = zohoProjects.find(p => String(p.id) === validatedData.projectId);
            if (zohoProject) {
              // Create the project in our local database
              project = await storage.createProject({
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
        localProjectId = project.id; // Use the local project ID
      }

      // Update the travel request data to use local IDs instead of Zoho IDs
      const requestData = {
        ...validatedData,
        travelerId: traveler.id,  // Use the local database user ID
        projectId: localProjectId  // Use the local database project ID
      };
      const newRequest = await storage.createTravelRequest(requestData);
      
      // Send email notifications
      try {
        const requester = await storage.getUser(req.user.id);
        // traveler is already fetched above
        
        // Get role-based notification recipients for request submission
        const recipients = await getRoleBasedRecipients('request_submitted');

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
  app.patch('/api/travel-requests/:id/approve', isAuthenticated, requireRole(['pm', 'admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { assignedOperationsTeam } = req.body;
      
      const updates = {
        status: "pm_approved" as const,
        pmApprovedBy: req.user.id,
        pmApprovedAt: new Date(),
        assignedOperationsTeam: assignedOperationsTeam || null,
      };

      const updatedRequest = await storage.updateTravelRequest(id, updates);
      
      // Send approval email notifications
      try {
        const request = await storage.getTravelRequest(id);
        if (request && request.traveler && request.requester) {
          const approver = await storage.getUser(req.user.id);
          
          // Get role-based notification recipients for request approval
          const recipients = await getRoleBasedRecipients('request_approved', request);

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

  app.patch('/api/travel-requests/:id/reject', isAuthenticated, requireRole(['pm', 'admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const updates = {
        status: "pm_rejected" as const,
        pmApprovedBy: req.user.id,
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
  app.get('/api/bookings', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
    try {
      const { requestId } = req.query;
      const bookings = await storage.getBookings(requestId as string);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
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

  app.post('/api/travel-requests/:id/complete', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
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
            provider: booking.provider || undefined,
            bookingReference: booking.bookingReference || undefined,
            cost: Number(booking.cost || 0)
          }));
          
          // Get role-based notification recipients for booking completion
          const recipients = await getRoleBasedRecipients('booking_completed', request);

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
  app.get('/api/budget-tracking', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
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

  app.get('/api/budget-tracking/user/:userId', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
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

  app.get('/api/budget-tracking/project/:projectId', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
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
  app.post('/api/admin/test-email', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      console.log('🧪 Testing email notifications...');
      
      // Get business unit managers (role: 'pm')
      const recipients = await getRoleBasedRecipients('request_submitted');
      console.log('📧 Found recipients:', recipients);
      
      // Test travel request data
      const testRequest = {
        travelerName: 'Karim Fleifel',
        requesterName: 'Test User',
        destination: 'Riyadh, KSA',
        origin: 'Dubai, UAE',
        departureDate: '2024-09-25T10:00:00.000Z',
        returnDate: '2024-09-26T18:00:00.000Z',
        purpose: 'delivery',
        projectName: 'BAJ - Anti-Fraud Analytics'
      };
      
      if (recipients.length > 0) {
        console.log('📤 Sending test email notification...');
        const success = await realEmailService.sendTravelRequestNotification(testRequest, recipients);
        
        if (success) {
          console.log('✅ Test email sent successfully!');
          res.json({ 
            message: 'Test email sent successfully', 
            recipients: recipients.map(r => r.email),
            success: true
          });
        } else {
          console.log('❌ Test email failed to send');
          res.status(500).json({ message: 'Failed to send test email', success: false });
        }
      } else {
        console.log('⚠️  No business unit managers found');
        res.json({ 
          message: 'No business unit managers found (no users with role: pm)', 
          recipients: [],
          success: false
        });
      }
      
    } catch (error) {
      console.error('❌ Email test error:', error);
      res.status(500).json({ message: 'Email test failed', error: String(error) });
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

  // Employee Documents API Routes (Operations only)
  app.get('/api/employee-documents', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      // Only operations users can view documents
      if (user.role !== 'operations_ksa' && user.role !== 'operations_uae' && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Operations role required." });
      }

      const { employee } = req.query; // Optional employee filter parameter
      let documents = await storage.getAllEmployeeDocuments();
      
      // If employee parameter is provided, filter by that employee
      if (employee) {
        console.log(`Filtering documents for employee: ${employee}`);
        
        // Find the app user that matches the employee ID (could be Zoho ID, app UUID, or email)
        const allUsers = await storage.getAllUsers();
        const targetUser = allUsers.find(user => 
          user.zohoUserId === employee || 
          user.id === employee || 
          user.email === employee
        );
        
        if (targetUser) {
          console.log(`Found target user: ${targetUser.firstName} ${targetUser.lastName} (${targetUser.id})`);
          // Filter documents to only include those belonging to this user
          documents = documents.filter(doc => doc.userId === targetUser.id);
          console.log(`Filtered to ${documents.length} documents for user ${targetUser.id}`);
        } else {
          console.log(`No user found matching employee ID: ${employee}`);
          // If no matching user found, return empty array
          documents = [];
        }
      }
      
      // Enhance documents with user information
      const documentsWithUsers = await Promise.all(
        documents.map(async (doc) => {
          const docUser = await storage.getUser(doc.userId);
          return {
            ...doc,
            user: docUser ? {
              id: docUser.id,
              firstName: docUser.firstName,
              lastName: docUser.lastName,
              email: docUser.email,
              zohoUserId: docUser.zohoUserId
            } : null
          };
        })
      );
      
      res.json(documentsWithUsers);
    } catch (error) {
      console.error("Error fetching employee documents:", error);
      res.status(500).json({ message: "Failed to fetch employee documents" });
    }
  });

  app.post('/api/employee-documents', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      // Only operations users can create documents
      if (user.role !== 'operations_ksa' && user.role !== 'operations_uae' && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Operations role required." });
      }

      // Check if userId exists in local database or find by Zoho ID
      let localUserId = req.body.userId;
      
      // First check if this is already a local user ID
      let existingUser = await storage.getUser(localUserId);
      
      if (!existingUser) {
        // This might be a Zoho user ID, try to find existing user by Zoho ID first
        console.log(`User ${localUserId} not found as local ID, checking if it's a Zoho ID...`);
        
        try {
          // Check if we have a user with this Zoho ID
          existingUser = await storage.getUserByZohoId(localUserId);
          
          if (existingUser) {
            localUserId = existingUser.id;
            console.log(`Found existing user by Zoho ID: ${existingUser.firstName} ${existingUser.lastName} (${localUserId})`);
          } else {
            // If not found by Zoho ID, create a new user from Zoho data
            const zohoUsers = await zohoService.getUsers();
            const zohoUser = zohoUsers.find(u => u.id === localUserId);
            
            if (zohoUser) {
              console.log(`Found Zoho user: ${zohoUser.name}, creating local user...`);
              
              const newLocalUser = await storage.createUser({
                email: zohoUser.email || `${zohoUser.name?.replace(/\s+/g, '.')}@magnoos.com`,
                firstName: zohoUser.name?.split(' ')[0] || 'Unknown',
                lastName: zohoUser.name?.split(' ').slice(1).join(' ') || '',
                role: 'manager', // Default role
                zohoUserId: zohoUser.id, // Store Zoho ID for reference
              });
              
              localUserId = newLocalUser.id;
              console.log(`Created local user with ID: ${localUserId}`);
            } else {
              throw new Error(`User ${localUserId} not found in Zoho either`);
            }
          }
        } catch (zohoError) {
          console.error('Error finding/creating user from Zoho:', zohoError);
          return res.status(400).json({ 
            message: 'Selected user not found. Please refresh and try again.' 
          });
        }
      }

      // Convert date strings (YYYY-MM-DD) to proper Date objects for PostgreSQL
      const documentData = {
        ...req.body,
        userId: localUserId, // Use the local user ID
        issueDate: req.body.issueDate ? new Date(req.body.issueDate + 'T00:00:00.000Z') : new Date(),
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate + 'T00:00:00.000Z') : new Date(),
      };
      
      const document = await storage.createEmployeeDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating employee document:", error);
      res.status(500).json({ message: "Failed to create employee document" });
    }
  });

  app.put('/api/employee-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== 'operations_ksa' && user.role !== 'operations_uae' && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Operations role required." });
      }

      const { id } = req.params;
      const updates = req.body;
      const document = await storage.updateEmployeeDocument(id, updates);
      res.json(document);
    } catch (error) {
      console.error("Error updating employee document:", error);
      res.status(500).json({ message: "Failed to update employee document" });
    }
  });

  app.delete('/api/employee-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== 'operations_ksa' && user.role !== 'operations_uae' && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Operations role required." });
      }

      const { id } = req.params;
      await storage.deleteEmployeeDocument(id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee document:", error);
      res.status(500).json({ message: "Failed to delete employee document" });
    }
  });

  // Passport management endpoints
  app.get('/api/passports', isAuthenticated, async (req: any, res) => {
    try {
      const passports = await storage.getAllPassports();
      res.json(passports);
    } catch (error) {
      console.error("Error fetching passports:", error);
      res.status(500).json({ message: "Failed to fetch passports" });
    }
  });

  app.post('/api/passports', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
    try {
      const passportSchema = z.object({
        userId: z.string().min(1, "Employee is required"),
        passportNumber: z.string().min(1, "Passport number is required"),
        fullName: z.string().min(1, "Full name is required"),
        nationality: z.string().min(1, "Nationality is required"),
        dateOfBirth: z.string().min(1, "Date of birth is required"),
        placeOfBirth: z.string().min(1, "Place of birth is required"),
        gender: z.enum(["Male", "Female", "Other"]),
        issueDate: z.string().min(1, "Issue date is required"),
        expiryDate: z.string().min(1, "Expiry date is required"),
        issuingAuthority: z.string().min(1, "Issuing authority is required"),
        issuingCountry: z.string().min(1, "Issuing country is required"),
        personalNumber: z.string().optional(),
        notes: z.string().optional(),
      });

      const validatedData = passportSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(400).json({ message: "Selected employee not found" });
      }

      // Create passport record in employee_documents table
      const passportData = {
        userId: validatedData.userId,
        documentType: 'passport' as const,
        documentNumber: validatedData.passportNumber,
        issuingCountry: validatedData.issuingCountry,
        issueDate: new Date(validatedData.issueDate),
        expiryDate: new Date(validatedData.expiryDate),
        notes: validatedData.notes || null,
        documentData: {
          fullName: validatedData.fullName,
          nationality: validatedData.nationality,
          dateOfBirth: validatedData.dateOfBirth,
          placeOfBirth: validatedData.placeOfBirth,
          gender: validatedData.gender,
          issuingAuthority: validatedData.issuingAuthority,
          personalNumber: validatedData.personalNumber,
        }
      };

      const newPassport = await storage.createEmployeeDocument(passportData);
      res.status(201).json(newPassport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid passport data", errors: error.errors });
      }
      console.error("Error creating passport:", error);
      res.status(500).json({ message: "Failed to create passport" });
    }
  });

  // Visa management endpoints
  app.get('/api/visas', isAuthenticated, async (req: any, res) => {
    try {
      const visas = await storage.getAllVisas();
      res.json(visas);
    } catch (error) {
      console.error("Error fetching visas:", error);
      res.status(500).json({ message: "Failed to fetch visas" });
    }
  });

  app.post('/api/visas', isAuthenticated, requireRole(['operations_ksa', 'operations_uae']), async (req: any, res) => {
    try {
      const visaSchema = z.object({
        userId: z.string().min(1, "Employee is required"),
        passportId: z.string().min(1, "Passport is required"),
        visaNumber: z.string().min(1, "Visa number is required"),
        visaType: z.string().min(1, "Visa type is required"),
        issuingCountry: z.string().min(1, "Issuing country is required"),
        destinationCountry: z.string().min(1, "Destination country is required"),
        issueDate: z.string().min(1, "Issue date is required"),
        expiryDate: z.string().min(1, "Expiry date is required"),
        entryType: z.enum(["Single Entry", "Multiple Entry", "Transit"]),
        duration: z.string().optional(),
        issuingConsulate: z.string().optional(),
        applicationDate: z.string().optional(),
        approvalDate: z.string().optional(),
        feeAmount: z.string().optional(),
        feeCurrency: z.string().default("USD"),
        notes: z.string().optional(),
      });

      const validatedData = visaSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(400).json({ message: "Selected employee not found" });
      }

      // Check if passport exists
      const passport = await storage.getEmployeeDocument(validatedData.passportId);
      if (!passport || passport.documentType !== 'passport') {
        return res.status(400).json({ message: "Selected passport not found" });
      }

      // Create visa record in employee_documents table
      const visaData = {
        userId: validatedData.userId,
        documentType: 'visa' as const,
        documentNumber: validatedData.visaNumber,
        issuingCountry: validatedData.issuingCountry,
        issueDate: new Date(validatedData.issueDate),
        expiryDate: new Date(validatedData.expiryDate),
        notes: validatedData.notes || null,
        documentData: {
          passportId: validatedData.passportId,
          visaType: validatedData.visaType,
          destinationCountry: validatedData.destinationCountry,
          entryType: validatedData.entryType,
          duration: validatedData.duration,
          issuingConsulate: validatedData.issuingConsulate,
          applicationDate: validatedData.applicationDate,
          approvalDate: validatedData.approvalDate,
          feeAmount: validatedData.feeAmount,
          feeCurrency: validatedData.feeCurrency,
        }
      };

      const newVisa = await storage.createEmployeeDocument(visaData);
      res.status(201).json(newVisa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid visa data", errors: error.errors });
      }
      console.error("Error creating visa:", error);
      res.status(500).json({ message: "Failed to create visa" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
