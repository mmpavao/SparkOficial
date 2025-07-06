import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@shared/schema';

// Create SQLite database connection
const sqlite = new Database('database.sqlite');

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Initialize database with schema
export function initializeDatabase() {
  console.log('🔄 Initializing SQLite database...');
  
  // Create tables if they don't exist
  const createTablesSQL = `
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (analyzed_by) REFERENCES users(id),
      FOREIGN KEY (financial_approved_by) REFERENCES users(id),
      FOREIGN KEY (admin_finalized_by) REFERENCES users(id)
    );

    -- Imports table
    CREATE TABLE IF NOT EXISTS imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- Suppliers table
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      credit_application_id INTEGER NOT NULL,
      import_id INTEGER NOT NULL,
      amount_used REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (credit_application_id) REFERENCES credit_applications(id),
      FOREIGN KEY (import_id) REFERENCES imports(id)
    );

    -- Admin Fees table
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

    -- Payment Schedules table
    CREATE TABLE IF NOT EXISTS payment_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    -- Import Documents table
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

    -- Import Payments table
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

    -- Import Products table
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

    -- Import Timeline table
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

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- API Configurations table
    CREATE TABLE IF NOT EXISTS api_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL UNIQUE,
      api_key TEXT,
      endpoint TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- CNPJ Analyses table
    CREATE TABLE IF NOT EXISTS cnpj_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cnpj TEXT NOT NULL,
      analysis_data TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Consultamais Analysis table
    CREATE TABLE IF NOT EXISTS consultamais_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cnpj TEXT NOT NULL,
      analysis_result TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire TEXT NOT NULL
    );
  `;

  // Execute table creation
  sqlite.exec(createTablesSQL);
  
  console.log('✅ SQLite database initialized successfully');
  return db;
}

// Close database connection
export function closeDatabase() {
  sqlite.close();
}