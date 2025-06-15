#!/usr/bin/env node
/**
 * I18n Auto-Fix Tool
 * Automatically applies translation fixes based on scanner results
 */

const fs = require('fs');
const path = require('path');

class I18nAutoFix {
  constructor() {
    this.fixedFiles = new Set();
    this.addedKeys = new Map();
    this.stats = {
      filesFixed: 0,
      stringsReplaced: 0,
      keysAdded: 0
    };
  }

  async fix() {
    console.log('🔧 Iniciando correção automática de internacionalização...\n');
    
    // Load missing translations data
    const missingData = this.loadMissingTranslations();
    if (!missingData) return;
    
    // Add missing keys to i18n files
    await this.addMissingKeys(missingData);
    
    // Apply fixes to source files
    await this.applyFixes(missingData);
    
    this.generateReport();
  }

  loadMissingTranslations() {
    try {
      const dataPath = 'scripts/missing-translations.json';
      if (!fs.existsSync(dataPath)) {
        console.log('❌ Arquivo missing-translations.json não encontrado.');
        console.log('Execute primeiro: node scripts/i18n-scanner.js');
        return null;
      }
      
      const content = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Erro ao carregar dados de tradução:', error.message);
      return null;
    }
  }

  async addMissingKeys(missingData) {
    console.log('📝 Adicionando chaves faltantes ao sistema de tradução...\n');
    
    const i18nPath = 'client/src/lib/i18n.ts';
    let content = fs.readFileSync(i18nPath, 'utf8');
    
    // Group keys by category
    const categorizedKeys = this.categorizeKeys(missingData);
    
    for (const [category, keys] of categorizedKeys) {
      content = this.addKeysToCategory(content, category, keys);
    }
    
    // Write updated i18n file
    fs.writeFileSync(i18nPath, content);
    console.log(`✅ Adicionadas ${Object.keys(missingData).length} chaves de tradução`);
  }

  categorizeKeys(missingData) {
    const categories = new Map();
    
    for (const [key, data] of Object.entries(missingData)) {
      const category = this.determineCategory(key, data);
      
      if (!categories.has(category)) {
        categories.set(category, new Map());
      }
      
      categories.get(category).set(key, data);
    }
    
    return categories;
  }

  determineCategory(key, data) {
    const text = data.pt.toLowerCase();
    
    // Categorize based on common patterns
    if (text.includes('erro') || text.includes('falha') || text.includes('error')) {
      return 'errors';
    }
    if (text.includes('sucesso') || text.includes('salvo') || text.includes('criado')) {
      return 'success';
    }
    if (text.includes('botão') || text.includes('clique') || text.includes('enviar')) {
      return 'actions';
    }
    if (text.includes('página') || text.includes('tela') || text.includes('área')) {
      return 'navigation';
    }
    if (text.includes('relatório') || text.includes('dados') || text.includes('informação')) {
      return 'reports';
    }
    if (text.includes('usuário') || text.includes('perfil') || text.includes('conta')) {
      return 'user';
    }
    
    return 'common';
  }

  addKeysToCategory(content, category, keys) {
    // Find the category section in each language
    const languages = ['pt', 'en', 'zh', 'es'];
    
    for (const lang of languages) {
      const translationStart = content.indexOf(`export const ${lang}Translations`);
      if (translationStart === -1) continue;
      
      // Find the category section
      const categoryPattern = new RegExp(`${category}:\\s*{([^}]*)}`, 's');
      const categoryMatch = content.match(categoryPattern);
      
      if (categoryMatch) {
        // Add keys to existing category
        const existingKeys = categoryMatch[1];
        const newKeys = Array.from(keys.entries())
          .map(([key, data]) => `    ${key}: '${data[lang]}',`)
          .join('\n');
        
        const updatedCategory = `${category}: {\n${existingKeys}\n${newKeys}\n  }`;
        content = content.replace(categoryPattern, updatedCategory);
      } else {
        // Create new category
        const newCategory = this.createNewCategory(category, keys, lang);
        content = this.insertNewCategory(content, newCategory, lang);
      }
    }
    
    return content;
  }

  createNewCategory(category, keys, lang) {
    const keyEntries = Array.from(keys.entries())
      .map(([key, data]) => `    ${key}: '${data[lang]}',`)
      .join('\n');
    
    return `  ${category}: {\n${keyEntries}\n  },`;
  }

