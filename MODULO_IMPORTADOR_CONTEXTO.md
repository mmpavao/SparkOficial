

# MÓDULO IMPORTADOR - CONTEXTO DE PRESERVAÇÃO E ISOLAMENTO

## STATUS: 100% FUNCIONAL ✅

**Data de Registro:** 16 de Janeiro de 2025  
**Última Atualização:** 17 de Janeiro de 2025  
**Versão Estável:** v1.0.0  
**Status:** PROTEGIDO E ISOLADO - ZERO MODIFICAÇÕES PERMITIDAS

---

## DECLARAÇÃO DE INTEGRIDADE E ISOLAMENTO

O **MÓDULO IMPORTADOR** está 100% funcional e operacional. Todas as suas funcionalidades foram testadas e validadas. Este módulo serve como REFERÊNCIA PRINCIPAL para o sistema e deve ser preservado em sua totalidade.

## REGRA FUNDAMENTAL DE ISOLAMENTO

⚠️ **REGRA ABSOLUTA DE ISOLAMENTO:** O módulo importador e o módulo administrativo devem operar de forma COMPLETAMENTE INDEPENDENTE. Qualquer alteração no módulo admin NÃO PODE, de forma alguma, afetar, modificar ou interferir no funcionamento do módulo importador.

### PRINCÍPIOS DE ISOLAMENTO:

1. **ISOLAMENTO DE CÓDIGO:** Nenhuma alteração em componentes admin pode modificar componentes do importador
2. **ISOLAMENTO DE ROTAS:** Rotas administrativas não podem alterar rotas do importador
3. **ISOLAMENTO DE DADOS:** Estruturas de dados do importador são imutáveis para o módulo admin
4. **ISOLAMENTO DE FUNCIONALIDADES:** Lógicas de negócio do importador são intocáveis pelo admin

---

## FUNCIONALIDADES PROTEGIDAS - MÓDULO IMPORTADOR

### 1. AUTENTICAÇÃO E SESSÃO ✅ ISOLADO
- Sistema de login/registro com CNPJ brasileiro
- Validação de formulários com Zod
- Gerenciamento de sessão com express-session
- Middleware de autenticação funcional

### 2. DASHBOARD DO IMPORTADOR ✅ ISOLADO
- Métricas de crédito (Aprovado, Em Uso, Disponível)
- Contadores de importações ativas
- Listagem de aplicações recentes
- Interface responsiva e funcional

### 3. GESTÃO DE CRÉDITO ✅ ISOLADO
- Formulário multi-etapas de solicitação
- Validação de dados empresariais
- Upload de documentos
- Tracking de status (draft, pending, approved, rejected)
- Cálculos de crédito disponível

### 4. GESTÃO DE IMPORTAÇÕES ✅ ISOLADO
- Criação de importações (FCL/LCL)
- Associação com fornecedores
- Tracking de pipeline completo
- Gestão de produtos múltiplos
- Cálculos de valores e totais

### 5. GESTÃO DE FORNECEDORES ✅ ISOLADO
- CRUD completo de fornecedores
- Informações comerciais e bancárias
- Categorização de produtos
- Validação de dados internacionais

---

## ESTRUTURA DE ARQUIVOS PROTEGIDA E ISOLADA

### PÁGINAS CORE DO IMPORTADOR (ZONA INTOCÁVEL)
```
client/src/pages/
├── auth.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── dashboard.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── credit.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── credit-application.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── credit-details.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── imports.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── import-new.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── import-details.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── suppliers.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── supplier-new.tsx ✅ ISOLADO - NUNCA MODIFICAR
└── supplier-details.tsx ✅ ISOLADO - NUNCA MODIFICAR
```

### COMPONENTES CORE DO IMPORTADOR (ZONA INTOCÁVEL)
```
client/src/components/
├── layout/AuthenticatedLayout.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── common/MetricsCard.tsx ✅ ISOLADO - NUNCA MODIFICAR
├── SmartDocumentUpload.tsx ✅ ISOLADO - NUNCA MODIFICAR
└── ui/ ✅ ISOLADO - NUNCA MODIFICAR (todos os componentes)
```

### BACKEND CORE DO IMPORTADOR (ZONA INTOCÁVEL)
```
server/
├── routes.ts ✅ ISOLADO - Seções do importador NUNCA MODIFICAR
├── storage.ts ✅ ISOLADO - Métodos do importador NUNCA MODIFICAR
└── auth.ts ✅ ISOLADO - NUNCA MODIFICAR
```

---

## ENDPOINTS PROTEGIDOS E ISOLADOS

### AUTENTICAÇÃO ✅ ZONA INTOCÁVEL
- `POST /api/auth/register`
- `POST /api/auth/login` 
- `GET /api/auth/user`
- `POST /api/auth/logout`

### CRÉDITO ✅ ZONA INTOCÁVEL
- `GET /api/credit/applications`
- `POST /api/credit/applications`
- `GET /api/credit/applications/:id`
- `PUT /api/credit/applications/:id`
- `DELETE /api/credit/applications/:id`

