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

### August 1, 2025
- **Role-Based Email Notifications Implemented**: Comprehensive automatic email system where new users receive emails based on their role:
  - **Manager Role**: Only gets emails for their own travel requests when Operations completes bookings (not all managers get all emails)
  - **PM Role**: Gets emails when any Manager submits request AND when Operations completes bookings  
  - **Operations Role**: Gets emails when PM approves requests for booking coordination
  - System automatically includes all users of relevant roles without manual configuration
  - Prevents email spam by only sending relevant notifications to appropriate roles
  - Helper function `getRoleBasedRecipients()` handles all role-based logic centrally
- **Vibrant Light Mode Enhancement**: Completely redesigned light mode with vibrant company colors while maintaining perfect readability:
  - **Background**: Multi-color gradient using vivid teal, sunny yellow, and pure white for dynamic appearance
  - **Cards**: Gradient backgrounds from white to light vivid teal with enhanced shadows and teal borders
  - **Header**: Gradient styling with vivid teal accents and enhanced hover effects
  - **Form Elements**: Light teal backgrounds with electric blue focus states and smooth transitions
  - **Theme Toggle**: Vibrant electric blue moon icon with purple hover effects in light mode
  - **Buttons**: Enhanced hover states with gradient backgrounds and colorful shadows
  - Dark mode remains unchanged and perfect as requested
- **Travel Request Submission Fixed**: Completely resolved all validation and foreign key constraint issues for travel request submission
- **Automatic Zoho Data Sync**: System now automatically creates local database records for Zoho users and projects when needed
- **Dashboard Stats Bug Fixed**: Corrected pending approvals count to use `activeRole` instead of base `role` for accurate data display
- **PM Dashboard Visual Enhancement**: Upgraded statistics cards with stunning gradient designs using official Magnoos colors:
  - Pending Approvals: Orange to Coral gradient (#FF6F00 to #FF6F61)
  - Approved This Month: Teal to Lime gradient (#1ABC3C to #A6E05A)
  - Active Projects: Electric Blue to Purple gradient (#0032FF to #8A2BE2)
  - Avg Approval Time: Vivid Teal to Lime Green gradient (#00D9C0 to #A3E635)
- **Operations Dashboard Enhanced**: Removed Budget Remaining and Cost Savings cards, added colorful gradient styling matching PM dashboard design
- **Table Readability Fixed**: All white background tables converted to dark theme with proper contrast across Operations dashboard
- **Traveler Display Bug Fixed**: Resolved "Unknown User" issue by fixing database query logic and correcting user data (Elie Radi name was incorrectly stored as "Unknown User")
- **Complete Workflow Verification**: Manager → PM → Operations travel request flow is fully functional and tested
- **Electric Purple Tab Styling**: Consistent Electric Purple (#8A2BE2) for selected navigation tabs across the application
- **View Details Button Fixed**: Now opens the completion modal for viewing travel request details instead of being non-functional
- **Role-Based Email Notification System**: Fully functional automatic email delivery using Resend API:
  - **Manager Role**: Only receives emails for travel requests they created when Operations completes bookings
  - **PM Role**: Receives emails when (1) any Manager submits a request and (2) when Operations completes bookings
  - **Operations Role**: Receives emails when PM approves requests for booking coordination
  - **Request Created**: Automatically notifies all PMs and Operations when Manager submits travel request
  - **Request Approved**: Automatically notifies all Operations users when PM approves request
  - **Bookings Completed**: Automatically notifies only the specific Manager who made request, plus traveler and approving PM
  - Professional email templates with company Electric Blue to Purple gradient branding
  - Clean "Access Travel Management System" login buttons in all emails (no visible URLs)
  - Real email delivery to e.radi@magnoos.com for testing with potential minor delays
  - All notifications routed to test email while preserving original recipient information
  - Graceful error handling - workflow continues even if email notifications fail
- **Admin Delete Functionality**: Added comprehensive admin-only testing tools:
  - **Admin Panel**: Dedicated /admin route accessible only to admin@magnoos.com with intuitive interface
  - **Test Data Cleanup**: One-click deletion of all travel requests and bookings with confirmation dialog
  - **Individual Delete**: Admin API endpoints to delete specific travel requests or bookings
  - **Security**: All delete operations restricted to admin@magnoos.com only and logged to console
  - **Pre-deployment Testing**: Allows complete testing cycle followed by clean database for deployment
- **Visual Enhancement Update**: Enhanced all dashboard cards with stunning gradient designs and animations:
  - **Manager Dashboard**: Four gradient cards (Electric Blue→Purple, Orange→Coral, Teal→Lime, Vivid Teal→Lime Green)
  - **PM Dashboard**: Four gradient cards with matching color scheme and hover animations
  - **Operations Dashboard**: Three gradient cards (Electric Blue→Purple, Vivid Teal→Dark Blue, Orange→Coral)
  - **Card Animations**: Added hover scale effects, shimmer loading states, and icon hover animations
  - **Tab Styling**: Electric Purple gradient for selected tabs across all dashboards
  - **Accessibility**: Improved text contrast with drop shadows and enhanced opacity levels
  - **Color Adjustment**: Enhanced Monthly Expense Trend chart with Vivid Teal→Lime Green gradient for better readability and visual appeal

### January 31, 2025
- **Zoho Projects API Integration Complete**: Successfully integrated Zoho Projects API with separate authentication credentials
- **Fixed Infinite Loop Issue**: Resolved pagination bug that caused endless API calls by implementing proper end-of-data detection  
- **Real Project Data Loading**: System now loads 100+ real projects from Zoho and displays them in conditional dropdown
- **Conditional Project Selection**: Projects dropdown only appears when "Delivery" purpose is selected, working as designed
- **API Performance Optimized**: Added 50-page limit and better retry logic for reliable project data fetching
- **UI Theme Improvements**: Fixed CSS color variables, header text visibility, and tab styling for consistent dark blue theme
- **Tab Navigation Enhanced**: All tabs now remain dark with blue highlights when selected (no more white tabs)
- **Logout Flow Fixed**: Properly implemented logout routing that clears session and redirects to login page
- **Official Magnoos Company Colors Implemented**: Complete color palette transformation using management-provided brand colors
  - **Primary Colors**: Magnoos Electric Blue (#0032FF), Dark Blue (#000037), Black (#000000)
  - **Secondary Colors**: Light Gray (#DADADA), Dark Gray (#464646), White (#FFFFFF)  
  - **Accent Colors**: Orange (#FF6F00), Coral/Peach (#FF6F61), Teal/Turquoise (#1ABC3C)
  - **Complementary Colors**: Vivid Teal (#00D9C0), Lime Green (#A3E635), Lime Mint (#A6E05A)
  - **Additional Colors**: Vintage Yellow (#F8C94E), Sunny Yellow (#FFD700), Electric Purple (#8A2BE2)
- **Theme System Enhanced**: Light/dark theme support with creative color combinations across all components
- **Status Badge Updates**: Travel request status badges now use themed company colors for better visual hierarchy
- **Manager Dashboard Styled**: Statistics cards, buttons, tables, and form elements updated with brand colors
- **Header & Navigation**: Avatar gradients, theme toggle, and navigation elements aligned with company branding