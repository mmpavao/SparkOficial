#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns to find hardcoded Portuguese text
const HARDCODED_PATTERNS = [
  // Zod validation messages
  /z\.string\(\)\.min\(\d+,\s*["']([^"']*(?:obrigatório|inválido|deve|mínimo|máximo)[^"']*)["']\)/g,
  /z\.string\(\)\.email\(\s*["']([^"']*(?:inválido|Email)[^"']*)["']\)/g,
  /z\.number\(\)\.min\(\d+,\s*["']([^"']*(?:deve|mínimo|maior)[^"']*)["']\)/g,
  /z\.enum\([^,]+,\s*\{\s*required_error:\s*["']([^"']*(?:obrigatório|Selecione)[^"']*)["']\s*\}/g,
  
  // Toast messages
  /toast\(\s*\{[^}]*title:\s*["']([^"']*(?:Sucesso|Erro|Aviso)[^"']*)["']/g,
  /toast\(\s*\{[^}]*description:\s*["']([^"']*(?:com sucesso|inválido|obrigatório|erro)[^"']*)["']/g,
  
  // Alert/confirm messages
  /alert\(\s*["']([^"']*(?:Erro|muito grande|inválido|andamento)[^"']*)["']\)/g,
  /confirm\(\s*["']([^"']*(?:certeza|deseja|substituir)[^"']*)["']\)/g,
  
  // Form labels and titles
  /<FormLabel[^>]*>([^<]*(?:obrigatório|\*)[^<]*)<\/FormLabel>/g,
  /<h[1-6][^>]*>([^<]*(?:Documentos|Obrigatórios|Complementares|Adicionais)[^<]*)<\/h[1-6]>/g,
  
  // General Portuguese patterns
  /["']([^"']*(?:obrigatório|inválido|deve ter|mínimo|máximo|pelo menos|muito grande|não encontrado|com sucesso|erro ao)[^"']*)["']/g
];

const EXCLUDED_PATTERNS = [
  /t\(['"]/, // Already using translation function
  /\$\{/, // Template literals with variables
  /console\./, // Console messages
  /\/\*/, // Comments
  /\/\//, // Comments
];

function findHardcodedText(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [];
  
  HARDCODED_PATTERNS.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1] || match[0];
      const line = content.substring(0, match.index).split('\n').length;
      
      // Skip if it's already translated or excluded
      const isExcluded = EXCLUDED_PATTERNS.some(excludePattern => 
        excludePattern.test(match[0])
      );
      
      if (!isExcluded && text.match(/[áàâãéêíóôõúç]|obrigatório|inválido|deve|mínimo|máximo|erro|sucesso/i)) {
        matches.push({
          file: filePath,
          line,
          text: text.trim(),
          context: match[0],
          patternType: getPatternType(patternIndex)
        });
      }
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  });
  
  return matches;
}

function getPatternType(index) {
  const types = [
    'Zod String Validation',
    'Zod Email Validation', 
    'Zod Number Validation',
    'Zod Enum Validation',
    'Toast Title',
    'Toast Description',
    'Alert Message',
    'Confirm Message',
    'Form Label',
    'Heading',
    'General Portuguese'
  ];
  return types[index] || 'Unknown';
}

function scanDirectory(dir, extensions = ['.tsx', '.ts', '.js', '.jsx']) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results.push(...scanDirectory(filePath, extensions));
    } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
      const matches = findHardcodedText(filePath);
      results.push(...matches);
    }
  });
  
  return results;
}

function generateReport(matches) {
  console.log('\n🔍 RELATÓRIO DE INTERNACIONALIZAÇÃO\n');
  console.log('═'.repeat(60));
  
  if (matches.length === 0) {
    console.log('✅ Nenhum texto hardcoded encontrado! Internacionalização 100% completa.');
    return;
  }
  
  console.log(`❌ Encontrados ${matches.length} textos hardcoded que precisam ser traduzidos:\n`);
  
  // Group by file
  const byFile = matches.reduce((acc, match) => {
    if (!acc[match.file]) acc[match.file] = [];
    acc[match.file].push(match);
    return acc;
  }, {});
  
  Object.entries(byFile).forEach(([file, fileMatches]) => {
    console.log(`📁 ${file.replace(process.cwd(), '.')}`);
    console.log('─'.repeat(50));
    
    fileMatches.forEach(match => {
      console.log(`   Linha ${match.line}: [${match.patternType}]`);
      console.log(`   Texto: "${match.text}"`);
      console.log(`   Contexto: ${match.context.substring(0, 80)}...`);
      console.log('');
    });
  });
  
  // Summary by pattern type
  console.log('\n📊 RESUMO POR TIPO:');
  console.log('─'.repeat(30));
  const byType = matches.reduce((acc, match) => {
    acc[match.patternType] = (acc[match.patternType] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} ocorrências`);
  });
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Substitua textos hardcoded por chaves t()');
  console.log('2. Adicione chaves correspondentes nos arquivos i18n');
  console.log('3. Execute este script novamente para verificar');
  console.log('4. Teste em todos os idiomas disponíveis');
}

// Main execution
const projectRoot = path.resolve(__dirname, '..');
const clientDir = path.join(projectRoot, 'client', 'src');
const sharedDir = path.join(projectRoot, 'shared');

console.log('🚀 Verificando internacionalização...');
console.log(`📂 Escaneando: ${clientDir}`);
console.log(`📂 Escaneando: ${sharedDir}`);

const matches = [
  ...scanDirectory(clientDir),
  ...scanDirectory(sharedDir)
];

generateReport(matches);