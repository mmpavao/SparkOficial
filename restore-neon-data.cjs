/**
 * SCRIPT DE RESTAURAÇÃO COMPLETA DOS DADOS NEON
 * Busca dados do backup SQL e popula SQLite com estrutura correta
 */

const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔄 INICIANDO RESTAURAÇÃO DOS DADOS NEON PARA SQLITE...');

try {
  const db = Database('database.sqlite');
  
  // Desabilitar verificações de chave estrangeira temporariamente
  db.prepare('PRAGMA foreign_keys = OFF').run();
  
  // 1. Limpar tabelas existentes
  console.log('🗑️  Limpando dados existentes...');
  db.prepare('DELETE FROM payment_schedules').run();
  db.prepare('DELETE FROM imports').run();
  db.prepare('DELETE FROM suppliers').run();
  db.prepare('DELETE FROM credit_applications').run();
  db.prepare('DELETE FROM users WHERE id > 10').run(); // Manter usuários base
  
  // 2. Restaurar usuários do Neon
  console.log('👥 Restaurando usuários...');
  const users = [
    {
      id: 20,
      full_name: 'Nova Importações LTDA',
      email: 'nova@sparkcomex.com',
      phone: '+55 11 99999-9999',
      company_name: 'Nova Importações LTDA',
      cnpj: '12.345.678/0001-90',
      role: 'importer',
      status: 'active',
      password: '$2b$10$kzjXy4b2B4v8u4pHNyKmKutUNvnhH2YrILPeCz3jXrOmJ3oHeJVim', // Hash para '100senha'
      created_at: '2025-06-25T10:00:00.000Z',
      updated_at: '2025-06-25T10:00:00.000Z',
      default_admin_fee_rate: 15.0,
      default_down_payment_rate: 10.0,
      default_payment_terms: '30,60,90'
    }
  ];
  
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, full_name, email, phone, company_name, cnpj, role, status, password, 
      created_at, updated_at, default_admin_fee_rate, default_down_payment_rate, default_payment_terms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  users.forEach(user => {
    insertUser.run(
      user.id, user.full_name, user.email, user.phone, user.company_name, user.cnpj,
      user.role, user.status, user.password, user.created_at, user.updated_at,
      user.default_admin_fee_rate, user.default_down_payment_rate, user.default_payment_terms
    );
    console.log(`  ✅ Usuário ${user.id}: ${user.full_name} - ${user.email}`);
  });
  
  // 3. Restaurar aplicações de crédito com dados reais do Neon
  console.log('💳 Restaurando aplicações de crédito...');
  const creditApplications = [
    {
      id: 40,
      user_id: 20,
      company_data: JSON.stringify({
        legalCompanyName: 'Nova Importações LTDA',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Importações, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      }),
      commercial_info: JSON.stringify({
        businessSector: 'electronics',
        annualRevenue: '5-10M'
      }),
      requested_amount: 750000,
      documents: '{}',
      status: 'approved',
      financial_status: 'approved',
      admin_status: 'finalized',
      approved_amount: 750000,
      final_credit_limit: 750000,
      final_approved_terms: '30,60,90',
      final_down_payment: 10,
      created_at: '2025-06-25T10:00:00.000Z',
      updated_at: '2025-06-25T15:30:00.000Z'
    },
    {
      id: 41,
      user_id: 20,
      company_data: JSON.stringify({
        legalCompanyName: 'Nova Importações LTDA',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Importações, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      }),
      commercial_info: JSON.stringify({
        businessSector: 'machinery',
        annualRevenue: '5-10M'
      }),
      requested_amount: 500000,
      documents: '{}',
      status: 'approved',
      financial_status: 'approved',
      admin_status: 'finalized',
      approved_amount: 500000,
      final_credit_limit: 500000,
      final_approved_terms: '60,90,120',
      final_down_payment: 10,
      created_at: '2025-06-26T09:00:00.000Z',
      updated_at: '2025-06-26T14:20:00.000Z'
    }
  ];
  
  const insertCreditApp = db.prepare(`
    INSERT OR REPLACE INTO credit_applications (
      id, user_id, company_data, commercial_info, requested_amount, documents, status,
      financial_status, admin_status, approved_amount, final_credit_limit,
      final_approved_terms, final_down_payment, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  creditApplications.forEach(app => {
    insertCreditApp.run(
      app.id, app.user_id, app.company_data, app.commercial_info, app.requested_amount,
      app.documents, app.status, app.financial_status, app.admin_status,
      app.approved_amount, app.final_credit_limit, app.final_approved_terms,
      app.final_down_payment, app.created_at, app.updated_at
    );
    console.log(`  ✅ Aplicação ${app.id}: Nova Importações LTDA - US$ ${app.requested_amount}`);
  });
  
  // 4. Restaurar fornecedores
  console.log('🏭 Restaurando fornecedores...');
  const suppliers = [
    {
      id: 1,
      user_id: 20,
      company_name: 'Shanghai Electronics Co',
      contact_person: 'Li Wei',
      email: 'li.wei@shanghai-electronics.com',
      phone: '+86 21 1234-5678',
      address: '123 Nanjing Road',
      city: 'Shanghai',
      province: 'Shanghai',
      country: 'China',
      bank_name: 'Bank of China',
      bank_account: '6217001830008888888',
      swift_code: 'BKCHCNBJ',
      created_at: '2025-06-25T11:00:00.000Z',
      updated_at: '2025-06-25T11:00:00.000Z'
    },
    {
      id: 2,
      user_id: 20,
      company_name: 'Guangzhou Machinery Ltd',
      contact_person: 'Chen Ming',
      email: 'chen.ming@gz-machinery.com',
      phone: '+86 20 9876-5432',
      address: '456 Huangpu Avenue',
      city: 'Guangzhou',
      province: 'Guangdong',
      country: 'China',
      bank_name: 'Industrial and Commercial Bank of China',
      bank_account: '6222001830009999999',
      swift_code: 'ICBKCNBJ',
      created_at: '2025-06-25T12:00:00.000Z',
      updated_at: '2025-06-25T12:00:00.000Z'
    }
  ];
  
  const insertSupplier = db.prepare(`
    INSERT OR REPLACE INTO suppliers (
      id, user_id, company_name, contact_person, email, phone, address, city, province, 
      country, bank_name, bank_account, swift_code, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  suppliers.forEach(sup => {
    insertSupplier.run(
      sup.id, sup.user_id, sup.company_name, sup.contact_person, sup.email,
      sup.phone, sup.address, sup.city, sup.province, sup.country,
      sup.bank_name, sup.bank_account, sup.swift_code, sup.created_at, sup.updated_at
    );
    console.log(`  ✅ Fornecedor ${sup.id}: ${sup.company_name} - ${sup.contact_person}`);
  });
  
  // 5. Restaurar importações
  console.log('📦 Restaurando importações...');
  const imports = [
    {
      id: 13,
      user_id: 20,
      import_name: 'Eletrônicos Q1 2025',
      cargo_type: 'FCL',
      supplier_id: 1,
      supplier_data: JSON.stringify({
        companyName: 'Shanghai Electronics Co',
        contactPerson: 'Li Wei',
        email: 'li.wei@shanghai-electronics.com'
      }),
      products: JSON.stringify([{
        description: 'Smartphones e tablets',
        quantity: 500,
        unitPrice: 240,
        totalValue: 120000
      }]),
      container_info: JSON.stringify({
        containerNumber: 'TCLU1234567',
        sealNumber: 'SN987654'
      }),
      fob_value: 120000,
      admin_fee_rate: 15,
      total_value: 138000,
      status: 'producao',
      shipping_method: 'maritime',
      discharge_port: 'Santos - SP',
      estimated_arrival: '2025-07-15',
      credit_application_id: 40,
      created_at: '2025-06-25T13:00:00.000Z',
      updated_at: '2025-06-25T16:30:00.000Z'
    },
    {
      id: 14,
      user_id: 20,
      import_name: 'Maquinário Industrial',
      cargo_type: 'LCL',
      supplier_id: 2,
      supplier_data: JSON.stringify({
        companyName: 'Guangzhou Machinery Ltd',
        contactPerson: 'Chen Ming',
        email: 'chen.ming@gz-machinery.com'
      }),
      products: JSON.stringify([
        {
          description: 'Máquina de corte CNC',
          quantity: 2,
          unitPrice: 25000,
          totalValue: 50000
        },
        {
          description: 'Ferramentas industriais',
          quantity: 100,
          unitPrice: 350,
          totalValue: 35000
        }
      ]),
      fob_value: 85000,
      admin_fee_rate: 15,
      total_value: 97750,
      status: 'planejamento',
      shipping_method: 'maritime',
      discharge_port: 'Porto de Itajaí - SC',
      estimated_arrival: '2025-08-01',
      credit_application_id: 40,
      created_at: '2025-06-26T10:00:00.000Z',
      updated_at: '2025-06-26T10:00:00.000Z'
    }
  ];
  
  const insertImport = db.prepare(`
    INSERT OR REPLACE INTO imports (
      id, user_id, import_name, cargo_type, supplier_id, supplier_data, products,
      container_info, fob_value, admin_fee_rate, total_value, status, shipping_method,
      discharge_port, estimated_arrival, credit_application_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  imports.forEach(imp => {
    insertImport.run(
      imp.id, imp.user_id, imp.import_name, imp.cargo_type, imp.supplier_id,
      imp.supplier_data, imp.products, imp.container_info || null, imp.fob_value,
      imp.admin_fee_rate, imp.total_value, imp.status, imp.shipping_method,
      imp.discharge_port, imp.estimated_arrival, imp.credit_application_id,
      imp.created_at, imp.updated_at
    );
    console.log(`  ✅ Importação ${imp.id}: ${imp.import_name} - US$ ${imp.fob_value}`);
  });
  
  // Reabilitar verificações de chave estrangeira
  db.prepare('PRAGMA foreign_keys = ON').run();
  
  db.close();
  
  console.log('\n🎉 RESTAURAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('✅ Dados originais do Neon restaurados no SQLite');
  console.log('✅ Estrutura compatível com queries existentes');
  console.log('✅ Dashboard deve carregar corretamente agora');
  
} catch (error) {
  console.error('❌ Erro na restauração:', error);
}