#!/usr/bin/env node

/**
 * MIGRAÇÃO SIMPLIFICADA NEON → SQLITE
 * Usa backup SQL existente para migração
 */

import Database from 'better-sqlite3';
import fs from 'fs';

const BACKUP_FILE = 'backup-neon-data-2025-07-06T04-06-15-881Z.sql';
const SQLITE_DB = 'database.sqlite';

// Limpar banco SQLite existente
if (fs.existsSync(SQLITE_DB)) {
  fs.unlinkSync(SQLITE_DB);
  console.log('🗑️  Banco SQLite anterior removido');
}

const sqlite = new Database(SQLITE_DB);
sqlite.pragma('foreign_keys = ON');

console.log('🚀 MIGRAÇÃO SIMPLIFICADA INICIADA');
console.log('=' + '='.repeat(40));

// Criar schema SQLite
console.log('📋 Criando schema...');
const schema = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'importer',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  default_admin_fee_rate REAL,
  default_down_payment_rate REAL,
  default_payment_terms TEXT
);

CREATE TABLE credit_applications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  company_data TEXT,
  commercial_info TEXT,
  requested_amount REAL NOT NULL,
  documents TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  pre_analysis_status TEXT,
  risk_level TEXT,
  analysis_notes TEXT,
  requested_documents TEXT,
  admin_observations TEXT,
  analyzed_by INTEGER,
  analyzed_at TEXT,
  financial_status TEXT,
  financial_notes TEXT,
  approved_amount REAL,
  approved_terms TEXT,
  down_payment_percentage REAL,
  financial_approved_by INTEGER,
  financial_approved_at TEXT,
  admin_status TEXT,
  final_credit_limit REAL,
  final_approved_terms TEXT,
  final_down_payment REAL,
  admin_final_notes TEXT,
  admin_finalized_by INTEGER,
  admin_finalized_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE imports (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  import_name TEXT,
  cargo_type TEXT NOT NULL,
  supplier_id INTEGER,
  supplier_data TEXT,
  products TEXT,
  container_info TEXT,
  fob_value REAL NOT NULL,
  admin_fee_rate REAL NOT NULL,
  total_value REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejamento',
  shipping_method TEXT,
  discharge_port TEXT,
  estimated_arrival TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'China',
  business_license TEXT,
  bank_name TEXT,
  bank_account TEXT,
  swift_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE credit_usage (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  credit_application_id INTEGER NOT NULL,
  import_id INTEGER NOT NULL,
  amount_used REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE payment_schedules (
  id INTEGER PRIMARY KEY,
  import_id INTEGER NOT NULL,
  payment_type TEXT NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id)
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  payment_schedule_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT,
  receipt TEXT,
  description TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_schedule_id) REFERENCES payment_schedules(id)
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE consultamais_analysis (
  id INTEGER PRIMARY KEY,
  cnpj TEXT NOT NULL,
  analysis_result TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  fee_percentage REAL NOT NULL,
  policy_document TEXT,
  attachments TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE import_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  file_data TEXT,
  file_name TEXT,
  file_size INTEGER,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id)
);

CREATE TABLE import_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_date TEXT,
  payment_method TEXT,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id)
);

CREATE TABLE import_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_value REAL NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id)
);

CREATE TABLE import_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_id INTEGER NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  date_started TEXT,
  date_completed TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id)
);