### IMPORTAÇÕES ✅ ZONA INTOCÁVEL
- `GET /api/imports`
- `POST /api/imports`
- `GET /api/imports/:id`
- `PUT /api/imports/:id`
- `DELETE /api/imports/:id`
- `PATCH /api/imports/:id/status`

### FORNECEDORES ✅ ZONA INTOCÁVEL
- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/:id`
- `PUT /api/suppliers/:id`
- `DELETE /api/suppliers/:id`

---

## SCHEMAS PROTEGIDOS E ISOLADOS

### DATABASE SCHEMA ✅ ZONA INTOCÁVEL
```typescript
// shared/schema.ts - SEÇÕES PROTEGIDAS:
- users table ✅ ISOLADO
- creditApplications table ✅ ISOLADO
- imports table ✅ ISOLADO  
- suppliers table ✅ ISOLADO
- Todos os schemas de validação do importador ✅ ISOLADO
```

---

## REGRAS DE DESENVOLVIMENTO COM ISOLAMENTO TOTAL

### ✅ PERMITIDO NO MÓDULO ADMIN
- Criar páginas administrativas completamente separadas
- Criar componentes admin sem tocar nos do importador
- Adicionar endpoints admin com prefixo `/api/admin/`
- Desenvolver funcionalidades admin independentes
- Consumir dados do importador via APIs existentes (somente leitura ou através de APIs específicas)

### ❌ ABSOLUTAMENTE PROIBIDO
- Modificar qualquer arquivo do módulo importador
- Alterar componentes compartilhados que afetem o importador
- Modificar endpoints existentes do importador
- Alterar estrutura de dados que impacte o importador
- Modificar fluxos de autenticação do importador
- Alterar schemas de banco relacionados ao importador
- Modificar lógica de negócio do importador
- Fazer alterações "globais" que afetem o importador

---

## PROTOCOLO DE ISOLAMENTO PARA DESENVOLVIMENTO ADMIN

### CRIAÇÃO DE FUNCIONALIDADES ADMIN:

1. **PREFIXOS OBRIGATÓRIOS:**
   - Páginas: `admin-*.tsx`
   - Componentes: `Admin*.tsx`
   - Endpoints: `/api/admin/*`
   - Hooks: `useAdmin*.ts`

2. **SEPARAÇÃO FÍSICA:**
   - Criar pastas específicas para admin quando necessário
   - Manter componentes admin completamente separados
   - Usar imports específicos, nunca compartilhados com importador

3. **CONSUMO DE DADOS:**
   - Usar apenas APIs públicas do importador
   - Criar APIs admin específicas quando necessário
   - NUNCA modificar storage methods do importador

---

## RESPONSABILIDADES ESPECÍFICAS POR MÓDULO

### MÓDULO IMPORTADOR (INTOCÁVEL)
- Mantém todas suas funcionalidades atuais
- Opera independentemente do módulo admin
- Suas APIs podem ser consumidas pelo admin (read-only)
- NÃO pode ser modificado por necessidades admin

### MÓDULO ADMIN (ISOLADO)
- Deve criar suas próprias páginas e componentes
- Deve consumir dados do importador via APIs existentes
- Deve adaptar sua interface aos dados fornecidos pelo importador
- DEVE operar de forma completamente independente
- NÃO pode alterar nenhuma estrutura do importador

---

## VALIDAÇÃO DE ISOLAMENTO

Para validar se o isolamento está sendo mantido:

1. ✅ Módulo importador funciona independentemente
2. ✅ Nenhuma alteração admin afeta funcionalidades do importador
3. ✅ Componentes admin não modificam componentes do importador
4. ✅ APIs do importador permanecem inalteradas
5. ✅ Schemas do importador permanecem intocados
6. ✅ Fluxos do importador operam normalmente
7. ✅ Admin consome dados apenas via APIs públicas

---

## ARQUITETURA DE ISOLAMENTO

```
APLICAÇÃO
│
├── MÓDULO IMPORTADOR (ZONA PROTEGIDA - INTOCÁVEL)
│   ├── Páginas do importador ✅
│   ├── Componentes do importador ✅  
│   ├── APIs do importador ✅
│   ├── Schemas do importador ✅
│   └── Lógicas do importador ✅
│
└── MÓDULO ADMIN (ZONA INDEPENDENTE)
    ├── Páginas admin (novas) ✅
    ├── Componentes admin (novos) ✅
    ├── APIs admin (novas) ✅
    ├── Consumo APIs importador (read-only) ✅
    └── Lógicas admin (independentes) ✅
```

---

**IMPORTANTE:** Este documento estabelece o isolamento completo entre os módulos. O módulo importador é uma zona intocável e o módulo admin deve operar de forma completamente independente, consumindo apenas dados via APIs públicas quando necessário.

---

*Documento criado em: 16/01/2025*  
*Atualizado com isolamento em: 17/01/2025*  
*Status: ATIVO, PROTEGIDO E ISOLADO*

