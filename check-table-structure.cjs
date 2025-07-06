const Database = require('better-sqlite3');

const db = Database('database.sqlite');

console.log('=== ESTRUTURA DA TABELA USERS ===');
const userStructure = db.prepare("PRAGMA table_info(users)").all();
console.log('Colunas da tabela users:');
userStructure.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
});

console.log('\n=== ESTRUTURA DA TABELA CREDIT_APPLICATIONS ===');
const creditStructure = db.prepare("PRAGMA table_info(credit_applications)").all();
console.log('Colunas da tabela credit_applications:');
creditStructure.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
});

console.log('\n=== ESTRUTURA DA TABELA SUPPLIERS ===');
const supplierStructure = db.prepare("PRAGMA table_info(suppliers)").all();
console.log('Colunas da tabela suppliers:');
supplierStructure.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
});

console.log('\n=== ESTRUTURA DA TABELA IMPORTS ===');
const importStructure = db.prepare("PRAGMA table_info(imports)").all();
console.log('Colunas da tabela imports:');
importStructure.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
});

db.close();