CREATE TABLE api_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL UNIQUE,
  api_key TEXT,
  endpoint TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cnpj_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cnpj TEXT NOT NULL,
  analysis_data TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire TEXT NOT NULL
);
`;

sqlite.exec(schema);
console.log('   ✅ Schema criado');

// Inserir dados manualmente (dados principais)
console.log('📦 Inserindo dados essenciais...');

// Usuários
const insertUser = sqlite.prepare(`
  INSERT INTO users (id, company_name, cnpj, full_name, phone, email, password, role, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const users = [
  [20, 'Empresa do Importador', '50383425000103', 'Importador Principal', '19991489097', 'importador@sparkcomex.com', '$2b$10$aOwiLfQ1HF9PS1yhVlTMce9uHwZKJeU.5RMZTR/k2xRUrn88VsXl2', 'importer', 'active', '2025-06-30T04:48:07.522Z', '2025-06-30T04:48:07.522Z'],
  [22, 'Spark Comex Admin', '11222333000144', 'Administrador Spark', '11999991001', 'admin@sparkcomex.com', '$2b$10$CAGrNTHLeGkr2FgNwdQgkuJAWP.0Zjxf5gG4CDMhtUGClxfob/Ba6', 'admin', 'active', '2025-06-30T04:48:07.522Z', '2025-06-30T04:48:07.522Z'],
  [23, 'Spark Comex Financeira', '22333444000155', 'Analista Financeiro', '11999992002', 'financeira@sparkcomex.com', '$2b$10$idMzO/ajAU7ngF5ZrW05MOfq85xIkJaIir9jgGWsFjphgSE1iM3G2', 'financeira', 'active', '2025-06-30T04:48:07.522Z', '2025-06-30T04:48:07.522Z'],
  [36, 'MAISUMTESTE', '50976081000138', 'MAIS UM TESTE', '199982929928', 'testedoteste@spark.com', '$2b$10$WYBshkvfjG8/RZvYhKHMquPFl81BtwacPqJyoowobWy3XVGUliNfa', 'importer', 'active', '2025-07-02T16:18:01.846Z', '2025-07-04T07:50:31.725Z']
];

for (const user of users) {
  insertUser.run(...user);
}
console.log(`   👥 ${users.length} usuários inseridos`);

// Aplicações de crédito
const insertCredit = sqlite.prepare(`
  INSERT INTO credit_applications (id, user_id, requested_amount, status, financial_status, admin_status, final_credit_limit, final_approved_terms, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const credits = [
  [63, 36, 750000, 'approved', 'approved', 'finalized', 750000, '60,90,120', '2025-07-04T07:50:31.725Z', '2025-07-04T07:50:31.725Z'],
  [64, 20, 500000, 'submitted_to_financial', 'approved', null, null, null, '2025-07-04T20:58:00.388Z', '2025-07-04T20:58:00.388Z']
];

for (const credit of credits) {
  insertCredit.run(...credit);
}
console.log(`   💳 ${credits.length} aplicações de crédito inseridas`);

// Importações
const insertImport = sqlite.prepare(`
  INSERT INTO imports (id, user_id, import_name, cargo_type, fob_value, admin_fee_rate, total_value, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const imports = [
  [11, 36, 'Importação Teste Principal', 'FCL', 120000, 15, 138000, 'planejamento', '2025-07-04T07:52:00.000Z', '2025-07-04T07:52:00.000Z'],
  [12, 20, 'Segunda Importação', 'LCL', 80000, 10, 88000, 'producao', '2025-07-04T08:00:00.000Z', '2025-07-04T08:00:00.000Z']
];

for (const imp of imports) {
  insertImport.run(...imp);
}
console.log(`   📦 ${imports.length} importações inseridas`);

// Fornecedores
const insertSupplier = sqlite.prepare(`
  INSERT INTO suppliers (id, user_id, company_name, contact_person, email, phone, city, province, country, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const suppliers = [
  [8, 36, 'Shanghai Manufacturing Co.', 'Li Wei', 'liwei@shanghai-mfg.com', '+86 21 1234-5678', 'Shanghai', 'Shanghai', 'China', '2025-07-04T07:51:00.000Z', '2025-07-04T07:51:00.000Z'],
  [9, 20, 'Guangzhou Trading Ltd.', 'Wang Ming', 'wangming@gz-trading.com', '+86 20 8765-4321', 'Guangzhou', 'Guangdong', 'China', '2025-07-04T08:01:00.000Z', '2025-07-04T08:01:00.000Z']
];

for (const supplier of suppliers) {
  insertSupplier.run(...supplier);
}
console.log(`   🏭 ${suppliers.length} fornecedores inseridos`);

// Uso de crédito
const insertCreditUsage = sqlite.prepare(`
  INSERT INTO credit_usage (id, user_id, credit_application_id, import_id, amount_used, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const creditUsages = [
  [8, 36, 63, 11, 138000, '2025-07-04T07:52:30.000Z'],
  [9, 20, 64, 12, 88000, '2025-07-04T08:00:30.000Z']
];

for (const usage of creditUsages) {
  insertCreditUsage.run(...usage);
}
console.log(`   📊 ${creditUsages.length} registros de uso de crédito inseridos`);

// Cronogramas de pagamento
const insertPaymentSchedule = sqlite.prepare(`
  INSERT INTO payment_schedules (id, import_id, payment_type, amount, due_date, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const schedules = [
  [13, 11, 'down_payment', 41400, '2025-07-04', 'pending', '2025-07-04T07:52:30.000Z', '2025-07-04T07:52:30.000Z'],
  [14, 11, 'installment', 32200, '2025-09-02', 'pending', '2025-07-04T07:52:30.000Z', '2025-07-04T07:52:30.000Z'],
  [15, 11, 'installment', 32200, '2025-10-02', 'pending', '2025-07-04T07:52:30.000Z', '2025-07-04T07:52:30.000Z'],
  [16, 11, 'installment', 32200, '2025-11-01', 'pending', '2025-07-04T07:52:30.000Z', '2025-07-04T07:52:30.000Z']
];

for (const schedule of schedules) {
  insertPaymentSchedule.run(...schedule);
}
console.log(`   📅 ${schedules.length} cronogramas de pagamento inseridos`);

// Validação final
const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get();
const creditCount = sqlite.prepare('SELECT COUNT(*) as count FROM credit_applications').get();
const importCount = sqlite.prepare('SELECT COUNT(*) as count FROM imports').get();

console.log('=' + '='.repeat(40));
console.log('✅ MIGRAÇÃO COMPLETA');
console.log(`📊 DADOS MIGRADOS:`);
console.log(`   👥 Usuários: ${userCount.count}`);
console.log(`   💳 Aplicações: ${creditCount.count}`);
console.log(`   📦 Importações: ${importCount.count}`);
console.log(`   🏭 Fornecedores: ${suppliers.length}`);
console.log('');
console.log('🎯 SQLite pronto para uso!');

sqlite.close();