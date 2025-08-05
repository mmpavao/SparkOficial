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
  
  // Origin and destination (ports)
  origin: text('origin').notNull(), // Porto de origem (China)
  destination: text('destination').notNull(), // Porto de destino (Brasil)
  destinationState: text('destination_state'), // Estado de destino no Brasil
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
  
  // Despachante (Customs Broker) information
  customsBrokerId: integer('customs_broker_id'), // ID do despachante responsável
  customsBrokerStatus: text('customs_broker_status').default('pending'), // pending, assigned, processing, completed
  
  // Detailed customs costs (estimated and actual)
  estimatedCustomsCosts: jsonb('estimated_customs_costs'), // Custos estimados pelo despachante
  actualCustomsCosts: jsonb('actual_customs_costs'), // Custos reais após desembaraço
  customsProcessingNotes: text('customs_processing_notes'), // Observações do despachante
  
  // Additional shipping and logistics info
  shippingLine: text('shipping_line'), // Companhia marítima
  vesselName: text('vessel_name'), // Nome do navio
  voyageNumber: text('voyage_number'), // Número da viagem
  masterBillOfLading: text('master_bill_of_lading'), // Master B/L
  houseBillOfLading: text('house_bill_of_lading'), // House B/L
  
  // Port and terminal details
  portOfLoading: text('port_of_loading'), // Porto de embarque específico
  portOfDischarge: text('port_of_discharge'), // Porto de desembarque específico
  finalDestination: text('final_destination'), // Destino final
  terminalLocation: text('terminal_location'), // Terminal específico
  
  // Customs documentation
  importDeclarationNumber: text('import_declaration_number'), // Número da DI
  licenseNumber: text('license_number'), // Número da LI (se aplicável)
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }), // Taxa de câmbio usada
  
  // Enhanced dates
  estimatedDeparture: timestamp('estimated_departure'),
  actualDeparture: timestamp('actual_departure'),
  estimatedArrival: timestamp('estimated_arrival'),
  actualArrival: timestamp('actual_arrival'),
  customsClearanceDate: timestamp('customs_clearance_date'),
  deliveryDate: timestamp('delivery_date'),
  
  // Insurance and risk
  insuranceValue: decimal('insurance_value', { precision: 12, scale: 2 }),
  insuranceCompany: text('insurance_company'),
  riskCategory: text('risk_category').default('normal'), // low, normal, high
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Master products catalog table
export const products = pgTable('products', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: integer('user_id').notNull(),
  
  // Basic product information
  productName: text('product_name').notNull(),
  description: text('description').notNull(),
  category: text('category'), // Categoria do produto
  subCategory: text('sub_category'), // Subcategoria
  
  // Classification and customs
  ncmCode: text('ncm_code').notNull(), // Código NCM brasileiro (8 dígitos)
  hsCode: text('hs_code'), // Código HS internacional (6 dígitos)
  productOrigin: text('product_origin').default('China'), // País de origem
  
  // Physical specifications
  weight: decimal('weight', { precision: 8, scale: 3 }).notNull(), // Peso unitário em kg
  length: decimal('length', { precision: 8, scale: 2 }), // Comprimento em cm
  width: decimal('width', { precision: 8, scale: 2 }), // Largura em cm
  height: decimal('height', { precision: 8, scale: 2 }), // Altura em cm
  volume: decimal('volume', { precision: 8, scale: 4 }), // Volume em m³
  
  // Material and composition
  material: text('material'), // Material principal
  composition: text('composition'), // Composição detalhada
  brand: text('brand'), // Marca
  model: text('model'), // Modelo
  
  // Packaging information
  packagingType: text('packaging_type'), // Tipo de embalagem
  unitsPerPackage: integer('units_per_package').default(1), // Unidades por embalagem
  packageWeight: decimal('package_weight', { precision: 8, scale: 3 }), // Peso da embalagem
  packageDimensions: text('package_dimensions'), // Dimensões da embalagem
  
  // Safety and compliance
  dangerousGoods: boolean('dangerous_goods').default(false), // Mercadoria perigosa
  requiresSpecialHandling: boolean('requires_special_handling').default(false),
  certifications: text('certifications').array(), // Certificações necessárias
  restrictions: text('restrictions'), // Restrições de importação
  
  // Commercial information
  unitOfMeasure: text('unit_of_measure').notNull().default('PCS'), // PCS, KG, M, M2, M3, etc
  minimumOrderQuantity: integer('minimum_order_quantity').default(1),
  standardPackSize: integer('standard_pack_size').default(1),
  
  // Tax and duty information (estimativas)
  estimatedImportTax: decimal('estimated_import_tax', { precision: 5, scale: 2 }), // % II
  estimatedIpi: decimal('estimated_ipi', { precision: 5, scale: 2 }), // % IPI
  estimatedPis: decimal('estimated_pis', { precision: 5, scale: 2 }), // % PIS
  estimatedCofins: decimal('estimated_cofins', { precision: 5, scale: 2 }), // % COFINS
  estimatedIcms: decimal('estimated_icms', { precision: 5, scale: 2 }), // % ICMS
  
  // Additional information
  notes: text('notes'), // Observações adicionais
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Products table for LCL imports - referencia os produtos master
export const importProducts = pgTable('import_products', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  importId: integer('import_id').notNull(),
  productId: integer('product_id').references(() => products.id), // Referência ao produto master
  
  // Product information (pode sobrescrever dados do master)
  productName: text('product_name').notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalValue: decimal('total_value', { precision: 12, scale: 2 }).notNull(),
  
  // Classification (herdada do master mas pode ser sobrescrita)
  ncmCode: text('ncm_code'),
  hsCode: text('hs_code'),
  
  // Physical specs for this specific import
  unitWeight: decimal('unit_weight', { precision: 8, scale: 3 }),
  totalWeight: decimal('total_weight', { precision: 8, scale: 3 }),
  dimensions: text('dimensions'),
  totalVolume: decimal('total_volume', { precision: 8, scale: 4 }),
  
  // Supplier for this specific import
  supplierId: integer('supplier_id'),
  
  createdAt: timestamp('created_at').defaultNow()
});

