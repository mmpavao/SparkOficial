const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

console.log('=== VERIFICAÇÃO DE DADOS ===');

const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log('Usuários:', users.count);

try {
  const credit = db.prepare('SELECT COUNT(*) as count FROM credit_applications').get();
  console.log('Aplicações de crédito:', credit.count);
} catch (error) {
  console.log('Aplicações de crédito: Tabela não encontrada');
}

const imports = db.prepare('SELECT COUNT(*) as count FROM imports').get();
console.log('Importações:', imports.count);

const suppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
console.log('Fornecedores:', suppliers.count);

console.log('\n=== SAMPLE IMPORTS ===');
const importSample = db.prepare('SELECT id, import_name, total_value, status FROM imports LIMIT 3').all();
importSample.forEach(imp => {
  console.log(`ID: ${imp.id}, Nome: ${imp.import_name}, Valor: ${imp.total_value}, Status: ${imp.status}`);
});

console.log('\n=== SAMPLE USERS ===');
const userSample = db.prepare('SELECT id, full_name, email, role FROM users LIMIT 3').all();
userSample.forEach(user => {
  console.log(`ID: ${user.id}, Nome: ${user.full_name}, Email: ${user.email}, Role: ${user.role}`);
});

db.close();