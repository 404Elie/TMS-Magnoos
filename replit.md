# Travel Management System

## Overview

This is a full-stack enterprise travel management system with role-based access control. It handles travel requests, approvals, bookings, and budget tracking for Managers, Project Managers, and Operations roles. The system aims to provide a scalable, maintainable, and smooth user experience while maintaining strict access controls and data integrity.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Email Fixes & Rate Limiting (October 31, 2025)
- **Project Name Display in Emails**: Fixed bug where emails showed "Project specified" instead of actual project name
  - Now correctly fetches and displays the actual project name selected by the user
  - Applied to all travel request notification emails
- **Email Rate Limiting**: Added 1.5 second delay between sending emails to multiple recipients
  - Prevents hitting email service rate limits when sending to multiple Business Unit Managers
  - Applied to all 4 email notification types (Request Submitted, Approved, Rejected, Booking Completion)
  - Ensures reliable email delivery without service disruption

### Email Access Button Implementation (October 23, 2025)
- **"Access Travel Management System" Button in All Emails**:
  - All email notifications include a prominent button directing users to the published app
  - Button uses `REPLIT_DOMAINS` environment variable to automatically link to published app URL (not preview)
  - Button text color changed to blue (#0032FF) for visibility in both light and dark modes (Outlook compatibility)
  - Consistent styling across all 5 email types: gradient button (Electric Blue → Purple) matching brand colors
  - Email types covered:
    - Travel Request Submitted → Business Unit Managers
    - Travel Request Approved → Requester + Operations
    - Travel Request Rejected → Requester
    - Booking Completion → Requester
    - Password Reset → User
  - Security: Uses published app domain when `REPLIT_DOMAINS` is set, falls back to placeholder for development
  - Purpose: One-click access from email notifications directly to the travel management system

### Project Synchronization Update (October 22, 2025)
- **Project Deduplication by Name**:
  - Changed deduplication logic from Zoho Project ID to project name
  - Database now has 133 unique projects (all current Zoho projects)
  - Removed unique constraint on zoho_project_id, added unique constraint on name
  - Handles cases where Zoho reuses IDs for different projects
  - Project dropdown shows clean project names only (no descriptions with HTML tags)
  - All projects from Zoho API now properly synced to database

### Request Visibility Enhancement (October 21, 2025)
- **User Names on My Requests Pages**:
  - **Project Manager My Requests**: Now displays "Approved by:" and "Completed by:" names below each request for easy follow-up
  - **Business Unit Manager My Requests**: Added table columns "Approved By" and "Completed By" showing who handled each request
  - **Operations Requests Tab**: Shows "Created by:" (requester) and "Approved by:" names for all completed/rejected requests
  - All changes display existing backend data (requester, pmApprover, operationsCompleter) without any logic modifications
  - Names appear only when applicable (e.g., "Approved by:" only shows for approved requests)
  - Maintains identical look/feel and functionality - zero breaking changes
  - Purpose: Enables face-to-face follow-up between roles without adding contact features

### Multi-Destination Travel Support (October 21, 2025)
- **Multiple Destinations for Travel Requests**:
  - Added "Add Destination" button in new request forms (both PM and Manager dashboards)
  - Users can now add multiple destinations for a single travel request (e.g., Dubai → Abu Dhabi → Sharjah)
  - Backend stores destinations in array format while maintaining backward compatibility with single-destination field
  - All display components updated to show complete multi-destination routes
  - Helper functions formatDestinations() and formatRoute() provide consistent formatting across the app
  - Database Schema: Added `destinations` text array field, keeping `destination` field for backward compatibility
  - Insert Schema: Extended with `additionalDestinations` array to accept multiple destinations from frontend
  - UI: Clean add/remove functionality for destination inputs with proper react-hook-form integration
  - Architect-reviewed and verified production-ready

### Email & Password Improvements (October 15, 2025)
- **Email Lowercase Conversion**: 
  - Frontend: All email inputs automatically convert to lowercase using Zod transform to prevent mobile auto-capitalization conflicts
  - Backend: Email normalization (.toLowerCase().trim()) in register and login endpoints prevents duplicate accounts from case variations
  - Ensures consistent login experience across desktop and mobile devices
- **Forgot Password Feature**:
  - Added "Forgot Password?" button and dialog on login page
  - Secure password reset flow via email using Resend API
  - Generates random temporary password, hashes with scrypt before storage
  - Security: Always returns success message (prevents email enumeration attacks)
  - Email template includes temporary password and instructions to change it after login
  - API endpoint: POST /api/forgot-password
- **Change Password Feature**:
  - Added "Change Password" button in sidebar footer (all dashboards)
  - Dialog-based interface for changing password while logged in
  - Validates current password before allowing change
  - Requires minimum 8 characters for new password with confirmation
  - API endpoint: POST /api/change-password (authenticated)
  - Security: Verifies current password with timing-safe comparison, hashes new password with scrypt
- **Testing Verified**: E2E tests confirm email normalization, forgot password flow, and change password functionality all work correctly

### Approval System and UI Fixes (August 20, 2025)
- **Approval Functionality Fully Working**: 
  - Fixed critical JSON parsing error preventing Business Unit Manager approvals
  - Resolved HTTP method mismatch (POST→PATCH) between frontend and backend
  - Fixed authentication references (req.userId→req.user.id) in approval endpoints
  - Enhanced error handling with detailed response validation
  - Added proper frontend filtering to hide approved requests from pending section
- **Technical Fixes**:
  - All TypeScript errors resolved across server and client code
  - Dropdown closing behavior improved across all components
  - Form flow enhanced with logical field ordering (Purpose→Project)
  - Email notifications confirmed working with real deliveries to e.radi@magnoos.com
  - Server endpoints now properly handle PATCH requests for approve/reject actions
- **Role Permission Final Implementation**: 
  - **Business Unit Manager (role: "pm")**: Full approval powers with working approval workflow
  - **Project Manager (role: "manager")**: Submit-only access with clean PM dashboard
  - **Operations Teams**: Maintain booking and document management capabilities
  - All role permissions fully functional and tested

## System Architecture

### UI/UX Decisions
- **Design System**: Consistent design using Shadcn/ui, responsive with mobile-first approach, accessible components.
- **Theming**: Tailwind CSS with custom Magnoos brand colors, including vibrant light mode and a consistent dark mode.
- **Dashboard Enhancements**: Gradient designs for statistics cards with hover animations and improved text contrast.
- **Tab Styling**: Consistent Electric Purple for selected navigation tabs.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state, React Hook Form with Zod for forms.
- **Backend**: Node.js, Express.js, TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database (serverless PostgreSQL).
- **Authentication**: Replit Auth with OpenID Connect, including role-based access control (Manager, Project Manager, Operations) and session persistence.
- **Type Safety**: End-to-end TypeScript with shared types and Zod validation across client and server.
- **Monorepo Structure**: Single repository with shared schema between client and server.
- **Database Management**: Schema definitions in TypeScript using Drizzle, automatic migrations with `drizzle-kit push`.
- **Email Notifications**: Role-based automatic email notifications for travel request status updates (creation, approval, booking completion) using Resend API.
- **Document Management**: Visa/Passport management system for operations users with expiry tracking and CRUD operations.

### Feature Specifications
- **Authentication System**: Integrated Replit Auth, role-based access control, session persistence, automatic user profile creation.
- **Database Schema**: Manages Users, Projects (with budget), Travel Requests (lifecycle), Bookings (flight, hotel), Budget Tracking, and Sessions.
- **Role-Based Access Control**:
    - **Business Unit Manager (role: "pm")**: Full access to Manager dashboard - submit requests, approve/reject all requests, assign to operations teams, view operations dashboards.
    - **Project Manager (role: "manager")**: Limited access to PM dashboard - submit travel requests only (no approval powers).
    - **Operations KSA/UAE**: Handles bookings, completes travel arrangements, manages budgets, manages visa/passport documents.
- **Data Flow**: Authentication via Replit Auth; Travel Request flow (PM submits → Business Unit Manager approves/rejects → Operations handles); Real-time budget updates.

## External Dependencies

- **@neondatabase/serverless**: Serverless PostgreSQL connection.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management.
- **express**: Web framework.
- **passport**: Authentication middleware.
- **openid-client**: OpenID Connect implementation.
- **@radix-ui/***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **react-hook-form**: Form management.
- **zod**: Schema validation.
- **lucide-react**: Icon library.
- **Zoho Projects API**: Integration for loading project data.
- **Resend API**: For sending transactional emails.