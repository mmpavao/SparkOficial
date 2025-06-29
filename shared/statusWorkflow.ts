/**
 * Status Workflow Management for Spark Comex Credit Applications
 * Defines valid status transitions and validation rules
 */

// Valid status values for each workflow stage
export const CREDIT_STATUS = {
  // General application status
  DRAFT: 'draft',
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;

export const PRE_ANALYSIS_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  PRE_APPROVED: 'pre_approved',
  NEEDS_DOCUMENTS: 'needs_documents',
  NEEDS_CLARIFICATION: 'needs_clarification',
  SUBMITTED_TO_FINANCIAL: 'submitted_to_financial'
} as const;

export const FINANCIAL_STATUS = {
  PENDING_FINANCIAL: 'pending_financial',
  UNDER_REVIEW_FINANCIAL: 'under_review_financial',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_DOCUMENTS: 'needs_documents_financial'
} as const;

export const ADMIN_STATUS = {
  PENDING_ADMIN: 'pending_admin',
  ADMIN_FINALIZED: 'admin_finalized'
} as const;

// Type definitions
export type CreditStatus = typeof CREDIT_STATUS[keyof typeof CREDIT_STATUS];
export type PreAnalysisStatus = typeof PRE_ANALYSIS_STATUS[keyof typeof PRE_ANALYSIS_STATUS];
export type FinancialStatus = typeof FINANCIAL_STATUS[keyof typeof FINANCIAL_STATUS];
export type AdminStatus = typeof ADMIN_STATUS[keyof typeof ADMIN_STATUS];

// Status transition rules
export const STATUS_TRANSITIONS: Record<CreditStatus, CreditStatus[]> = {
  [CREDIT_STATUS.DRAFT]: [CREDIT_STATUS.PENDING, CREDIT_STATUS.CANCELLED],
  [CREDIT_STATUS.PENDING]: [CREDIT_STATUS.UNDER_REVIEW, CREDIT_STATUS.CANCELLED],
  [CREDIT_STATUS.UNDER_REVIEW]: [CREDIT_STATUS.APPROVED, CREDIT_STATUS.REJECTED],
  [CREDIT_STATUS.APPROVED]: [], // Terminal state
  [CREDIT_STATUS.REJECTED]: [], // Terminal state
  [CREDIT_STATUS.CANCELLED]: [], // Terminal state
};

export const PRE_ANALYSIS_TRANSITIONS: Record<PreAnalysisStatus, PreAnalysisStatus[]> = {
  [PRE_ANALYSIS_STATUS.PENDING]: [
    PRE_ANALYSIS_STATUS.UNDER_REVIEW,
    PRE_ANALYSIS_STATUS.NEEDS_DOCUMENTS,
    PRE_ANALYSIS_STATUS.NEEDS_CLARIFICATION
  ],
  [PRE_ANALYSIS_STATUS.UNDER_REVIEW]: [
    PRE_ANALYSIS_STATUS.PRE_APPROVED,
    PRE_ANALYSIS_STATUS.NEEDS_DOCUMENTS,
    PRE_ANALYSIS_STATUS.NEEDS_CLARIFICATION
  ],
  [PRE_ANALYSIS_STATUS.PRE_APPROVED]: [PRE_ANALYSIS_STATUS.SUBMITTED_TO_FINANCIAL],
  [PRE_ANALYSIS_STATUS.NEEDS_DOCUMENTS]: [PRE_ANALYSIS_STATUS.UNDER_REVIEW],
  [PRE_ANALYSIS_STATUS.NEEDS_CLARIFICATION]: [PRE_ANALYSIS_STATUS.UNDER_REVIEW],
  [PRE_ANALYSIS_STATUS.SUBMITTED_TO_FINANCIAL]: [], // Terminal for this stage
};

export const FINANCIAL_TRANSITIONS: Record<FinancialStatus, FinancialStatus[]> = {
  [FINANCIAL_STATUS.PENDING_FINANCIAL]: [FINANCIAL_STATUS.UNDER_REVIEW_FINANCIAL],
  [FINANCIAL_STATUS.UNDER_REVIEW_FINANCIAL]: [
    FINANCIAL_STATUS.APPROVED,
    FINANCIAL_STATUS.REJECTED,
    FINANCIAL_STATUS.NEEDS_DOCUMENTS
  ],
  [FINANCIAL_STATUS.APPROVED]: [], // Goes to admin finalization
  [FINANCIAL_STATUS.REJECTED]: [], // Terminal state
  [FINANCIAL_STATUS.NEEDS_DOCUMENTS]: [FINANCIAL_STATUS.UNDER_REVIEW_FINANCIAL],
};

export const ADMIN_TRANSITIONS: Record<AdminStatus, AdminStatus[]> = {
  [ADMIN_STATUS.PENDING_ADMIN]: [ADMIN_STATUS.ADMIN_FINALIZED],
  [ADMIN_STATUS.ADMIN_FINALIZED]: [], // Terminal state
};

