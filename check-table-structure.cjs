const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

console.log('🔍 Verificando estrutura das tabelas...\n');

// Verificar estrutura da tabela credit_applications
try {
  const tableInfo = db.prepare("PRAGMA table_info(credit_applications)").all();
  console.log('📋 CREDIT_APPLICATIONS COLUMNS:');
  tableInfo.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
} catch (error) {
  console.log('❌ Erro ao verificar credit_applications:', error.message);
}

console.log('\n');

// Verificar estrutura da tabela imports
try {
  const tableInfo = db.prepare("PRAGMA table_info(imports)").all();
  console.log('📋 IMPORTS COLUMNS:');
  tableInfo.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
} catch (error) {
  console.log('❌ Erro ao verificar imports:', error.message);
}

console.log('\n');

// Verificar dados existentes
try {
  const creditCount = db.prepare('SELECT COUNT(*) as count FROM credit_applications').get();
  const importCount = db.prepare('SELECT COUNT(*) as count FROM imports').get();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  console.log('📊 CONTAGEM DE DADOS:');
  console.log(`Usuários: ${userCount.count}`);
  console.log(`Aplicações de crédito: ${creditCount.count}`);
  console.log(`Importações: ${importCount.count}`);
} catch (error) {
  console.log('❌ Erro ao contar dados:', error.message);
}

db.close();