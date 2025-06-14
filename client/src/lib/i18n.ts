/**
 * Internationalization system for Spark Comex
 * Supports Portuguese (default) and English
 */

export type Language = 'pt' | 'en';

export interface Translations {
  // Navigation and Layout
  nav: {
    dashboard: string;
    credit: string;
    imports: string;
    reports: string;
    settings: string;
    adminArea: string;
    importerArea: string;
    users: string;
    logout: string;
  };
  
  // Authentication
  auth: {
    login: string;
    register: string;
    email: string;
    password: string;
    confirmPassword: string;
    companyName: string;
    cnpj: string;
    fullName: string;
    phone: string;
    loginButton: string;
    registerButton: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    loginSuccess: string;
    registerSuccess: string;
  };
  
  // Dashboard
  dashboard: {
    welcome: string;
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    manageCreditsAndImports: string;
    totalCredit: string;
    availableCredit: string;
    totalImports: string;
    activeImports: string;
    recentApplications: string;
    recentImports: string;
    viewAll: string;
    noData: string;
  };
  
  // Credit Management
  credit: {
    title: string;
    requestCredit: string;
    requestedAmount: string;
    requestedCurrency: string;
    businessPlan: string;
    financialDocuments: string;
    expectedUsage: string;
    submitApplication: string;
    myApplications: string;
    status: {
      pending: string;
      under_review: string;
      approved: string;
      rejected: string;
      cancelled: string;
    };
    applicationSuccess: string;
  };
  
  // Import Management
  imports: {
    title: string;
    newImport: string;
    supplier: string;
    product: string;
    quantity: string;
    unitPrice: string;
    totalValue: string;
    currency: string;
    expectedDelivery: string;
    notes: string;
    submitImport: string;
    myImports: string;
    status: {
      planning: string;
      ordered: string;
      in_transit: string;
      customs: string;
      delivered: string;
      cancelled: string;
    };
    importSuccess: string;
  };
  
  // User Roles
  roles: {
    super_admin: string;
    admin: string;
    importer: string;
    inactive: string;
  };
  
  // Currency
  currency: {
    USD: string;
    EUR: string;
    CNY: string;
    BRL: string;
  };
  
  // Common
  common: {
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    view: string;
    create: string;
    update: string;
    loading: string;
    error: string;
    success: string;
    date: string;
    amount: string;
    status: string;
    actions: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    total: string;
    available: string;
    used: string;
    pending: string;
    approved: string;
    rejected: string;
    active: string;
    inactive: string;
    yes: string;
    no: string;
  };
  
  // Admin
  admin: {
    title: string;
    userManagement: string;
    createUser: string;
    editUser: string;
    deactivateUser: string;
    activateUser: string;
    changeRole: string;
    totalUsers: string;
    systemMetrics: string;
    recentActivity: string;
  };
  
  // Reports
  reports: {
    title: string;
    creditReport: string;
    importReport: string;
    userReport: string;
    financialReport: string;
    generateReport: string;
    dateRange: string;
    fromDate: string;
    toDate: string;
    reportType: string;
  };
  
  // Settings
  settings: {
    title: string;
    profile: string;
    preferences: string;
    language: string;
    notifications: string;
    security: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    updateProfile: string;
    profileUpdated: string;
  };
  
  // Validation Messages
  validation: {
    required: string;
    invalidEmail: string;
    invalidCnpj: string;
    invalidPhone: string;
    passwordMismatch: string;
    minLength: string;
    maxLength: string;
    invalidCurrency: string;
  };
  
  // Error Messages
  errors: {
    generic: string;
    networkError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    sessionExpired: string;
    loginFailed: string;
    registrationFailed: string;
  };
}

