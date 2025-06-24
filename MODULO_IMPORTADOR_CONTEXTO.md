
# MÓDULO IMPORTADOR - CONTEXTO DE PRESERVAÇÃO

## STATUS: 100% FUNCIONAL ✅

**Data de Registro:** 16 de Janeiro de 2025  
**Versão Estável:** v1.0.0  
**Status:** PROTEGIDO - NÃO MODIFICAR SEM SOLICITAÇÃO EXPLÍCITA

---

## DECLARAÇÃO DE INTEGRIDADE

O **MÓDULO IMPORTADOR** está 100% funcional e operacional. Todas as suas funcionalidades foram testadas e validadas. Este módulo serve como REFERÊNCIA PRINCIPAL para o sistema e deve ser preservado em sua totalidade.

## REGRA FUNDAMENTAL

⚠️ **REGRA ABSOLUTA:** Qualquer alteração futura em outros módulos (Admin, Financeira) deve se adaptar às funcionalidades e estruturas do módulo importador, NUNCA o contrário.

---

## FUNCIONALIDADES PROTEGIDAS

### 1. AUTENTICAÇÃO E SESSÃO
- Sistema de login/registro com CNPJ brasileiro ✅
- Validação de formulários com Zod ✅
- Gerenciamento de sessão com express-session ✅
- Middleware de autenticação funcional ✅

### 2. DASHBOARD DO IMPORTADOR
- Métricas de crédito (Aprovado, Em Uso, Disponível) ✅
- Contadores de importações ativas ✅
- Listagem de aplicações recentes ✅
- Interface responsiva e funcional ✅

### 3. GESTÃO DE CRÉDITO
- Formulário multi-etapas de solicitação ✅
- Validação de dados empresariais ✅
- Upload de documentos ✅
- Tracking de status (draft, pending, approved, rejected) ✅
- Cálculos de crédito disponível ✅

### 4. GESTÃO DE IMPORTAÇÕES
- Criação de importações (FCL/LCL) ✅
- Associação com fornecedores ✅
- Tracking de pipeline completo ✅
- Gestão de produtos múltiplos ✅
- Cálculos de valores e totais ✅

### 5. GESTÃO DE FORNECEDORES
- CRUD completo de fornecedores ✅
- Informações comerciais e bancárias ✅
- Categorização de produtos ✅
- Validação de dados internacionais ✅

---

## ESTRUTURA DE ARQUIVOS PROTEGIDA

### PÁGINAS CORE (NÃO MODIFICAR)
```
client/src/pages/
├── auth.tsx ✅ PROTEGIDO
├── dashboard.tsx ✅ PROTEGIDO  
├── credit.tsx ✅ PROTEGIDO
├── credit-application.tsx ✅ PROTEGIDO
├── credit-details.tsx ✅ PROTEGIDO
├── imports.tsx ✅ PROTEGIDO
├── import-new.tsx ✅ PROTEGIDO
├── import-details.tsx ✅ PROTEGIDO
├── suppliers.tsx ✅ PROTEGIDO
├── supplier-new.tsx ✅ PROTEGIDO
└── supplier-details.tsx ✅ PROTEGIDO
```

### COMPONENTES CORE (NÃO MODIFICAR)
```
client/src/components/
├── layout/AuthenticatedLayout.tsx ✅ PROTEGIDO
├── common/MetricsCard.tsx ✅ PROTEGIDO
└── ui/ ✅ PROTEGIDO (todos os componentes)
```

### BACKEND CORE (NÃO MODIFICAR)
```
server/
├── routes.ts ✅ PROTEGIDO (endpoints do importador)
├── storage.ts ✅ PROTEGIDO (métodos do importador)
└── auth.ts ✅ PROTEGIDO
```

---

## ENDPOINTS PROTEGIDOS

### AUTENTICAÇÃO ✅
- `POST /api/auth/register`
- `POST /api/auth/login` 
- `GET /api/auth/user`
- `POST /api/auth/logout`

### CRÉDITO ✅
- `GET /api/credit/applications`
- `POST /api/credit/applications`
- `GET /api/credit/applications/:id`
- `PUT /api/credit/applications/:id`
- `DELETE /api/credit/applications/:id`

### IMPORTAÇÕES ✅
- `GET /api/imports`
- `POST /api/imports`
- `GET /api/imports/:id`
- `PUT /api/imports/:id`
- `DELETE /api/imports/:id`
- `PATCH /api/imports/:id/status`

### FORNECEDORES ✅
- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/:id`
- `PUT /api/suppliers/:id`
- `DELETE /api/suppliers/:id`

---

## SCHEMAS PROTEGIDOS

### DATABASE SCHEMA ✅
```typescript
// shared/schema.ts - SEÇÕES PROTEGIDAS:
- users table ✅
- creditApplications table ✅  
- imports table ✅
- suppliers table ✅
- Todos os schemas de validação ✅
```

---

## REGRAS DE DESENVOLVIMENTO

### ✅ PERMITIDO
- Adicionar novos módulos (Admin, Financeira)
- Criar novos endpoints para outros módulos
- Adicionar novas funcionalidades em outros módulos
- Melhorar UI/UX sem alterar funcionalidade core

### ❌ PROIBIDO SEM SOLICITAÇÃO EXPLÍCITA
- Modificar endpoints do importador
- Alterar estrutura de dados do importador
- Modificar componentes UI do importador
- Alterar fluxos de autenticação
- Modificar schemas de banco relacionados ao importador
- Alterar lógica de negócio do importador

---

## PROTOCOLO DE ALTERAÇÃO

Se for necessário modificar o módulo importador:

1. **SOLICITAÇÃO EXPLÍCITA** - O usuário deve solicitar especificamente a alteração
2. **JUSTIFICATIVA** - Deve haver justificativa clara para a mudança
3. **BACKUP** - Fazer backup da versão atual antes da alteração
4. **VALIDAÇÃO** - Testar todas as funcionalidades após alteração
5. **DOCUMENTAÇÃO** - Atualizar este documento com as mudanças

---

## RESPONSABILIDADES DOS OUTROS MÓDULOS

### MÓDULO ADMIN
- Deve consumir dados do importador via APIs existentes
- Deve adaptar sua interface aos dados fornecidos pelo importador
- NÃO deve alterar estruturas de dados do importador

### MÓDULO FINANCEIRA  
- Deve consumir dados do importador via APIs existentes
- Deve trabalhar com os status e estruturas definidas pelo importador
- NÃO deve modificar fluxos do importador

---

## VALIDAÇÃO DE INTEGRIDADE

Para validar se o módulo importador continua funcional:

1. ✅ Login/Registro funcionando
2. ✅ Dashboard carregando métricas corretas
3. ✅ Criação de solicitação de crédito
4. ✅ Criação de fornecedores
5. ✅ Criação de importações
6. ✅ Visualização de detalhes
7. ✅ Edição de registros
8. ✅ Navegação entre páginas

---

**IMPORTANTE:** Este documento deve ser consultado antes de qualquer alteração no sistema. O módulo importador é a base funcional do sistema e deve ser preservado como referência de qualidade e estabilidade.

---

*Documento criado em: 16/01/2025*  
*Última atualização: 16/01/2025*  
*Status: ATIVO E PROTEGIDO*
