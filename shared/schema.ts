import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["manager", "pm", "operations_ksa", "operations_uae", "admin"]);

// Travel request status enum
export const requestStatusEnum = pgEnum("request_status", [
  "submitted",
  "pm_approved",
  "pm_rejected", 
  "operations_completed",
  "cancelled"
]);

// Booking status enum
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled"
]);

// Document type enum for visas and passports
export const documentTypeEnum = pgEnum("document_type", [
  "passport",
  "visa",
  "emirates_id",
  "iqama"
]);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("manager"),
  activeRole: userRoleEnum("active_role"), // For admin users to switch roles
  zohoUserId: varchar("zoho_user_id"),
  annualTravelBudget: decimal("annual_travel_budget", { precision: 10, scale: 2 }).default("15000"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee documents table (visas, passports, etc.)
export const employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentType: documentTypeEnum("document_type").notNull(),
  documentNumber: varchar("document_number").notNull(),
  issuingCountry: varchar("issuing_country").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  notes: text("notes"),
  attachmentUrl: varchar("attachment_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table (synced from Zoho)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zohoProjectId: varchar("zoho_project_id").unique().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  travelBudget: decimal("travel_budget", { precision: 10, scale: 2 }),
  status: varchar("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel requests table
export const travelRequests = pgTable("travel_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  travelerId: varchar("traveler_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id), // Optional, only required for delivery purpose
  origin: varchar("origin").notNull(), // Where they're traveling from
  destination: varchar("destination").notNull(), // Primary destination (backward compatibility)
  destinations: text("destinations").array(), // Multiple destinations support
  purpose: varchar("purpose").notNull(),
  customPurpose: varchar("custom_purpose"), // For when purpose is "other"
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date").notNull(),
  estimatedFlightCost: decimal("estimated_flight_cost", { precision: 8, scale: 2 }),
  estimatedHotelCost: decimal("estimated_hotel_cost", { precision: 8, scale: 2 }),
  estimatedOtherCost: decimal("estimated_other_cost", { precision: 8, scale: 2 }),
  actualTotalCost: decimal("actual_total_cost", { precision: 8, scale: 2 }),
  notes: text("notes"),
  status: requestStatusEnum("status").notNull().default("submitted"),
  pmApprovedBy: varchar("pm_approved_by").references(() => users.id),
  pmApprovedAt: timestamp("pm_approved_at"),
  pmRejectionReason: text("pm_rejection_reason"),
  assignedOperationsTeam: varchar("assigned_operations_team"), // 'operations_ksa' or 'operations_uae'
  operationsCompletedBy: varchar("operations_completed_by").references(() => users.id),
  operationsCompletedAt: timestamp("operations_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => travelRequests.id),
  type: varchar("type").notNull(), // 'flight', 'hotel', 'car_rental', 'other'
  provider: varchar("provider"),
  bookingReference: varchar("booking_reference"),
  cost: decimal("cost", { precision: 8, scale: 2 }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  bookedBy: varchar("booked_by").references(() => users.id),
  bookedAt: timestamp("booked_at"),
  details: jsonb("details"), // Store booking details as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget tracking table
export const budgetTracking = pgTable("budget_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  allocatedAmount: decimal("allocated_amount", { precision: 10, scale: 2 }),
  spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requestsAsRequester: many(travelRequests, { relationName: "requester" }),
  requestsAsTraveler: many(travelRequests, { relationName: "traveler" }),
  pmApprovals: many(travelRequests, { relationName: "pmApprover" }),
  operationsCompletions: many(travelRequests, { relationName: "operationsCompleter" }),
  bookings: many(bookings),
  budgetTracking: many(budgetTracking),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  travelRequests: many(travelRequests),
  budgetTracking: many(budgetTracking),
}));

export const travelRequestsRelations = relations(travelRequests, ({ one, many }) => ({
  requester: one(users, {
    fields: [travelRequests.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  traveler: one(users, {
    fields: [travelRequests.travelerId],
    references: [users.id],
    relationName: "traveler",
  }),
  project: one(projects, {
    fields: [travelRequests.projectId],
    references: [projects.id],
  }),
  pmApprover: one(users, {
    fields: [travelRequests.pmApprovedBy],
    references: [users.id],
    relationName: "pmApprover",
  }),
  operationsCompleter: one(users, {
    fields: [travelRequests.operationsCompletedBy],
    references: [users.id],
    relationName: "operationsCompleter",
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  request: one(travelRequests, {
    fields: [bookings.requestId],
    references: [travelRequests.id],
  }),
  bookedBy: one(users, {
    fields: [bookings.bookedBy],
    references: [users.id],
  }),
}));

export const budgetTrackingRelations = relations(budgetTracking, ({ one }) => ({
  user: one(users, {
    fields: [budgetTracking.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [budgetTracking.projectId],
    references: [projects.id],
  }),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  user: one(users, {
    fields: [employeeDocuments.userId],
    references: [users.id],
  }),
}));


// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelRequestSchema = createInsertSchema(travelRequests).omit({
  id: true,
  status: true,
  pmApprovedBy: true,
  pmApprovedAt: true,
  pmRejectionReason: true,
  operationsCompletedBy: true,
  operationsCompletedAt: true,
  actualTotalCost: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  status: true,
  bookedBy: true,
  bookedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetTrackingSchema = createInsertSchema(budgetTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TravelRequest = typeof travelRequests.$inferSelect;
export type InsertTravelRequest = z.infer<typeof insertTravelRequestSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type BudgetTracking = typeof budgetTracking.$inferSelect;
export type InsertBudgetTracking = z.infer<typeof insertBudgetTrackingSchema>;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;

// Extended types with relations
export type TravelRequestWithDetails = TravelRequest & {
  requester: User;
  traveler: User;
  project: Project;
  pmApprover?: User;
  operationsCompleter?: User;
  bookings: Booking[];
};

export type ProjectWithBudget = Project & {
  travelRequests: TravelRequest[];
  budgetTracking: BudgetTracking[];
};

export type UserWithBudget = User & {
  budgetTracking: BudgetTracking[];
  requestsAsTraveler: TravelRequest[];
};
