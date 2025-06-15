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
  role: text("role").notNull().default("importer"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  confirmPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
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
  role: z.enum(["super_admin", "admin", "importer"]).default("admin"),
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
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Basic Information
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
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

// Import tracking table with enhanced pipeline tracking
export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  creditApplicationId: serial("credit_application_id").references(() => creditApplications.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  
  // Basic Import Information
  importName: text("import_name").notNull(), // Nome/código da importação para rastreamento
  importNumber: text("import_number").unique(),
  supplierName: text("supplier_name").notNull(),
  supplierLocation: text("supplier_location").notNull(),
  
  // Cargo Type and Container Information
  cargoType: text("cargo_type").notNull().default("FCL"), // FCL (Full Container Load) ou LCL (Less than Container Load)
  containerNumber: text("container_number"), // Número do contêiner (se FCL)
  sealNumber: text("seal_number"), // Número do lacre
  
  // Product Details - now supports multiple products for LCL
  products: jsonb("products").notNull(), // Array de produtos: [{name, description, hsCode, quantity, unitPrice, totalValue}]
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
  currentStage: text("current_stage").notNull().default("estimativa"), // estimativa, invoice, producao, embarque, transporte, atracacao, desembaraco, transporte_terrestre, entrega
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
  
  // Customs and Compliance
  customsStatus: text("customs_status"),
  importLicense: text("import_license"),
  dutyRate: text("duty_rate"),
  taxesAmount: text("taxes_amount"),
  
  // Documents and Files
  documents: text("documents").array(),
  requiredDocuments: jsonb("required_documents"),
  
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
  website: z.string().url("URL inválida").optional().or(z.literal("")),
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
    userId: z.number().optional(),
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
  productName: z.string().min(2, "Nome do produto é obrigatório"),
  productDescription: z.string().min(10, "Descrição detalhada é obrigatória"),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  supplierName: z.string().min(2, "Nome do fornecedor é obrigatório"),
  supplierLocation: z.string().min(2, "Localização do fornecedor é obrigatória"),
  shippingMethod: z.enum(["sea", "air", "land"]).default("sea"),
  containerType: z.enum(["20ft", "40ft", "40ft-hc", "lcl"]).optional(),
  weight: z.string().optional(),
  volume: z.string().optional(),
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
export type PipelineStage = z.infer<typeof pipelineStageSchema>;
