#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Padrões específicos para textos que não obedecem ao seletor
const SELECTOR_VIOLATION_PATTERNS = [
  // 1. Toast messages hardcoded (deve usar t())
  {
    pattern: /toast\(\s*\{\s*title:\s*["']([^"']*(?:Sucesso|Erro|Aviso)[^"']*)["']/g,
    type: 'Toast Title',
    solution: 'Use t("toast.success"), t("toast.error"), etc.'
  },
  {
    pattern: /toast\(\s*\{\s*[^}]*description:\s*["']([^"']*(?:sucesso|erro|inválido|obrigatório)[^"']*)["']/g,
    type: 'Toast Description', 
    solution: 'Use t("messages.xxxSuccess"), t("validation.xxxError"), etc.'
  },
  
  // 2. Zod validation messages (deve usar validation keys)
  {
    pattern: /z\.string\(\)\.min\(\d+,\s*["']([^"']*(?:obrigatório|deve|mínimo)[^"']*)["']\)/g,
    type: 'Zod String Validation',
    solution: 'Use t("validation.xxxRequired")'
  },
  {
    pattern: /z\.string\(\)\.email\(\s*["']([^"']*(?:inválido)[^"']*)["']\)/g,
    type: 'Zod Email Validation',
    solution: 'Use t("validation.emailInvalid")'
  },
  {
    pattern: /z\.number\(\)\.min\(\d+,\s*["']([^"']*(?:deve|maior|mínimo)[^"']*)["']\)/g,
    type: 'Zod Number Validation',
    solution: 'Use t("validation.minValue")'
  },
  
  // 3. Form labels hardcoded (deve usar t())
  {
    pattern: /<FormLabel[^>]*>([^<]*(?:\*|obrigatório)[^<]*)<\/FormLabel>/g,
    type: 'Form Label',
    solution: 'Use {t("forms.xxxLabel")} *'
  },
  
  // 4. Alert/confirm hardcoded (deve usar dialog functions)
  {
    pattern: /alert\(\s*["']([^"']*(?:Erro|muito grande|inválido|andamento)[^"']*)["']\)/g,
    type: 'Alert Message',
    solution: 'Use useI18nDialog().alert("dialog.xxxError")'
  },
  {
    pattern: /confirm\(\s*["']([^"']*(?:certeza|deseja|substituir)[^"']*)["']\)/g,
    type: 'Confirm Dialog',
    solution: 'Use useI18nDialog().confirm("dialog.xxxConfirm")'
  },
  
  // 5. Títulos de seções hardcoded
  {
    pattern: /<h[1-6][^>]*>([^<]*(?:Documentos|Obrigatórios|Complementares|Adicionais|Validação)[^<]*)<\/h[1-6]>/g,
    type: 'Section Heading',
    solution: 'Use {t("sections.xxxTitle")}'
  },
  
  // 6. Status messages hardcoded
  {
    pattern: /["']([^"']*(?:foi recebida|com sucesso|processada|enviada|aprovada)[^"']*)["']/g,
    type: 'Status Message',
    solution: 'Use t("status.xxxMessage")'
  }
];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Verificar se o arquivo já usa useTranslation
  const hasTranslation = content.includes('useTranslation') || content.includes('const { t }');
  
  SELECTOR_VIOLATION_PATTERNS.forEach((patternObj, index) => {
    let match;
    while ((match = patternObj.pattern.exec(content)) !== null) {
      const text = match[1] || match[0];
      const line = content.substring(0, match.index).split('\n').length;
      
      // Filtrar falsos positivos
      if (text.includes('t(') || text.includes('${') || text.length < 3) {
        continue;
      }
      
      issues.push({
        file: filePath,
        line,
        type: patternObj.type,
        text: text.trim(),
        context: match[0].substring(0, 100),
        solution: patternObj.solution,
        hasTranslation,
        severity: hasTranslation ? 'HIGH' : 'MEDIUM' // Maior prioridade se já usa i18n
      });
    }
    // Reset regex
    patternObj.pattern.lastIndex = 0;
  });
  
  return issues;
}

function scanDirectory(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results.push(...scanDirectory(filePath, extensions));
    } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
      const issues = analyzeFile(filePath);
      results.push(...issues);
    }
  });
  
  return results;
}

function generateSelectorReport(issues) {
  console.log('\n🎯 RELATÓRIO: TEXTOS QUE NÃO OBEDECEM AO SELETOR DE IDIOMAS\n');
  console.log('═'.repeat(70));
  
  if (issues.length === 0) {
    console.log('✅ Todos os textos estão obedecendo ao seletor de idiomas!');
    return;
  }
  
  // Separar por prioridade
  const highPriority = issues.filter(i => i.severity === 'HIGH');
  const mediumPriority = issues.filter(i => i.severity === 'MEDIUM');
  
  console.log(`❌ Encontrados ${issues.length} textos que NÃO respondem ao seletor:\n`);
  
  if (highPriority.length > 0) {
    console.log('🔴 ALTA PRIORIDADE (arquivos que JÁ usam i18n):');
    console.log('─'.repeat(50));
    
    const byFile = highPriority.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {});
    
    Object.entries(byFile).forEach(([file, fileIssues]) => {
      console.log(`\n📁 ${file.replace(process.cwd(), '.')}`);
      console.log(`   ✅ JÁ USA: useTranslation()`);
      
      fileIssues.forEach(issue => {
        console.log(`   🐛 Linha ${issue.line}: [${issue.type}]`);
        console.log(`      Texto: "${issue.text}"`);
        console.log(`      💡 Solução: ${issue.solution}`);
        console.log('');
      });
    });
  }
  
  if (mediumPriority.length > 0) {
    console.log('\n🟡 MÉDIA PRIORIDADE (arquivos que NÃO usam i18n):');
    console.log('─'.repeat(50));
    
    const byFile = mediumPriority.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {});
    
    Object.entries(byFile).slice(0, 5).forEach(([file, fileIssues]) => {
      console.log(`\n📁 ${file.replace(process.cwd(), '.')}`);
      console.log(`   ❌ PRECISA: import { useTranslation } from 'react-i18next'`);
      console.log(`   ❌ PRECISA: const { t } = useTranslation()`);
      console.log(`   🐛 ${fileIssues.length} textos hardcoded encontrados`);
    });
    
    if (Object.keys(byFile).length > 5) {
      console.log(`\n   ... e mais ${Object.keys(byFile).length - 5} arquivos`);
    }
  }
  
  // Resumo por tipo
  console.log('\n📊 RESUMO POR TIPO DE PROBLEMA:');
  console.log('─'.repeat(40));
  const byType = issues.reduce((acc, issue) => {
    const key = `${issue.type} (${issue.severity})`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(byType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} ocorrências`);
    });
  
  console.log('\n🎯 PRÓXIMOS PASSOS PARA SELETOR FUNCIONAR:');
  console.log('1. Foque nos arquivos de ALTA PRIORIDADE primeiro');
  console.log('2. Substitua textos hardcoded por t("chave.correspondente")');
  console.log('3. Adicione as chaves nos arquivos i18n (pt-BR, en, fr, ru, zh)');
  console.log('4. Teste o seletor de idiomas para confirmar funcionamento');
  
  return {
    total: issues.length,
    highPriority: highPriority.length,
    mediumPriority: mediumPriority.length,
    byType
  };
}

// Execução principal
const projectRoot = path.resolve(__dirname, '..');
const clientDir = path.join(projectRoot, 'client', 'src');

console.log('🔍 Analisando textos que não obedecem ao seletor de idiomas...');
console.log(`📂 Escaneando: ${clientDir}`);

const issues = scanDirectory(clientDir);
const report = generateSelectorReport(issues);

// Export para usar em outros scripts se necessário
export { analyzeFile, generateSelectorReport };