// Status centralizados para importações - Portuguese workflow
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

export type ImportStatus = typeof IMPORT_STATUS[keyof typeof IMPORT_STATUS];

// Labels em português para os status
export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  [IMPORT_STATUS.PLANEJAMENTO]: "Planejamento",
  [IMPORT_STATUS.PRODUCAO]: "Produção",
  [IMPORT_STATUS.ENTREGUE_AGENTE]: "Entregue ao Agente",
  [IMPORT_STATUS.TRANSPORTE_MARITIMO]: "Transporte Marítimo",
  [IMPORT_STATUS.TRANSPORTE_AEREO]: "Transporte Aéreo",
  [IMPORT_STATUS.DESEMBARACO]: "Desembaraço",
  [IMPORT_STATUS.TRANSPORTE_NACIONAL]: "Transporte Nacional",
  [IMPORT_STATUS.CONCLUIDO]: "Concluído",
  [IMPORT_STATUS.CANCELADO]: "Cancelado"
};

// Cores para os status
export const IMPORT_STATUS_COLORS: Record<ImportStatus, string> = {
  [IMPORT_STATUS.PLANEJAMENTO]: "bg-blue-100 text-blue-800 border-blue-200",
  [IMPORT_STATUS.PRODUCAO]: "bg-orange-100 text-orange-800 border-orange-200",
  [IMPORT_STATUS.ENTREGUE_AGENTE]: "bg-purple-100 text-purple-800 border-purple-200",
  [IMPORT_STATUS.TRANSPORTE_MARITIMO]: "bg-cyan-100 text-cyan-800 border-cyan-200",
  [IMPORT_STATUS.TRANSPORTE_AEREO]: "bg-sky-100 text-sky-800 border-sky-200",
  [IMPORT_STATUS.DESEMBARACO]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [IMPORT_STATUS.TRANSPORTE_NACIONAL]: "bg-indigo-100 text-indigo-800 border-indigo-200",
  [IMPORT_STATUS.CONCLUIDO]: "bg-green-100 text-green-800 border-green-200",
  [IMPORT_STATUS.CANCELADO]: "bg-red-100 text-red-800 border-red-200"
};

// Função para obter o label do status
export function getImportStatusLabel(status: string): string {
  return IMPORT_STATUS_LABELS[status as ImportStatus] || status;
}

// Função para obter a cor do status
export function getImportStatusColor(status: string): string {
  return IMPORT_STATUS_COLORS[status as ImportStatus] || "bg-gray-100 text-gray-800 border-gray-200";
}

// Lista de status válidos
export const VALID_IMPORT_STATUSES = Object.values(IMPORT_STATUS);

// Status ativos (não finalizados)
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

// Status de transporte
export const TRANSPORT_IMPORT_STATUSES = [
  IMPORT_STATUS.TRANSPORTE_MARITIMO,
  IMPORT_STATUS.TRANSPORTE_AEREO,
  IMPORT_STATUS.TRANSPORTE_NACIONAL
];

// Funções de validação
export function isValidImportStatus(status: string): status is ImportStatus {
  return VALID_IMPORT_STATUSES.includes(status as ImportStatus);
}

export function isActiveImportStatus(status: string): boolean {
  return ACTIVE_IMPORT_STATUSES.includes(status as ImportStatus);
}

export function isFinalImportStatus(status: string): boolean {
  return FINAL_IMPORT_STATUSES.includes(status as ImportStatus);
}

export function isTransportImportStatus(status: string): boolean {
  return TRANSPORT_IMPORT_STATUSES.includes(status as ImportStatus);
}

// Função para obter status baseado no shipping method
export function getTransportStatusForShippingMethod(shippingMethod: string): ImportStatus {
  if (shippingMethod === 'air') {
    return IMPORT_STATUS.TRANSPORTE_AEREO;
  } else if (shippingMethod === 'sea') {
    return IMPORT_STATUS.TRANSPORTE_MARITIMO;
  }
  // Default para marítimo se não especificado
  return IMPORT_STATUS.TRANSPORTE_MARITIMO;
}

// Função para obter lista de status dinâmica baseada no shipping method
export function getImportStatusLabelsForShippingMethod(shippingMethod: string): Record<string, string> {
  const transportStatus = getTransportStatusForShippingMethod(shippingMethod);
  const transportLabel = shippingMethod === 'air' ? 'Transporte Aéreo' : 'Transporte Marítimo';
  
  return {
    [IMPORT_STATUS.PLANEJAMENTO]: "Planejamento",
    [IMPORT_STATUS.PRODUCAO]: "Produção",
    [IMPORT_STATUS.ENTREGUE_AGENTE]: "Entregue ao Agente",
    [transportStatus]: transportLabel,
    [IMPORT_STATUS.DESEMBARACO]: "Desembaraço", 
    [IMPORT_STATUS.TRANSPORTE_NACIONAL]: "Transporte Nacional",
    [IMPORT_STATUS.CONCLUIDO]: "Concluído",
    [IMPORT_STATUS.CANCELADO]: "Cancelado"
  };
}