# Travel Management System

## Overview

This is a full-stack enterprise travel management system with role-based access control. It handles travel requests, approvals, bookings, and budget tracking for Managers, Project Managers, and Operations roles. The system aims to provide a scalable, maintainable, and smooth user experience while maintaining strict access controls and data integrity.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

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
- **Testing Verified**: E2E tests confirm email normalization works correctly and forgot password flow successfully sends reset emails

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