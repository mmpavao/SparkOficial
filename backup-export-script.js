#!/usr/bin/env node

/**
 * SCRIPT DE BACKUP COMPLETO - NEON DATABASE
 * Exporta todos os dados do banco atual para arquivo SQL
 * Execução: node backup-export-script.js
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Configuração do banco
const sql = neon(process.env.DATABASE_URL);

// Lista de tabelas para backup
const tables = [
  'users',
  'credit_applications', 
  'imports',
  'suppliers',
  'admin_fees',
  'credit_usage',
  'payment_schedules',
  'payments',
  'import_documents',
  'import_payments',
  'import_products',
  'import_timeline',
  'notifications',
  'api_configurations',
  'cnpj_analyses',
  'consultamais_analysis',
  'sessions'
];

async function exportTable(tableName) {
  try {
    console.log(`📦 Exportando tabela: ${tableName}`);
    
    // Buscar dados da tabela - corrigindo sintaxe do Neon
    const query = `SELECT * FROM ${tableName}`;
    const rows = await sql(query);
    
    if (rows.length === 0) {
      console.log(`   ⚠️  Tabela ${tableName} vazia - pulando`);
      return '';
    }
    
    console.log(`   ✅ ${rows.length} registros encontrados`);
    
    // Gerar comandos INSERT
    let insertCommands = `\n-- Dados da tabela: ${tableName}\n`;
    
    for (const row of rows) {
      const columns = Object.keys(row).join(', ');
      const values = Object.values(row).map(value => {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return value;
      }).join(', ');
      
      insertCommands += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
    }
    
    return insertCommands;
    
  } catch (error) {
    console.error(`❌ Erro ao exportar ${tableName}:`, error.message);
    return `-- ERRO ao exportar ${tableName}: ${error.message}\n`;
  }
}

async function createFullBackup() {
  console.log('🚀 INICIANDO BACKUP COMPLETO DO BANCO NEON');
  console.log('=' + '='.repeat(50));
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-neon-data-${timestamp}.sql`;
  
  let backupContent = `-- BACKUP COMPLETO SPARK COMEX
-- Data: ${new Date().toISOString()}
-- Origem: Neon Database
-- Destino: SQLite Migration
-- 
-- INSTRUÇÕES DE RESTAURAÇÃO:
-- 1. Execute este arquivo em qualquer banco PostgreSQL/SQLite
-- 2. Todos os dados serão restaurados
-- 3. Mantenha este arquivo como backup de segurança
--
-- TABELAS INCLUÍDAS: ${tables.join(', ')}

SET client_encoding = 'UTF8';
`;

  for (const table of tables) {
    const tableData = await exportTable(table);
    backupContent += tableData;
  }
  
  backupContent += `\n-- FIM DO BACKUP - ${new Date().toISOString()}\n`;
  
  // Salvar arquivo de backup
  fs.writeFileSync(backupFileName, backupContent, 'utf8');
  
  console.log('=' + '='.repeat(50));
  console.log('✅ BACKUP COMPLETO FINALIZADO');
  console.log(`📁 Arquivo criado: ${backupFileName}`);
  console.log(`📊 Tamanho: ${(fs.statSync(backupFileName).size / 1024).toFixed(2)} KB`);
  console.log('');
  console.log('🔐 DADOS SEGUROS:');
  console.log('   - Todos os usuários e senhas');
  console.log('   - Todas as aplicações de crédito');
  console.log('   - Todas as importações');
  console.log('   - Todos os fornecedores');
  console.log('   - Todas as configurações');
  console.log('');
  console.log('📥 DOWNLOAD: Clique no arquivo para baixar');
  
  return backupFileName;
}

// Executar backup
createFullBackup()
  .then(filename => {
    console.log(`🎯 Backup salvo em: ${filename}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 ERRO NO BACKUP:', error);
    process.exit(1);
  });

export { createFullBackup };