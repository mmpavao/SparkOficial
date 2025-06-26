# ROADMAP - MÓDULO DE IMPORTAÇÕES
## Sistema Integrado de Gestão de Importações com Crédito Rotativo

### 📋 VISÃO GERAL
Implementação completa do módulo de importações integrado ao sistema de crédito existente, mantendo a arquitetura atual e padrões visuais estabelecidos.

---

## 🎯 OBJETIVOS PRINCIPAIS

1. **Integração Financeira Completa**
   - Validação automática de crédito disponível
   - Reserva e liberação de crédito rotativo
   - Geração automática de cronogramas de pagamento
   - Aplicação de taxas administrativas apenas no valor financiado

2. **Pipeline de Importação Completo**
   - 8 estágios de rastreamento (Estimativa → Concluído)
   - Sistema de documentos por fase
   - Timeline visual com status em tempo real
   - Notificações automáticas de mudanças

3. **Interface Consistente**
   - Reutilização de componentes existentes (Cards, Badges, Filters)
   - Padrão visual idêntico ao módulo de crédito
   - Suporte aos 4 idiomas (PT/EN/ZH/ES)
   - Design responsivo mobile-first

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### **SEMANA 1-2: FUNDAÇÃO E ESTRUTURA**

#### **Sprint 1.1: Navegação e Rotas Base**
**Arquivos a criar/modificar:**
- `client/src/components/layout/AuthenticatedLayout.tsx` - Adicionar seção importações
- `client/src/App.tsx` - Adicionar rotas do módulo
- `client/src/pages/imports.tsx` - Página principal de listagem
- `client/src/pages/import-new.tsx` - Formulário de nova importação
- `client/src/pages/import-details.tsx` - Detalhes da importação

**Entregáveis:**
- [ ] Navegação funcional no sidebar
- [ ] Roteamento completo implementado
- [ ] Estrutura básica das páginas criada
- [ ] Breadcrumbs e títulos contextuais

#### **Sprint 1.2: Schema e API Base**
**Arquivos a criar/modificar:**
- `shared/schema.ts` - Validar/ajustar schema de imports existente
- `server/routes.ts` - Endpoints CRUD de importações
- `server/storage.ts` - Operações de banco para importações
- `client/src/hooks/useImports.tsx` - Hook de gerenciamento de importações

**Entregáveis:**
- [ ] Schema de importações otimizado
- [ ] API endpoints funcionais (GET, POST, PUT, DELETE)
- [ ] Validações Zod implementadas
- [ ] Hooks React Query configurados

---

### **SEMANA 3-4: PÁGINAS PRINCIPAIS**

#### **Sprint 2.1: Listagem de Importações**
**Componentes a criar:**
- `client/src/components/imports/ImportCard.tsx` - Card visual da importação
- `client/src/components/imports/ImportFilters.tsx` - Filtros avançados
- `client/src/components/imports/ImportMetrics.tsx` - Métricas superiores
- `client/src/components/ui/StatusBadge.tsx` - Badges de status (reutilizar)

**Features:**
- [x] Cards visuais com dropdown actions (ImportCard.tsx)
- [x] Filtros por status, fornecedor, período, valor (ImportFilters.tsx)
- [x] Métricas: Total, Em Andamento, Concluídas, Valor Total + 4 métricas adicionais (ImportMetrics.tsx)
- [x] Interface completa integrada (imports-new-integrated.tsx)
- [x] Sistema de permissões role-based implementado
- [x] Formatação compacta de números para métricas (formatCompactNumber)

#### **Sprint 2.2: Formulário de Nova Importação**
**Componentes a criar:**
- `client/src/components/imports/ImportForm.tsx` - Formulário principal
- `client/src/components/imports/ProductManager.tsx` - Gerenciador de produtos LCL
- `client/src/components/imports/FinancialPreview.tsx` - Preview financeiro
- `client/src/components/imports/TermsConfirmation.tsx` - Modal de confirmação

**Features:**
- [ ] Seleção FCL/LCL com interface adaptativa
- [ ] Dropdown de fornecedores cadastrados
- [ ] Sistema de múltiplos produtos para LCL
- [ ] Preview financeiro em tempo real
- [ ] Validação de crédito disponível
- [ ] Modal de confirmação de termos

---

### **SEMANA 5-6: PIPELINE E TRACKING**