// Validation functions
export function isValidStatusTransition(
  currentStatus: CreditStatus,
  newStatus: CreditStatus
): boolean {
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
}

export function isValidPreAnalysisTransition(
  currentStatus: PreAnalysisStatus,
  newStatus: PreAnalysisStatus
): boolean {
  const validTransitions = PRE_ANALYSIS_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
}

export function isValidFinancialTransition(
  currentStatus: FinancialStatus,
  newStatus: FinancialStatus
): boolean {
  const validTransitions = FINANCIAL_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
}

export function isValidAdminTransition(
  currentStatus: AdminStatus,
  newStatus: AdminStatus
): boolean {
  const validTransitions = ADMIN_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
}

// Helper function to get current workflow stage
export function getCurrentWorkflowStage(
  status: CreditStatus,
  preAnalysisStatus: PreAnalysisStatus,
  financialStatus: FinancialStatus,
  adminStatus: AdminStatus
): 'draft' | 'pending_admin' | 'pending_financial' | 'pending_final_admin' | 'completed' | 'rejected' {
  if (status === CREDIT_STATUS.DRAFT) return 'draft';
  if (status === CREDIT_STATUS.REJECTED || status === CREDIT_STATUS.CANCELLED) return 'rejected';
  if (adminStatus === ADMIN_STATUS.ADMIN_FINALIZED) return 'completed';
  if (financialStatus === FINANCIAL_STATUS.APPROVED) return 'pending_final_admin';
  if (preAnalysisStatus === PRE_ANALYSIS_STATUS.SUBMITTED_TO_FINANCIAL) return 'pending_financial';
  return 'pending_admin';
}

// Status display helpers
export function getStatusDisplayInfo(status: CreditStatus): { label: string; color: string } {
  switch (status) {
    case CREDIT_STATUS.DRAFT:
      return { label: 'Rascunho', color: 'gray' };
    case CREDIT_STATUS.PENDING:
      return { label: 'Pendente', color: 'yellow' };
    case CREDIT_STATUS.UNDER_REVIEW:
      return { label: 'Em Análise', color: 'blue' };
    case CREDIT_STATUS.APPROVED:
      return { label: 'Aprovado', color: 'green' };
    case CREDIT_STATUS.REJECTED:
      return { label: 'Rejeitado', color: 'red' };
    case CREDIT_STATUS.CANCELLED:
      return { label: 'Cancelado', color: 'gray' };
    default:
      return { label: 'Desconhecido', color: 'gray' };
  }
}

export function getPreAnalysisDisplayInfo(status: PreAnalysisStatus): { label: string; color: string } {
  switch (status) {
    case PRE_ANALYSIS_STATUS.PENDING:
      return { label: 'Aguardando Análise', color: 'gray' };
    case PRE_ANALYSIS_STATUS.UNDER_REVIEW:
      return { label: 'Em Pré-Análise', color: 'blue' };
    case PRE_ANALYSIS_STATUS.PRE_APPROVED:
      return { label: 'Pré-Aprovado', color: 'green' };
    case PRE_ANALYSIS_STATUS.NEEDS_DOCUMENTS:
      return { label: 'Documentos Pendentes', color: 'orange' };
    case PRE_ANALYSIS_STATUS.NEEDS_CLARIFICATION:
      return { label: 'Esclarecimentos Pendentes', color: 'orange' };
    case PRE_ANALYSIS_STATUS.SUBMITTED_TO_FINANCIAL:
      return { label: 'Enviado à Financeira', color: 'purple' };
    default:
      return { label: 'Desconhecido', color: 'gray' };
  }
}

export function getFinancialDisplayInfo(status: FinancialStatus): { label: string; color: string } {
  switch (status) {
    case FINANCIAL_STATUS.PENDING_FINANCIAL:
      return { label: 'Aguardando Financeira', color: 'gray' };
    case FINANCIAL_STATUS.UNDER_REVIEW_FINANCIAL:
      return { label: 'Análise Final', color: 'blue' };
    case FINANCIAL_STATUS.APPROVED:
      return { label: 'Aprovado', color: 'green' };
    case FINANCIAL_STATUS.REJECTED:
      return { label: 'Rejeitado', color: 'red' };
    case FINANCIAL_STATUS.NEEDS_DOCUMENTS:
      return { label: 'Documentos Pendentes', color: 'orange' };
    default:
      return { label: 'Desconhecido', color: 'gray' };
  }
}

export function getAdminDisplayInfo(status: AdminStatus): { label: string; color: string } {
  switch (status) {
    case ADMIN_STATUS.PENDING_ADMIN:
      return { label: 'Aguardando Finalização', color: 'yellow' };
    case ADMIN_STATUS.ADMIN_FINALIZED:
      return { label: 'Finalizado', color: 'green' };
    default:
      return { label: 'Desconhecido', color: 'gray' };
  }
}