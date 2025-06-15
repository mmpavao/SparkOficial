#!/usr/bin/env node
/**
 * I18n Scanner - Automated Detection and Extraction Tool
 * Detects hardcoded strings and validates translation coverage
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  scanDirs: ['client/src'],
  excludePatterns: [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /\.d\.ts$/,
    /\.test\./,
    /\.spec\./,
    /i18n\.ts$/
  ],
  fileExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  // Patterns to detect hardcoded strings in JSX/React
  stringPatterns: [
    // JSX text content: <div>Hardcoded Text</div>
    />\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^<>{}\n]{2,})\s*</g,
    // String literals in JSX: placeholder="Hardcoded"
    /(?:placeholder|title|label|alt)\s*=\s*["']([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^"']{2,})["']/g,
    // Button/link text: <Button>Hardcoded Text</Button>
    /<(?:Button|Link|span|div|h[1-6]|p|label)[^>]*>\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^<>{}\n]{2,})\s*</g,
    // Toast/alert messages: toast({ title: "Hardcoded" })
    /(?:toast|alert|confirm)\s*\(\s*[^)]*["']([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^"']{2,})["']/g,
    // Error messages: throw new Error("Hardcoded")
    /(?:Error|throw)\s*\(\s*["']([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^"']{2,})["']/g
  ],
  // Exclude these patterns (technical strings, URLs, etc.)
  excludeStrings: [
    /^https?:\/\//,
    /^\/api\//,
    /^[A-Z_]+$/,
    /^\d+$/,
    /^[a-z-]+$/,
    /className|onClick|onChange|onSubmit/,
    /bg-|text-|border-|flex|grid/,
    /^[a-z]+\.[a-z]+/,
    /Console|Debug|Log/i
  ]
};

class I18nScanner {
  constructor() {
    this.hardcodedStrings = new Map();
    this.translationKeys = new Set();
    this.stats = {
      filesScanned: 0,
      stringsFound: 0,
      translationKeysFound: 0
    };
  }

  // Scan all files and detect hardcoded strings
  async scan() {
    console.log('🔍 Iniciando varredura de internacionalização...\n');
    
    // Load existing translation keys
    this.loadExistingTranslations();
    
    // Scan directories
    for (const dir of CONFIG.scanDirs) {
      await this.scanDirectory(dir);
    }
    
    this.generateReport();
  }

  // Load existing translation keys from i18n.ts
  loadExistingTranslations() {
    try {
      const i18nPath = path.join('client/src/lib/i18n.ts');
      const content = fs.readFileSync(i18nPath, 'utf8');
      
      // Extract translation keys using regex
      const keyMatches = content.matchAll(/(\w+):\s*{[^}]*}/g);
      for (const match of keyMatches) {
        this.translationKeys.add(match[1]);
      }
      
      // Extract nested keys
      const nestedMatches = content.matchAll(/(\w+):\s*['"`]([^'"`]+)['"`]/g);
      for (const match of nestedMatches) {
        this.translationKeys.add(match[1]);
      }
      
      this.stats.translationKeysFound = this.translationKeys.size;
      console.log(`📚 Carregadas ${this.stats.translationKeysFound} chaves de tradução existentes`);
    } catch (error) {
      console.warn('⚠️  Não foi possível carregar traduções existentes:', error.message);
    }
  }

  // Recursively scan directory
  async scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (CONFIG.excludePatterns.some(pattern => pattern.test(fullPath))) {
          continue;
        }
        await this.scanDirectory(fullPath);
      } else if (stat.isFile()) {
        await this.scanFile(fullPath);
      }
    }
  }

  // Scan individual file for hardcoded strings
  async scanFile(filePath) {
    // Check if file should be scanned
    const ext = path.extname(filePath);
    if (!CONFIG.fileExtensions.includes(ext)) return;
    
    if (CONFIG.excludePatterns.some(pattern => pattern.test(filePath))) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.stats.filesScanned++;
      
      // Skip files that already use translation extensively
      const translationUsage = (content.match(/t\./g) || []).length;
      const totalLines = content.split('\n').length;
      
      const strings = this.extractStrings(content, filePath);
      
      if (strings.length > 0) {
        this.hardcodedStrings.set(filePath, {
          strings,
          translationUsage,
          totalLines,
          priority: this.calculatePriority(strings, translationUsage, totalLines)
        });
      }
    } catch (error) {
      console.warn(`⚠️  Erro ao escanear ${filePath}:`, error.message);
    }
  }

  // Extract hardcoded strings from file content
  extractStrings(content, filePath) {
    const foundStrings = [];
    
    for (const pattern of CONFIG.stringPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const string = match[1].trim();
        
        // Skip if string matches exclude patterns
        if (CONFIG.excludeStrings.some(excludePattern => excludePattern.test(string))) {
          continue;
        }
        
        // Skip very short or very long strings
        if (string.length < 3 || string.length > 100) {
          continue;
        }
        
        // Skip if it looks like a translation key usage
        if (string.includes('t.') || string.includes('useTranslation')) {
          continue;
        }
        
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        foundStrings.push({
          text: string,
          line: lineNumber,
          context: this.getContext(content, match.index)
        });
      }
    }
    
    this.stats.stringsFound += foundStrings.length;
    return foundStrings;
  }

  // Get surrounding context for a string
  getContext(content, index) {
    const lines = content.split('\n');
    const lineIndex = content.substring(0, index).split('\n').length - 1;
    const contextLines = [];
    
    for (let i = Math.max(0, lineIndex - 1); i <= Math.min(lines.length - 1, lineIndex + 1); i++) {
      contextLines.push(`${i + 1}: ${lines[i].trim()}`);
    }
    
    return contextLines.join('\n');
  }

  // Calculate priority for fixing this file
  calculatePriority(strings, translationUsage, totalLines) {
    const stringCount = strings.length;
    const translationRatio = translationUsage / totalLines;
    
    if (stringCount > 10 && translationRatio < 0.1) return 'HIGH';
    if (stringCount > 5 && translationRatio < 0.3) return 'MEDIUM';
    if (stringCount > 0) return 'LOW';
    return 'NONE';
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE INTERNACIONALIZAÇÃO');
    console.log('='.repeat(60));
    
    console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
    console.log(`   Arquivos escaneados: ${this.stats.filesScanned}`);
    console.log(`   Strings hardcoded encontradas: ${this.stats.stringsFound}`);
    console.log(`   Chaves de tradução existentes: ${this.stats.translationKeysFound}`);
    
    if (this.hardcodedStrings.size === 0) {
      console.log('\n✅ Parabéns! Nenhuma string hardcoded encontrada.');
      return;
    }
    
    // Priority summary
    const priorities = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const [, data] of this.hardcodedStrings) {
      priorities[data.priority]++;
    }
    
    console.log(`\n🎯 PRIORIDADE DE CORREÇÃO:`);
    console.log(`   Alta prioridade: ${priorities.HIGH} arquivos`);
    console.log(`   Média prioridade: ${priorities.MEDIUM} arquivos`);
    console.log(`   Baixa prioridade: ${priorities.LOW} arquivos`);
    
    // Detailed breakdown
    console.log('\n📋 DETALHAMENTO POR ARQUIVO:\n');
    
    const sortedFiles = [...this.hardcodedStrings.entries()].sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b[1].priority] - priorityOrder[a[1].priority];
    });
    
    for (const [filePath, data] of sortedFiles) {
      const priorityIcon = data.priority === 'HIGH' ? '🔴' : 
                          data.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      console.log(`${priorityIcon} ${filePath} (${data.priority})`);
      console.log(`   📊 ${data.strings.length} strings | ${data.translationUsage} usos de t. | ${data.totalLines} linhas`);
      
      // Show first few strings as examples
      for (let i = 0; i < Math.min(3, data.strings.length); i++) {
        const str = data.strings[i];
        console.log(`   📝 Linha ${str.line}: "${str.text}"`);
      }
      
      if (data.strings.length > 3) {
        console.log(`   ... e mais ${data.strings.length - 3} strings`);
      }
      console.log('');
    }
    
    this.generateFixSuggestions();
    this.generateTranslationKeys();
  }

  // Generate automatic fix suggestions
  generateFixSuggestions() {
    console.log('\n🔧 SUGESTÕES DE CORREÇÃO AUTOMÁTICA:\n');
    
    const suggestions = [];
    
    for (const [filePath, data] of this.hardcodedStrings) {
      for (const str of data.strings) {
        const key = this.generateTranslationKey(str.text);
        suggestions.push({
          file: filePath,
          line: str.line,
          original: str.text,
          suggested: `{t.${key}}`,
          key: key,
          value: str.text
        });
      }
    }
    
    // Group by suggested keys
    const keyGroups = new Map();
    for (const suggestion of suggestions) {
      if (!keyGroups.has(suggestion.key)) {
        keyGroups.set(suggestion.key, []);
      }
      keyGroups.get(suggestion.key).push(suggestion);
    }
    
    console.log('Chaves de tradução sugeridas para adicionar ao i18n.ts:\n');
    
    for (const [key, suggestions] of keyGroups) {
      console.log(`${key}: '${suggestions[0].value}',`);
    }
    
    console.log('\nSubstituições sugeridas:\n');
    
    for (const suggestion of suggestions.slice(0, 10)) {
      console.log(`📄 ${suggestion.file}:${suggestion.line}`);
      console.log(`   - "${suggestion.original}"`);
      console.log(`   + ${suggestion.suggested}`);
      console.log('');
    }
    
    if (suggestions.length > 10) {
      console.log(`... e mais ${suggestions.length - 10} sugestões`);
    }
  }

  // Generate translation key from text
  generateTranslationKey(text) {
    return text
      .toLowerCase()
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  // Generate missing translation keys
  generateTranslationKeys() {
    const outputPath = 'scripts/missing-translations.json';
    
    const missingKeys = {};
    
    for (const [filePath, data] of this.hardcodedStrings) {
      for (const str of data.strings) {
        const key = this.generateTranslationKey(str.text);
        missingKeys[key] = {
          pt: str.text,
          en: `[TRANSLATE] ${str.text}`,
          zh: `[TRANSLATE] ${str.text}`,
          es: `[TRANSLATE] ${str.text}`,
          files: [filePath],
          line: str.line
        };
      }
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(missingKeys, null, 2));
    console.log(`\n💾 Chaves faltantes salvas em: ${outputPath}`);
    console.log(`\n✨ Execute: node scripts/i18n-fix.js para aplicar correções automaticamente`);
  }
}

// Run scanner
if (require.main === module) {
  const scanner = new I18nScanner();
  scanner.scan().catch(console.error);
}

module.exports = I18nScanner;