// Customs Brokers table
export const customsBrokers = pgTable('customs_brokers', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: integer('user_id').notNull(), // O despachante é um usuário no sistema
  
  // Company information
  companyName: text('company_name').notNull(),
  cnpj: text('cnpj').notNull(),
  registrationNumber: text('registration_number'), // Registro na Receita Federal
  licenseNumber: text('license_number'), // Licença de despachante
  
  // Contact information
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  
  // Specialization
  specialization: text('specialization').array(), // Especialidades (ex: eletrônicos, têxtil, etc.)
  servicesOffered: text('services_offered').array(), // Serviços oferecidos
  portsOfOperation: text('ports_of_operation').array(), // Portos onde atua
  
  // Pricing and terms
  standardFeeStructure: jsonb('standard_fee_structure'), // Estrutura de taxas padrão
  minimumOrderValue: decimal('minimum_order_value', { precision: 12, scale: 2 }),
  averageProcessingTime: integer('average_processing_time'), // Tempo médio em dias
  
  // Ratings and performance
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'), // 0-5 stars
  totalImportsProcessed: integer('total_imports_processed').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('0'), // Percentage
  
  // Status
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false), // Verificado pela plataforma
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Client-Broker relationships table
export const clientBrokerRelationships = pgTable('client_broker_relationships', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  importerId: integer('importer_id').notNull(), // ID do importador
  customsBrokerId: integer('customs_broker_id').notNull(), // ID do despachante
  
  // Relationship details
  relationshipType: text('relationship_type').default('preferred'), // preferred, contracted, trial
  status: text('status').default('active'), // active, inactive, suspended
  
  // Contract terms
  preferredFeeStructure: jsonb('preferred_fee_structure'), // Estrutura de taxas negociada
  contractStartDate: timestamp('contract_start_date'),
  contractEndDate: timestamp('contract_end_date'),
  
  // Performance tracking
  totalImportsHandled: integer('total_imports_handled').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
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

// Zod schemas for validation
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  ncmCode: z.string()
    .min(8, "Código NCM deve ter 8 dígitos")
    .max(10, "Código NCM deve ter no máximo 10 dígitos")
    .regex(/^\d{8}(\.\d{2})?$/, "Formato de NCM inválido (ex: 84159020 ou 84159020.00)"),
  weight: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
  }).refine((val) => val > 0, "Peso deve ser maior que 0"),
  unitOfMeasure: z.string().min(1, "Unidade de medida é obrigatória"),
  length: z.union([z.string(), z.number(), z.undefined()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  width: z.union([z.string(), z.number(), z.undefined()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  height: z.union([z.string(), z.number(), z.undefined()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  volume: z.union([z.string(), z.number(), z.undefined()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }),
});

// Insert schemas using drizzle-zod
export const insertImportSchema = createInsertSchema(imports, {
  totalValue: z.string().min(1, 'Valor total é obrigatório'),
  importName: z.string().min(1, 'Nome da importação é obrigatório'),
  cargoType: z.enum(['FCL', 'LCL'], { required_error: 'Tipo de carga é obrigatório' }),
  transportMethod: z.enum(['maritimo', 'aereo'], { required_error: 'Método de transporte é obrigatório' }),
  incoterms: z.enum(['FOB', 'CIF', 'EXW'], { required_error: 'Incoterms é obrigatório' }),
  origin: z.string().min(1, 'Porto de origem é obrigatório'),
  destination: z.string().min(1, 'Porto de destino é obrigatório'),
  destinationState: z.string().optional(),
  customsBrokerId: z.number().optional(),
  customsBrokerStatus: z.enum(['pending', 'assigned', 'processing', 'completed']).default('pending'),
  estimatedCustomsCosts: z.any().optional(), // JSON data for customs costs
  actualCustomsCosts: z.any().optional(),
  customsProcessingNotes: z.string().optional(),
  shippingLine: z.string().optional(),
  vesselName: z.string().optional(),
  voyageNumber: z.string().optional(),
  masterBillOfLading: z.string().optional(),
  houseBillOfLading: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  finalDestination: z.string().optional(),
  terminalLocation: z.string().optional(),
  importDeclarationNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  exchangeRate: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  insuranceValue: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  insuranceCompany: z.string().optional(),
  riskCategory: z.enum(['low', 'normal', 'high']).default('normal')
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertImportProductSchemaLegacy = createInsertSchema(importProducts, {
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
export type NewImportProduct = z.infer<typeof insertImportProductSchemaLegacy>;
export type ImportDocument = typeof importDocuments.$inferSelect;
export type NewImportDocument = z.infer<typeof insertImportDocumentSchema>;
export type ImportTimeline = typeof importTimeline.$inferSelect;
export type ImportPayment = typeof importPayments.$inferSelect;

// Product types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Customs Broker types  
export type CustomsBroker = typeof customsBrokers.$inferSelect;
export type ClientBrokerRelationship = typeof clientBrokerRelationships.$inferSelect;

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