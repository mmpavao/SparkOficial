const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

console.log('🔍 Validação completa do sistema após migração SQLite...\n');

// 1. Validar estrutura das tabelas
console.log('1️⃣ ESTRUTURA DAS TABELAS:');
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`   Tabelas encontradas: ${tables.length}`);
  tables.forEach(table => console.log(`   ✓ ${table.name}`));
} catch (error) {
  console.log('❌ Erro ao verificar tabelas:', error.message);
}

// 2. Validar dados existentes
console.log('\n2️⃣ DADOS EXISTENTES:');
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const creditCount = db.prepare('SELECT COUNT(*) as count FROM credit_applications').get();
  const importCount = db.prepare('SELECT COUNT(*) as count FROM imports').get();
  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  
  console.log(`   Usuários: ${userCount.count}`);
  console.log(`   Aplicações de crédito: ${creditCount.count}`);
  console.log(`   Importações: ${importCount.count}`);
  console.log(`   Fornecedores: ${supplierCount.count}`);
} catch (error) {
  console.log('❌ Erro ao contar dados:', error.message);
}

// 3. Validar funcionalidade de queries
console.log('\n3️⃣ TESTE DE QUERIES:');

// Teste getImportsByUser equivalente
try {
  const importsByUser20 = db.prepare(`
    SELECT * FROM imports 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(20);
  
  console.log(`   ✓ Imports do usuário 20: ${importsByUser20.length} encontradas`);
  if (importsByUser20.length > 0) {
    console.log(`     Primeira importação: ${importsByUser20[0].import_name}`);
  }
} catch (error) {
  console.log('❌ Erro no teste getImportsByUser:', error.message);
}

// Teste getAllImports equivalente
try {
  const allImports = db.prepare(`
    SELECT * FROM imports 
    ORDER BY created_at DESC
  `).all();
  
  console.log(`   ✓ Total de importações: ${allImports.length}`);
} catch (error) {
  console.log('❌ Erro no teste getAllImports:', error.message);
}

// Teste calculateAvailableCredit equivalente
try {
  const creditApp = db.prepare('SELECT * FROM credit_applications WHERE id = ?').get(1);
  if (creditApp) {
    const activeImports = db.prepare(`
      SELECT * FROM imports 
      WHERE credit_application_id = ?
      AND status IN ('planejamento', 'producao', 'entregue_agente', 'transporte_maritimo', 'transporte_aereo', 'desembaraco', 'transporte_nacional', 'planning', 'production', 'delivered_agent', 'maritime_transport', 'air_transport', 'customs_clearance', 'national_transport')
    `).all(1);
    
    console.log(`   ✓ Teste calculateAvailableCredit: ${activeImports.length} importações ativas`);
  } else {
    console.log('   ⚠️  Aplicação de crédito ID 1 não encontrada');
  }
} catch (error) {
  console.log('❌ Erro no teste calculateAvailableCredit:', error.message);
}

// 4. Validar integridade referencial
console.log('\n4️⃣ INTEGRIDADE REFERENCIAL:');
try {
  // Verificar imports com credit_application_id válido
  const importsWithCredit = db.prepare(`
    SELECT i.id, i.import_name, i.credit_application_id, c.id as credit_id
    FROM imports i
    LEFT JOIN credit_applications c ON i.credit_application_id = c.id
    WHERE i.credit_application_id IS NOT NULL
  `).all();
  
  console.log(`   ✓ Importações com crédito: ${importsWithCredit.length}`);
  
  const orphanedImports = importsWithCredit.filter(imp => !imp.credit_id);
  if (orphanedImports.length > 0) {
    console.log(`   ⚠️  Importações órfãs: ${orphanedImports.length}`);
  } else {
    console.log('   ✅ Todas as importações têm crédito válido');
  }
} catch (error) {
  console.log('❌ Erro na validação de integridade:', error.message);
}

// 5. Validar usuários de teste
console.log('\n5️⃣ USUÁRIOS DE TESTE:');
try {
  const testUsers = db.prepare('SELECT id, email, role FROM users').all();
  console.log('   Usuários cadastrados:');
  testUsers.forEach(user => {
    console.log(`     ${user.id}: ${user.email} (${user.role})`);
  });
} catch (error) {
  console.log('❌ Erro ao listar usuários:', error.message);
}

// 6. Sample queries para debug
console.log('\n6️⃣ DADOS DE EXEMPLO:');
try {
  const sampleCredit = db.prepare('SELECT * FROM credit_applications LIMIT 1').get();
  if (sampleCredit) {
    console.log('   ✓ Aplicação de crédito exemplo:');
    console.log(`     ID: ${sampleCredit.id}, User ID: ${sampleCredit.user_id}`);
    console.log(`     Status: ${sampleCredit.status}, Valor: ${sampleCredit.requested_amount}`);
  }
  
  const sampleImport = db.prepare('SELECT * FROM imports LIMIT 1').get();
  if (sampleImport) {
    console.log('   ✓ Importação exemplo:');
    console.log(`     ID: ${sampleImport.id}, Nome: ${sampleImport.import_name}`);
    console.log(`     User ID: ${sampleImport.user_id}, Credit ID: ${sampleImport.credit_application_id}`);
  }
} catch (error) {
  console.log('❌ Erro ao buscar dados de exemplo:', error.message);
}

console.log('\n🎉 Validação completa!');
db.close();