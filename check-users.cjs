require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Verificando usuários cadastrados no banco de dados...\n');

// Verificar se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env');
  process.exit(1);
}

console.log('✅ DATABASE_URL encontrada');
console.log('📡 Conectando ao banco de dados...\n');

// Criar pool de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkUsers() {
  try {
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar usuários existentes (APENAS LEITURA)
    const usersResult = await client.query(`
      SELECT 
        id,
        email,
        full_name,
        company_name,
        cnpj,
        created_at,
        is_admin
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n👥 Usuários encontrados (${usersResult.rows.length}):`);
    
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.full_name || 'Nome não informado'}`);
        console.log(`      📧 Email: ${user.email}`);
        console.log(`      🏢 Empresa: ${user.company_name || 'Não informado'}`);
        console.log(`      🆔 CNPJ: ${user.cnpj || 'Não informado'}`);
        console.log(`      👑 Admin: ${user.is_admin ? 'Sim' : 'Não'}`);
        console.log(`      📅 Criado em: ${user.created_at}`);
      });
      
      console.log('\n💡 **DICA DE LOGIN:**');
      console.log('   Use o email e senha que você cadastrou anteriormente.');
      console.log('   Se não lembrar, você pode criar uma nova conta através da tela de registro.');
      
    } else {
      console.log('   Nenhum usuário encontrado no banco.');
      console.log('\n💡 **DICA:**');
      console.log('   O banco está vazio. Você pode criar uma nova conta através da tela de registro.');
    }
    
    client.release();
    console.log('\n🎉 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao consultar usuários:');
    console.error(`   ${error.message}`);
    
    if (error.code === '42P01') {
      console.error('\n💡 Dica: A tabela "users" não existe. O banco pode estar vazio ou com estrutura diferente.');
    }
    
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

checkUsers();
