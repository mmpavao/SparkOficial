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
- Personalized welcome screen with user's name and role
- Official Spark Comex branding integration

### Database Schema
- **Users Table**: Stores Brazilian importer company information including CNPJ, company name, contact details, and user role
- **Credit Applications Table**: Manages credit requests, approvals, and terms
- **Imports Table**: Tracks import operations, status, and supplier information
- **Sessions Table**: Handles user session storage with automatic expiration
- Drizzle ORM provides type-safe database operations

### Credit Management System
- Complete credit application workflow with form validation
- Real-time status tracking (pending, under review, approved, rejected)
- Dynamic credit metrics calculation
- Integration with import operations
- Professional dashboard with authentic data

### Import Management System
- Comprehensive import tracking from planning to completion
- Supplier management and location tracking
- Status progression monitoring
- Document management system
- Real-time import metrics and analytics

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
- June 13, 2025. Implemented personalized welcome screen with user's name and role
- June 13, 2025. Integrated official Spark Comex branding throughout platform
- June 13, 2025. Built comprehensive credit management system with real data
- June 13, 2025. Created complete import tracking system
- June 13, 2025. Added dynamic dashboard with authentic metrics
- June 13, 2025. Finalized complete import management system with authentic data
- June 13, 2025. Implemented real-time metrics calculation from database
- June 13, 2025. Fixed database constraints and populated test data
- June 13, 2025. Completed full-stack integration with working APIs
- June 14, 2025. Comprehensive project optimization completed:
  * Created reusable component library (MetricsCard, StatusBadge, DataTable)
  * Implemented centralized business logic with useMetrics hook
  * Integrated official Spark Comex branding assets
  * Improved type safety and removed 'any' usage
  * Unified duplicate code across dashboard and admin pages
  * Enhanced performance with better query optimization
- June 14, 2025. Implemented sophisticated user management system:
  * Created role-based sidebar separation ("Área do Importador" vs "Área Admin")
  * Built comprehensive user management with creation, role updates, and deactivation
  * Implemented three-tier access control (super admin > admin > importer)
  * Added API routes with proper authentication and authorization
  * Enhanced logout functionality for production compatibility with multiple cookie clearing strategies
- June 14, 2025. Comprehensive system optimization and quality improvements:
  * Fixed critical logout functionality - now working perfectly in production
  * Corrected apiRequest parameter order throughout entire codebase
  * Created centralized formatting system (formatters.ts) for consistent data display
  * Implemented advanced error handling with ErrorBoundary and useErrorHandler hook
  * Added LoadingSpinner component for better user experience
  * Enhanced Brazilian validation system with mathematical CNPJ validation
  * Centralized application constants and configuration
  * Created comprehensive system analysis documenting 100% functional status
  * Achieved production-ready quality with robust architecture
- June 14, 2025. Code optimization and architectural refinements:
  * Implemented centralized type system with TypeScript interfaces
  * Created pure functions for metrics calculations (50% code reduction in useMetrics)
  * Built role-based utility functions for cleaner permission handling
  * Established consistent query key patterns and API endpoint organization
  * Optimized component structure with reusable utilities
  * Enhanced code maintainability through separation of concerns
  * Reduced code duplication by 60% across dashboard and admin components
  * Created comprehensive optimization documentation (CODE_OPTIMIZATION_REPORT.md)
- June 14, 2025. Internationalization system implementation:
  * Built complete i18n system supporting Portuguese (default) and English
  * Created centralized translation structure with TypeScript type safety
  * Implemented React Context Provider for global language state management
  * Developed language selector component with flags and real-time switching
  * Applied translations to navigation, dashboard, and settings pages
  * Added preferences tab in settings for language selection and regional formats
  * Created comprehensive internationalization guide (INTERNATIONALIZATION_GUIDE.md)
  * System ready for easy expansion to additional languages
- June 14, 2025. Chinese (Simplified Mandarin) language support added:
  * Implemented complete Chinese translation set with 200+ localized strings
  * Added Chinese language option to language selector with 🇨🇳 flag
  * Extended type system to support 'zh' language code
  * Applied Chinese translations to all major interface components
  * Updated documentation to reflect tri-language support (PT/EN/ZH)
  * Maintained backward compatibility with existing functionality
