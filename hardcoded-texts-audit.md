# Hardcoded Portuguese Texts Audit Report

## Executive Summary

This comprehensive audit identified **926 instances** of hardcoded Portuguese text strings across 89 TypeScript/TSX files in the client-side codebase. These texts need to be internationalized to support the application's multi-language functionality.

### Key Findings
- **Total hardcoded texts**: 926 instances
- **Files affected**: 89 files
- **High-priority user-facing texts**: ~650 instances
- **Medium-priority internal texts**: ~200 instances
- **Low-priority debug/console texts**: ~76 instances

## Files with Most Hardcoded Texts

| File | Count | Priority |
|------|-------|----------|
| `src/pages/credit-application.tsx` | 56 | HIGH |
| `src/components/credit/CreditStatusTracker.tsx` | 51 | HIGH |
| `src/pages/credit-details.tsx` | 39 | HIGH |
| `src/pages/import-new-enhanced.tsx` | 38 | HIGH |
| `src/components/credit/CreditAnalysisPanel.tsx` | 35 | HIGH |
| `src/lib/documentValidation.ts` | 32 | MEDIUM |
| `src/components/credit/CreditScoreAnalysis.tsx` | 32 | HIGH |
| `src/pages/dashboard_old.tsx` | 30 | HIGH |
| `src/components/imports/ExpandedImportForm.tsx` | 27 | HIGH |
| `src/pages/dashboard_broken.tsx` | 26 | HIGH |

## Categorization by Type

### 1. User Interface Elements (HIGH Priority)

#### Form Labels and Placeholders (73 instances)
Examples:
```typescript
// src/components/AdminImportFilters.tsx:45
placeholder="Buscar por importação, produto ou importador..."

// src/pages/credit-application.tsx
placeholder="Ex: Eletrônicos Q1 2024"
placeholder="Observações sobre a importação..."
placeholder="Nome como impresso no cartão"
```

#### Button Text and Actions (85+ instances)
Examples:
```typescript
// Various files
"Confirmar Finalização"
"Nova Aplicação"
"Salvar Alterações"
"Enviar Solicitação"
"Ver Detalhes"
```

#### Status Labels and Badges (120+ instances)
Examples:
```typescript
// src/utils/importStatus.ts
"Produção"
"Transporte Marítimo"
"Transporte Aéreo"
"Desembaraço"
"Concluído"

// src/pages/admin.tsx
"Pendente Análise"
"Em Análise"
"Pré-aprovado"
```

#### Navigation and Menu Items (45+ instances)
Examples:
```typescript
// src/components/layout/AuthenticatedLayout.tsx
"Aplicações de Crédito"
"Painel Administrativo"
"Configurações"
```

#### Dialog and Modal Titles (35+ instances)
Examples:
```typescript
// src/components/credit/CreditStatusTracker.tsx
title: 'Solicitação Enviada'
title: 'Pré-análise'
title: 'Análise Financeira'
title: 'Aprovação Final'
```

### 2. Messages and Notifications (MEDIUM-HIGH Priority)

#### Success Messages (25+ instances)
Examples:
```typescript
// Various files
"Importação operacional atualizada com sucesso"
"Todas as notificações foram marcadas como lidas"
"Sua aplicação foi recebida com sucesso"
```

#### Error Messages (45+ instances)
Examples:
```typescript
// src/lib/validation.ts
"CNPJ deve ter 14 dígitos"
"CNPJ inválido"
"Email inválido"
"Telefone deve ter 10 ou 11 dígitos"

// src/hooks/useDocumentUpload.ts
"Arquivo muito grande (máximo 10MB)"
"Não foi possível enviar o documento. Tente novamente."
```

#### Warning Messages (30+ instances)
Examples:
```typescript
// src/components/SmartDocumentValidator.tsx
"Nome do arquivo não indica ser comprovante de CNPJ"
"Formato do arquivo pode afetar a qualidade da análise"
"Arquivo muito pequeno - pode estar com baixa resolução"
```