// Portuguese translations (default)
export const ptTranslations: Translations = {
  nav: {
    dashboard: 'Dashboard',
    credit: 'Crédito',
    imports: 'Importações',
    reports: 'Relatórios',
    settings: 'Configurações',
    adminArea: 'Área Admin',
    importerArea: 'Área do Importador',
    users: 'Usuários',
    logout: 'Sair',
  },
  
  auth: {
    login: 'Entrar',
    register: 'Cadastrar',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',
    companyName: 'Nome da Empresa',
    cnpj: 'CNPJ',
    fullName: 'Nome Completo',
    phone: 'Telefone',
    loginButton: 'Entrar',
    registerButton: 'Cadastrar',
    alreadyHaveAccount: 'Já tem uma conta?',
    dontHaveAccount: 'Não tem uma conta?',
    loginSuccess: 'Login realizado com sucesso!',
    registerSuccess: 'Cadastro realizado com sucesso!',
  },
  
  dashboard: {
    welcome: 'Bem-vindo',
    goodMorning: 'Bom dia',
    goodAfternoon: 'Boa tarde',
    goodEvening: 'Boa noite',
    manageCreditsAndImports: 'Gerencie seus créditos e importações da China de forma simples e eficiente.',
    totalCredit: 'Crédito Total',
    availableCredit: 'Crédito Disponível',
    totalImports: 'Total de Importações',
    activeImports: 'Importações Ativas',
    recentApplications: 'Solicitações Recentes',
    recentImports: 'Importações Recentes',
    viewAll: 'Ver Todas',
    noData: 'Nenhum dado disponível',
  },
  
  credit: {
    title: 'Gestão de Crédito',
    requestCredit: 'Solicitar Crédito',
    requestedAmount: 'Valor Solicitado',
    requestedCurrency: 'Moeda',
    businessPlan: 'Plano de Negócios',
    financialDocuments: 'Documentos Financeiros',
    expectedUsage: 'Uso Esperado',
    submitApplication: 'Enviar Solicitação',
    myApplications: 'Minhas Solicitações',
    status: {
      pending: 'Pendente',
      under_review: 'Em Análise',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
    },
    applicationSuccess: 'Solicitação de crédito enviada com sucesso!',
  },
  
  imports: {
    title: 'Gestão de Importações',
    newImport: 'Nova Importação',
    supplier: 'Fornecedor',
    product: 'Produto',
    quantity: 'Quantidade',
    unitPrice: 'Preço Unitário',
    totalValue: 'Valor Total',
    currency: 'Moeda',
    expectedDelivery: 'Entrega Prevista',
    notes: 'Observações',
    submitImport: 'Cadastrar Importação',
    myImports: 'Minhas Importações',
    status: {
      planning: 'Planejamento',
      ordered: 'Pedido Feito',
      in_transit: 'Em Trânsito',
      customs: 'Alfândega',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    },
    importSuccess: 'Importação cadastrada com sucesso!',
  },
  
  roles: {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    importer: 'Importador',
    inactive: 'Inativo',
  },
  
  currency: {
    USD: 'Dólar Americano',
    EUR: 'Euro',
    CNY: 'Yuan Chinês',
    BRL: 'Real Brasileiro',
  },
  
  common: {
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    view: 'Visualizar',
    create: 'Criar',
    update: 'Atualizar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    date: 'Data',
    amount: 'Valor',
    status: 'Status',
    actions: 'Ações',
    search: 'Pesquisar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    total: 'Total',
    available: 'Disponível',
    used: 'Usado',
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    active: 'Ativo',
    inactive: 'Inativo',
    yes: 'Sim',
    no: 'Não',
  },
  
  admin: {
    title: 'Painel Administrativo',
    userManagement: 'Gestão de Usuários',
    createUser: 'Criar Usuário',
    editUser: 'Editar Usuário',
    deactivateUser: 'Desativar Usuário',
    activateUser: 'Ativar Usuário',
    changeRole: 'Alterar Função',
    totalUsers: 'Total de Usuários',
    systemMetrics: 'Métricas do Sistema',
    recentActivity: 'Atividade Recente',
  },
  
  reports: {
    title: 'Relatórios',
    creditReport: 'Relatório de Crédito',
    importReport: 'Relatório de Importações',
    userReport: 'Relatório de Usuários',
    financialReport: 'Relatório Financeiro',
    generateReport: 'Gerar Relatório',
    dateRange: 'Período',
    fromDate: 'Data Inicial',
    toDate: 'Data Final',
    reportType: 'Tipo de Relatório',
  },
  
  settings: {
    title: 'Configurações',
    profile: 'Perfil',
    preferences: 'Preferências',
    language: 'Idioma',
    notifications: 'Notificações',
    security: 'Segurança',
    changePassword: 'Alterar Senha',
    currentPassword: 'Senha Atual',
    newPassword: 'Nova Senha',
    confirmNewPassword: 'Confirmar Nova Senha',
    updateProfile: 'Atualizar Perfil',
    profileUpdated: 'Perfil atualizado com sucesso!',
  },
  
  validation: {
    required: 'Este campo é obrigatório',
    invalidEmail: 'E-mail inválido',
    invalidCnpj: 'CNPJ inválido',
    invalidPhone: 'Telefone inválido',
    passwordMismatch: 'As senhas não coincidem',
    minLength: 'Mínimo de {0} caracteres',
    maxLength: 'Máximo de {0} caracteres',
    invalidCurrency: 'Moeda inválida',
  },
  
  errors: {
    generic: 'Ocorreu um erro inesperado',
    networkError: 'Erro de conexão',
    unauthorized: 'Não autorizado',
    forbidden: 'Acesso negado',
    notFound: 'Não encontrado',
    serverError: 'Erro interno do servidor',
    sessionExpired: 'Sessão expirada',
    loginFailed: 'Falha no login',
    registrationFailed: 'Falha no cadastro',
  },
};

