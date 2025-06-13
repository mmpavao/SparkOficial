import { pgTable, text, serial, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
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

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Credit applications table
export const creditApplications = pgTable("credit_applications", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  requestedAmount: text("requested_amount").notNull(), // Stored as string to handle large numbers
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, under_review
  documents: text("documents").array(),
  notes: text("notes"),
  reviewedBy: serial("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  approvedAmount: text("approved_amount"),
  interestRate: text("interest_rate"),
  paymentTerms: text("payment_terms"),
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

export const insertCreditApplicationSchema = createInsertSchema(creditApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  approvedAmount: true,
  interestRate: true,
  paymentTerms: true,
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
