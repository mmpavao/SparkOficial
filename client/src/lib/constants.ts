/**
 * Application constants for Spark Comex platform
 */

export const APP_CONFIG = {
  name: 'Spark Comex',
  version: '1.0.0',
  description: 'Plataforma de gestão de crédito e importação para empresas brasileiras',
  supportEmail: 'suporte@sparkcomex.com.br',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  IMPORTER: 'importer',
  INACTIVE: 'inactive'
} as const;

export const CREDIT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;

export const IMPORT_STATUS = {
  PLANNING: 'planning',
  ORDERED: 'ordered',
  IN_TRANSIT: 'in_transit',
  CUSTOMS: 'customs',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'Dólar Americano (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'CNY', label: 'Yuan Chinês (CNY)', symbol: '¥' },
  { value: 'BRL', label: 'Real Brasileiro (BRL)', symbol: 'R$' }
];

export const VALIDATION_RULES = {
  cnpj: {
    minLength: 14,
    maxLength: 18, // With formatting
    pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
  },
  phone: {
    minLength: 10,
    maxLength: 15,
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  }
};

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    user: '/api/auth/user'
  },
  credit: {
    applications: '/api/credit/applications',
    status: (id: number) => `/api/credit/applications/${id}/status`
  },
  imports: {
    list: '/api/imports',
    create: '/api/imports',
    update: (id: number) => `/api/imports/${id}`
  },
  admin: {
    users: '/api/admin/users',
    creditApplications: '/api/admin/credit-applications',
    imports: '/api/admin/imports',
    userRole: (id: number) => `/api/admin/users/${id}/role`
  }
};

export const QUERY_KEYS = {
  auth: ['/api/auth/user'],
  users: ['/api/users'],
  creditApplications: ['/api/credit/applications'],
  imports: ['/api/imports'],
  suppliers: ['/api/suppliers'],
  admin: {
    users: ['/api/admin/users'],
    creditApplications: ['/api/admin/credit-applications'],
    imports: ['/api/admin/imports'],
    suppliers: ['/api/admin/suppliers']
  }
} as const;

export const brazilianStates = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" }
];

export const businessSectors = [
  { value: "agronegocio", label: "Agronegócio" },
  { value: "alimenticio", label: "Alimentício" },
  { value: "automotivo", label: "Automotivo" },
  { value: "construcao", label: "Construção Civil" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "farmaceutico", label: "Farmacêutico" },
  { value: "moda", label: "Moda e Vestuário" },
  { value: "petroleo", label: "Petróleo e Gás" },
  { value: "quimico", label: "Químico" },
  { value: "siderurgia", label: "Siderurgia" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "textil", label: "Têxtil" },
  { value: "outros", label: "Outros" }
];

export const revenueRanges = [
  { value: "ate_500k", label: "Até R$ 500.000" },
  { value: "500k_2m", label: "R$ 500.000 - R$ 2.000.000" },
  { value: "2m_10m", label: "R$ 2.000.000 - R$ 10.000.000" },
  { value: "10m_50m", label: "R$ 10.000.000 - R$ 50.000.000" },
  { value: "acima_50m", label: "Acima de R$ 50.000.000" }
];