const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

console.log('🔧 Inserindo dados de teste...');

// Inserir aplicações de crédito de teste
const insertCredit = db.prepare(`
  INSERT INTO credit_applications (
    user_id, company_data, requested_amount, 
    status, financial_status, admin_status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

try {
  const companyData1 = JSON.stringify({
    legalCompanyName: 'Empresa Teste Ltda',
    cnpj: '12345678000123',
    address: 'Rua Teste, 123'
  });
  
  const companyData2 = JSON.stringify({
    legalCompanyName: 'Importadora ABC',
    cnpj: '98765432000109',
    address: 'Av. Principal, 456'
  });
  
  insertCredit.run(20, companyData1, 750000, 'approved', 'approved', 'admin_finalized', new Date().toISOString());
  insertCredit.run(22, companyData2, 500000, 'pending', 'pending', 'pending', new Date().toISOString());
  
  console.log('✅ Aplicações de crédito inseridas!');
} catch (error) {
  console.log('⚠️ Aplicações já existem ou erro:', error.message);
}

// Atualizar importações existentes para ter credit_application_id
const updateImport = db.prepare(`
  UPDATE imports 
  SET credit_application_id = ? 
  WHERE user_id = ? AND credit_application_id IS NULL
`);

try {
  updateImport.run(1, 20);  // Importação do user 20 vinculada ao crédito 1
  updateImport.run(1, 20);  // Segunda importação também
  
  console.log('✅ Importações atualizadas com credit_application_id!');
} catch (error) {
  console.log('⚠️ Erro ao atualizar importações:', error.message);
}

// Verificar dados finais
const credits = db.prepare('SELECT COUNT(*) as count FROM credit_applications').get();
const imports = db.prepare('SELECT COUNT(*) as count FROM imports').get();
const users = db.prepare('SELECT COUNT(*) as count FROM users').get();

console.log('\n📊 DADOS FINAIS:');
console.log(`Usuários: ${users.count}`);
console.log(`Aplicações de crédito: ${credits.count}`);
console.log(`Importações: ${imports.count}`);

// Verificar sample import with credit_application_id
const sampleImport = db.prepare('SELECT id, import_name, user_id, credit_application_id FROM imports LIMIT 1').get();
console.log('\n📋 Sample import:', sampleImport);

db.close();
console.log('\n🎉 Dados de teste inseridos!');