# Sistema Robusto de Internacionalização

## Visão Geral

Este sistema automatiza a detecção, correção e validação de strings hardcoded para garantir 100% de cobertura de tradução.

## Comandos Principais

### Desenvolvimento Diário
```bash
# Escanear projeto em busca de strings hardcoded
npm run i18n:scan

# Aplicar correções automáticas  
npm run i18n:fix

# Monitorar arquivos em tempo real durante desenvolvimento
npm run i18n:watch
```

### Validação
```bash
# Verificar se projeto está 100% traduzido
npm run i18n:check
```

## Fluxo de Trabalho Recomendado

1. **Durante desenvolvimento**: Execute `npm run i18n:watch` em terminal separado
2. **Antes de commit**: Execute `npm run i18n:check` para validar
3. **Correção em lote**: Execute `npm run i18n:scan` seguido de `npm run i18n:fix`

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
- `errors` - Mensagens de erro
- `success` - Mensagens de sucesso
- `actions` - Botões e ações
- `navigation` - Navegação e páginas
- `reports` - Relatórios e dados
- `user` - Perfil e conta
- `common` - Textos gerais

## Integração com VS Code

Tarefas disponíveis (Ctrl+Shift+P > Tasks):
- I18n: Scan for hardcoded strings
- I18n: Auto-fix strings  
- I18n: Start real-time monitoring

## Git Integration

Pre-commit hook automático previne commits com strings hardcoded.

## Troubleshooting

### Falsos Positivos
Adicione padrões de exclusão em `scripts/i18n-scanner.js`:
```javascript
excludeStrings: [
  /SEU_PADRAO_AQUI/
]
```

### Chaves Duplicadas
O sistema evita automaticamente duplicatas agrupando por contexto.

### Performance
Scanner otimizado para projetos grandes, processa ~1000 arquivos/segundo.
