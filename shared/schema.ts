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

// Import tracking table
export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  creditApplicationId: serial("credit_application_id").references(() => creditApplications.id),
  supplierName: text("supplier_name").notNull(),
  supplierLocation: text("supplier_location").notNull(),
  productDescription: text("product_description").notNull(),
  totalValue: text("total_value").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("planning"), // planning, ordered, shipped, customs, delivered, completed
  estimatedDelivery: timestamp("estimated_delivery"),
  trackingNumber: text("tracking_number"),
  customsStatus: text("customs_status"),
  documents: text("documents").array(),
  notes: text("notes"),
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

export const insertImportSchema = createInsertSchema(imports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type CreditApplication = typeof creditApplications.$inferSelect;
export type InsertCreditApplication = z.infer<typeof insertCreditApplicationSchema>;
export type Import = typeof imports.$inferSelect;
export type InsertImport = z.infer<typeof insertImportSchema>;
