### Overview

Spark Comex is an enterprise-grade credit management platform for Brazilian importers, streamlining credit applications and operations with Chinese suppliers. It features multi-tier approval workflows, advanced document management, real-time analytics, and robust role-based access control. The platform aims to be a comprehensive solution for international trade finance.

### User Preferences

Preferred communication style: Simple, everyday language.

### System Architecture

**Frontend:**
-   **Framework**: React 18 with TypeScript and Vite.
-   **Routing**: Wouter for lightweight client-side routing with protected routes.
-   **State Management**: TanStack Query v5 for server state with optimistic updates.
-   **UI Framework**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling and custom theming.
-   **Form Handling**: React Hook Form with Zod validation.
-   **Internationalization**: Complete 4-language support (PT/EN/ZH/ES) with React Context.

**Backend:**
-   **Runtime**: Node.js with TypeScript and Express.js.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Authentication**: Session-based with PostgreSQL store and bcrypt hashing.
-   **API Design**: RESTful endpoints with role-based access control.
-   **File Handling**: Secure document upload system with validation and scanning.

**Core Features & Components:**
-   **Multi-Tier User System**: Four distinct roles (Importador, Admin, Financeira, Super Admin) with granular access control.
-   **Advanced Authentication & Security**: Session-based auth, password hashing, Brazilian CNPJ validation, role-based access.
-   **Sophisticated Credit Workflow**: A 4-tier approval process (Importer → Admin → Financeira → Admin) with multi-step forms, real-time document validation, and dynamic credit management.
-   **Advanced Document Management**: Supports multiple file types, real-time validation, security scanning, and categorization.
-   **Professional Dashboard System**: Role-specific dashboards with real-time metrics, interactive charts, and activity tracking.
-   **Enterprise-Grade UI Framework**: Consistent design system, responsive layouts, and Brazilian-specific input components.
-   **Internationalization System**: Comprehensive support for Portuguese, English, Chinese, and Spanish.
-   **Comprehensive Import Management**: Includes cargo tracking, multiple product support, and financial previews.
-   **Supplier Management**: Integrated Chinese supplier registration and management.
-   **User Profile Management**: Settings page with avatar upload and preferences.
-   **Credit Score Analysis**: Integration with external APIs (Score QUOD, Cadastro PJ Plus) for credit and company data, including CND (Certidão Negativa de Débitos) integration.
-   **Modular Communication System**: Document requests, support tickets, and internal messaging for bidirectional communication.
-   **Payment Workflow System**: Management of payment schedules, receipts, and supplier bank details.

**Project Structure:**
-   `client/`: Frontend React application.
-   `server/`: Backend Express.js application.
-   `shared/`: Shared types and schemas.
-   `migrations/`: Database migration files.

### External Dependencies

-   **Database**: Neon Database (serverless PostgreSQL).
-   **UI Libraries**: Radix UI, Tailwind CSS, Lucide React (icons).
-   **Development Tools**: TypeScript, ESLint, Prettier, Vite.
-   **Credit Analysis APIs**: Score QUOD, Cadastro PJ Plus.
-   **CND API**: Direct Data (for Certidão Negativa de Débitos).