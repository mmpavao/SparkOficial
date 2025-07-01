
# 🌍 Padrões de Internacionalização - Spark Comex

## ✅ Implementação Obrigatória

### 1. Import Obrigatório
```typescript
import { useTranslation } from "@/contexts/I18nContext";
```

### 2. Uso no Componente
```typescript
export default function ComponentName() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t.moduleName.title}</h1>
      <p>{t.moduleName.description}</p>
    </div>
  );
}
```

### 3. Validação em Desenvolvimento
```typescript
import { useI18nValidation } from "@/hooks/useI18nValidation";

export default function ComponentName() {
  const { t } = useI18nValidation({
    componentName: 'ComponentName',
    requiredKeys: ['moduleName.title', 'moduleName.description']
  });
  
  return (
    <div>
      <h1>{t('moduleName.title')}</h1>
      <p>{t('moduleName.description')}</p>
    </div>
  );
}
```

## 🗂️ Estrutura de Traduções

### Categorias Principais
- `nav.*` - Navegação
- `dashboard.*` - Dashboard
- `credit.*` - Módulo de Crédito
- `imports.*` - Módulo de Importações
- `admin.*` - Administração
- `suppliers.*` - Fornecedores
- `common.*` - Termos comuns
- `auth.*` - Autenticação
- `forms.*` - Formulários
- `settings.*` - Configurações

### Exemplo de Uso
```typescript
// ✅ CORRETO
<Button>{t('common.save')}</Button>
<h1>{t('imports.title')}</h1>
<p>{t('dashboard.welcome')}</p>

// ❌ INCORRETO
<Button>Salvar</Button>
<h1>Importações</h1>
<p>Bem-vindo</p>
```

## 🔧 Ferramentas de Desenvolvimento

### Hook de Validação
```typescript
const { t } = useI18nValidation({
  componentName: 'ImportsList',
  requiredKeys: [
    'imports.title',
    'imports.newImport',
    'imports.noImportsFound'
  ]
});
```

### Verificação de Tradução
```typescript
import { hasTranslation } from "@/hooks/useI18nValidation";

if (hasTranslation('imports.advancedFilter', t)) {
  // Mostrar filtro avançado
}
```

### Fallback Customizado
```typescript
import { getTranslationWithFallback } from "@/hooks/useI18nValidation";

const title = getTranslationWithFallback(
  'imports.customTitle',
  'Título Padrão',
  t
);
```

## 📋 Checklist de Desenvolvimento

### Antes de Criar Componente
- [ ] Identificar categoria de tradução
- [ ] Listar todas as strings necessárias
- [ ] Verificar se strings já existem no sistema

### Durante o Desenvolvimento
- [ ] Importar `useTranslation` ou `useI18nValidation`
- [ ] Usar `t('categoria.chave')` para TODOS os textos
- [ ] Adicionar `data-component` para debug
- [ ] Testar em pelo menos 2 idiomas

### Antes do Commit
- [ ] Nenhum texto hardcoded presente
- [ ] Console sem warnings de traduções faltantes
- [ ] Testado em PT e EN no mínimo
- [ ] Documentação atualizada se necessário

## 🚫 Regras de Proibição

### NUNCA Fazer
```typescript
// ❌ Texto hardcoded
<h1>Título do Componente</h1>

// ❌ String direta
const message = "Operação realizada com sucesso";

// ❌ Interpolação sem tradução
<p>Você tem {count} itens</p>
```

### ✅ Sempre Fazer
```typescript
// ✅ Tradução correta
<h1>{t('component.title')}</h1>

// ✅ String traduzida
const message = t('common.operationSuccess');

// ✅ Interpolação com tradução
<p>{t('component.itemCount', { count: count.toString() })}</p>
```

## 🏗️ Adicionando Novas Traduções

### 1. Editar Context
Adicionar nas 4 linguagens em `client/src/contexts/I18nContext.tsx`:

```typescript
// Português
moduleName: {
  newKey: 'Novo Texto'
}

// Inglês
moduleName: {
  newKey: 'New Text'
}

// Chinês
moduleName: {
  newKey: '新文本'
}

// Espanhol
moduleName: {
  newKey: 'Nuevo Texto'
}
```

### 2. Usar no Componente
```typescript
<span>{t('moduleName.newKey')}</span>
```

## 🎯 Metas de Qualidade

- **100%** dos textos traduzidos
- **0** warnings de tradução no console
- **4** idiomas sempre sincronizados
- **Fallback** inteligente para PT quando necessário

## 🔍 Debugging

### Console Warnings
O sistema avisa automaticamente sobre:
- Chaves de tradução não encontradas
- Componentes sem validação i18n
- Diferenças entre idiomas

### Ferramentas
- `useI18nValidation` para componentes
- Logs detalhados em desenvolvimento
- Fallback automático para português