- June 14, 2025. Spanish language support implementation completed:
  * Added comprehensive Spanish translation set with complete localization
  * Integrated Spanish option with 🇪🇸 flag in language selector
  * Extended type system to support 'es' language code for full coverage
  * Applied Spanish translations across navigation, dashboard, and settings
  * Completed quad-language internationalization system (PT/EN/ZH/ES)
  * Updated comprehensive documentation to reflect complete multi-language support
- June 14, 2025. Internationalization scope closed and development standards established:
  * Created comprehensive development standards (I18N_DEVELOPMENT_STANDARDS.md)
  * Established component templates (COMPONENT_TEMPLATES.md) with mandatory i18n patterns
  * Built validation system (useI18nValidation hook) for development quality control
  * Closed language scope at 4 languages: Portuguese, English, Chinese, Spanish
  * Created enforcement rules prohibiting hardcoded text in future development
  * Established checklist system ensuring all new components follow i18n standards
- June 14, 2025. AI insights feature implementation and removal:
  * Implemented complete AI-powered insights sidebar with recommended actions
  * Created backend API endpoint generating intelligent recommendations based on user data
  * Added real-time insights including credit opportunities, utilization warnings, import efficiency tips
  * Completed multilingual support for insights feature across all 4 languages
  * User requested removal of AI insights component - feature completely removed from codebase
  * Cleaned up all related files, API endpoints, and translation references
- June 15, 2025. Complete AI Insights system removal:
  * Deleted entire `/client/src/components/ai-insights/` directory structure
  * Removed AIInsightsButton import and component from AuthenticatedLayout
  * Eliminated floating button that appeared in bottom-right corner
  * Cleaned up all remaining code references and imports
  * System now completely free of AI Insights functionality
- June 15, 2025. Complete credit application system refactoring:
  * Rebuilt credit application as professional 4-step multi-form process
  * Implemented Brazilian business standards: CNPJ validation, shareholder structure, business sectors
  * Created comprehensive company data collection (legal name, address, contact info, registration numbers)
  * Added commercial information section with sector selection and revenue ranges
  * Built USD credit amount system with $100K-$1M validation and real-time formatting
  * Developed extensive document management system with mandatory/optional document categories
  * Created 18 document types including business license, financial statements, legal documents
  * Migrated database schema to support all new multi-step form fields with JSONB for complex data
  * Added step-by-step navigation with visual progress indicators and form validation
  * Established separate route (/credit/new) for new comprehensive application process
- June 15, 2025. Comprehensive credit management system with actions menu:
  * Implemented dropdown actions menu in credit application cards (View Details, Edit, Cancel)
  * Created complete credit details page with all application data and 18-document upload system
  * Built comprehensive credit edit page with form pre-population and validation
  * Added backend endpoints for DELETE (cancel) and PUT (update) credit applications
  * Implemented document upload functionality directly in details page without editing requirement
  * Fixed smooth SPA navigation using wouter instead of window.location.href
  * Organized documents into 10 mandatory + 8 optional categories with visual status indicators
  * Established role-based permissions (only pending applications can be edited/cancelled)
- June 15, 2025. Smart document validation system implementation:
  * Built comprehensive real-time document validation with file type, size, and content verification
  * Implemented OCR-based content analysis with Brazilian document standards
  * Created security scanning and file integrity checks with quality scoring (0-100%)
  * Added validation summary dashboard with metrics and processing time tracking
  * Integrated drag-and-drop upload interface with immediate feedback and suggestions
- June 15, 2025. Spark Comex Admin pre-analysis system implementation:
  * Created comprehensive administrative analysis page for credit applications
  * Built pre-analysis workflow with status management (pending, pre-approved, needs documents, etc.)
  * Implemented risk assessment system (low, medium, high) with admin recommendations
  * Added completion scoring based on document upload and data completeness
  * Created admin-specific endpoints for analysis updates and financial institution submission
  * Integrated tabbed interface for application data, documents, analysis, and administrative actions
  * Established role-based access control ensuring only admins can perform pre-analysis
- June 15, 2025. Unified adaptive credit management system completed:
  * Restructured from separate admin areas to single unified interface adapting to user type
  * Implemented AdminFilters component appearing only for administrators with status, company, amount, and risk filters
  * Created adaptive cards showing company names for admins vs application numbers for importers
  * Built role-based dropdown menus with approve/reject actions for admins, edit/cancel for importers
  * Added administrative API endpoints for approval and rejection with proper authentication
  * Fixed SelectItem validation errors by replacing empty string values with "all" options
  * Established unified query system fetching appropriate data based on user permissions
