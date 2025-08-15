require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testando conexão com o banco de dados Neon...\n');
console.log('⚠️  REGRA NÚMERO 1: APENAS LEITURA - NENHUMA MODIFICAÇÃO NO BANCO!\n');

// Verificar se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env');
  process.exit(1);
}

console.log('✅ DATABASE_URL encontrada');
console.log('📡 Tentando conectar ao banco de dados...\n');

// Criar pool de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Query de teste executada com sucesso!');
    console.log(`⏰ Hora atual do servidor: ${result.rows[0].current_time}`);
    console.log(`📊 Versão do PostgreSQL: ${result.rows[0].db_version.split(' ')[0]}`);
    
    // Verificar tabelas existentes (APENAS LEITURA - SEM MODIFICAÇÕES)
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Tabelas encontradas (${tablesResult.rows.length}):`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('   Nenhuma tabela encontrada (banco vazio)');
    }
    
    client.release();
    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Verifique se o servidor está rodando e acessível');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Dica: Verifique se a URL do banco está correta');
    } else if (error.code === '28P01') {
      console.error('\n💡 Dica: Verifique as credenciais de acesso');
    }
    
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

testConnection();
