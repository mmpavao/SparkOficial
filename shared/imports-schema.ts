import { pgTable, text, integer, decimal, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Main imports table
export const imports = pgTable('imports', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: integer('user_id').notNull(),
  supplierId: integer('supplier_id'),
  creditApplicationId: integer('credit_application_id'),
  
  // Basic information
  importName: text('import_name').notNull(),
  importCode: text('import_code'),
  cargoType: text('cargo_type').notNull(), // 'FCL' or 'LCL'
  
  // Origin and destination
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  transportMethod: text('transport_method').notNull(), // 'maritimo' or 'aereo'
  
  // Financial information
  totalValue: decimal('total_value', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  incoterms: text('incoterms').notNull(), // 'FOB', 'CIF', 'EXW'
  
  // Status and priority
  status: text('status').default('planejamento'), // planejamento, producao, entregue_agente, transporte_maritimo, transporte_aereo, desembaraco, transporte_nacional, concluido
  priority: text('priority').default('normal'), // 'low', 'normal', 'high'
  
  // Container information (FCL only)
  containerNumber: text('container_number'),
  sealNumber: text('seal_number'),
  
  // Dates
  estimatedArrival: timestamp('estimated_arrival'),
  actualArrival: timestamp('actual_arrival'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Products table for LCL imports
export const importProducts = pgTable('import_products', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  importId: integer('import_id').notNull(),
  
  // Product information
  productName: text('product_name').notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalValue: decimal('total_value', { precision: 12, scale: 2 }).notNull(),
  
  // Classification
  hsCode: text('hs_code'),
  weight: decimal('weight', { precision: 8, scale: 2 }),
  dimensions: text('dimensions'),
  
  createdAt: timestamp('created_at').defaultNow()
});

// Documents table
export const importDocuments = pgTable('import_documents', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  importId: integer('import_id').notNull(),
  
  // Document classification
  documentType: text('document_type').notNull(), // 'commercial_invoice', 'packing_list', 'bill_of_lading', etc.
  fileName: text('file_name').notNull(),
  fileData: text('file_data'), // base64 encoded
  
  // Status and metadata
  isMandatory: boolean('is_mandatory').default(true),
  status: text('status').default('pending'), // 'pending', 'uploaded', 'validated', 'rejected'
  notes: text('notes'),
  
  // Upload information
  uploadedBy: integer('uploaded_by'),
  uploadedAt: timestamp('uploaded_at').defaultNow()
});

// Timeline/status history table
export const importTimeline = pgTable('import_timeline', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  importId: integer('import_id').notNull(),
  
  // Status change information
  status: text('status').notNull(),
  previousStatus: text('previous_status'),
  changedBy: integer('changed_by'),
  changedAt: timestamp('changed_at').defaultNow(),
  
  // Additional information
  notes: text('notes'),
  automaticChange: boolean('automatic_change').default(false)
});

// Payment schedule table
export const importPayments = pgTable('import_payments', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  importId: integer('import_id').notNull(),
  creditApplicationId: integer('credit_application_id'),
  
  // Payment information
  paymentType: text('payment_type').notNull(), // 'down_payment', 'installment'
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Schedule
  dueDate: timestamp('due_date').notNull(),
  paidDate: timestamp('paid_date'),
  
  // Status
  status: text('status').default('pending'), // 'pending', 'paid', 'overdue', 'cancelled'
  paymentMethod: text('payment_method'), // 'bank_transfer', 'letter_of_credit', etc.
  
  // Receipt
  receiptData: text('receipt_data'), // base64 encoded receipt
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Insert schemas using drizzle-zod
export const insertImportSchema = createInsertSchema(imports, {
  totalValue: z.string().min(1, 'Valor total é obrigatório'),
  importName: z.string().min(1, 'Nome da importação é obrigatório'),
  cargoType: z.enum(['FCL', 'LCL'], { required_error: 'Tipo de carga é obrigatório' }),
  transportMethod: z.enum(['maritimo', 'aereo'], { required_error: 'Método de transporte é obrigatório' }),
  incoterms: z.enum(['FOB', 'CIF', 'EXW'], { required_error: 'Incoterms é obrigatório' }),
  origin: z.string().min(1, 'Origem é obrigatória'),
  destination: z.string().min(1, 'Destino é obrigatório')
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertImportProductSchema = createInsertSchema(importProducts, {
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que zero'),
  unitPrice: z.string().min(1, 'Preço unitário é obrigatório'),
  totalValue: z.string().min(1, 'Valor total é obrigatório')
}).omit({
  id: true,
  createdAt: true
});

export const insertImportDocumentSchema = createInsertSchema(importDocuments, {
  documentType: z.string().min(1, 'Tipo de documento é obrigatório'),
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório')
}).omit({
  id: true,
  uploadedAt: true
});

// TypeScript types
export type Import = typeof imports.$inferSelect;
export type NewImport = z.infer<typeof insertImportSchema>;
export type ImportProduct = typeof importProducts.$inferSelect;
export type NewImportProduct = z.infer<typeof insertImportProductSchema>;
export type ImportDocument = typeof importDocuments.$inferSelect;
export type NewImportDocument = z.infer<typeof insertImportDocumentSchema>;
export type ImportTimeline = typeof importTimeline.$inferSelect;
export type ImportPayment = typeof importPayments.$inferSelect;

// Status workflow constants
export const IMPORT_STATUSES = {
  PLANEJAMENTO: 'planejamento',
  PRODUCAO: 'producao', 
  ENTREGUE_AGENTE: 'entregue_agente',
  TRANSPORTE_MARITIMO: 'transporte_maritimo',
  TRANSPORTE_AEREO: 'transporte_aereo',
  DESEMBARACO: 'desembaraco',
  TRANSPORTE_NACIONAL: 'transporte_nacional',
  CONCLUIDO: 'concluido'
} as const;

export const IMPORT_STATUS_LABELS = {
  [IMPORT_STATUSES.PLANEJAMENTO]: 'Planejamento',
  [IMPORT_STATUSES.PRODUCAO]: 'Produção',
  [IMPORT_STATUSES.ENTREGUE_AGENTE]: 'Entregue ao Agente',
  [IMPORT_STATUSES.TRANSPORTE_MARITIMO]: 'Transporte Marítimo',
  [IMPORT_STATUSES.TRANSPORTE_AEREO]: 'Transporte Aéreo',
  [IMPORT_STATUSES.DESEMBARACO]: 'Desembaraço',
  [IMPORT_STATUSES.TRANSPORTE_NACIONAL]: 'Transporte Nacional',
  [IMPORT_STATUSES.CONCLUIDO]: 'Concluído'
} as const;

// Document types
export const DOCUMENT_TYPES = {
  COMMERCIAL_INVOICE: 'commercial_invoice',
  PACKING_LIST: 'packing_list',
  BILL_OF_LADING: 'bill_of_lading',
  AIRWAY_BILL: 'airway_bill',
  CERTIFICATE_ORIGIN: 'certificate_origin',
  INSURANCE_POLICY: 'insurance_policy',
  INSPECTION_CERTIFICATE: 'inspection_certificate',
  IMPORT_LICENSE: 'import_license'
} as const;

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.COMMERCIAL_INVOICE]: 'Fatura Comercial',
  [DOCUMENT_TYPES.PACKING_LIST]: 'Lista de Embalagem',
  [DOCUMENT_TYPES.BILL_OF_LADING]: 'Conhecimento de Embarque',
  [DOCUMENT_TYPES.AIRWAY_BILL]: 'Conhecimento Aéreo',
  [DOCUMENT_TYPES.CERTIFICATE_ORIGIN]: 'Certificado de Origem',
  [DOCUMENT_TYPES.INSURANCE_POLICY]: 'Apólice de Seguro',
  [DOCUMENT_TYPES.INSPECTION_CERTIFICATE]: 'Certificado de Inspeção',
  [DOCUMENT_TYPES.IMPORT_LICENSE]: 'Licença de Importação'
} as const;