#### **Sprint 3.1: Sistema de Pipeline**
**Componentes a criar:**
- `client/src/components/imports/ImportTimeline.tsx` - Timeline visual
- `client/src/components/imports/StageCard.tsx` - Card de estágio
- `client/src/components/imports/StageManager.tsx` - Gerenciador de estágios
- `client/src/utils/pipelineUtils.ts` - Utilitários de pipeline

**Features:**
- [ ] 8 estágios definidos e configurados
- [ ] Timeline visual com ícones e cores
- [ ] Datas estimadas vs reais
- [ ] Sistema de progresso percentual
- [ ] Atualização de status por admins

#### **Sprint 3.2: Página de Detalhes**
**Layout em 3 colunas:**
- `client/src/components/imports/ImportInfo.tsx` - Informações principais
- `client/src/components/imports/FinancialSummary.tsx` - Resumo financeiro
- `client/src/components/imports/DocumentsSection.tsx` - Seção de documentos

**Features:**
- [ ] Card destacado com valor e status
- [ ] Timeline interativa do pipeline
- [ ] Detalhes do fornecedor integrados
- [ ] Informações de produtos organizadas
- [ ] Responsividade mobile

---

### **SEMANA 7-8: SISTEMA FINANCEIRO**

#### **Sprint 4.1: Integração com Crédito**
**Arquivos a criar/modificar:**
- `client/src/hooks/useCreditValidation.tsx` - Validação de crédito
- `client/src/utils/creditCalculator.ts` - Calculadora de crédito
- `server/services/creditService.ts` - Serviços de crédito
- `shared/types/credit.ts` - Tipos financeiros

**Features:**
- [ ] Validação de limite disponível em tempo real
- [ ] Reserva de crédito durante criação
- [ ] Liberação automática na conclusão
- [ ] Cálculo de taxa administrativa (10%)
- [ ] Integração com sistema de crédito rotativo

#### **Sprint 4.2: Cronograma de Pagamentos**
**Componentes a criar:**
- `client/src/components/payments/PaymentSchedule.tsx` - Cronograma visual
- `client/src/components/payments/PaymentCard.tsx` - Card de pagamento
- `client/src/utils/paymentGenerator.ts` - Gerador de cronogramas
- `server/services/paymentService.ts` - Serviços de pagamento

**Features:**
- [ ] Entrada automática de 30%
- [ ] Parcelamento baseado em termos aprovados
- [ ] Data base: mudança para 'entregue_agente'
- [ ] Status visual (pendente/pago/vencido)
- [ ] Upload de comprovantes

---

### **SEMANA 9-10: SISTEMA DE DOCUMENTOS**

#### **Sprint 5.1: Upload e Categorização**
**Componentes a criar:**
- `client/src/components/documents/DocumentUpload.tsx` - Upload por categoria
- `client/src/components/documents/DocumentList.tsx` - Lista de documentos
- `client/src/components/documents/DocumentViewer.tsx` - Visualizador
- `client/src/utils/documentValidator.ts` - Validação de documentos

**Features:**
- [ ] Categorias por estágio do pipeline
- [ ] Drag & drop com preview
- [ ] Validação de tipo e tamanho
- [ ] Versionamento de documentos
- [ ] Sistema de aprovação administrativa

#### **Sprint 5.2: Gestão Documental**
**Features:**
- [ ] Documentos obrigatórios vs opcionais
- [ ] Status de completude por estágio
- [ ] Notificações de documentos pendentes
- [ ] Histórico de uploads
- [ ] Download em lote

---

### **SEMANA 11-12: DASHBOARD E RELATÓRIOS**

#### **Sprint 6.1: Dashboard de Importações**
**Componentes a criar:**
- `client/src/components/dashboard/ImportsDashboard.tsx` - Dashboard específico
- `client/src/components/charts/PipelineChart.tsx` - Gráfico de pipeline
- `client/src/components/metrics/ImportMetrics.tsx` - Métricas avançadas

**Features:**
- [ ] Métricas de importações no dashboard principal
- [ ] Gráfico de distribuição por estágio
- [ ] Importações recentes
- [ ] Alertas de atraso
- [ ] KPIs operacionais

#### **Sprint 6.2: Pipeline Administrativo**
**Página para admins:**
- `client/src/pages/import-pipeline.tsx` - Visão geral administrativa
- `client/src/components/admin/PipelineOverview.tsx` - Overview do pipeline
- `client/src/components/admin/PerformanceMetrics.tsx` - Métricas de performance

**Features:**
- [ ] Visão consolidada de todas as importações
- [ ] Filtros por cliente, período, status
- [ ] Métricas de performance por fornecedor
- [ ] Tempo médio por estágio
- [ ] Relatórios de eficiência

