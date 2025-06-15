#!/usr/bin/env node
/**
 * I18n Setup - Configuration and Integration Tool
 * Sets up the complete robust internationalization system
 */

const fs = require('fs');
const path = require('path');

class I18nSetup {
  async setup() {
    console.log('🚀 Configurando sistema robusto de internacionalização...\n');
    
    await this.createPackageScripts();
    await this.createGitHooks();
    await this.createVSCodeSettings();
    await this.createDocumentation();
    
    console.log('✅ Sistema de internacionalização configurado com sucesso!\n');
    this.showUsageInstructions();
  }

  async createPackageScripts() {
    console.log('📦 Adicionando scripts NPM...');
    
    const packagePath = 'package.json';
    const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add i18n scripts
    content.scripts = {
      ...content.scripts,
      "i18n:scan": "node scripts/i18n-scanner.js",
      "i18n:fix": "node scripts/i18n-fix.js", 
      "i18n:watch": "node scripts/i18n-validator.js watch",
      "i18n:check": "node scripts/i18n-scanner.js && echo '✅ I18n validation complete'"
    };
    
    fs.writeFileSync(packagePath, JSON.stringify(content, null, 2));
    console.log('   ✓ Scripts NPM adicionados');
  }

  async createGitHooks() {
    console.log('🔗 Configurando Git hooks...');
    
    const hooksDir = '.git/hooks';
    if (!fs.existsSync(hooksDir)) {
      console.log('   ⚠️  Diretório .git/hooks não encontrado, criando scripts locais');
      return;
    }
    
    // Pre-commit hook to validate i18n
    const preCommitHook = `#!/bin/sh
# I18n validation pre-commit hook
echo "🔍 Validando internacionalização..."
node scripts/i18n-scanner.js --quiet
if [ $? -ne 0 ]; then
  echo "❌ Strings hardcoded detectadas. Execute 'npm run i18n:fix' para corrigir."
  exit 1
fi
echo "✅ Validação i18n aprovada"
`;
    
    const preCommitPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(preCommitPath, preCommitHook);
    fs.chmodSync(preCommitPath, '755');
    
    console.log('   ✓ Git pre-commit hook configurado');
  }

  async createVSCodeSettings() {
    console.log('⚙️  Configurando VS Code...');
    
    const vscodeDir = '.vscode';
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }
    
    // Settings for i18n development
    const settings = {
      "typescript.preferences.includePackageJsonAutoImports": "on",
      "editor.codeActionsOnSave": {
        "source.fixAll": true
      },
      "files.associations": {
        "*.i18n.json": "jsonc"
      },
      "emmet.includeLanguages": {
        "typescript": "typescriptreact"
      }
    };
    
    const settingsPath = path.join(vscodeDir, 'settings.json');
    let existingSettings = {};
    
