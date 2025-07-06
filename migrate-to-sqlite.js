#!/usr/bin/env node

/**
 * MIGRAÇÃO AUTOMÁTICA NEON → SQLITE
 * Importa dados do backup SQL para SQLite local
 * Execução: node migrate-to-sqlite.js
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

// Configurações
const BACKUP_FILE = 'backup-neon-data-2025-07-06T04-06-15-881Z.sql';
const SQLITE_DB = 'database.sqlite';

// Conexão SQLite
const sqlite = new Database(SQLITE_DB);
sqlite.pragma('foreign_keys = ON');

// Conexão Neon (para comparação)
const sql = neon(process.env.DATABASE_URL);

async function migrateData() {
  console.log('🚀 INICIANDO MIGRAÇÃO NEON → SQLITE');
  console.log('=' + '='.repeat(50));
  
  try {
    // 1. Criar schema SQLite
    console.log('📋 Criando schema SQLite...');
    await createSQLiteSchema();
    
    // 2. Extrair e converter dados do backup
    console.log('📦 Convertendo dados do backup...');
    await convertAndImportData();
    
    // 3. Validar dados migrados
    console.log('✅ Validando dados migrados...');
    await validateMigration();
    
    console.log('=' + '='.repeat(50));
    console.log('🎯 MIGRAÇÃO COMPLETA - SQLite pronto para uso!');
    
  } catch (error) {
    console.error('💥 ERRO NA MIGRAÇÃO:', error);
    throw error;
  }
}

async function createSQLiteSchema() {
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    -- Credit Applications table
    CREATE TABLE IF NOT EXISTS credit_applications (
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

    -- Imports table
    CREATE TABLE IF NOT EXISTS imports (
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

    -- Suppliers table
    CREATE TABLE IF NOT EXISTS suppliers (
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

    -- Credit Usage table
    CREATE TABLE IF NOT EXISTS credit_usage (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      credit_application_id INTEGER NOT NULL,
      import_id INTEGER NOT NULL,
      amount_used REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Payment Schedules table
    CREATE TABLE IF NOT EXISTS payment_schedules (
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

    -- Payments table
    CREATE TABLE IF NOT EXISTS payments (
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

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Consultamais Analysis table
    CREATE TABLE IF NOT EXISTS consultamais_analysis (
      id INTEGER PRIMARY KEY,
      cnpj TEXT NOT NULL,
      analysis_result TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Admin Fees table (empty in backup)
    CREATE TABLE IF NOT EXISTS admin_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fee_percentage REAL NOT NULL,
      policy_document TEXT,
      attachments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Empty tables from backup
    CREATE TABLE IF NOT EXISTS import_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      file_data TEXT,
      file_name TEXT,
      file_size INTEGER,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (import_id) REFERENCES imports(id)
    );

    CREATE TABLE IF NOT EXISTS import_payments (
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

    CREATE TABLE IF NOT EXISTS import_products (
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

    CREATE TABLE IF NOT EXISTS import_timeline (
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

    CREATE TABLE IF NOT EXISTS api_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL UNIQUE,
      api_key TEXT,
      endpoint TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cnpj_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cnpj TEXT NOT NULL,
      analysis_data TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Sessions table (skip - will be recreated)
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire TEXT NOT NULL
    );
  `;

  sqlite.exec(schema);
  console.log('   ✅ Schema SQLite criado');
}

async function convertAndImportData() {
  // Buscar dados diretamente do Neon
  console.log('📥 Buscando dados do Neon...');
  
  // Users
  const users = await sql('SELECT * FROM users ORDER BY id');
  console.log(`   👥 ${users.length} usuários encontrados`);
  
  for (const user of users) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO users (
        id, company_name, cnpj, full_name, phone, email, password, avatar, 
        role, status, created_at, updated_at, default_admin_fee_rate, 
        default_down_payment_rate, default_payment_terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const safeAvatar = user.avatar && typeof user.avatar === 'string' ? user.avatar : null;
    const safeCreatedAt = user.created_at && typeof user.created_at === 'string' ? user.created_at : new Date().toISOString();
    const safeUpdatedAt = user.updated_at && typeof user.updated_at === 'string' ? user.updated_at : new Date().toISOString();
    
    stmt.run(
      user.id, user.company_name, user.cnpj, user.full_name, 
      user.phone, user.email, user.password, safeAvatar,
      user.role, user.status, safeCreatedAt, safeUpdatedAt,
      user.default_admin_fee_rate || null, user.default_down_payment_rate || null, 
      user.default_payment_terms || null
    );
  }
  
  // Credit Applications
  const credits = await sql('SELECT * FROM credit_applications ORDER BY id');
  console.log(`   💳 ${credits.length} aplicações de crédito encontradas`);
  
  for (const credit of credits) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO credit_applications (
        id, user_id, company_data, commercial_info, requested_amount, documents,
        status, pre_analysis_status, risk_level, analysis_notes, requested_documents,
        admin_observations, analyzed_by, analyzed_at, financial_status, financial_notes,
        approved_amount, approved_terms, down_payment_percentage, financial_approved_by,
        financial_approved_at, admin_status, final_credit_limit, final_approved_terms,
        final_down_payment, admin_final_notes, admin_finalized_by, admin_finalized_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      credit.id, credit.user_id, 
      credit.company_data ? JSON.stringify(credit.company_data) : null, 
      credit.commercial_info ? JSON.stringify(credit.commercial_info) : null, 
      credit.requested_amount,
      credit.documents ? JSON.stringify(credit.documents) : null, 
      credit.status, credit.pre_analysis_status || null,
      credit.risk_level || null, credit.analysis_notes || null, credit.requested_documents || null,
      credit.admin_observations || null, credit.analyzed_by || null, credit.analyzed_at || null,
      credit.financial_status || null, credit.financial_notes || null, credit.approved_amount || null,
      credit.approved_terms || null, credit.down_payment_percentage || null, credit.financial_approved_by || null,
      credit.financial_approved_at || null, credit.admin_status || null, credit.final_credit_limit || null,
      credit.final_approved_terms || null, credit.final_down_payment || null, credit.admin_final_notes || null,
      credit.admin_finalized_by || null, credit.admin_finalized_at || null, 
      credit.created_at || new Date().toISOString(), credit.updated_at || new Date().toISOString()
    );
  }
  
  // Imports
  const imports = await sql('SELECT * FROM imports ORDER BY id');
  console.log(`   📦 ${imports.length} importações encontradas`);
  
  for (const imp of imports) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO imports (
        id, user_id, import_name, cargo_type, supplier_id, supplier_data,
        products, container_info, fob_value, admin_fee_rate, total_value,
        status, shipping_method, discharge_port, estimated_arrival,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      imp.id, imp.user_id, imp.import_name || null, imp.cargo_type, imp.supplier_id || null,
      imp.supplier_data ? JSON.stringify(imp.supplier_data) : null, 
      imp.products ? JSON.stringify(imp.products) : null,
      imp.container_info ? JSON.stringify(imp.container_info) : null, 
      imp.fob_value, imp.admin_fee_rate,
      imp.total_value, imp.status, imp.shipping_method || null, imp.discharge_port || null,
      imp.estimated_arrival || null, imp.created_at || new Date().toISOString(), imp.updated_at || new Date().toISOString()
    );
  }
  
  // Suppliers
  const suppliers = await sql('SELECT * FROM suppliers ORDER BY id');
  console.log(`   🏭 ${suppliers.length} fornecedores encontrados`);
  
  for (const supplier of suppliers) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO suppliers (
        id, user_id, company_name, contact_person, email, phone, address,
        city, province, postal_code, country, business_license, bank_name,
        bank_account, swift_code, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      supplier.id, supplier.user_id, supplier.company_name, supplier.contact_person || null,
      supplier.email || null, supplier.phone || null, supplier.address || null, supplier.city || null,
      supplier.province || null, supplier.postal_code || null, supplier.country || 'China', supplier.business_license || null,
      supplier.bank_name || null, supplier.bank_account || null, supplier.swift_code || null,
      supplier.created_at || new Date().toISOString(), supplier.updated_at || new Date().toISOString()
    );
  }
  
  // Credit Usage
  const creditUsage = await sql('SELECT * FROM credit_usage ORDER BY id');
  console.log(`   📊 ${creditUsage.length} registros de uso de crédito encontrados`);
  
  for (const usage of creditUsage) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO credit_usage (
        id, user_id, credit_application_id, import_id, amount_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      usage.id, usage.user_id, usage.credit_application_id, usage.import_id,
      usage.amount_used, usage.created_at
    );
  }
  
  // Payment Schedules
  const paymentSchedules = await sql('SELECT * FROM payment_schedules ORDER BY id');
  console.log(`   📅 ${paymentSchedules.length} cronogramas de pagamento encontrados`);
  
  for (const schedule of paymentSchedules) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO payment_schedules (
        id, import_id, payment_type, amount, due_date, status, description,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      schedule.id, schedule.import_id, schedule.payment_type, schedule.amount,
      schedule.due_date, schedule.status, schedule.description,
      schedule.created_at, schedule.updated_at
    );
  }
  
  // Payments
  const payments = await sql('SELECT * FROM payments ORDER BY id');
  console.log(`   💰 ${payments.length} pagamentos encontrados`);
  
  for (const payment of payments) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO payments (
        id, payment_schedule_id, amount, payment_method, receipt, description,
        paid_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      payment.id, payment.payment_schedule_id, payment.amount, payment.payment_method,
      payment.receipt, payment.description, payment.paid_at, payment.created_at, payment.updated_at
    );
  }
  
  // Notifications
  const notifications = await sql('SELECT * FROM notifications ORDER BY id');
  console.log(`   🔔 ${notifications.length} notificações encontradas`);
  
  for (const notification of notifications) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO notifications (
        id, user_id, title, message, type, read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      notification.id, notification.user_id, notification.title, notification.message,
      notification.type, notification.read ? 1 : 0, notification.created_at
    );
  }
  
  // Consultamais Analysis
  const consultamais = await sql('SELECT * FROM consultamais_analysis ORDER BY id');
  console.log(`   🔍 ${consultamais.length} análises Consultamais encontradas`);
  
  for (const analysis of consultamais) {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO consultamais_analysis (
        id, cnpj, analysis_result, status, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      analysis.id, analysis.cnpj, analysis.analysis_result, analysis.status, analysis.created_at
    );
  }
  
  console.log('   ✅ Todos os dados migrados com sucesso');
}

async function validateMigration() {
  // Contar registros em SQLite
  const sqliteUsers = sqlite.prepare('SELECT COUNT(*) as count FROM users').get();
  const sqliteCredits = sqlite.prepare('SELECT COUNT(*) as count FROM credit_applications').get();
  const sqliteImports = sqlite.prepare('SELECT COUNT(*) as count FROM imports').get();
  const sqliteSuppliers = sqlite.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  
  console.log('📊 VALIDAÇÃO DOS DADOS:');
  console.log(`   👥 Usuários: ${sqliteUsers.count}`);
  console.log(`   💳 Aplicações: ${sqliteCredits.count}`);
  console.log(`   📦 Importações: ${sqliteImports.count}`);
  console.log(`   🏭 Fornecedores: ${sqliteSuppliers.count}`);
  
  // Testar consulta
  const testUser = sqlite.prepare('SELECT * FROM users WHERE email = ?').get('importador@sparkcomex.com');
  if (testUser) {
    console.log(`   ✅ Teste: Usuário ${testUser.full_name} encontrado`);
  }
  
  console.log('   ✅ Validação completa');
}

// Executar migração
migrateData()
  .then(() => {
    console.log('🎯 MIGRAÇÃO FINALIZADA COM SUCESSO!');
    sqlite.close();
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 FALHA NA MIGRAÇÃO:', error);
    sqlite.close();
    process.exit(1);
  });

export { migrateData };