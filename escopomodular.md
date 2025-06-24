
# SPARK COMEX - ESCOPO MODULAR COMPLETO

## VISÃO GERAL DO SISTEMA

O Spark Comex é uma plataforma completa de crédito e importação para empresários brasileiros que importam da China, estruturada em três módulos principais com diferentes níveis de acesso e responsabilidades.

---

## MÓDULO IMPORTADOR (Base/Core)

### **Funcionalidades Principais**
- **Dashboard Pessoal**: Métricas próprias (importações, crédito disponível, valor total)
- **Gestão de Crédito**: Criar, editar, visualizar próprias solicitações de crédito
- **Gestão de Importações**: CRUD completo das próprias importações
- **Gestão de Fornecedores**: CRUD completo dos próprios fornecedores chineses
- **Perfil/Configurações**: Gerenciar dados da empresa, avatar, preferências

### **Características de Acesso**
- Vê apenas seus próprios dados
- Pode criar, editar e cancelar suas próprias solicitações
- Interface focada em "Minhas Importações", "Meus Fornecedores"
- Acesso limitado ao escopo da própria empresa

### **APIs Utilizadas**
- `/api/credit/applications` (próprias aplicações)
- `/api/imports` (próprias importações)
- `/api/suppliers` (próprios fornecedores)
- `/api/user/profile`

### **Permissões**
- **Dados**: Próprios apenas
- **Ações**: CRUD próprios dados
- **Objetivo**: Operação comercial

---

## MÓDULO ADMIN (Gestão e Pré-Aprovação)

### **Funcionalidades Principais**
- **Dashboard Administrativo**: Métricas globais de TODOS os importadores
- **Gestão de Usuários**: Criar, editar, desativar usuários (importadores, admins, financeira)
- **Pré-Análise de Crédito**: Primeira camada de aprovação, análise de documentos
- **Supervisão de Importações**: Visualizar TODAS as importações de TODOS os importadores
- **Supervisão de Fornecedores**: Visualizar TODOS os fornecedores de TODOS os importadores
- **Relatórios Globais**: Métricas consolidadas do sistema

### **Diferenças do Importador**
- **Escopo Global**: Vê dados de TODOS os importadores
- **Poder de Gestão**: Pode criar/editar usuários
- **Pré-Aprovação**: Primeira etapa do processo de aprovação de crédito
- **Interface Administrativa**: "Todas as Importações", "Todos os Fornecedores"
- **Análise de Risco**: Avalia documentos e faz recomendações

### **APIs Específicas**
- `/api/admin/users` (gestão completa de usuários)
- `/api/admin/credit-applications` (todas as aplicações)
- `/api/admin/imports` (todas as importações)
- `/api/admin/suppliers` (todos os fornecedores)
- `/api/admin/credit-applications/:id/approve` (pré-aprovação)

### **Permissões**
- **Dados**: Todos os dados
- **Ações**: Gestão global + pré-aprovação
- **Objetivo**: Gestão e controle

---

## MÓDULO FINANCEIRA (Aprovação Final)

### **Funcionalidades Principais**
- **Dashboard Financeiro**: Foco em aplicações pré-aprovadas pelo admin
- **Aprovação Final de Crédito**: Segunda e última camada de aprovação
- **Definição de Limites**: Estabelece valor final do crédito, prazo de pagamento, entrada
- **Análise de Fornecedores**: Avalia fornecedores de empresas aprovadas
- **Supervisão de Importações**: Monitora importações de empresas com crédito aprovado

### **Diferenças do Admin**
- **Foco Financeiro**: Especializado em análise financeira final
- **Poder de Aprovação Final**: Define limites e termos definitivos
- **Escopo Seletivo**: Foca em aplicações já pré-aprovadas pelo admin
- **Decisão Financeira**: Estabelece entrada (10%), prazo (30-180 dias), limite final

### **APIs Específicas**
- `/api/financeira/credit-applications` (aplicações pré-aprovadas)
- `/api/financeira/suppliers` (fornecedores de empresas aprovadas)
- `/api/financeira/imports` (importações de empresas aprovadas)
- `/api/financeira/credit-applications/:id/approve` (aprovação final)

### **Permissões**
- **Dados**: Dados pré-aprovados
- **Ações**: Aprovação final + definição de termos
- **Objetivo**: Análise e aprovação financeira

---

## FLUXO DE TRABALHO INTEGRADO

### **Processo de Aprovação de Crédito**
1. **Importador** → Cria solicitação de crédito
2. **Admin** → Faz pré-análise, solicita documentos, pré-aprova
3. **Financeira** → Faz análise final, define limites e aprova

### **Hierarquia de Acesso**
- **Importador**: Dados próprios apenas
- **Admin**: Todos os dados + gestão de usuários + pré-aprovação
- **Financeira**: Dados seletivos (pré-aprovados) + aprovação final

---

## ELEMENTOS COMUNS ENTRE MÓDULOS

