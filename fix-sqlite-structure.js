/**
 * SCRIPT DE CORREÇÃO - ESTRUTURA SQLITE
 * Corrige a estrutura do banco SQLite para coincidir com o schema Drizzle
 */

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('database.sqlite');

console.log('🔧 Iniciando correção da estrutura do banco SQLite...');

// 1. Verificar estrutura atual
console.log('\n📋 Verificando estrutura atual...');

try {
  // Verificar se a tabela imports existe e sua estrutura
  const importsInfo = db.prepare("PRAGMA table_info(imports)").all();
  console.log('Colunas da tabela imports:', importsInfo.map(col => col.name));
  
  // Verificar se existem dados
  const importsCount = db.prepare("SELECT COUNT(*) as count FROM imports").get();
  console.log(`Total de imports: ${importsCount.count}`);
  
  // Se a tabela não tem a coluna credit_application_id, vamos adicioná-la
  const hasCredidApplicationId = importsInfo.some(col => col.name === 'credit_application_id');
  
  if (!hasCredidApplicationId) {
    console.log('🔧 Adicionando coluna credit_application_id...');
    db.prepare("ALTER TABLE imports ADD COLUMN credit_application_id INTEGER").run();
  }
  
  // Verificar tabela notifications
  try {
    const notificationsInfo = db.prepare("PRAGMA table_info(notifications)").all();
    console.log('Colunas da tabela notifications:', notificationsInfo.map(col => col.name));
    
    const hasStatus = notificationsInfo.some(col => col.name === 'status');
    if (!hasStatus) {
      console.log('🔧 Adicionando coluna status à tabela notifications...');
      db.prepare("ALTER TABLE notifications ADD COLUMN status TEXT DEFAULT 'unread'").run();
    }
  } catch (error) {
    console.log('📝 Criando tabela notifications...');
    db.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        status TEXT NOT NULL DEFAULT 'unread',
        priority TEXT NOT NULL DEFAULT 'normal',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        read_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();
  }
  
  // Verificar payment_schedules
  try {
    const paymentsInfo = db.prepare("PRAGMA table_info(payment_schedules)").all();
    console.log('Colunas da tabela payment_schedules:', paymentsInfo.map(col => col.name));
  } catch (error) {
    console.log('📝 Criando tabela payment_schedules...');
    db.prepare(`
      CREATE TABLE IF NOT EXISTS payment_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        import_id INTEGER NOT NULL,
        payment_type TEXT NOT NULL,
        amount TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        currency TEXT DEFAULT 'USD',
        installment_number INTEGER,
        total_installments INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (import_id) REFERENCES imports(id)
      )
    `).run();
  }
  
  console.log('✅ Estrutura do banco corrigida!');
  
  // Inserir alguns dados de teste se estiverem vazios
  const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (usersCount.count === 0) {
    console.log('📝 Inserindo dados de teste...');
    
    // Inserir usuários
    const insertUser = db.prepare(`
      INSERT INTO users (full_name, email, password, role, cnpj, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run('Admin Spark', 'admin@sparkcomex.com', '$2b$12$LQv3c1yqBwlVHpPZ7L2i8uzF4f5vgx4mQlRmOdRBH4TP6Gh3kOHvy', 'admin', '12345678000123', '11999999999', 'active');
    insertUser.run('Financeira Spark', 'financeira@sparkcomex.com', '$2b$12$LQv3c1yqBwlVHpPZ7L2i8uzF4f5vgx4mQlRmOdRBH4TP6Gh3kOHvy', 'financeira', '12345678000124', '11999999998', 'active');
    insertUser.run('Importador Teste', 'teste@sparkcomex.com', '$2b$12$LQv3c1yqBwlVHpPZ7L2i8uzF4f5vgx4mQlRmOdRBH4TP6Gh3kOHvy', 'importer', '12345678000125', '11999999997', 'active');
    
    console.log('✅ Usuários inseridos!');
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  db.close();
}

console.log('\n🎉 Correção finalizada!');