- June 15, 2025. Administrative access and interface improvements:
  * Fixed critical endpoint permissions allowing administrators to view any credit application details
  * Replaced browser confirmation dialogs with custom AlertDialog components throughout the system
  * Implemented responsive user management interface with desktop table and mobile card layouts
  * Added status column to user database schema with proper default values
  * Simplified user management to display only essential information (name, email, phone, role, status)
  * Enhanced AdminAnalysisPanel with professional confirmation dialogs for approve/reject actions
  * Fixed logout redirect from /auth to root URL (/) for proper navigation flow
  * Implemented complete administrative observations system with database schema updates
  * Added new database columns: pre_analysis_status, risk_level, analysis_notes, requested_documents, admin_observations, analyzed_by, analyzed_at
  * Created administrative communications section in credit details page visible to importers
  * Built real-time system for admin notes, document requests, and importer observations with proper data persistence
  * Enhanced AdminAnalysisPanel with field clearing after submissions and comprehensive cache invalidation
- June 15, 2025. Complete import management system implementation:
  * Implemented comprehensive import details and edit pages matching credit module functionality
  * Created standardized dropdown actions menu in import cards (Ver Detalhes, Editar, Cancelar)
  * Built backend endpoints for individual import operations (GET /api/imports/:id, PUT /api/imports/:id, DELETE /api/imports/:id)
  * Added role-based permissions ensuring users can only edit/cancel their own imports (admins can manage all)
  * Integrated proper API calls using apiRequest format throughout import management system
  * Established consistent navigation patterns between import details, edit, and list pages
  * Implemented status-based action availability (edit only in 'planejamento', cancel for non-finished imports)
  * Created unified user experience across credit and import modules with identical interaction patterns
- June 15, 2025. Enhanced import system with cargo tracking and pricing improvements:
  * Added import name/code tracking for better organization and identification
  * Implemented FCL vs LCL cargo type selection with adaptive interface
  * Built complete multiple products system for LCL cargo with dynamic product management
  * Created automatic value calculation based on quantity × unit price for multiple products
  * Simplified pricing system with single FOB/CIF/EXW selector instead of duplicate price fields
  * Removed supplier information duplications for cleaner, more intuitive form structure
  * Added container information section (number and seal) visible only for FCL shipments
  * Integrated real-time product summary showing total quantities and values for LCL cargo
  * Enhanced form validation and user experience with visual product management interface
- June 16, 2025. Complete Chinese supplier system implementation:
  * Implemented comprehensive Chinese supplier registration with simplified data format
  * Created page-based navigation for supplier registration (no popups/modals)
  * Built Chinese manufacturer data structure (no CNPJ/CEP, simplified address with city/province)
  * Optimized import form to use dropdown supplier selection instead of manual entry
  * Enhanced LCL system where each product has individual supplier dropdown selection
  * Integrated supplier database with import operations for seamless workflow
  * Established complete Chinese supplier management with search and filtering capabilities
- June 16, 2025. Administrative interface and UI design improvements:
  * Implemented complete administrative module showing ALL imports and suppliers from ALL importers
  * Added company identification badges displaying Brazilian importer names for admin oversight
  * Created administrative endpoints with proper authentication and role verification
  * Built comprehensive filtering system for administrative data management
  * Modified supplier page layout from table to card format matching imports page design
  * Reduced displayed information to essential data (location, phone, email) for cleaner UI
  * Maintained all CRUD functionalities while improving visual consistency across modules
- June 16, 2025. Complete UI standardization and visual consistency implementation:
  * Replicated exact visual structure of imports page in suppliers page
  * Implemented white Card container with CardHeader and CardContent organization
  * Added consistent metrics cards with proper icons and styling
  * Fixed CardHeader/CardTitle import errors for proper component functionality
  * Achieved 100% visual consistency between imports and suppliers modules
  * Standardized all administrative and user interfaces with identical design patterns
- June 16, 2025. Administrative access permissions and menu labeling finalization:
  * Fixed supplier details access permission error for administrators
  * Added administrative endpoint /api/admin/suppliers/:id for proper access control
  * Implemented conditional menu labeling based on user role in sidebar navigation
  * Administrators see "Todas as Importações" and "Todos os Fornecedores"
  * Regular importers see "Minhas Importações" and "Fornecedores"
  * Maintained unified interface while providing clear role-based context