---

### **SEMANA 13-14: REFINAMENTOS E INTEGRAÇÕES**

#### **Sprint 7.1: Notificações e Comunicação**
**Sistema de notificações:**
- `client/src/components/notifications/ImportNotifications.tsx`
- `server/services/notificationService.ts`
- Integração com sistema existente

**Features:**
- [ ] Notificações de mudança de status
- [ ] Alertas de vencimento de pagamento
- [ ] Comunicações entre admin e importador
- [ ] Push notifications (futuro)

#### **Sprint 7.2: Otimizações e Polimento**
**Melhorias finais:**
- [ ] Otimização de performance
- [ ] Testes de responsividade
- [ ] Validação de acessibilidade
- [ ] Testes de integração
- [ ] Documentação técnica

---

## 🔧 ESPECIFICAÇÕES TÉCNICAS

### **Arquitetura de Componentes**
```
src/components/imports/
├── ImportCard.tsx           # Card visual da importação
├── ImportForm.tsx           # Formulário principal
├── ImportTimeline.tsx       # Timeline do pipeline
├── FinancialPreview.tsx     # Preview financeiro
├── ProductManager.tsx       # Gerenciador de produtos
└── filters/
    ├── ImportFilters.tsx    # Filtros da listagem
    └── StatusFilter.tsx     # Filtro por status

src/components/documents/
├── DocumentUpload.tsx       # Upload de documentos
├── DocumentList.tsx         # Lista de documentos
└── DocumentViewer.tsx       # Visualizador

src/components/payments/
├── PaymentSchedule.tsx      # Cronograma de pagamentos
├── PaymentCard.tsx          # Card individual de pagamento
└── PaymentForm.tsx          # Formulário de pagamento
```

### **Hooks e Utilitários**
```
src/hooks/
├── useImports.tsx           # Gerenciamento de importações
├── useCreditValidation.tsx  # Validação de crédito
└── useImportPipeline.tsx    # Gerenciamento do pipeline

src/utils/
├── pipelineUtils.ts         # Utilitários de pipeline
├── creditCalculator.ts      # Cálculos financeiros
├── paymentGenerator.ts      # Geração de cronogramas
└── documentValidator.ts     # Validação de documentos
```

### **API Endpoints**
```
/api/imports                 # CRUD de importações
/api/imports/:id/stages      # Gerenciamento de estágios
/api/imports/:id/documents   # Upload de documentos
/api/imports/:id/payments    # Cronograma de pagamentos
/api/imports/pipeline        # Vista administrativa
```

---

## 📊 MÉTRICAS DE SUCESSO

### **Funcionalidades Core**
- [ ] Criação de importação com validação de crédito
- [ ] Pipeline completo de 8 estágios funcionando
- [ ] Sistema de pagamentos integrado
- [ ] Upload de documentos por categoria
- [ ] Dashboard com métricas em tempo real

### **Performance**
- [ ] Tempo de carregamento < 2s
- [ ] Interface responsiva em todos os dispositivos
- [ ] Suporte aos 4 idiomas implementado
- [ ] Zero breaking changes no sistema existente

### **Integração**
- [ ] 100% compatível com sistema de crédito atual
- [ ] Reutilização de componentes existentes
- [ ] Consistência visual mantida
- [ ] Dados em tempo real sincronizados

---

## 🚀 CRITÉRIOS DE ACEITE

### **Para Importadores**
- Criar importação com validação de crédito em tempo real
- Acompanhar pipeline com timeline visual
- Upload de documentos por fase
- Visualizar cronograma de pagamentos
- Receber notificações de mudanças

### **Para Administradores**
- Visão consolidada de todas as importações
- Atualizar status do pipeline
- Aprovar documentos
- Gerar relatórios de performance
- Monitorar KPIs operacionais

### **Para Sistema**
- Integração perfeita com crédito rotativo
- Cálculos financeiros automáticos
- Notificações automáticas
- Backup e versionamento de documentos
- Logs de auditoria completos

---

## 📝 PRÓXIMOS PASSOS

1. **Revisar e aprovar roadmap**
2. **Definir prioridades específicas**
3. **Iniciar Sprint 1.1: Navegação e Rotas Base**
4. **Configurar ambiente de desenvolvimento**
5. **Definir métricas de acompanhamento**

---

*Documento criado em: 26/06/2025*  
*Versão: 1.0*  
*Responsável: Sistema Spark Comex*