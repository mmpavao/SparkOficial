const Database = require('better-sqlite3');

try {
  const db = Database('database.sqlite');
  
  console.log('=== VERIFICAÇÃO DOS DADOS SQLITE ===');
  
  // Verificar usuários
  const users = db.prepare('SELECT id, full_name, email, company_name, role FROM users ORDER BY id').all();
  console.log('\n👥 USUÁRIOS:', users.length);
  users.forEach(user => {
    console.log(`  ${user.id}: ${user.full_name} (${user.email}) - ${user.company_name} [${user.role}]`);
  });
  
  // Verificar aplicações de crédito
  try {
    const creditApps = db.prepare('SELECT * FROM credit_applications ORDER BY id LIMIT 3').all();
    console.log('\n💳 APLICAÇÕES DE CRÉDITO:', creditApps.length);
    if (creditApps.length > 0) {
      console.log('Colunas disponíveis:', Object.keys(creditApps[0]));
      creditApps.forEach(app => {
        console.log(`  ${app.id}: ${app.legal_company_name || 'N/A'} - US$ ${app.requested_amount || 'N/A'} [${app.status || 'N/A'}]`);
      });
    }
  } catch (error) {
    console.log('❌ Erro nas aplicações de crédito:', error.message);
  }
  
  // Verificar importações
  const imports = db.prepare('SELECT id, user_id, import_name, fob_value, status FROM imports ORDER BY id').all();
  console.log('\n📦 IMPORTAÇÕES:', imports.length);
  imports.forEach(imp => {
    console.log(`  ${imp.id}: ${imp.import_name} - US$ ${imp.fob_value} [${imp.status}]`);
  });
  
  // Verificar fornecedores
  const suppliers = db.prepare('SELECT id, user_id, company_name, contact_name FROM suppliers ORDER BY id').all();
  console.log('\n🏭 FORNECEDORES:', suppliers.length);
  suppliers.forEach(sup => {
    console.log(`  ${sup.id}: ${sup.company_name} - ${sup.contact_name}`);
  });
  
  db.close();
  console.log('\n✅ Verificação concluída');
  
} catch (error) {
  console.error('❌ Erro ao verificar dados:', error.message);
}