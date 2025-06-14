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
  auth: ['auth', 'user'],
  users: ['users'],
  creditApplications: ['credit', 'applications'],
  imports: ['imports'],
  admin: {
    users: ['admin', 'users'],
    creditApplications: ['admin', 'credit-applications'],
    imports: ['admin', 'imports']
  }
} as const;