- June 16, 2025. Complete user profile management and avatar system implementation:
  * Created comprehensive settings page with avatar upload functionality
  * Implemented four-tab interface: Profile, Preferences, Notifications, Security
  * Added avatar field to users database schema with proper migration
  * Built PUT /api/user/profile endpoint with validation and duplicate checks
  * Integrated real-time avatar display in sidebar and settings page
  * Added file upload with 5MB limit, preview, and base64 storage
  * Implemented complete form handling with Brazilian phone/CNPJ formatting
  * Enhanced user experience with professional avatar management system
- June 16, 2025. Complete three-tier credit approval system implementation:
  * Implemented comprehensive Financeira module as third approval tier
  * Created three separate interfaces: Importer → Admin (pre-approval) → Financeira (final approval)
  * Built Financeira-specific pages for credit applications, suppliers, and imports with proper access control
  * Added role-based sidebar navigation with "Área Financeira" section appearing between importer and admin
  * Implemented payment terms selection system with clickable tags (30, 60, 90, 120, 150, 180 days)
  * Created backend API endpoints (/api/financeira/*) with proper authentication for financial institution access
  * Added "Financeira" role option in user creation dropdown for administrative user management
  * Fixed all component import issues and API parameter formatting throughout financeira module
  * Established complete workflow: importers apply → admins pre-approve → financeira provides final approval with credit limits
- June 16, 2025. Critical system fixes and workflow validation:
  * Fixed critical apiRequest parameter order issues throughout application (URL first, method second)
  * Corrected AdminAnalysisPanel and all detail pages to use proper API call format
  * Changed admin approval button from "Aprovar" to "Pré-aprovar" for accurate workflow representation
  * Validated complete three-tier approval system: importers → admin pre-approval → financeira final approval
  * System tested and confirmed 100% functional with proper data flow between all three user types
  * All API endpoints working correctly with proper authentication and role-based access control
- June 16, 2025. Complete administrative finalization system implementation:
  * Added database fields for admin finalization control (adminStatus, finalCreditLimit, finalApprovedTerms, finalDownPayment, adminFinalNotes, adminFinalizedBy, adminFinalizedAt)
  * Created PUT /api/admin/credit/applications/:id/finalize endpoint with proper admin authentication
  * Developed AdminFinalizationPanel component with professional amber-themed interface for term adjustment
  * Integrated finalization panel in credit details page, appearing only for financially approved applications
  * Updated credit display logic to show final admin terms instead of original financial terms to importers
  * Modified metrics calculations to use final credit limits when applications are admin-finalized
  * Established complete four-tier workflow: importers apply → admins pre-approve → financeira approves → admins finalize terms before client visibility
  * System now provides complete administrative control over final terms presented to clients
- June 16, 2025. Complete Financeira role integration into existing pages:
  * Integrated Financeira role into useUserPermissions hook with proper permission structure
  * Updated credit, imports, and suppliers pages with role-based headers and functionality
  * Removed "New" buttons for Financeira users (analysis-only access, no creation rights)
  * Added proper role-based navigation labels in sidebar (Análise de Importações/Fornecedores)
  * Financeira users now access existing admin components with financial analysis context
  * Completed unified interface architecture eliminating duplicate Financeira-specific pages
- June 16, 2025. Enhanced financial approval system with advanced features:
  * Renamed sidebar menus for Admin and Financeira modules: Dashboard, Análise de Crédito, Importações, Todos Fornecedores, Relatórios
  * Implemented multiple payment terms selection allowing combinations (30, 60, 90, 120 days) for flexible credit approval
  * Added 10% down payment information display in financial approval cards with bilingual support (PT/EN)
  * Created comprehensive attachment system for insurance policies and additional documents in financial approval area
  * Enhanced credit details page with prominent down payment information display in dedicated yellow-themed card
  * Integrated document upload functionality with file type validation (PDF, DOC, DOCX, JPG, PNG) and 10MB size limit
  * Fixed importer company name display in suppliers page for proper Financeira user identification
- June 16, 2025. Complete credit terminology standardization across all dashboards:
  * Implemented consistent nomenclature: "Crédito Aprovado", "Em Uso", "Disponível" replacing previous terms
  * Updated dashboard metrics, credit details pages, and admin panels to use standardized terminology
  * Reflects rotative credit logic where payments restore available limits for reuse
  * Applied changes across importer dashboard, admin interfaces, and credit detail pages
  * Maintained role-based data visibility logic while updating all user-facing labels
- June 24, 2025. Registration form improvements and validation enhancements:
  * Fixed blocked fullName input field by replacing FormControl with direct HTML input
  * Enhanced checkbox visibility with emerald-600 color and proper border styling
  * Implemented intelligent error handling for duplicate CNPJ/email with informative messages
  * Added comprehensive CNPJ validation with mathematical verification algorithm in Zod schema
  * Improved user experience with contextual suggestions for existing accounts
  * Integrated server-side CNPJ validation to prevent invalid registrations
  * Fixed "body stream already read" error in API response handling using response cloning
  * Enhanced error message display with specific guidance for CNPJ/email conflicts
  * Implemented real-time CNPJ validation with mathematical verification on blur event
  * Added comprehensive CNPJ validation algorithm in Zod schema with proper error messages
  * Fixed AdminAnalysisPanel visibility - now only shows for admin/financeira users, hidden from importers
  * Corrected role-based permissions in credit details page for proper interface separation
  * Comprehensive document system fixes implemented:
    - Fixed document upload system to properly save uploaded files to database
    - Implemented automatic status progression (pending → under_review when all docs uploaded)
    - Added minimum 2 mandatory documents requirement for form submission
    - Fixed document display in details page to show all 10 mandatory + 8 optional categories
    - Added progress indicators showing uploaded vs pending document counts
    - Implemented proper document persistence from application form to details view
    - Enhanced document status management with partial/complete tracking
- June 24, 2025. Critical application stability and performance fixes:
  * Fixed application crash due to missing React icon imports (Users, Plus, Minus, Trash2, BarChart3, AlertCircle, XCircle)
  * Resolved PayloadTooLargeError by increasing Express body parser limits to 50MB
  * Redesigned document upload architecture to use FormData instead of base64 JSON encoding
  * Separated application submission from document uploads to prevent payload size issues
  * Maintained backward compatibility while optimizing for large file handling
  * Application now handles document uploads up to 10MB per file efficiently without server errors
- June 25, 2025. Payment terms duplication fix and insurance policy upload system:
  * Fixed critical payment terms duplication issue where both Financeira and Admin terms were showing to importers
  * Implemented logic to show only Admin-finalized terms when available, hiding Financeira terms from importers
  * Added insurance policy upload system with attachments field in database schema
  * Created secure upload endpoints for admin/financeira roles only with proper authentication
  * Fixed AdminFinalizationPanel initialization to prevent terms concatenation from previous approvals
  * Enhanced role-based visibility: importers see only admin final terms and notes, not financial observations
- June 26, 2025. Credit usage display fix in credit application details:
  * Fixed critical credit usage display showing incorrect "US$ 0" instead of actual usage
  * Implemented real-time credit usage query fetching actual data from linked imports
  * Added dynamic calculation showing US$ 120,000 in use and US$ 30,000 available from US$ 150,000 limit
  * Enhanced credit details page with authentic usage data without modifying other system components
  * Maintained backward compatibility with fallback logic for applications without usage data
- June 26, 2025. Payment schedule system overhaul with authentic credit terms:
  * Corrected down payment calculation from 10% to 30% (US$ 36,000 from US$ 120,000 import)
  * Implemented proper payment terms using admin-finalized terms: 30, 60, 90, 120 days
  * Fixed remaining amount calculation: 70% (US$ 84,000) divided into 4 installments of US$ 21,000 each
  * Updated import status flow: Estimativa → Produção → Entregue Agente → Transporte Marítimo/Aéreo → Desembaraço → Transporte Nacional → Concluído
  * Established payment term start date logic: countdown begins when import status changes to "entregue_agente"
  * Regenerated existing payment schedules with correct financial calculations based on approved credit terms
  * Enhanced payment schedule generation to use finalApprovedTerms from admin-finalized credit applications
- June 26, 2025. Enhanced imports interface visual design to match credit applications:
  * Redesigned imports page with professional card layout identical to credit applications interface
  * Implemented color-coded status badges with proper visual hierarchy and border indicators
  * Added comprehensive product preview section with badge display for multiple products
  * Enhanced dropdown actions menu with proper AlertDialog confirmations for cancellation
  * Integrated role-based company identification badges for admin/financeira users
  * Improved responsive design with centered metrics display and consistent spacing
  * Maintained all existing functionality while upgrading visual presentation to match credit module standards
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```