  insertNewCategory(content, newCategory, lang) {
    // Find the end of the current translation object
    const translationPattern = new RegExp(`(export const ${lang}Translations[^}]+)}`, 's');
    const match = content.match(translationPattern);
    
    if (match) {
      const replacement = match[1] + '\n' + newCategory + '\n}';
      content = content.replace(translationPattern, replacement);
    }
    
    return content;
  }

  async applyFixes(missingData) {
    console.log('\n🔄 Aplicando correções nos arquivos fonte...\n');
    
    const filesToFix = new Set();
    
    // Collect all files that need fixing
    for (const [key, data] of Object.entries(missingData)) {
      for (const file of data.files) {
        filesToFix.add(file);
      }
    }
    
    // Apply fixes to each file
    for (const filePath of filesToFix) {
      await this.fixFile(filePath, missingData);
    }
  }

  async fixFile(filePath, missingData) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let hasChanges = false;
      
      // Check if file already imports useTranslation
      const hasTranslationImport = content.includes('useTranslation');
      
      // Add import if needed
      if (!hasTranslationImport) {
        content = this.addTranslationImport(content);
        hasChanges = true;
      }
      
      // Add useTranslation hook if needed
      const hasTranslationHook = content.includes('const { t }');
      if (!hasTranslationHook) {
        content = this.addTranslationHook(content);
        hasChanges = true;
      }
      
      // Replace hardcoded strings
      for (const [key, data] of Object.entries(missingData)) {
        if (data.files.includes(filePath)) {
          const originalText = data.pt;
          const category = this.determineCategory(key, data);
          const replacement = `{t.${category}.${key}}`;
          
          // Replace in JSX content
          const jsxPattern = new RegExp(`>\\s*${this.escapeRegex(originalText)}\\s*<`, 'g');
          if (jsxPattern.test(content)) {
            content = content.replace(jsxPattern, `>${replacement}<`);
            hasChanges = true;
            this.stats.stringsReplaced++;
          }
          
          // Replace in attributes
          const attrPattern = new RegExp(`(placeholder|title|label|alt)\\s*=\\s*["']${this.escapeRegex(originalText)}["']`, 'g');
          if (attrPattern.test(content)) {
            content = content.replace(attrPattern, `$1=${replacement}`);
            hasChanges = true;
            this.stats.stringsReplaced++;
          }
        }
      }
      
      // Write updated file if changes were made
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        this.fixedFiles.add(filePath);
        this.stats.filesFixed++;
        console.log(`✅ Corrigido: ${filePath}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
    }
  }

  addTranslationImport(content) {
    // Find existing imports
    const importPattern = /import.*from.*['"][^'"]+['"];?\s*\n/g;
    const imports = content.match(importPattern) || [];
    
    // Add translation import
    const translationImport = "import { useTranslation } from '@/contexts/I18nContext';\n";
    
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      return content.replace(lastImport, lastImport + translationImport);
    } else {
      return translationImport + content;
    }
  }

  addTranslationHook(content) {
    // Find function component start
    const componentPattern = /(export default function \w+\(\)[^{]*{)/;
    const match = content.match(componentPattern);
    
    if (match) {
      const hook = '\n  const { t } = useTranslation();\n';
      return content.replace(match[1], match[1] + hook);
    }
    
    return content;
  }

  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO DE CORREÇÃO AUTOMÁTICA');
    console.log('='.repeat(50));
    
    console.log(`\n✅ ESTATÍSTICAS:`);
    console.log(`   Arquivos corrigidos: ${this.stats.filesFixed}`);
    console.log(`   Strings substituídas: ${this.stats.stringsReplaced}`);
    console.log(`   Chaves adicionadas: ${this.stats.keysAdded}`);
    
    if (this.fixedFiles.size > 0) {
      console.log(`\n📁 ARQUIVOS MODIFICADOS:`);
      for (const file of this.fixedFiles) {
        console.log(`   ✓ ${file}`);
      }
    }
    
    console.log('\n🎉 Correção automática concluída!');
    console.log('💡 Execute o scanner novamente para verificar pendências: node scripts/i18n-scanner.js');
  }
}

// Run auto-fix
if (require.main === module) {
  const fixer = new I18nAutoFix();
  fixer.fix().catch(console.error);
}

module.exports = I18nAutoFix;