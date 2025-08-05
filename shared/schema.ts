import { pgTable, text, serial, timestamp, varchar, jsonb, index, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Brazilian importers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("importer"),
  status: text("status").notNull().default("active"),
  // Global financial terms for importers
  defaultAdminFeeRate: integer("default_admin_fee_rate"), // Percentage (e.g., 10 = 10%)
  defaultDownPaymentRate: integer("default_down_payment_rate"), // Percentage (e.g., 30 = 30%)
  defaultPaymentTerms: text("default_payment_terms"), // Comma-separated days (e.g., "30,60,90,120")
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  userType: z.enum(["importer", "customs_broker"]).default("importer"),
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .refine((cnpj) => {
      // Remove formatting
      const cleanCnpj = cnpj.replace(/\D/g, '');

      // Check if it has 14 digits
      if (cleanCnpj.length !== 14) {
        return false;
      }

      // Check if all digits are the same
      if (/^(\d)\1+$/.test(cleanCnpj)) {
        return false;
      }

      // Calculate verification digits
      let sum = 0;
      let weight = 5;

      // First verification digit
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanCnpj[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
      }

      let remainder = sum % 11;
      const firstDigit = remainder < 2 ? 0 : 11 - remainder;

      if (parseInt(cleanCnpj[12]) !== firstDigit) {
        return false;
      }

      // Second verification digit
      sum = 0;
      weight = 6;

      for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCnpj[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
      }

      remainder = sum % 11;
      const secondDigit = remainder < 2 ? 0 : 11 - remainder;

      return parseInt(cleanCnpj[13]) === secondDigit;
    }, { message: "CNPJ inválido" }),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos de uso e política de privacidade",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema for admin to create new admin users
export const createAdminUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["super_admin", "admin", "financeira", "importer"]).default("importer"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Credit applications table
export const creditApplications = pgTable("credit_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),

  // Company Information
  legalCompanyName: text("legal_company_name").notNull(),
  tradingName: text("trading_name"),
  cnpj: text("cnpj").notNull(),
  stateRegistration: text("state_registration"),
  municipalRegistration: text("municipal_registration"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),

  // Shareholders Information
  shareholders: jsonb("shareholders").notNull(), // Array of {name, cpf, percentage}

  // Commercial Information
  businessSector: text("business_sector").notNull(),
  annualRevenue: text("annual_revenue").notNull(),
  mainImportedProducts: text("main_imported_products").notNull(),
  mainOriginMarkets: text("main_origin_markets").notNull(),

  // Credit Information
  requestedAmount: text("requested_amount").notNull(), // USD amount
  currency: text("currency").notNull().default("USD"),
  productsToImport: text("products_to_import").array().notNull(),
  monthlyImportVolume: text("monthly_import_volume").notNull(),
  justification: text("justification").notNull(),

  // Documents
  requiredDocuments: jsonb("required_documents"), // Track uploaded required docs
  optionalDocuments: jsonb("optional_documents"), // Track uploaded optional docs
  documentsStatus: text("documents_status").notNull().default("pending"), // pending, partial, complete

  // Application Status
  status: text("status").notNull().default("draft"), // draft, pending, under_review, approved, rejected
  currentStep: integer("current_step").notNull().default(1), // 1-4 for form steps

  // Review Information
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  approvedAmount: text("approved_amount"),
  interestRate: text("interest_rate"),
  paymentTerms: text("payment_terms"),
  reviewNotes: text("review_notes"),

  // Administrative Analysis
  preAnalysisStatus: text("pre_analysis_status").default("pending"), // pending, under_review, pre_approved, needs_documents, needs_clarification
  riskLevel: text("risk_level").default("medium"), // low, medium, high
  analysisNotes: text("analysis_notes"), // Notas da análise administrativa
  requestedDocuments: text("requested_documents"), // Documentos solicitados pelo admin
  adminObservations: text("admin_observations"), // Observações para o importador
  analyzedBy: integer("analyzed_by").references(() => users.id),
  analyzedAt: timestamp("analyzed_at"),

  // Financial Institution Analysis
  financialStatus: text("financial_status").default("pending_financial"), // pending_financial, approved_financial, rejected_financial, needs_documents_financial
  creditLimit: text("credit_limit"), // Limite de crédito aprovado pela financeira
  approvedTerms: text("approved_terms"), // JSON array dos prazos aprovados [30, 60, 90, etc]
  financialNotes: text("financial_notes"), // Observações da financeira
  financialAnalyzedBy: integer("financial_analyzed_by").references(() => users.id),
  financialAnalyzedAt: timestamp("financial_analyzed_at"),

  // Admin Final Terms (after financial approval)
  adminStatus: text("admin_status").default("pending_admin"), // pending_admin, admin_finalized
  finalCreditLimit: text("final_credit_limit"), // Limite final definido pelo admin
  finalApprovedTerms: text("final_approved_terms"), // Prazos finais definidos pelo admin
  finalDownPayment: text("final_down_payment").default("10"), // Percentual de entrada final
  adminFee: text("admin_fee").default("0"), // Taxa administrativa em percentual (aplicada apenas no valor financiado)
  adminFinalNotes: text("admin_final_notes"), // Observações finais do admin
  adminFinalizedBy: integer("admin_finalized_by").references(() => users.id),
  adminFinalizedAt: timestamp("admin_finalized_at"),

  // Credit Usage Management
  usedCredit: text("used_credit").default("0"), // Currently used credit amount
  availableCredit: text("available_credit").default("0"), // Available credit (limit - used)

  // Financial Institution Attachments (apólices and additional documents)
  attachments: text("attachments"), // JSON array of attachment metadata

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),

  // Basic Information
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person"),
  contactName: text("contact_name"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),

  // Location Information
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  zipCode: text("zip_code"),

  // Business Information
  businessRegistration: text("business_registration"),
  taxId: text("tax_id"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  swiftCode: text("swift_code"),

  // Categories and Specialization
  productCategories: text("product_categories").array(),
  specialization: text("specialization"),
  certifications: text("certifications").array(),

  // Trading Terms
  preferredPaymentTerms: text("preferred_payment_terms"),
  minimumOrderValue: text("minimum_order_value"),
  leadTime: text("lead_time"),

  // Quality and Compliance
  qualityStandards: text("quality_standards").array(),
  exportLicenses: text("export_licenses").array(),

  // Relationship Status
  status: text("status").notNull().default("active"), // active, inactive, blacklisted
  rating: integer("rating").default(5), // 1-5 star rating
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit usage tracking table
export const creditUsage = pgTable("credit_usage", {
  id: serial("id").primaryKey(),
  creditApplicationId: integer("credit_application_id").references(() => creditApplications.id).notNull(),
  importId: integer("import_id").references(() => imports.id).notNull(),
  amountUsed: text("amount_used").notNull(), // Amount of credit used for this import
  status: text("status").notNull().default("reserved"), // reserved, confirmed, released
  reservedAt: timestamp("reserved_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin fees configuration table
export const adminFees = pgTable("admin_fees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  feePercentage: text("fee_percentage").notNull(), // Admin fee percentage
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment schedules table
export const paymentSchedules = pgTable("payment_schedules", {
  id: serial("id").primaryKey(),
  importId: integer("import_id").references(() => imports.id).notNull(),
  paymentType: text("payment_type").notNull(), // down_payment, installment
  dueDate: timestamp("due_date").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  installmentNumber: integer("installment_number"), // For installment payments
  totalInstallments: integer("total_installments"), // Total number of installments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentScheduleId: integer("payment_schedule_id").references(() => paymentSchedules.id).notNull(),
  importId: integer("import_id").references(() => imports.id).notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method"), // bank_transfer, pix, etc
  paymentReference: text("payment_reference"), // User provided reference
  proofDocument: text("proof_document"), // Base64 encoded payment proof
  proofFilename: text("proof_filename"),
  status: text("status").notNull().default("pending"), // pending, confirmed, rejected
  paidAt: timestamp("paid_at"),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: integer("confirmed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Import documents table
export const importDocuments = pgTable("import_documents", {
  id: serial("id").primaryKey(),
  importId: integer("import_id").references(() => imports.id).notNull(),
  documentType: text("document_type").notNull(), // proforma_invoice, bill_of_lading, etc
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Import tracking table with enhanced pipeline tracking
export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  creditApplicationId: integer("credit_application_id").references(() => creditApplications.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),

  // Basic Import Information
  importName: text("import_name").notNull(), // Nome/código da importação para rastreamento
  importNumber: text("import_number").unique(),

  // Cargo Type and Container Information
  cargoType: text("cargo_type").notNull().default("FCL"), // FCL (Full Container Load) ou LCL (Less than Container Load)
  containerNumber: text("container_number"), // Número do contêiner (se FCL)
  sealNumber: text("seal_number"), // Número do lacre

  // Product Details - now supports multiple products for LCL
  products: jsonb("products").notNull(), // Array de produtos: [{name, description, hsCode, quantity, unitPrice, totalValue, supplierId}]
  totalValue: text("total_value").notNull(),
  currency: text("currency").notNull().default("USD"),

  // Pricing Information
  fobPrice: text("fob_price"),
  cifPrice: text("cif_price"),
  freightCost: text("freight_cost"),
  insuranceCost: text("insurance_cost"),

  // Physical Specifications
  weight: text("weight"), // in kg
  volume: text("volume"), // in m³
  dimensions: text("dimensions"), // LxWxH in cm

  // Shipping Information
  shippingMethod: text("shipping_method"), // sea, air, land
  containerType: text("container_type"), // 20ft, 40ft, 40ft-hc, lcl
  incoterms: text("incoterms").default("FOB"), // FOB, CIF, EXW, etc.

  // Pipeline Status and Tracking
  currentStage: text("current_stage").notNull().default("estimativa"), // estimativa, producao, entregue_agente, transporte_maritimo, transporte_aereo, desembaraco, transporte_nacional, concluido
  status: text("status").notNull().default("planning"), // planning, active, completed, cancelled

  // Pipeline Stages with Timestamps
  stageEstimativa: jsonb("stage_estimativa"), // { status, startDate, endDate, notes, documents }
  stageInvoice: jsonb("stage_invoice"),
  stageProducao: jsonb("stage_producao"),
  stageEmbarque: jsonb("stage_embarque"),
  stageTransporte: jsonb("stage_transporte"),
  stageAtracacao: jsonb("stage_atracacao"),
  stageDesembaraco: jsonb("stage_desembaraco"),
  stageTransporteTerrestre: jsonb("stage_transporte_terrestre"),
  stageEntrega: jsonb("stage_entrega"),

  // Dates
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  invoiceDate: timestamp("invoice_date"),
  productionStartDate: timestamp("production_start_date"),
  shippingDate: timestamp("shipping_date"),

  // Tracking and Documentation
  trackingNumber: text("tracking_number"),
  bl_number: text("bl_number"), // Bill of Lading
  invoiceNumber: text("invoice_number"),
  customsDeclarationNumber: text("customs_declaration_number"),

  // Port Information
  portOfLoading: text("port_of_loading"),
  portOfDischarge: text("port_of_discharge"),
  finalDestination: text("final_destination"),

  // Customs Broker Information
  customsBrokerEmail: text("customs_broker_email"),
  customsBrokerId: integer("customs_broker_id").references(() => users.id),
  customsBrokerStatus: text("customs_broker_status").default("pending"), // pending, assigned, processing, completed
  customsProcessingNotes: text("customs_processing_notes"),

  // Customs and Compliance
  customsStatus: text("customs_status"),
  importLicense: text("import_license"),
  dutyRate: text("duty_rate"),
  taxesAmount: text("taxes_amount"),

  // Documents and Files
  documents: text("documents").array(),
  requiredDocuments: jsonb("required_documents"),

  // Credit and Payment Information
  creditUsed: text("credit_used"), // Amount of credit used for this import
  adminFeeRate: text("admin_fee_rate"), // Admin fee percentage applied
  adminFeeAmount: text("admin_fee_amount"), // Calculated admin fee amount
  totalWithFees: text("total_with_fees"), // Total value including admin fees
  paymentStatus: text("payment_status").default("pending"), // pending, down_payment_paid, in_progress, completed
  downPaymentRequired: text("down_payment_required"), // Required down payment amount
  downPaymentPaid: text("down_payment_paid"), // Paid down payment amount
  paymentTermsDays: integer("payment_terms_days"), // Payment terms in days
  paymentStartDate: timestamp("payment_start_date"), // When payment terms start (usually shipping date)

  // Additional Information
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Only visible to admins
  riskLevel: text("risk_level").default("low"), // low, medium, high

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Validation schemas for multi-step credit application
export const companyInfoSchema = z.object({
  legalCompanyName: z.string().min(2, "Razão social é obrigatória"),
  tradingName: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ inválido"),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  address: z.string().min(5, "Endereço é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP inválido"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  website: z.string().optional().refine((val) => {
    if (!val) return true; // Campo opcional
    // Importar a função de validação no frontend
    try {
      // Aceita URLs em diferentes formatos
      if (val.startsWith('http://') || val.startsWith('https://')) {
        new URL(val);
        return true;
      }
      // Testa se é um domínio válido
      return /^(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(val);
    } catch {
      return false;
    }
  }, "Website deve ser uma URL válida"),
  shareholders: z.array(z.object({
    name: z.string().min(2, "Nome do sócio é obrigatório"),
    cpf: z.string().min(11, "CPF inválido"),
    percentage: z.number().min(0).max(100, "Percentual deve estar entre 0 e 100"),
  })).min(1, "Pelo menos um sócio é obrigatório"),
});

export const commercialInfoSchema = z.object({
  businessSector: z.string().min(1, "Setor de atuação é obrigatório"),
  annualRevenue: z.string().min(1, "Faturamento anual é obrigatório"),
  mainImportedProducts: z.string().min(10, "Descrição dos produtos importados é obrigatória"),
  mainOriginMarkets: z.string().min(5, "Principais mercados de origem são obrigatórios"),
});

export const creditInfoSchema = z.object({
  requestedAmount: z.string()
    .transform((val) => parseFloat(val.replace(/[,$]/g, '')))
    .refine((val) => val >= 100000, { message: "Valor mínimo é USD $100.000" })
    .refine((val) => val <= 1000000, { message: "Valor máximo é USD $1.000.000" })
    .transform((val) => val.toString()),
  productsToImport: z.array(z.string()).min(1, "Adicione pelo menos um produto"),
  monthlyImportVolume: z.string().min(1, "Volume mensal é obrigatório"),
  justification: z.string().min(20, "Justificativa deve ter pelo menos 20 caracteres"),
});

export const documentsSchema = z.object({
  requiredDocuments: z.record(z.boolean()).optional(),
  optionalDocuments: z.record(z.boolean()).optional(),
});

export const insertCreditApplicationSchema = companyInfoSchema
  .merge(commercialInfoSchema)
  .merge(creditInfoSchema)
  .extend({
    userId: z.number(),
    status: z.string().default("draft"),
    currentStep: z.number().default(1),
    documentsStatus: z.string().default("pending"),
    currency: z.string().default("USD"),
  });

// Supplier validation schema
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyName: z.string().min(2, "Nome da empresa é obrigatório"),
  contactName: z.string().min(2, "Nome do contato é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  address: z.string().min(5, "Endereço é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  country: z.string().min(2, "País é obrigatório"),
  productCategories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria"),
});

// Product schema for imports
const productSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  hsCode: z.string().optional(),
  quantity: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? 0 : num;
  }).refine((val) => val > 0, "Quantidade deve ser maior que 0"),
  unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  supplierId: z.number().min(1, "Fornecedor é obrigatório"),
});

// Enhanced import validation schema
export const insertImportSchema = createInsertSchema(imports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  importName: z.string().min(3, "Nome/código da importação é obrigatório"),
  cargoType: z.enum(["FCL", "LCL"]).default("FCL"),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  products: z.array(productSchema).min(1, "Pelo menos um produto é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  currency: z.string().default("USD"),
  incoterms: z.string().min(1, "Incoterms é obrigatório"),
  shippingMethod: z.string().min(1, "Método de envio é obrigatório"),
  containerType: z.string().optional(),
  weight: z.string().optional(),
  volume: z.string().optional(),
  estimatedDelivery: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

// Pipeline stage schema
export const pipelineStageSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "delayed", "cancelled"]).default("pending"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedDate: z.string().optional(),
  actualDate: z.string().optional(),
  notes: z.string().optional(),
  documents: z.array(z.string()).optional(),
  responsiblePerson: z.string().optional(),
  location: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type CreditApplication = typeof creditApplications.$inferSelect;
export type InsertCreditApplication = z.infer<typeof insertCreditApplicationSchema>;
export type Import = typeof imports.$inferSelect;
export type InsertImport = z.infer<typeof insertImportSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // credit_approved, credit_rejected, import_status_change, payment_due, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional context data
  status: text("status").notNull().default("unread"), // unread, read
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Document Requests System
export const documentRequests = pgTable('document_requests', {
  id: serial('id').primaryKey(),
  creditApplicationId: integer('credit_application_id').notNull().references(() => creditApplications.id),
  requestedBy: integer('requested_by').notNull().references(() => users.id),
  requestedFrom: integer('requested_from').notNull().references(() => users.id),
  documentType: text('document_type').notNull(),
  documentName: text('document_name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // pending, uploaded, approved, rejected
  uploadedFileUrl: text('uploaded_file_url'),
  uploadedAt: timestamp('uploaded_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Support Tickets System
export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  ticketNumber: text('ticket_number').notNull().unique(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  creditApplicationId: integer('credit_application_id').references(() => creditApplications.id),
  subject: text('subject').notNull(),
  category: text('category').notNull(), // document_issue, payment_question, technical_support, general_inquiry
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent
  status: text('status').notNull().default('open'), // open, in_progress, waiting_response, resolved, closed
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// Ticket Messages
export const ticketMessages = pgTable('ticket_messages', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => supportTickets.id),
  senderId: integer('sender_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  attachments: text('attachments').array(), // JSON array of attachment URLs
  isInternal: boolean('is_internal').default(false), // For internal admin notes
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports for the new tables
export type DocumentRequest = typeof documentRequests.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;

export type PipelineStage = z.infer<typeof pipelineStageSchema>;
export type Notification = typeof notifications.$inferSelect;

// Credit Score table for Receita WS integration
export const creditScores = pgTable("credit_scores", {
  id: serial("id").primaryKey(),
  creditApplicationId: integer("credit_application_id").references(() => creditApplications.id).notNull(),
  cnpj: text("cnpj").notNull(),
  
  // Score Information
  creditScore: integer("credit_score").notNull(), // 0-1000
  scoreDate: timestamp("score_date").defaultNow(),
  
  // Company Data from Receita WS
  companyData: jsonb("company_data"), // Full response from Receita WS
  
  // Parsed fields for quick access
  legalName: text("legal_name"),
  tradingName: text("trading_name"),
  status: text("status"), // ATIVA, BAIXADA, etc
  openingDate: timestamp("opening_date"),
  shareCapital: text("share_capital"),
  
  // Address
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  
  // Contact
  phone: text("phone"),
  email: text("email"),
  
  // CNAE - Economic Activities
  mainActivity: jsonb("main_activity"), // {code, description}
  secondaryActivities: jsonb("secondary_activities"), // [{code, description}]
  
  // Partners/Shareholders
  partners: jsonb("partners"), // [{name, qualification, joinDate}]
  
  // Credit Analysis Results (DirectD API Integration)
  creditAnalysis: jsonb("credit_analysis"), // Complete DirectD response with detailed analysis
  hasDebts: boolean("has_debts").default(false),
  hasProtests: boolean("has_protests").default(false),
  hasBankruptcy: boolean("has_bankruptcy").default(false),
  hasLawsuits: boolean("has_lawsuits").default(false),
  
  // Score QUOD Specific Fields
  capacidadePagamento: text("capacidade_pagamento"), // Payment capacity indicator
  indicadoresNegocio: jsonb("indicadores_negocio"), // Business indicators array from Score QUOD
  consultasAnteriores: jsonb("consultas_anteriores"), // Previous queries data
  protestosDetalhes: jsonb("protestos_detalhes"), // Detailed protests information
  acoesJudiciaisDetalhes: jsonb("acoes_judiciais_detalhes"), // Detailed lawsuits information
  chequesSemdFundo: jsonb("cheques_sem_fundo"), // Bounced checks information
  recuperacoesJudiciais: jsonb("recuperacoes_judiciais"), // Judicial recovery data
  falenciasDetalhes: jsonb("falencias_detalhes"), // Bankruptcy details
  
  // New Score QUOD fields
  faixaScore: text("faixa_score"), // Score range description from QUOD
  scoreMotivos: jsonb("score_motivos"), // Array of reasons for score calculation
  
  // CND - Certidão Negativa de Débitos (State Tax Certificate)
  cndStatus: text("cnd_status"), // "Regular", "Irregular", "Não Consultado"
  cndHasDebts: boolean("cnd_has_debts").default(false), // Flag indicating if has debts
  cndEffectiveNegative: boolean("cnd_effective_negative").default(false), // If certificate has negative effect
  cndCertificateNumber: text("cnd_certificate_number"), // Certificate number
  cndValidationCode: text("cnd_validation_code"), // Validation code
  cndIssueDate: timestamp("cnd_issue_date"), // Issue date
  cndExpiryDate: timestamp("cnd_expiry_date"), // Expiry date
  cndDebtsDetails: jsonb("cnd_debts_details"), // Array of debt details if any
  cndStateRegistration: text("cnd_state_registration"), // State registration used
  cndState: text("cnd_state"), // State where CND was consulted
  cndPdfUrl: text("cnd_pdf_url"), // URL to download the CND PDF certificate
  cndFullResponse: jsonb("cnd_full_response"), // Complete API response
  
  // SCR Bacen - Sistema de Informações de Crédito (Banking Credit Information System)
  scrStatus: text("scr_status"), // "Consultado", "Não Consultado", "Erro"
  scrQuantidadeInstituicoes: integer("scr_quantidade_instituicoes"), // Number of financial institutions
  scrQuantidadeOperacoes: integer("scr_quantidade_operacoes"), // Total credit operations
  scrRelacionamentos: text("scr_relacionamentos"), // Banking relationships
  scrVolume: text("scr_volume"), // Total operation volume
  scrSituacao: text("scr_situacao"), // Current situation
  scrPerfil: text("scr_perfil"), // Credit profile
  scrScore: text("scr_score"), // SCR credit score
  scrClasseRisco: text("scr_classe_risco"), // Risk classification
  scrValorVencer: text("scr_valor_vencer"), // Amount to mature
  scrValorVencido: text("scr_valor_vencido"), // Overdue amount
  scrIndiceTotal: text("scr_indice_total"), // Total index
  scrIndiceCartao: text("scr_indice_cartao"), // Card index
  scrIndiceCreditoPessoal: text("scr_indice_credito_pessoal"), // Personal credit index
  scrIndiceChequeEspecial: text("scr_indice_cheque_especial"), // Overdraft index
  scrPercentualCategoria: jsonb("scr_percentual_categoria"), // Percentage by category
  scrPercentualVencido: jsonb("scr_percentual_vencido"), // Overdue percentage
  scrPercentualPrazo: jsonb("scr_percentual_prazo"), // Term percentage (short/medium/long)
  scrPercentualEvolucao: jsonb("scr_percentual_evolucao"), // Evolution percentage
  scrFullResponse: jsonb("scr_full_response"), // Complete SCR API response
  
  // Detalhamento Negativo - Detailed negative credit information
  detalhamentoStatus: text("detalhamento_status").default('Não Consultado'), // "Consultado", "Não Consultado", "Erro"
  detalhamentoProtestos: integer("detalhamento_protestos").default(0), // Total number of protests
  detalhamentoValorProtestos: text("detalhamento_valor_protestos"), // Total value of protests
  detalhamentoAcoesJudiciais: integer("detalhamento_acoes_judiciais").default(0), // Total judicial actions
  detalhamentoValorAcoes: text("detalhamento_valor_acoes"), // Total value of judicial actions
  detalhamentoChequesSemdFundo: integer("detalhamento_cheques_sem_fundo").default(0), // Total bounced checks
  detalhamentoRecuperacoes: integer("detalhamento_recuperacoes").default(0), // Total judicial recoveries
  detalhamentoFalencias: integer("detalhamento_falencias").default(0), // Total bankruptcies
  detalhamentoProtestosDetalhes: jsonb("detalhamento_protestos_detalhes"), // Detailed protests with registries
  detalhamentoAcoesDetalhes: jsonb("detalhamento_acoes_detalhes"), // Detailed judicial actions
  detalhamentoChequesDetalhes: jsonb("detalhamento_cheques_detalhes"), // Detailed bounced checks
  detalhamentoRecuperacoesDetalhes: jsonb("detalhamento_recuperacoes_detalhes"), // Detailed judicial recoveries
  detalhamentoFalenciasDetalhes: jsonb("detalhamento_falencias_detalhes"), // Detailed bankruptcies
  detalhamentoFullResponse: jsonb("detalhamento_full_response"), // Complete Detalhamento Negativo API response
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
});

export type CreditScore = typeof creditScores.$inferSelect & {
  // Extended types for DirectD fields (since JSONB fields need explicit typing)
  indicadoresNegocio?: string[];
  consultasAnteriores?: {
    ultimos30Dias?: number;
    ultimos60Dias?: number;  
    ultimos90Dias?: number;
    segmento?: string;
  };
  protestosDetalhes?: Array<{
    cartorio?: string;
    valorTotal?: number;
    cidade?: string;
    quantidade?: number;
  }>;
  acoesJudiciaisDetalhes?: Array<{
    numeroProcesso?: string;
    valor?: number;
    autor?: string;
    status?: string;
  }>;
  chequesSemdFundo?: Array<{
    banco?: string;
    agencia?: string;
    quantidade?: number;
    valor?: number;
  }>;
};

// Import all imports-related tables and schemas
export * from './imports-schema';