# Travel Management System - Replit.md

## Overview

This is a full-stack travel management system built for enterprise use with role-based access control. The application manages travel requests, approvals, bookings, and budget tracking across different user roles (Manager, Project Manager, Operations).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom brand colors and CSS variables
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Database Provider**: Neon Database (serverless PostgreSQL)

### Key Components

#### Authentication System
- Integrated Replit Auth using OpenID Connect
- Role-based access control (Manager, PM, Operations)
- Session persistence with PostgreSQL storage
- Automatic user profile creation and management

#### Database Schema
- **Users**: Store user profiles with roles and metadata
- **Projects**: Project management with budget tracking
- **Travel Requests**: Complete travel request lifecycle management
- **Bookings**: Flight, hotel, and other travel bookings
- **Budget Tracking**: Project and user-level budget monitoring
- **Sessions**: Session storage for authentication

#### Role-Based Access Control
- **Manager**: Create travel requests, view team requests, manage projects
- **Project Manager**: Approve/reject travel requests for their projects
- **Operations**: Handle bookings, complete travel arrangements, manage budgets

#### UI Component System
- Consistent design system using Shadcn/ui
- Responsive design with mobile-first approach
- Accessible components with proper ARIA attributes
- Custom brand theming with Magnoos colors

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth → Session created → User profile retrieved/created
2. **Travel Request Flow**: Manager creates request → PM approves/rejects → Operations handles bookings
3. **Budget Tracking**: Real-time budget updates as bookings are made
4. **State Management**: TanStack Query handles API calls, caching, and optimistic updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **express**: Web framework
- **passport**: Authentication middleware
- **openid-client**: OpenID Connect implementation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form management
- **zod**: Schema validation
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution
- **esbuild**: Production bundling

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Node.js server with TypeScript execution via tsx
- Database migrations via Drizzle Kit
- Replit-specific development tools and overlays

### Production
- Frontend built with Vite and served statically
- Backend bundled with esbuild as ES modules
- PostgreSQL database with connection pooling
- Environment-based configuration (DATABASE_URL, SESSION_SECRET, etc.)

### Database Management
- Schema definitions in TypeScript using Drizzle
- Automatic migrations with `drizzle-kit push`
- PostgreSQL-specific features (enums, JSONB, UUID generation)

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared schema between client and server
2. **Type Safety**: End-to-end TypeScript with shared types and Zod validation
3. **Role-Based Security**: Server-side role validation with frontend route protection
4. **Modern Stack**: Latest React patterns with server state management
5. **Database-First**: Schema-driven development with type generation
6. **Authentication Integration**: Leveraging Replit's built-in auth system
7. **Responsive Design**: Mobile-first approach with accessible components

The system is designed to be scalable, maintainable, and provides a smooth user experience across different roles while maintaining strict access controls and data integrity.

## Recent Changes

### January 31, 2025
- **Zoho Projects API Integration Complete**: Successfully integrated Zoho Projects API with separate authentication credentials
- **Fixed Infinite Loop Issue**: Resolved pagination bug that caused endless API calls by implementing proper end-of-data detection  
- **Real Project Data Loading**: System now loads 100+ real projects from Zoho and displays them in conditional dropdown
- **Conditional Project Selection**: Projects dropdown only appears when "Delivery" purpose is selected, working as designed
- **API Performance Optimized**: Added 50-page limit and better retry logic for reliable project data fetching