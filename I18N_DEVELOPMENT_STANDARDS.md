# Padrões de Desenvolvimento - Internacionalização Spark Comex

## Escopo Finalizado

O sistema de internacionalização está **COMPLETO** com suporte a **4 idiomas**:
- 🇧🇷 **Português** (pt) - Idioma padrão
- 🇺🇸 **Inglês** (en)
- 🇨🇳 **Chinês Simplificado** (zh)
- 🇪🇸 **Espanhol** (es)

**IMPORTANTE**: Não adicionar novos idiomas. O escopo está fechado em 4 idiomas.

## Regras Obrigatórias para Desenvolvimento

### 1. Textos Hardcoded PROIBIDOS

❌ **NUNCA FAZER:**
```typescript
// Texto hardcoded - PROIBIDO
<h1>Dashboard</h1>
<p>Bem-vindo ao sistema</p>
<Button>Salvar</Button>
```

✅ **SEMPRE FAZER:**
```typescript
// Usar sistema de traduções - OBRIGATÓRIO
const { t } = useTranslation();

<h1>{t.nav.dashboard}</h1>
<p>{t.dashboard.welcome}</p>
<Button>{t.common.save}</Button>
```

### 2. Estrutura Obrigatória para Novos Componentes

Todo novo componente DEVE seguir este padrão:

```typescript
import { useTranslation } from "@/contexts/I18nContext";

export default function NovoComponente() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t.categoria.titulo}</h2>
      <p>{t.categoria.descricao}</p>
    </div>
  );
}
```

### 3. Adição de Novas Strings de Tradução

Quando precisar de nova string de tradução:

#### Passo 1: Adicionar ao arquivo `client/src/lib/i18n.ts`

```typescript
// Adicionar em TODOS os 4 idiomas
export const ptTranslations: Translations = {
  // ... outras categorias
  novaCategoria: {
    novoTexto: 'Texto em português',
  },
};

export const enTranslations: Translations = {
  // ... outras categorias
  novaCategoria: {
    novoTexto: 'Text in English',
  },
};

export const zhTranslations: Translations = {
  // ... outras categorias
  novaCategoria: {
    novoTexto: '中文文本',
  },
};

export const esTranslations: Translations = {
  // ... outras categorias
  novaCategoria: {
    novoTexto: 'Texto en español',
  },
};
```

#### Passo 2: Atualizar interface TypeScript

```typescript
export interface Translations {
  // ... outras categorias
  novaCategoria: {
    novoTexto: string;
  };
}
```

### 4. Categorias de Tradução Existentes

Use as categorias já estabelecidas:

- `nav` - Navegação e menus
- `auth` - Autenticação e login
- `dashboard` - Página principal
- `credit` - Gestão de crédito
- `imports` - Gestão de importações
- `roles` - Funções de usuário
- `currency` - Moedas
- `common` - Textos comuns (botões, ações)
- `admin` - Painel administrativo
- `reports` - Relatórios
- `settings` - Configurações
- `validation` - Mensagens de validação
- `errors` - Mensagens de erro

### 5. Nomenclatura de Chaves

Seguir padrão camelCase:
```typescript
// ✅ Correto
{t.credit.requestCredit}
{t.imports.newImport}
{t.common.saveChanges}

// ❌ Incorreto
{t.credit.request_credit}
{t.imports.new-import}
{t.common.save_changes}
```

### 6. Validação Obrigatória

Antes de fazer commit, verificar:

1. **Todas as 4 traduções** foram adicionadas
2. **Interface TypeScript** foi atualizada
3. **Nenhum texto hardcoded** foi deixado
4. **Componente funciona** em todos os 4 idiomas

### 7. Estrutura de Arquivos

```
client/src/
├── lib/i18n.ts                 # ✅ Traduções centralizadas
├── contexts/I18nContext.tsx    # ✅ Context Provider
├── components/ui/language-selector.tsx  # ✅ Seletor de idioma
└── páginas/componentes          # ✅ Usar useTranslation()
```

### 8. Componentes Prontos

Usar componentes já implementados:
- `<LanguageSelector />` - Seletor de idioma
- `useTranslation()` - Hook para traduções
- `t.categoria.chave` - Acesso às traduções

### 9. Testes de Qualidade

Para cada novo desenvolvimento:

1. Testar em **todos os 4 idiomas**
2. Verificar **responsividade** em diferentes idiomas
3. Confirmar **caracteres especiais** (ü, ñ, 中文)
4. Validar **comprimento de texto** em todas as línguas

### 10. Exemplo Completo

```typescript
// ✅ Implementação padrão obrigatória
import { useTranslation } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExemploComponente() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.userManagement}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{t.admin.systemMetrics}</p>
        <Button>{t.common.save}</Button>
      </CardContent>
    </Card>
  );
}
```

## Enforcement (Fiscalização)

### Revisão de Código
- Todo PR deve verificar internacionalização
- Nenhum texto hardcoded pode passar
- Todas as 4 traduções devem estar presentes

### Checklist Obrigatório
- [ ] Usei `useTranslation()` no componente
- [ ] Adicionei traduções em todos os 4 idiomas
- [ ] Atualizei interface TypeScript
- [ ] Testei em pelo menos 2 idiomas diferentes
- [ ] Não deixei nenhum texto hardcoded

## Benefícios da Padronização

1. **Consistência** - Toda a aplicação usa o mesmo padrão
2. **Manutenibilidade** - Fácil encontrar e alterar traduções
3. **Qualidade** - Usuários têm experiência uniforme
4. **Performance** - Sistema otimizado para 4 idiomas específicos
5. **Profissionalismo** - Aplicação enterprise-ready

## Conclusão

Este padrão é **OBRIGATÓRIO** para todo desenvolvimento futuro no Spark Comex. O sistema de internacionalização está completo e fechado em 4 idiomas. Qualquer desvio destes padrões deve ser corrigido imediatamente.

**Lembre-se**: Sem texto hardcoded, sempre usar `useTranslation()`, sempre 4 idiomas.