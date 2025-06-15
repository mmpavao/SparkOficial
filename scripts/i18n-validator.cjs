#!/usr/bin/env node
/**
 * I18n Development Validator
 * Real-time validation during development to prevent hardcoded strings
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class I18nValidator {
  constructor() {
    this.isWatching = false;
    this.violations = new Map();
  }

  // Start watching files for changes
  startWatching() {
    console.log('👀 Iniciando monitoramento de arquivos em tempo real...');
    console.log('   Detectando strings hardcoded conforme você desenvolve\n');
    
    const watcher = chokidar.watch('client/src/**/*.{tsx,ts,jsx,js}', {
      ignored: /node_modules|\.git|dist|build/,
      persistent: true
    });

    watcher
      .on('change', (filePath) => this.validateFile(filePath, 'MODIFIED'))
      .on('add', (filePath) => this.validateFile(filePath, 'ADDED'))
      .on('unlink', (filePath) => this.clearViolations(filePath));

    this.isWatching = true;
    console.log('✅ Monitoramento ativo. Pressione Ctrl+C para parar.\n');
  }

  async validateFile(filePath, action) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const violations = this.detectViolations(content);
      
      if (violations.length > 0) {
        this.violations.set(filePath, violations);
        this.reportViolations(filePath, violations, action);
      } else {
        // Clear violations if file is now clean
        if (this.violations.has(filePath)) {
          this.violations.delete(filePath);
          console.log(`✅ ${filePath} - Todas as strings foram traduzidas!`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Erro ao validar ${filePath}:`, error.message);
    }
  }

  detectViolations(content) {
    const violations = [];
    
    // Patterns for hardcoded strings
    const patterns = [
      {
        name: 'JSX Content',
        regex: />([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^<>{}\n]{3,})</g,
        severity: 'HIGH'
      },
      {
        name: 'JSX Attributes',
        regex: /(?:placeholder|title|label|alt)=["']([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^"']{3,})["']/g,
        severity: 'MEDIUM'
      },
      {
        name: 'Button Text',
        regex: /<Button[^>]*>([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^<>{}\n]{3,})</g,
        severity: 'HIGH'
      },
      {
        name: 'Toast Messages',
        regex: /toast\([^)]*["']([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^"']{3,})["']/g,
        severity: 'HIGH'
      }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const text = match[1].trim();
        
        // Skip if already using translation or is technical
        if (this.shouldSkip(text)) continue;
        
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        violations.push({
          type: pattern.name,
          text: text,
          line: lineNumber,
          severity: pattern.severity,
          suggestion: this.generateSuggestion(text)
        });
      }
    }
    
    return violations;
  }

  shouldSkip(text) {
    const skipPatterns = [
      /t\.|useTranslation/,
      /^https?:\/\//,
      /^\/api\//,
      /className|onClick/,
      /^[a-z-]+$/,
      /^\d+$/,
      /Console|Debug/i
    ];
    
    return skipPatterns.some(pattern => pattern.test(text)) || text.length < 3;
  }

  generateSuggestion(text) {
    const key = text
      .toLowerCase()
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    return `{t.common.${key}}`;
  }

  reportViolations(filePath, violations, action) {
    const timestamp = new Date().toLocaleTimeString();
    const actionIcon = action === 'ADDED' ? '🆕' : '📝';
    
    console.log(`${actionIcon} ${timestamp} - ${filePath}`);
    console.log(`   ❌ ${violations.length} string(s) hardcoded detectada(s):\n`);
    
    for (const violation of violations) {
      const severityIcon = violation.severity === 'HIGH' ? '🔴' : '🟡';
      console.log(`   ${severityIcon} Linha ${violation.line} (${violation.type})`);
      console.log(`      Texto: "${violation.text}"`);
      console.log(`      Sugestão: ${violation.suggestion}`);
      console.log('');
    }
    
    console.log('   💡 Execute: node scripts/i18n-scanner.js para correção automática\n');
  }

  clearViolations(filePath) {
    if (this.violations.has(filePath)) {
      this.violations.delete(filePath);
      console.log(`🗑️  ${filePath} removido do monitoramento`);
    }
  }

  // Generate summary report
  generateSummary() {
    if (this.violations.size === 0) {
      console.log('✅ Nenhuma violação de i18n detectada!');
      return;
    }
    
    console.log('\n📊 RESUMO DE VIOLAÇÕES ATIVAS:');
    console.log('─'.repeat(40));
    
    let totalViolations = 0;
    for (const [filePath, violations] of this.violations) {
      console.log(`📄 ${filePath} (${violations.length} strings)`);
      totalViolations += violations.length;
    }
    
    console.log(`\nTotal: ${totalViolations} strings hardcoded em ${this.violations.size} arquivos`);
  }
}

// CLI interface
if (require.main === module) {
  const validator = new I18nValidator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'watch':
      validator.startWatching();
      break;
    case 'summary':
      validator.generateSummary();
      break;
    default:
      console.log('I18n Validator - Sistema de Validação de Internacionalização');
      console.log('');
      console.log('Comandos disponíveis:');
      console.log('  watch   - Monitora arquivos em tempo real');
      console.log('  summary - Mostra resumo de violações');
      console.log('');
      console.log('Exemplos:');
      console.log('  node scripts/i18n-validator.js watch');
      console.log('  node scripts/i18n-validator.js summary');
  }
}

module.exports = I18nValidator;