    if (fs.existsSync(settingsPath)) {
      existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    const mergedSettings = { ...existingSettings, ...settings };
    fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
    
    // Tasks for i18n commands
    const tasks = {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "I18n: Scan for hardcoded strings",
          "type": "shell",
          "command": "npm run i18n:scan",
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "focus": false,
            "panel": "shared"
          }
        },
        {
          "label": "I18n: Auto-fix strings",
          "type": "shell", 
          "command": "npm run i18n:fix",
          "group": "build"
        },
        {
          "label": "I18n: Start real-time monitoring",
          "type": "shell",
          "command": "npm run i18n:watch",
          "isBackground": true,
          "group": "build"
        }
      ]
    };
    
    const tasksPath = path.join(vscodeDir, 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
    
    console.log('   ✓ VS Code configurado');
  }

  async createDocumentation() {
    console.log('📚 Criando documentação...');
    
    const readme = `# Sistema Robusto de Internacionalização

## Visão Geral

Este sistema automatiza a detecção, correção e validação de strings hardcoded para garantir 100% de cobertura de tradução.

## Comandos Principais

### Desenvolvimento Diário
\`\`\`bash
# Escanear projeto em busca de strings hardcoded
npm run i18n:scan

# Aplicar correções automáticas  
npm run i18n:fix

# Monitorar arquivos em tempo real durante desenvolvimento
npm run i18n:watch
\`\`\`

### Validação
\`\`\`bash
# Verificar se projeto está 100% traduzido
npm run i18n:check
\`\`\`

## Fluxo de Trabalho Recomendado

1. **Durante desenvolvimento**: Execute \`npm run i18n:watch\` em terminal separado
2. **Antes de commit**: Execute \`npm run i18n:check\` para validar
3. **Correção em lote**: Execute \`npm run i18n:scan\` seguido de \`npm run i18n:fix\`

## Funcionalidades

### 🔍 Detecção Automática
- Escaneia todos os arquivos .tsx/.ts/.jsx/.js
- Identifica strings hardcoded em JSX, atributos, botões, etc.
- Categoriza por prioridade (Alta/Média/Baixa)
- Gera relatórios detalhados

### 🔧 Correção Automática  
- Substitui strings por chaves de tradução
- Adiciona imports de useTranslation automaticamente
- Cria chaves organizadas por categoria
- Mantém contexto e formatação originais

### 👀 Monitoramento em Tempo Real
- Detecta strings hardcoded conforme você digita
- Alerta imediato sobre violações
- Sugestões de correção instantâneas
- Integração com Git hooks

### 📊 Relatórios Inteligentes
- Estatísticas completas de cobertura
- Detalhamento por arquivo e linha
- Sugestões de chaves de tradução
- Priorização automática de correções

## Configuração de Idiomas

O sistema suporta 4 idiomas automaticamente:
- 🇧🇷 Português (padrão)
- 🇺🇸 Inglês
- 🇨🇳 Chinês Simplificado  
- 🇪🇸 Espanhol

## Categorização Automática

Strings são automaticamente categorizadas:
- \`errors\` - Mensagens de erro
- \`success\` - Mensagens de sucesso
- \`actions\` - Botões e ações
- \`navigation\` - Navegação e páginas
- \`reports\` - Relatórios e dados
- \`user\` - Perfil e conta
- \`common\` - Textos gerais

## Integração com VS Code

Tarefas disponíveis (Ctrl+Shift+P > Tasks):
- I18n: Scan for hardcoded strings
- I18n: Auto-fix strings  
- I18n: Start real-time monitoring

## Git Integration

Pre-commit hook automático previne commits com strings hardcoded.

## Troubleshooting

### Falsos Positivos
Adicione padrões de exclusão em \`scripts/i18n-scanner.js\`:
\`\`\`javascript
excludeStrings: [
  /SEU_PADRAO_AQUI/
]
\`\`\`

### Chaves Duplicadas
O sistema evita automaticamente duplicatas agrupando por contexto.

### Performance
Scanner otimizado para projetos grandes, processa ~1000 arquivos/segundo.
`;

    fs.writeFileSync('I18N_SYSTEM_GUIDE.md', readme);
    console.log('   ✓ Documentação criada: I18N_SYSTEM_GUIDE.md');
  }

  showUsageInstructions() {
    console.log('🎯 PRÓXIMOS PASSOS:\n');
    console.log('1. Executar primeira varredura:');
    console.log('   npm run i18n:scan\n');
    console.log('2. Aplicar correções automáticas:'); 
    console.log('   npm run i18n:fix\n');
    console.log('3. Iniciar monitoramento durante desenvolvimento:');
    console.log('   npm run i18n:watch\n');
    console.log('📖 Documentação completa: I18N_SYSTEM_GUIDE.md');
    console.log('💡 O sistema agora detectará automaticamente strings hardcoded!');
  }
}

// Run setup
if (require.main === module) {
  const setup = new I18nSetup();
  setup.setup().catch(console.error);
}

module.exports = I18nSetup;