// English translations
export const enTranslations: Translations = {
  nav: {
    dashboard: 'Dashboard',
    credit: 'Credit',
    imports: 'Imports',
    reports: 'Reports',
    settings: 'Settings',
    adminArea: 'Admin Area',
    importerArea: 'Importer Area',
    users: 'Users',
    logout: 'Logout',
  },
  
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    companyName: 'Company Name',
    cnpj: 'CNPJ',
    fullName: 'Full Name',
    phone: 'Phone',
    loginButton: 'Login',
    registerButton: 'Register',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',
    loginSuccess: 'Login successful!',
    registerSuccess: 'Registration successful!',
  },
  
  dashboard: {
    welcome: 'Welcome',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    manageCreditsAndImports: 'Manage your credits and imports from China simply and efficiently.',
    totalCredit: 'Total Credit',
    availableCredit: 'Available Credit',
    totalImports: 'Total Imports',
    activeImports: 'Active Imports',
    recentApplications: 'Recent Applications',
    recentImports: 'Recent Imports',
    viewAll: 'View All',
    noData: 'No data available',
  },
  
  credit: {
    title: 'Credit Management',
    requestCredit: 'Request Credit',
    requestedAmount: 'Requested Amount',
    requestedCurrency: 'Currency',
    businessPlan: 'Business Plan',
    financialDocuments: 'Financial Documents',
    expectedUsage: 'Expected Usage',
    submitApplication: 'Submit Application',
    myApplications: 'My Applications',
    status: {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    },
    applicationSuccess: 'Credit application submitted successfully!',
  },
  
  imports: {
    title: 'Import Management',
    newImport: 'New Import',
    supplier: 'Supplier',
    product: 'Product',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    totalValue: 'Total Value',
    currency: 'Currency',
    expectedDelivery: 'Expected Delivery',
    notes: 'Notes',
    submitImport: 'Submit Import',
    myImports: 'My Imports',
    status: {
      planning: 'Planning',
      ordered: 'Ordered',
      in_transit: 'In Transit',
      customs: 'Customs',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    },
    importSuccess: 'Import registered successfully!',
  },
  
  roles: {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    importer: 'Importer',
    inactive: 'Inactive',
  },
  
  currency: {
    USD: 'US Dollar',
    EUR: 'Euro',
    CNY: 'Chinese Yuan',
    BRL: 'Brazilian Real',
  },
  
  common: {
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    create: 'Create',
    update: 'Update',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    total: 'Total',
    available: 'Available',
    used: 'Used',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',
    yes: 'Yes',
    no: 'No',
  },
  
  admin: {
    title: 'Admin Panel',
    userManagement: 'User Management',
    createUser: 'Create User',
    editUser: 'Edit User',
    deactivateUser: 'Deactivate User',
    activateUser: 'Activate User',
    changeRole: 'Change Role',
    totalUsers: 'Total Users',
    systemMetrics: 'System Metrics',
    recentActivity: 'Recent Activity',
  },
  
  reports: {
    title: 'Reports',
    creditReport: 'Credit Report',
    importReport: 'Import Report',
    userReport: 'User Report',
    financialReport: 'Financial Report',
    generateReport: 'Generate Report',
    dateRange: 'Date Range',
    fromDate: 'From Date',
    toDate: 'To Date',
    reportType: 'Report Type',
  },
  
  settings: {
    title: 'Settings',
    profile: 'Profile',
    preferences: 'Preferences',
    language: 'Language',
    notifications: 'Notifications',
    security: 'Security',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updateProfile: 'Update Profile',
    profileUpdated: 'Profile updated successfully!',
  },
  
  validation: {
    required: 'This field is required',
    invalidEmail: 'Invalid email',
    invalidCnpj: 'Invalid CNPJ',
    invalidPhone: 'Invalid phone',
    passwordMismatch: 'Passwords do not match',
    minLength: 'Minimum {0} characters',
    maxLength: 'Maximum {0} characters',
    invalidCurrency: 'Invalid currency',
  },
  
  errors: {
    generic: 'An unexpected error occurred',
    networkError: 'Connection error',
    unauthorized: 'Unauthorized',
    forbidden: 'Access denied',
    notFound: 'Not found',
    serverError: 'Internal server error',
    sessionExpired: 'Session expired',
    loginFailed: 'Login failed',
    registrationFailed: 'Registration failed',
  },
};

// Translation collections
export const translations: Record<Language, Translations> = {
  pt: ptTranslations,
  en: enTranslations,
};

// Get current language from localStorage or default to Portuguese
export const getCurrentLanguage = (): Language => {
  if (typeof window === 'undefined') return 'pt';
  return (localStorage.getItem('spark-comex-language') as Language) || 'pt';
};

// Set language and persist in localStorage
export const setLanguage = (language: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('spark-comex-language', language);
  }
};

// Get translation by key with fallback
export const getTranslation = (key: string, language?: Language): string => {
  const lang = language || getCurrentLanguage();
  const t = translations[lang];
  
  // Navigate through nested keys (e.g., 'auth.login')
  const keys = key.split('.');
  let value: any = t;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  // Fallback to Portuguese if translation not found
  if (value === undefined && lang !== 'pt') {
    return getTranslation(key, 'pt');
  }
  
  return value || key;
};

// Format translation with parameters
export const formatTranslation = (key: string, params: (string | number)[], language?: Language): string => {
  let translation = getTranslation(key, language);
  
  params.forEach((param, index) => {
    translation = translation.replace(`{${index}}`, String(param));
  });
  
  return translation;
};