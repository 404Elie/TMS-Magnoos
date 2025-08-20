# Travel Management System

## Overview

This is a full-stack enterprise travel management system with role-based access control. It handles travel requests, approvals, bookings, and budget tracking for Managers, Project Managers, and Operations roles. The system aims to provide a scalable, maintainable, and smooth user experience while maintaining strict access controls and data integrity.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### White Screen and Database Connection Issues Resolution (August 20, 2025)
- **Critical Issues Resolved**: 
  - Fixed admin login white screen blocking system usage
  - Fixed database connection termination during authentication
- **Root Causes**: 
  - Missing imports causing JavaScript runtime errors in App.tsx
  - Neon database connection timeouts during passport authentication
- **Fixed Issues**:
  - Missing `useTheme` import from ThemeContext
  - Missing `TooltipProvider` import from ui/tooltip
  - Incorrect `AdminRoleSwitcher` import syntax (named vs default export)
  - Database connection errors in `getUser` and `getUserByEmail` methods
  - Passport deserializeUser error handling
  - Enhanced operations dashboard empty states with helpful messaging
- **Resolution Impact**: 
  - All roles now render properly with functional dashboards
  - Admin role switching works correctly
  - Authentication flow stable with proper error handling
  - Operations dashboards display informative content when empty
- **Testing Verified**: Login, authentication, role switching, and dashboard loading all functional
- **Enhancements Added**: 
  - Operations KSA and UAE tracking sections added to Business Manager dashboard
  - Full dashboard analytics and TypeScript error resolution completed
  - All role-based dashboards now fully functional with comprehensive monitoring capabilities

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
    - **Manager**: Creates travel requests, views team requests, manages projects.
    - **Project Manager**: Approves/rejects travel requests for their projects.
    - **Operations**: Handles bookings, completes travel arrangements, manages budgets, manages visa/passport documents.
- **Data Flow**: Authentication via Replit Auth; Travel Request flow (Manager submits → PM approves/rejects → Operations handles); Real-time budget updates.

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