### 3. Data Display and Formatting (MEDIUM Priority)

#### Default Values and Fallbacks (58+ instances)
Examples:
```typescript
// src/pages/supplier-details.tsx
{supplier.contactName || 'Não informado'}
{supplier.state || 'Não informado'}
{supplier.businessRegistration || 'Não informado'}

// src/pages/dashboard_broken.tsx
{user?.companyName || 'Usuário'}
{activity.companyName || 'Empresa não informada'}
```

#### Descriptive Text (95+ instances)
Examples:
```typescript
// src/utils/pipelineUtils.ts
description: 'Definição da importação e documentação inicial'
description: 'Fabricação dos produtos pelo fornecedor'
description: 'Liberação alfandegária no Brasil'

// src/lib/constants.ts
description: 'Plataforma de gestão de crédito e importação para empresas brasileiras'
```

#### Time/Date Formatting (15+ instances)
Examples:
```typescript
// src/utils/pipelineUtils.ts
return months === 1 ? '1 mês' : `${months} meses`;

// src/utils/roleUtils.ts
"Bom dia", "Boa tarde", "Boa noite"
```

### 4. Configuration and Constants (MEDIUM Priority)

#### Role and Status Mappings (25+ instances)
Examples:
```typescript
// src/utils/roleUtils.ts
"Super Administrador"
"Administrador"
"Importador"
"Inativo"
"Usuário"

// src/lib/constants.ts
{ value: 'USD', label: 'Dólar Americano (USD)', symbol: '$' }
{ value: 'CNY', label: 'Yuan Chinês (CNY)', symbol: '¥' }
```

#### Document Categories (65+ instances)
Examples:
```typescript
// src/lib/documentValidation.ts
requiredText: ['licença', 'alvará', 'funcionamento']
requiredText: ['balanço', 'demonstrativo', 'financeiro']
requiredText: ['inscrição', 'municipal', 'estadual']

// src/components/credit/PreparationGuideModal.tsx
"Razão social completa"
"Inscrições estadual e municipal"
"Endereço completo com CEP"
```

### 5. Debug and Development (LOW Priority)

#### Console Messages (9 instances)
Examples:
```typescript
// src/contexts/ModuleContext.tsx
console.error(`❌ PROTEÇÃO MODULAR: Acesso negado de ${module} para ${requiredModule}`);

// src/hooks/useModuleGuard.ts
console.error(`🔒 PROTEÇÃO MODULAR: ${user?.role} não autorizado para ${componentName}`);
```

#### Debug Labels (12+ instances)
Examples:
```typescript
// Various files
"Data não disponível"
"Documento não encontrado no índice"
```

## Priority Assessment

### HIGH Priority (650+ instances)
**Impact**: Directly visible to end users
**Category**: UI elements, form labels, buttons, status indicators, navigation
**Recommendation**: Internationalize immediately

**Files to prioritize**:
- `src/pages/credit-application.tsx` (56 instances)
- `src/components/credit/CreditStatusTracker.tsx` (51 instances)
- `src/pages/credit-details.tsx` (39 instances)
- `src/pages/import-new-enhanced.tsx` (38 instances)
- `src/components/credit/CreditAnalysisPanel.tsx` (35 instances)

### MEDIUM Priority (200+ instances)
**Impact**: User-facing but contextual (error messages, descriptions, fallback values)
**Category**: Notifications, validation messages, default values
**Recommendation**: Internationalize in phase 2

**Files to prioritize**:
- `src/lib/documentValidation.ts` (32 instances)
- `src/lib/validation.ts` (validation messages)
- `src/hooks/useDocumentUpload.ts` (error handling)

### LOW Priority (76+ instances)
**Impact**: Internal/debugging, not typically seen by end users
**Category**: Console messages, debug labels, internal constants
**Recommendation**: Internationalize in final phase or maintain as-is

