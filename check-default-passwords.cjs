require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Verificando usuários com possíveis senhas padrão...\n');

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

async function checkDefaultPasswords() {
  try {
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar usuários com possíveis senhas padrão
    console.log('🔐 Verificando padrões de senha...\n');
    
    // Lista de senhas padrão comuns
    const commonPasswords = [
      '123456',
      'password',
      'admin',
      'teste',
      'test',
      '123',
      'abc123',
      'qwerty',
      'senha',
      'admin123',
      'teste123',
      'spark',
      'comex',
      'sparkcomex',
      '12345678',
      'password123'
    ];
    
    // Verificar usuários existentes
    const usersResult = await client.query(`
      SELECT 
        id,
        email,
        full_name,
        company_name,
        cnpj,
        password,
        role,
        status,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log(`👥 Usuários encontrados (${usersResult.rows.length}):`);
    
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.full_name || 'Nome não informado'}`);
        console.log(`      📧 Email: ${user.email}`);
        console.log(`      🏢 Empresa: ${user.company_name || 'Não informado'}`);
        console.log(`      🆔 CNPJ: ${user.cnpj || 'Não informado'}`);
        console.log(`      👑 Role: ${user.role || 'Não informado'}`);
        console.log(`      📊 Status: ${user.status || 'Não informado'}`);
        console.log(`      📅 Criado em: ${user.created_at}`);
        
        // Verificar se a senha parece ser padrão
        if (user.password) {
          const password = user.password.toLowerCase();
          const isCommonPassword = commonPasswords.some(common => 
            password.includes(common.toLowerCase()) || 
            password === common.toLowerCase()
          );
          
          if (isCommonPassword) {
            console.log(`      🔑 Senha: POSSÍVEL SENHA PADRÃO (${user.password})`);
          } else {
            console.log(`      🔑 Senha: Hash criptografado (${user.password.substring(0, 10)}...)`);
          }
        }
      });
      
      console.log('\n💡 **DICAS DE LOGIN:**');
      console.log('   🔐 **Senhas padrão comuns para testar:**');
      commonPasswords.forEach((pwd, i) => {
        if (i < 10) console.log(`      ${i + 1}. ${pwd}`);
      });
      
      console.log('\n   📧 **Usuários recomendados para teste:**');
      console.log('      1. teste@sparkcomex.com (usuário mais recente)');
      console.log('      2. customs@test.com (usuário de teste)');
      console.log('      3. despachante@sparkcomex.com (despachante)');
      
      console.log('\n   🚀 **Como testar:**');
      console.log('      - Acesse: http://localhost:3000');
      console.log('      - Use um dos emails acima');
      console.log('      - Teste as senhas padrão listadas');
      console.log('      - Ou crie uma nova conta');
      
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
    
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

checkDefaultPasswords();
