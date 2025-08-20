# Travel Management System

## Overview

This is a full-stack enterprise travel management system with role-based access control. It handles travel requests, approvals, bookings, and budget tracking for Managers, Project Managers, and Operations roles. The system aims to provide a scalable, maintainable, and smooth user experience while maintaining strict access controls and data integrity.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Role Permission Final Implementation (August 20, 2025)
- **Complete Role Restructure Finalized**: 
  - **Business Unit Manager (role: "pm")**: Full approval powers with access to Manager dashboard including approval workflow, operations monitoring, and team assignment capabilities
  - **Project Manager (role: "manager")**: Submit-only access with clean PM dashboard containing only dashboard overview and submit request functionality
  - **Operations Teams**: Maintain booking and document management capabilities
- **Technical Implementation**:
  - Completely rebuilt PM dashboard with clean submit-only functionality
  - Removed all approval and operations access from Project Manager role
  - Maintained full approval workflow in Business Unit Manager dashboard
  - Fixed routing in App.tsx to correctly map roles to appropriate dashboards
  - Resolved all TypeScript errors and component dependencies
- **Final Architecture**: 
  - Business Unit Manager → Manager Dashboard (full powers)
  - Project Manager → PM Dashboard (submit only)
  - Operations → Operations Dashboard (booking/documents)
  - Role permissions fully aligned with business workflow requirements

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