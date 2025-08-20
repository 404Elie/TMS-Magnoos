import {
  users,
  projects,
  travelRequests,
  bookings,
  budgetTracking,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type TravelRequest,
  type InsertTravelRequest,
  type TravelRequestWithDetails,
  type Booking,
  type InsertBooking,
  type BudgetTracking,
  type InsertBudgetTracking,
  type ProjectWithBudget,
  type UserWithBudget,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(userData: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserRole(id: string, activeRole: string): Promise<User>;
  updateUserPassword(email: string, hashedPassword: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  
  // Travel request operations
  getTravelRequests(filters?: {
    requesterId?: string;
    travelerId?: string;
    projectId?: string;
    status?: string;
    pmId?: string; // For PM to see requests they need to approve
  }): Promise<TravelRequestWithDetails[]>;
  getTravelRequest(id: string): Promise<TravelRequestWithDetails | undefined>;
  createTravelRequest(request: InsertTravelRequest): Promise<TravelRequest>;
  updateTravelRequest(id: string, updates: Partial<TravelRequest>): Promise<TravelRequest>;
  
  // Booking operations
  getBookings(requestId?: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking>;
  
  // Budget operations
  getBudgetTracking(filters?: {
    userId?: string;
    projectId?: string;
    year?: number;
    month?: number;
  }): Promise<BudgetTracking[]>;
  createBudgetTracking(tracking: InsertBudgetTracking): Promise<BudgetTracking>;
  updateBudgetTracking(id: string, updates: Partial<BudgetTracking>): Promise<BudgetTracking>;
  
  // Analytics operations
  getUserBudgetSummary(userId: string, year: number): Promise<UserWithBudget | undefined>;
  getProjectBudgetSummary(projectId: string, year: number): Promise<ProjectWithBudget | undefined>;
  getDashboardStats(role: string, userId?: string): Promise<any>;
  
  // Admin delete operations for testing
  deleteTravelRequest(id: string): Promise<boolean>;
  deleteBooking(id: string): Promise<boolean>;
  deleteBookingsByTravelRequestId(requestId: string): Promise<void>;
  deleteAllTestData(): Promise<{ travelRequests: number; bookings: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, activeRole: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ activeRole: activeRole as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(email: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  // Project operations
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(asc(projects.name));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  // Travel request operations
  async getTravelRequests(filters?: {
    requesterId?: string;
    travelerId?: string;
    projectId?: string;
    status?: string;
    pmId?: string;
  }): Promise<TravelRequestWithDetails[]> {
    let query = db
      .select()
      .from(travelRequests)
      .leftJoin(users, eq(travelRequests.requesterId, users.id))
      .leftJoin(projects, eq(travelRequests.projectId, projects.id));

    const conditions = [];
    if (filters?.requesterId) {
      conditions.push(eq(travelRequests.requesterId, filters.requesterId));
    }
    if (filters?.travelerId) {
      conditions.push(eq(travelRequests.travelerId, filters.travelerId));
    }
    if (filters?.projectId) {
      conditions.push(eq(travelRequests.projectId, filters.projectId));
    }
    if (filters?.status) {
      conditions.push(eq(travelRequests.status, filters.status as any));
    }
    if (filters?.pmId) {
      // For PM role, show requests that need approval (submitted status)
      conditions.push(eq(travelRequests.status, "submitted"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(travelRequests.createdAt));

    // Transform results to include related data
    const requestsWithDetails: TravelRequestWithDetails[] = [];
    for (const result of results) {
      const request = result.travel_requests;
      const requester = await this.getUser(request.requesterId);
      const traveler = await this.getUser(request.travelerId);
      const project = result.projects;
      const pmApprover = request.pmApprovedBy ? await this.getUser(request.pmApprovedBy) : undefined;
      const operationsCompleter = request.operationsCompletedBy ? await this.getUser(request.operationsCompletedBy) : undefined;
      const bookings = await this.getBookings(request.id);

      if (requester && traveler) {
        requestsWithDetails.push({
          ...request,
          requester,
          traveler,
          project: project || null,
          pmApprover,
          operationsCompleter,
          bookings,
        });
      }
    }

    return requestsWithDetails;
  }

  async getTravelRequest(id: string): Promise<TravelRequestWithDetails | undefined> {
    const [request] = await db.select().from(travelRequests).where(eq(travelRequests.id, id));
    if (!request) return undefined;

    const requester = await this.getUser(request.requesterId);
    const traveler = await this.getUser(request.travelerId);
    const [project] = await db.select().from(projects).where(eq(projects.id, request.projectId));
    const pmApprover = request.pmApprovedBy ? await this.getUser(request.pmApprovedBy) : undefined;
    const operationsCompleter = request.operationsCompletedBy ? await this.getUser(request.operationsCompletedBy) : undefined;
    const requestBookings = await this.getBookings(request.id);

    if (!requester || !traveler) return undefined;

    return {
      ...request,
      requester,
      traveler,
      project: project || null,
      pmApprover,
      operationsCompleter,
      bookings: requestBookings,
    };
  }

  async createTravelRequest(request: InsertTravelRequest): Promise<TravelRequest> {
    const [newRequest] = await db.insert(travelRequests).values(request).returning();
    return newRequest;
  }

  async updateTravelRequest(id: string, updates: Partial<TravelRequest>): Promise<TravelRequest> {
    const [updatedRequest] = await db
      .update(travelRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(travelRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Booking operations
  async getBookings(requestId?: string): Promise<Booking[]> {
    let query = db.select().from(bookings);
    
    if (requestId) {
      query = query.where(eq(bookings.requestId, requestId));
    }

    return await query.orderBy(desc(bookings.createdAt));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  // Budget operations
  async getBudgetTracking(filters?: {
    userId?: string;
    projectId?: string;
    year?: number;
    month?: number;
  }): Promise<BudgetTracking[]> {
    let query = db.select().from(budgetTracking);

    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(budgetTracking.userId, filters.userId));
    }
    if (filters?.projectId) {
      conditions.push(eq(budgetTracking.projectId, filters.projectId));
    }
    if (filters?.year) {
      conditions.push(eq(budgetTracking.year, filters.year));
    }
    if (filters?.month) {
      conditions.push(eq(budgetTracking.month, filters.month));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(budgetTracking.year), desc(budgetTracking.month));
  }

  async createBudgetTracking(tracking: InsertBudgetTracking): Promise<BudgetTracking> {
    const [newTracking] = await db.insert(budgetTracking).values(tracking).returning();
    return newTracking;
  }

  async updateBudgetTracking(id: string, updates: Partial<BudgetTracking>): Promise<BudgetTracking> {
    const [updatedTracking] = await db
      .update(budgetTracking)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgetTracking.id, id))
      .returning();
    return updatedTracking;
  }

  // Analytics operations
  async getUserBudgetSummary(userId: string, year: number): Promise<UserWithBudget | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const userBudgetTracking = await this.getBudgetTracking({ userId, year });
    const userRequests = await db
      .select()
      .from(travelRequests)
      .where(eq(travelRequests.travelerId, userId));

    return {
      ...user,
      budgetTracking: userBudgetTracking,
      requestsAsTraveler: userRequests,
    };
  }

  async getProjectBudgetSummary(projectId: string, year: number): Promise<ProjectWithBudget | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return undefined;

    const projectBudgetTracking = await this.getBudgetTracking({ projectId, year });
    const projectRequests = await db
      .select()
      .from(travelRequests)
      .where(eq(travelRequests.projectId, projectId));

    return {
      ...project,
      budgetTracking: projectBudgetTracking,
      travelRequests: projectRequests,
    };
  }

  async getDashboardStats(role: string, userId?: string): Promise<any> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (role === "manager") {
      // Manager stats - their own requests
      const totalRequests = await db
        .select({ count: sql<number>`count(*)` })
        .from(travelRequests)
        .where(eq(travelRequests.requesterId, userId!));

      const pendingRequests = await db
        .select({ count: sql<number>`count(*)` })
        .from(travelRequests)
        .where(and(
          eq(travelRequests.requesterId, userId!),
          eq(travelRequests.status, "submitted")
        ));

      const approvedRequests = await db
        .select({ count: sql<number>`count(*)` })
        .from(travelRequests)
        .where(and(
          eq(travelRequests.requesterId, userId!),
          eq(travelRequests.status, "pm_approved")
        ));

      const completedRequests = await db
        .select({ count: sql<number>`count(*)` })
        .from(travelRequests)
        .where(and(
          eq(travelRequests.requesterId, userId!),
          eq(travelRequests.status, "operations_completed")
        ));

      return {
        totalRequests: totalRequests[0]?.count || 0,
        pendingRequests: pendingRequests[0]?.count || 0,
        approvedRequests: approvedRequests[0]?.count || 0,
        completedRequests: completedRequests[0]?.count || 0,
      };
    }

    if (role === "pm") {
      // PM stats - all requests needing approval and project analytics
      const pendingApprovals = await db
        .select({ count: sql<number>`count(*)` })
        .from(travelRequests)
        .where(eq(travelRequests.status, "submitted"));

      const approvedMonth = await db
        .select({ count: sql<number>`count(*)` })
        .from(travelRequests)
        .where(and(
          eq(travelRequests.status, "pm_approved"),
          sql`EXTRACT(YEAR FROM ${travelRequests.pmApprovedAt}) = ${currentYear}`,
          sql`EXTRACT(MONTH FROM ${travelRequests.pmApprovedAt}) = ${currentMonth}`
        ));

      const activeProjects = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(eq(projects.status, "active"));

      return {
        pendingApprovals: pendingApprovals[0]?.count || 0,
        approvedMonth: approvedMonth[0]?.count || 0,
        activeProjects: activeProjects[0]?.count || 0,
        avgApprovalTime: "2.3h", // This would need more complex calculation
      };
    }

    if (role === "operations") {
      // Operations stats - booking and budget data
      const activeBookings = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(eq(bookings.status, "in_progress"));

      const monthlySpend = await db
        .select({ total: sql<number>`COALESCE(SUM(${bookings.cost}), 0)` })
        .from(bookings)
        .where(and(
          sql`EXTRACT(YEAR FROM ${bookings.createdAt}) = ${currentYear}`,
          sql`EXTRACT(MONTH FROM ${bookings.createdAt}) = ${currentMonth}`
        ));

      const pendingTasks = await db
        .select({ count: sql<number>`count(*)` })
        .from(travelRequests)
        .where(eq(travelRequests.status, "pm_approved"));

      return {
        activeBookings: activeBookings[0]?.count || 0,
        monthlySpend: monthlySpend[0]?.total || 0,
        budgetRemaining: 124680, // This would need budget calculation
        pendingTasks: pendingTasks[0]?.count || 0,
        costSavings: 8540, // This would need savings calculation
      };
    }

    return {};
  }

  // Admin delete operations for testing
  async deleteTravelRequest(id: string): Promise<boolean> {
    try {
      const result = await db.delete(travelRequests).where(eq(travelRequests.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting travel request:", error);
      return false;
    }
  }

  async deleteBooking(id: string): Promise<boolean> {
    try {
      const result = await db.delete(bookings).where(eq(bookings.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting booking:", error);
      return false;
    }
  }

  async deleteBookingsByTravelRequestId(requestId: string): Promise<void> {
    try {
      await db.delete(bookings).where(eq(bookings.travelRequestId, requestId));
    } catch (error) {
      console.error("Error deleting bookings by travel request ID:", error);
      throw error;
    }
  }

  async deleteAllTestData(): Promise<{ travelRequests: number; bookings: number }> {
    try {
      // Delete all bookings first (to avoid foreign key constraints)
      const deletedBookings = await db.delete(bookings);
      
      // Delete all travel requests
      const deletedRequests = await db.delete(travelRequests);
      
      return {
        bookings: deletedBookings.rowCount || 0,
        travelRequests: deletedRequests.rowCount || 0
      };
    } catch (error) {
      console.error("Error deleting all test data:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
