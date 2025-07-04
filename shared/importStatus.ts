/**
 * STATUS CANÔNICO DAS IMPORTAÇÕES - SPARK COMEX
 * Sistema unificado de status para importações
 * Data: 04/07/2025
 */

// Status canônicos das importações
export const IMPORT_STATUS = {
  PLANEJAMENTO: 'planejamento',
  PRODUCAO: 'producao',
  ENTREGUE_AGENTE: 'entregue_agente',
  TRANSPORTE_MARITIMO: 'transporte_maritimo',
  TRANSPORTE_AEREO: 'transporte_aereo',
  DESEMBARACO: 'desembaraco',
  TRANSPORTE_NACIONAL: 'transporte_nacional',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado'
} as const;

// Tipo TypeScript para os status
export type ImportStatus = typeof IMPORT_STATUS[keyof typeof IMPORT_STATUS];

// Labels em português para exibição
export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  [IMPORT_STATUS.PLANEJAMENTO]: 'Planejamento',
  [IMPORT_STATUS.PRODUCAO]: 'Produção',
  [IMPORT_STATUS.ENTREGUE_AGENTE]: 'Entregue ao Agente',
  [IMPORT_STATUS.TRANSPORTE_MARITIMO]: 'Transporte Marítimo',
  [IMPORT_STATUS.TRANSPORTE_AEREO]: 'Transporte Aéreo',
  [IMPORT_STATUS.DESEMBARACO]: 'Desembaraço',
  [IMPORT_STATUS.TRANSPORTE_NACIONAL]: 'Transporte Nacional',
  [IMPORT_STATUS.CONCLUIDO]: 'Concluído',
  [IMPORT_STATUS.CANCELADO]: 'Cancelado'
};

// Cores padronizadas para cada status
export const IMPORT_STATUS_COLORS: Record<ImportStatus, string> = {
  [IMPORT_STATUS.PLANEJAMENTO]: 'bg-blue-100 text-blue-800 border-blue-200',
  [IMPORT_STATUS.PRODUCAO]: 'bg-orange-100 text-orange-800 border-orange-200',
  [IMPORT_STATUS.ENTREGUE_AGENTE]: 'bg-purple-100 text-purple-800 border-purple-200',
  [IMPORT_STATUS.TRANSPORTE_MARITIMO]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  [IMPORT_STATUS.TRANSPORTE_AEREO]: 'bg-sky-100 text-sky-800 border-sky-200',
  [IMPORT_STATUS.DESEMBARACO]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [IMPORT_STATUS.TRANSPORTE_NACIONAL]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [IMPORT_STATUS.CONCLUIDO]: 'bg-green-100 text-green-800 border-green-200',
  [IMPORT_STATUS.CANCELADO]: 'bg-red-100 text-red-800 border-red-200'
};

// Array de todos os status válidos
export const VALID_IMPORT_STATUSES = Object.values(IMPORT_STATUS);

// Status que indicam importação ativa (não finalizada)
export const ACTIVE_IMPORT_STATUSES = [
  IMPORT_STATUS.PLANEJAMENTO,
  IMPORT_STATUS.PRODUCAO,
  IMPORT_STATUS.ENTREGUE_AGENTE,
  IMPORT_STATUS.TRANSPORTE_MARITIMO,
  IMPORT_STATUS.TRANSPORTE_AEREO,
  IMPORT_STATUS.DESEMBARACO,
  IMPORT_STATUS.TRANSPORTE_NACIONAL
];

// Status finais
export const FINAL_IMPORT_STATUSES = [
  IMPORT_STATUS.CONCLUIDO,
  IMPORT_STATUS.CANCELADO
];

// Status de transporte (para agrupamento)
export const TRANSPORT_IMPORT_STATUSES = [
  IMPORT_STATUS.TRANSPORTE_MARITIMO,
  IMPORT_STATUS.TRANSPORTE_AEREO,
  IMPORT_STATUS.TRANSPORTE_NACIONAL
];

// Função para obter label do status
export function getImportStatusLabel(status: string): string {
  return IMPORT_STATUS_LABELS[status as ImportStatus] || status;
}

// Função para obter cor do status
export function getImportStatusColor(status: string): string {
  return IMPORT_STATUS_COLORS[status as ImportStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
}

// Função para validar se um status é válido
export function isValidImportStatus(status: string): status is ImportStatus {
  return VALID_IMPORT_STATUSES.includes(status as ImportStatus);
}

// Função para verificar se importação está ativa
export function isActiveImportStatus(status: string): boolean {
  return ACTIVE_IMPORT_STATUSES.includes(status as ImportStatus);
}

// Função para verificar se é status final
export function isFinalImportStatus(status: string): boolean {
  return FINAL_IMPORT_STATUSES.includes(status as ImportStatus);
}

// Função para verificar se é status de transporte
export function isTransportImportStatus(status: string): boolean {
  return TRANSPORT_IMPORT_STATUSES.includes(status as ImportStatus);
}