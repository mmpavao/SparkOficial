# FLUXO INTELIGENTE DE PRÉ-APROVAÇÃO - ANÁLISE E PROJETO

## PROBLEMA IDENTIFICADO
- Pré-aprovação funciona (status atualizado), mas interface não reflete mudança
- Botão continua disponível após pré-aprovação
- Falta progressão visual do workflow

## FLUXO ATUAL (4 ETAPAS)
1. **Importador** → Aplica para crédito (status: pending)
2. **Admin** → Pré-aprovação (status: pre_approved) 
3. **Financeira** → Aprovação final (status: approved)
4. **Admin** → Finalização (status: admin_finalized)

## FLUXO INTELIGENTE PROPOSTO

### Estados e Transições
```
PENDING → PRÉ-APROVADO → SUBMETIDO_FINANCEIRA → APROVADO_FINANCEIRA → FINALIZADO_ADMIN
```

### Interface Admin por Status

#### 1. Status: PENDING
- Botões: "Pré-aprovar" + "Rejeitar"
- Campos: Nível de Risco, Notas, Solicitar Documentos, Observações

#### 2. Status: PRE_APPROVED (NOVO)
- Badge: "Pré-Aprovado" (verde)
- Botão: "Submeter à Financeira" (azul)
- Validação: Verificar se documentos obrigatórios foram enviados
- Instrução: "Confira todos os documentos antes de enviar à financeira"

#### 3. Status: SUBMITTED_TO_FINANCIAL
- Badge: "Enviado à Financeira" (amarelo)
- Texto: "Aguardando análise financeira"
- Sem botões de ação (aguardando financeira)

#### 4. Status: FINANCIALLY_APPROVED
- Badge: "Aprovado pela Financeira" (verde)
- Botão: "Finalizar Termos" (âmbar)
- Mostrar: Limites e termos aprovados pela financeira

#### 5. Status: ADMIN_FINALIZED
- Badge: "Finalizado" (verde escuro)
- Texto: "Processo concluído"
- Mostrar: Termos finais para o cliente

## VALIDAÇÕES INTELIGENTES

### Antes de Submeter à Financeira
1. Verificar documentos obrigatórios carregados
2. Confirmar notas de análise preenchidas
3. Validar nível de risco definido

### Interface Adaptativa
- Esconder campos não relevantes para cada status
- Mostrar informações progressivas
- Indicadores visuais de progresso

## INTEGRAÇÃO COM MÓDULOS EXISTENTES

### Módulo Financeira
- Continua recebendo aplicações com status "submitted_to_financial"
- Interface não alterada

### Módulo Importador
- Visualiza progressão do status
- Recebe comunicações adequadas para cada etapa

### Banco de Dados
- Usar campos existentes (preAnalysisStatus, financialStatus, adminStatus)
- Adicionar campo submittedToFinancialAt se necessário

## COMPONENTES A MODIFICAR (APENAS ADMIN)

### AdminAnalysisPanel.tsx
- Lógica condicional por status
- Botões adaptativos
- Validações antes de submissão

### Status Badge
- Cores e textos específicos por status
- Indicação visual clara de progresso

### Validação de Documentos
- Verificar 10 documentos obrigatórios
- Contar 1 enviado + 1 pendente = necessário mais uploads

## IMPLEMENTAÇÃO SEGURA
- Modificar apenas componentes Admin
- Manter compatibilidade com Financeira e Importador
- Usar endpoints existentes
- Adicionar apenas endpoint de submissão se necessário

## RESULTADO ESPERADO
1. Admin pré-aprova → Status muda → Interface atualiza
2. Botão "Submeter à Financeira" aparece
3. Validação inteligente antes de submeter
4. Progressão visual clara para todas as partes
5. Fluxo intuitivo e profissional