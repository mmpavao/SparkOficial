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
    sparkcomex: string;
    carregando: string;
    acoes: string;
    close: string;
    erro: string;
    queryfunction: string;
    usuariocriadocomsuce: string;
    erroaocriarusuario: string;
    roledousuarioatualiz: string;
    erroaoatualizarroled: string;
    usuariodesativadocom: string;
    erroaodesativarusuar: string;
    bemvindodevoltaaspar: string;
    bemvindoasparkcomex: string;
    suanovaimportacaofoi: string;
    erroaocriarimportaca: string;
    orelatoriofoigeradoe: string;
    suasinformacoesforam: string;
    erroaoatualizarperfi: string;
    suapreferenciadenoti: string;
    suaconfiguracaodeseg: string;
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
    sparkcomex: 'Spark Comex',
    carregando: 'Carregando...',
    acoes: 'Ações',
    close: 'Fechar',
    erro: 'Erro',
    queryfunction: 'QueryFunction',
    usuariocriadocomsuce: 'Usuário criado com sucesso',
    erroaocriarusuario: 'Erro ao criar usuário',
    roledousuarioatualiz: 'Role do usuário atualizada com sucesso',
    erroaoatualizarroled: 'Erro ao atualizar role do usuário',
    usuariodesativadocom: 'Usuário desativado com sucesso',
    erroaodesativarusuar: 'Erro ao desativar usuário',
    bemvindodevoltaaspar: 'Bem-vindo de volta à Spark Comex.',
    bemvindoasparkcomex: 'Bem-vindo à Spark Comex.',
    suanovaimportacaofoi: 'Sua nova importação foi registrada com sucesso.',
    erroaocriarimportaca: 'Erro ao criar importação',
    orelatoriofoigeradoe: 'O relatório foi gerado e está sendo baixado.',
    suasinformacoesforam: 'Suas informações foram salvas com sucesso.',
    erroaoatualizarperfi: 'Erro ao atualizar perfil.',
    suapreferenciadenoti: 'Sua preferência de notificação foi atualizada.',
    suaconfiguracaodeseg: 'Sua configuração de segurança foi salva.',
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

// English translations
const enTranslations: Translations = {
  ...ptTranslations,
  common: {
    ...ptTranslations.common,
    sparkcomex: 'Spark Comex',
    carregando: 'Loading...',
    acoes: 'Actions',
    close: 'Close',
    erro: 'Error',
    queryfunction: 'QueryFunction',
    usuariocriadocomsuce: 'User created successfully',
    erroaocriarusuario: 'Error creating user',
    roledousuarioatualiz: 'User role updated successfully',
    erroaoatualizarroled: 'Error updating user role',
    usuariodesativadocom: 'User deactivated successfully',
    erroaodesativarusuar: 'Error deactivating user',
    bemvindodevoltaaspar: 'Welcome back to Spark Comex.',
    bemvindoasparkcomex: 'Welcome to Spark Comex.',
    suanovaimportacaofoi: 'Your new import has been registered successfully.',
    erroaocriarimportaca: 'Error creating import',
    orelatoriofoigeradoe: 'The report has been generated and is being downloaded.',
    suasinformacoesforam: 'Your information has been saved successfully.',
    erroaoatualizarperfi: 'Error updating profile.',
    suapreferenciadenoti: 'Your notification preference has been updated.',
    suaconfiguracaodeseg: 'Your security configuration has been saved.',
  }
};

// Chinese translations
const zhTranslations: Translations = {
  ...ptTranslations,
  common: {
    ...ptTranslations.common,
    sparkcomex: 'Spark Comex',
    carregando: '正在加载...',
    acoes: '操作',
    close: '关闭',
    erro: '错误',
    queryfunction: 'QueryFunction',
    usuariocriadocomsuce: '用户创建成功',
    erroaocriarusuario: '创建用户时出错',
    roledousuarioatualiz: '用户角色更新成功',
    erroaoatualizarroled: '更新用户角色时出错',
    usuariodesativadocom: '用户停用成功',
    erroaodesativarusuar: '停用用户时出错',
    bemvindodevoltaaspar: '欢迎回到 Spark Comex。',
    bemvindoasparkcomex: '欢迎来到 Spark Comex。',
    suanovaimportacaofoi: '您的新进口已成功注册。',
    erroaocriarimportaca: '创建进口时出错',
    orelatoriofoigeradoe: '报告已生成并正在下载。',
    suasinformacoesforam: '您的信息已成功保存。',
    erroaoatualizarperfi: '更新个人资料时出错。',
    suapreferenciadenoti: '您的通知偏好已更新。',
    suaconfiguracaodeseg: '您的安全配置已保存。',
  }
};

// Spanish translations
const esTranslations: Translations = {
  ...ptTranslations,
  common: {
    ...ptTranslations.common,
    sparkcomex: 'Spark Comex',
    carregando: 'Cargando...',
    acoes: 'Acciones',
    close: 'Cerrar',
    erro: 'Error',
    queryfunction: 'QueryFunction',
    usuariocriadocomsuce: 'Usuario creado exitosamente',
    erroaocriarusuario: 'Error al crear usuario',
    roledousuarioatualiz: 'Rol de usuario actualizado exitosamente',
    erroaoatualizarroled: 'Error al actualizar rol de usuario',
    usuariodesativadocom: 'Usuario desactivado exitosamente',
    erroaodesativarusuar: 'Error al desactivar usuario',
    bemvindodevoltaaspar: 'Bienvenido de vuelta a Spark Comex.',
    bemvindoasparkcomex: 'Bienvenido a Spark Comex.',
    suanovaimportacaofoi: 'Su nueva importación ha sido registrada exitosamente.',
    erroaocriarimportaca: 'Error al crear importación',
    orelatoriofoigeradoe: 'El reporte ha sido generado y se está descargando.',
    suasinformacoesforam: 'Su información ha sido guardada exitosamente.',
    erroaoatualizarperfi: 'Error al actualizar perfil.',
    suapreferenciadenoti: 'Su preferencia de notificación ha sido actualizada.',
    suaconfiguracaodeseg: 'Su configuración de seguridad ha sido guardada.',
  }
};

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