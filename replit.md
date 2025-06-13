# Spark Comex - Brazilian Import Credit Platform

## Overview

Spark Comex is a full-stack web application designed for Brazilian importers to manage credit applications and import operations from China. The platform provides a comprehensive solution for handling credit limits, import tracking, reporting, and user management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Express sessions with PostgreSQL session store
- **Password Hashing**: bcrypt for secure password storage
- **Database Provider**: Neon Database (serverless PostgreSQL)

### Project Structure
- `client/` - Frontend React application
- `server/` - Backend Express.js application
- `shared/` - Shared types and schemas between frontend and backend
- `migrations/` - Database migration files

## Key Components

### Authentication System
- Session-based authentication using express-session
- PostgreSQL session storage via connect-pg-simple
- Password hashing with bcrypt
- Registration with Brazilian business validation (CNPJ)
- Form validation using Zod schemas

### Database Schema
- **Users Table**: Stores Brazilian importer company information including CNPJ, company name, contact details
- **Sessions Table**: Handles user session storage with automatic expiration
- Drizzle ORM provides type-safe database operations

### UI Component System
- Comprehensive design system using Shadcn/UI
- Custom components for Brazilian-specific inputs (CNPJ, phone formatting)
- Responsive design with mobile-first approach
- Toast notifications for user feedback
- Password input with visibility toggle

### API Layer
- RESTful API design with Express.js
- Centralized error handling middleware
- Request logging for API endpoints
- Type-safe API client using TanStack Query

## Data Flow

### Authentication Flow
1. User registers with company details and CNPJ validation
2. Credentials are validated against Zod schemas
3. Password is hashed using bcrypt before storage
4. Session is created and stored in PostgreSQL
5. Frontend receives user data via protected API endpoints

### Application State Management
1. TanStack Query manages server state and caching
2. React Hook Form handles local form state
3. Session state is persisted across browser refreshes
4. Optimistic updates provide immediate UI feedback

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Via @neondatabase/serverless with WebSocket support
- **Session Storage**: PostgreSQL table for express-session

### UI Dependencies
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **TypeScript**: Static type checking across the stack
- **ESLint/Prettier**: Code formatting and linting
- **Vite**: Fast development server and build tool

## Deployment Strategy

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- ESBuild compiles TypeScript backend to `dist/index.js`
- Static assets are served from the Express server

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session secret configuration for production security
- Development vs production environment detection

### Replit Integration
- Configured for Replit's autoscale deployment
- PostgreSQL module integration
- Development workflow with hot reloading

## Changelog

```
Changelog:
- June 13, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```