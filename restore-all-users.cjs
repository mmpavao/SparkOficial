/**
 * RESTAURAR TODOS OS USUÁRIOS - SISTEMA SPARK COMEX
 * Inclui usuários admin, financeira, super admin e importador
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

// Conectar ao banco SQLite
const db = new Database('database.sqlite');

console.log('🔄 RESTAURANDO TODOS OS USUÁRIOS...\n');

// Criar hash para senha '100senha'
const passwordHash = '$2b$10$kzjXy4b2B4v8u4pHNyKmKutUNvnhH2YrILPeCz3jXrOmJ3oHeJVim';

// Usuários completos do sistema
const users = [
  {
    id: 20,
    company_name: 'Nova Importações LTDA',
    cnpj: '12.345.678/0001-90',
    full_name: 'Nova Importações LTDA',
    phone: '+55 11 99999-9999',
    email: 'nova@sparkcomex.com',
    password: passwordHash,
    role: 'importer',
    status: 'active',
    default_admin_fee_rate: 15.0,
    default_down_payment_rate: 10.0,
    default_payment_terms: '30,60,90',
    created_at: '2025-06-25T10:00:00.000Z',
    updated_at: '2025-06-25T10:00:00.000Z'
  },
  {
    id: 21,
    company_name: 'Spark Comex Admin',
    cnpj: '11.111.111/0001-11',
    full_name: 'Administrador Spark Comex',
    phone: '+55 11 8888-8888',
    email: 'admin@sparkcomex.com',
    password: passwordHash,
    role: 'admin',
    status: 'active',
    default_admin_fee_rate: 15.0,
    default_down_payment_rate: 10.0,
    default_payment_terms: '30,60,90',
    created_at: '2025-06-25T10:00:00.000Z',
    updated_at: '2025-06-25T10:00:00.000Z'
  },
  {
    id: 22,
    company_name: 'Spark Comex Financeira',
    cnpj: '22.222.222/0001-22',
    full_name: 'Analista Financeiro',
    phone: '+55 11 7777-7777',
    email: 'financeira@sparkcomex.com',
    password: passwordHash,
    role: 'financeira',
    status: 'active',
    default_admin_fee_rate: 15.0,
    default_down_payment_rate: 10.0,
    default_payment_terms: '30,60,90',
    created_at: '2025-06-25T10:00:00.000Z',
    updated_at: '2025-06-25T10:00:00.000Z'
  },
  {
    id: 23,
    company_name: 'Spark Comex Super Admin',
    cnpj: '33.333.333/0001-33',
    full_name: 'Super Administrador',
    phone: '+55 11 6666-6666',
    email: 'superadmin@sparkcomex.com',
    password: passwordHash,
    role: 'superadmin',
    status: 'active',
    default_admin_fee_rate: 15.0,
    default_down_payment_rate: 10.0,
    default_payment_terms: '30,60,90',
    created_at: '2025-06-25T10:00:00.000Z',
    updated_at: '2025-06-25T10:00:00.000Z'
  }
];

const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (
    id, company_name, cnpj, full_name, phone, email, password, role, status,
    default_admin_fee_rate, default_down_payment_rate, default_payment_terms,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

users.forEach(user => {
  insertUser.run(
    user.id, user.company_name, user.cnpj, user.full_name, user.phone,
    user.email, user.password, user.role, user.status,
    user.default_admin_fee_rate, user.default_down_payment_rate, 
    user.default_payment_terms, user.created_at, user.updated_at
  );
  console.log(`✅ ${user.role.toUpperCase()}: ${user.full_name} (${user.email})`);
});

console.log('\n🎉 TODOS OS USUÁRIOS RESTAURADOS!');
console.log('🔑 Senha para todos: 100senha');
console.log('\n📋 CREDENCIAIS:');
console.log('• Importador: nova@sparkcomex.com');
console.log('• Admin: admin@sparkcomex.com');
console.log('• Financeira: financeira@sparkcomex.com');
console.log('• Super Admin: superadmin@sparkcomex.com');

db.close();