import { createContext, useContext } from 'react';

// Simplified translation structure to get the app working
export interface Translations {
  navigation: {
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
    all: string;
    smartphonessamsung: string;
    shenzhensantos: string;
    emtransito: string;
    componenteseletronic: string;
    beijingsaopaulo: string;
    alfandega: string;
  };
  dashboard: {
    title: string;
    welcome: string;
    creditSummary: string;
    recentImports: string;
    quickActions: string;
    metrics: string;
    manageCreditsAndImports: string;
    availableCredit: string;
    activeImports: string;
    totalImports: string;
  };
  credit: {
    title: string;
    application: string;
    applications: string;
    limit: string;
    available: string;
    used: string;
    requestedAmount: string;
    purpose: string;
    status: string;
    applyForCredit: string;
    viewDetails: string;
    requestCredit: string;
  };
  imports: {
    title: string;
    addNew: string;
    productDescription: string;
    supplier: string;
    value: string;
    currency: string;
    location: string;
    estimatedDate: string;
    status: string;
    tracking: string;
    details: string;
    newImport: string;
  };
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
    download: string;
    preview: string;
    customReport: string;
    scheduledReports: string;
    weeklyReports: string;
    selectReport: string;
  };
  settings: {
    title: string;
    profile: string;
    notifications: string;
    security: string;
    billing: string;
    language: string;
    preferences: string;
    account: string;
    privacy: string;
  };
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
    forgotPassword: string;
    rememberMe: string;
    welcomeBack: string;
    welcome: string;
    signUp: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
  };
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
  success: {
    loginSuccess: string;
    registrationSuccess: string;
    profileUpdated: string;
    settingsSaved: string;
    applicationSubmitted: string;
    importCreated: string;
    reportGenerated: string;
  };
}

// Portuguese translations (main language)
const ptTranslations: Translations = {
  navigation: {
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
  common: {
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    view: 'Visualizar',
    create: 'Criar',
    update: 'Atualizar',
    loading: 'Carregando',
    error: 'Erro',
    success: 'Sucesso',
    date: 'Data',
    amount: 'Valor',
    status: 'Status',
    actions: 'Ações',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    total: 'Total',
    available: 'Disponível',
    used: 'Utilizado',
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    active: 'Ativo',
    inactive: 'Inativo',
    yes: 'Sim',
    no: 'Não',
    all: 'Todos',
    smartphonessamsung: 'Smartphones Samsung',
    shenzhensantos: 'Shenzhen → Santos',
    emtransito: 'Em trânsito',
    componenteseletronic: 'Componentes Eletrônicos',
    beijingsaopaulo: 'Beijing → São Paulo',
    alfandega: 'Alfândega',
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Bem-vindo',
    creditSummary: 'Resumo de Crédito',
    recentImports: 'Importações Recentes',
    quickActions: 'Ações Rápidas',
    metrics: 'Métricas',
    manageCreditsAndImports: 'Gerencie seus créditos e importações',
    availableCredit: 'Crédito Disponível',
    activeImports: 'Importações Ativas',
    totalImports: 'Total de Importações',
  },
  credit: {
    title: 'Gerenciamento de Crédito',
    application: 'Solicitação',
    applications: 'Solicitações',
    limit: 'Limite',
    available: 'Disponível',
    used: 'Utilizado',
    requestedAmount: 'Valor Solicitado',
    purpose: 'Finalidade',
    status: 'Status',
    applyForCredit: 'Solicitar Crédito',
    viewDetails: 'Ver Detalhes',
    requestCredit: 'Solicitar Crédito',
  },
  imports: {
    title: 'Gerenciamento de Importações',
    addNew: 'Nova Importação',
    productDescription: 'Descrição do Produto',
    supplier: 'Fornecedor',
    value: 'Valor',
    currency: 'Moeda',
    location: 'Localização',
    estimatedDate: 'Data Estimada',
    status: 'Status',
    tracking: 'Rastreamento',
    details: 'Detalhes',
    newImport: 'Nova Importação',
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
    download: 'Baixar',
    preview: 'Visualizar',
    customReport: 'Relatório Personalizado',
    scheduledReports: 'Relatórios Agendados',
    weeklyReports: 'Relatórios Semanais',
    selectReport: 'Selecionar Relatório',
  },
  settings: {
    title: 'Configurações',
    profile: 'Perfil',
    notifications: 'Notificações',
    security: 'Segurança',
    billing: 'Faturamento',
    language: 'Idioma',
    preferences: 'Preferências',
    account: 'Conta',
    privacy: 'Privacidade',
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
    forgotPassword: 'Esqueci a Senha',
    rememberMe: 'Lembrar de Mim',
    welcomeBack: 'Bem-vindo de volta',
    welcome: 'Bem-vindo',
    signUp: 'Criar Conta',
    alreadyHaveAccount: 'Já tem uma conta?',
    dontHaveAccount: 'Não tem uma conta?',
  },
  errors: {
    generic: 'Ocorreu um erro inesperado',
    networkError: 'Erro de conexão',
    unauthorized: 'Não autorizado',
    forbidden: 'Acesso negado',
    notFound: 'Não encontrado',
    serverError: 'Erro do servidor',
    sessionExpired: 'Sessão expirada',
    loginFailed: 'Falha no login',
    registrationFailed: 'Falha no cadastro',
  },
  success: {
    loginSuccess: 'Login realizado com sucesso',
    registrationSuccess: 'Cadastro realizado com sucesso',
    profileUpdated: 'Perfil atualizado com sucesso',
    settingsSaved: 'Configurações salvas com sucesso',
    applicationSubmitted: 'Solicitação enviada com sucesso',
    importCreated: 'Importação criada com sucesso',
    reportGenerated: 'Relatório gerado com sucesso',
  },
};

// Copy Portuguese for other languages temporarily to get app working
const enTranslations: Translations = { ...ptTranslations };
const zhTranslations: Translations = { ...ptTranslations };
const esTranslations: Translations = { ...ptTranslations };

// Available translations
const translations = {
  pt: ptTranslations,
  en: enTranslations,
  zh: zhTranslations,
  es: esTranslations,
};

export type Language = keyof typeof translations;

// Language management functions
export const getCurrentLanguage = (): Language => {
  if (typeof window === 'undefined') return 'pt';
  
  const saved = localStorage.getItem('spark-comex-language');
  if (saved && saved in translations) {
    return saved as Language;
  }
  
  return 'pt'; // Default to Portuguese
};

export const setLanguage = (lang: Language): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('spark-comex-language', lang);
};

// Create context
export const I18nContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}>({
  language: 'pt',
  setLanguage: () => {},
  t: ptTranslations,
});

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export { translations };