### **Interface/UI**
- Mesma estrutura de Card/CardContent
- Métricas cards padronizadas
- Sistema de filtros similar
- Dropdown de ações consistente

### **Funcionalidades Compartilhadas**
- Visualização de importações (escopo diferente)
- Gestão de fornecedores (permissões diferentes)
- Sistema de documentos
- Timeline de status

### **Tecnologias**
- Mesma base React/TypeScript
- Componentes UI reutilizados
- Sistema de autenticação compartilhado
- APIs REST padronizadas

### **Componentes Reutilizáveis**
- `MetricsCard`: Cards de métricas padronizados
- `StatusBadge`: Badges de status consistentes
- `DataTable`: Tabelas de dados uniformes
- `LoadingSpinner`: Indicadores de carregamento
- `ErrorBoundary`: Tratamento de erros

---

## DIFERENÇAS FUNDAMENTAIS

### **Escopo de Dados**
| Módulo | Escopo | Descrição |
|--------|--------|-----------|
| **Importador** | Próprios dados | Vê apenas informações da própria empresa |
| **Admin** | Todos os dados | Acesso global a todas as informações |
| **Financeira** | Dados pré-aprovados | Foco em aplicações já validadas pelo admin |

### **Permissões de Ação**
| Módulo | Permissões | Capacidades |
|--------|------------|-------------|
| **Importador** | CRUD próprios dados | Gerencia apenas seus recursos |
| **Admin** | Gestão global + pré-aprovação | Controle total + primeira aprovação |
| **Financeira** | Aprovação final + definição de termos | Decisão financeira definitiva |

### **Arquivos de Interface Específicos**
- `admin.tsx` - Dashboard administrativo
- `admin-users.tsx` - Gestão de usuários
- `admin-credit-analysis.tsx` - Análise de crédito
- `dashboard.tsx` - Dashboard do importador
- `credit.tsx` - Gestão de crédito do importador

---

## SISTEMA DE AUTENTICAÇÃO E ROLES

### **Roles Disponíveis**
- `super_admin`: Acesso total ao sistema
- `admin`: Gestão e pré-aprovação
- `importer`: Operações próprias
- `financeira`: Aprovação final
- `inactive`: Usuário desativado

### **Hooks de Autenticação**
- `useAuth()`: Gerencia estado de autenticação
- `useUserPermissions()`: Controla permissões por role
- `AuthenticatedLayout`: Layout com controle de acesso

---

## TECNOLOGIAS E ARQUITETURA

### **Frontend**
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Framework**: Shadcn/UI + Radix UI
- **Styling**: Tailwind CSS

### **Backend**
- **Runtime**: Node.js com TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL com Drizzle ORM
- **Authentication**: Express sessions
- **Password**: bcrypt

### **Estrutura de Arquivos**
```
client/src/
├── components/
│   ├── common/           # Componentes reutilizáveis
│   └── ui/              # UI primitives
├── hooks/               # React hooks otimizados
├── lib/                 # Utilitários e configurações
├── pages/               # Páginas da aplicação
├── types/               # Definições de tipos
└── utils/               # Funções utilitárias
```

---

## INTERNACIONALIZAÇÃO

### **Idiomas Suportados**
- Português (pt) - Padrão
- English (en)
- Español (es)
- 中文 (zh) - Chinês simplificado

### **Sistema I18n**
- Context API para gerenciamento de idioma
- Traduções centralizadas em `i18n.ts`
- Componente `LanguageSelector` para troca de idioma
- Validações localizadas

---

## MÉTRICAS E MONITORAMENTO

### **Dashboard Metrics**
- Importador: Métricas pessoais
- Admin: Métricas globais do sistema
- Financeira: Métricas de aplicações aprovadas

### **Hooks de Métricas**
- `useMetrics()`: Cálculos de métricas reutilizáveis
- `useUnifiedEndpoints()`: APIs unificadas por módulo

---

## SEGURANÇA E VALIDAÇÃO

### **Sistema de Validação**
- Validação de CNPJ/CPF brasileiros
- Formatação de telefone/CEP
- Schemas Zod para validação de forms
- Tratamento de erros centralizado

### **Componentes de Segurança**
- `AdminRoute`: Proteção de rotas administrativas
- Middleware de autenticação no backend
- Session management com PostgreSQL
- Password hashing com bcrypt

---

## CONCLUSÃO

O sistema Spark Comex mantém uma arquitetura modular bem definida onde cada papel tem acesso específico às funcionalidades necessárias para sua função, garantindo:

- **Segurança**: Controle de acesso por roles
- **Eficiência**: Fluxo de aprovação estruturado
- **Escalabilidade**: Componentes reutilizáveis
- **Manutenibilidade**: Código organizado e tipado
- **Usabilidade**: Interface consistente e responsiva

O fluxo de aprovação de crédito em três etapas (Importador → Admin → Financeira) garante um processo robusto e controlado para a concessão de crédito para importações.