## Specific Text Examples by Category

### Form Validation Messages
```typescript
// High Priority - User sees these frequently
"Nome da importação é obrigatório"
"Tipo de carga é obrigatório"  
"Valor total é obrigatório"
"Moeda é obrigatória"
"Incoterms é obrigatório"
"CNPJ deve ter 14 dígitos"
"Email inválido"
"Telefone deve ter 10 ou 11 dígitos"
```

### Import Status Labels
```typescript
// High Priority - Core business logic display
"Planejamento"
"Produção"
"Entregue ao Agente"
"Transporte Marítimo"
"Transporte Aéreo"
"Desembaraço"
"Transporte Nacional"
"Concluído"
"Cancelado"
```

### Credit Application Flow
```typescript
// High Priority - Main user journey
"Solicitação Enviada"
"Pré-análise"
"Análise Financeira"
"Aprovação Final"
"Sua aplicação foi recebida com sucesso"
"Nossa equipe está revisando seus documentos"
"Avaliação pela instituição financeira"
"Finalização dos termos e condições"
```

### Document Upload Messages
```typescript
// Medium Priority - Important for UX
"Arquivo muito grande (máximo 10MB)"
"Formato não suportado. Use: PDF, JPG, PNG"
"Não foi possível enviar o documento. Tente novamente."
"Nome do arquivo não indica ser comprovante de CNPJ"
"Arquivo muito pequeno - pode estar com baixa resolução"
```

## Internationalization Strategy Recommendations

### Phase 1: Critical User Interface (Weeks 1-2)
- Focus on files with 20+ instances
- Prioritize forms, buttons, navigation, status labels
- Start with credit application and import management flows

### Phase 2: Messages and Validation (Weeks 3-4)  
- Error messages and validation
- Success/warning notifications
- Document upload feedback
- Default values and fallbacks

### Phase 3: Configuration and Polish (Week 5)
- Role mappings and constants
- Descriptive text and tooltips
- Time/date formatting
- Document categories

### Phase 4: Debug and Internal (Optional)
- Console messages
- Debug labels
- Internal constants

## Technical Implementation Notes

1. **Existing I18n Infrastructure**: The project already has `react-i18next` setup with `I18nContext.tsx`
2. **Translation Files**: Located in `src/i18n/` with `pt-BR.json`, `en.json`, `fr.json`, etc.
3. **Current Usage**: Some components already use `useTranslation()` hook
4. **Key Structure**: Existing keys follow pattern like `auth.login`, `credit.title`, etc.

## Recommended Key Naming Convention

```typescript
// Status labels
"status.production": "Produção"
"status.seaTransport": "Transporte Marítimo"
"status.airTransport": "Transporte Aéreo"

// Validation messages  
"validation.cnpjRequired": "CNPJ deve ter 14 dígitos"
"validation.emailInvalid": "Email inválido"

// Form labels
"forms.importName": "Nome da Importação"
"forms.cargoType": "Tipo de Carga"
"forms.totalValue": "Valor Total"

// Actions
"actions.save": "Salvar"
"actions.cancel": "Cancelar"
"actions.submit": "Enviar"
```

## Conclusion

The audit reveals extensive use of hardcoded Portuguese text throughout the application. With 926 instances across 89 files, this represents a significant internationalization effort. However, the existing i18n infrastructure provides a solid foundation for implementation.

The recommended phased approach prioritizes user-facing elements first, ensuring the most impactful improvements are delivered early while maintaining development velocity.

**Next Steps:**
1. Begin with Phase 1 implementation focusing on the top 10 files with highest counts
2. Establish consistent key naming conventions
3. Create comprehensive translation files for all target languages
4. Implement automated testing to prevent regression of hardcoded texts

---

**Generated on:** 2025-08-14  
**Total Files Analyzed:** 89  
**Total Hardcoded Texts Found:** 926  
**Analysis Method:** Regex pattern matching for Portuguese characters in string literals