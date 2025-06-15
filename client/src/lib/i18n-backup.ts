import { createContext, useContext } from 'react';

// Define the complete type structure
export interface Translations {
  // Navigation
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

  // Common UI elements
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
  };

  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    creditSummary: string;
    recentImports: string;
    quickActions: string;
    metrics: string;
  };

  // Credit management
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
  };

  // Import management
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
    download: string;
    preview: string;
    customReport: string;
    scheduledReports: string;
    weeklyReports: string;
    selectReport: string;
  };

  // Settings
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

  // Auth
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

  // Error messages
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

  // Success messages
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

// Portuguese translations
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
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Bem-vindo',
    creditSummary: 'Resumo de Crédito',
    recentImports: 'Importações Recentes',
    quickActions: 'Ações Rápidas',
    metrics: 'Métricas',
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
  navigation: {
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
  common: {
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    create: 'Create',
    update: 'Update',
    loading: 'Loading',
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
    all: 'All',
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
    creditSummary: 'Credit Summary',
    recentImports: 'Recent Imports',
    quickActions: 'Quick Actions',
    metrics: 'Metrics',
  },
  credit: {
    title: 'Credit Management',
    application: 'Application',
    applications: 'Applications',
    limit: 'Limit',
    available: 'Available',
    used: 'Used',
    requestedAmount: 'Requested Amount',
    purpose: 'Purpose',
    status: 'Status',
    applyForCredit: 'Apply for Credit',
    viewDetails: 'View Details',
  },
  imports: {
    title: 'Import Management',
    addNew: 'New Import',
    productDescription: 'Product Description',
    supplier: 'Supplier',
    value: 'Value',
    currency: 'Currency',
    location: 'Location',
    estimatedDate: 'Estimated Date',
    status: 'Status',
    tracking: 'Tracking',
    details: 'Details',
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
    download: 'Download',
    preview: 'Preview',
    customReport: 'Custom Report',
    scheduledReports: 'Scheduled Reports',
    weeklyReports: 'Weekly Reports',
    selectReport: 'Select Report',
  },
  settings: {
    title: 'Settings',
    profile: 'Profile',
    notifications: 'Notifications',
    security: 'Security',
    billing: 'Billing',
    language: 'Language',
    preferences: 'Preferences',
    account: 'Account',
    privacy: 'Privacy',
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
    forgotPassword: 'Forgot Password',
    rememberMe: 'Remember Me',
    welcomeBack: 'Welcome Back',
    welcome: 'Welcome',
    signUp: 'Sign Up',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
  },
  errors: {
    generic: 'An unexpected error occurred',
    networkError: 'Network error',
    unauthorized: 'Unauthorized',
    forbidden: 'Access denied',
    notFound: 'Not found',
    serverError: 'Server error',
    sessionExpired: 'Session expired',
    loginFailed: 'Login failed',
    registrationFailed: 'Registration failed',
  },
  success: {
    loginSuccess: 'Login successful',
    registrationSuccess: 'Registration successful',
    profileUpdated: 'Profile updated successfully',
    settingsSaved: 'Settings saved successfully',
    applicationSubmitted: 'Application submitted successfully',
    importCreated: 'Import created successfully',
    reportGenerated: 'Report generated successfully',
  },
};

// Chinese translations
const zhTranslations: Translations = {
  navigation: {
    dashboard: '仪表板',
    credit: '信贷',
    imports: '进口',
    reports: '报告',
    settings: '设置',
    adminArea: '管理区',
    importerArea: '进口商区',
    users: '用户',
    logout: '登出',
  },
  common: {
    save: '保存',
    cancel: '取消',
    edit: '编辑',
    delete: '删除',
    view: '查看',
    create: '创建',
    update: '更新',
    loading: '加载中',
    error: '错误',
    success: '成功',
    date: '日期',
    amount: '金额',
    status: '状态',
    actions: '操作',
    search: '搜索',
    filter: '筛选',
    export: '导出',
    import: '导入',
    total: '总计',
    available: '可用',
    used: '已使用',
    pending: '待处理',
    approved: '已批准',
    rejected: '已拒绝',
    active: '活跃',
    inactive: '不活跃',
    yes: '是',
    no: '否',
    all: '全部',
  },
  dashboard: {
    title: '仪表板',
    welcome: '欢迎',
    creditSummary: '信贷摘要',
    recentImports: '最近进口',
    quickActions: '快速操作',
    metrics: '指标',
  },
  credit: {
    title: '信贷管理',
    application: '申请',
    applications: '申请',
    limit: '限额',
    available: '可用',
    used: '已使用',
    requestedAmount: '申请金额',
    purpose: '用途',
    status: '状态',
    applyForCredit: '申请信贷',
    viewDetails: '查看详情',
  },
  imports: {
    title: '进口管理',
    addNew: '新进口',
    productDescription: '产品描述',
    supplier: '供应商',
    value: '价值',
    currency: '货币',
    location: '位置',
    estimatedDate: '预计日期',
    status: '状态',
    tracking: '追踪',
    details: '详情',
  },
  reports: {
    title: '报告',
    creditReport: '信贷报告',
    importReport: '进口报告',
    userReport: '用户报告',
    financialReport: '财务报告',
    generateReport: '生成报告',
    dateRange: '日期范围',
    fromDate: '开始日期',
    toDate: '结束日期',
    reportType: '报告类型',
    download: '下载',
    preview: '预览',
    customReport: '自定义报告',
    scheduledReports: '定时报告',
    weeklyReports: '周报',
    selectReport: '选择报告',
  },
  settings: {
    title: '设置',
    profile: '个人资料',
    notifications: '通知',
    security: '安全',
    billing: '账单',
    language: '语言',
    preferences: '偏好',
    account: '账户',
    privacy: '隐私',
  },
  auth: {
    login: '登录',
    register: '注册',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    companyName: '公司名称',
    cnpj: 'CNPJ',
    fullName: '全名',
    phone: '电话',
    loginButton: '登录',
    registerButton: '注册',
    forgotPassword: '忘记密码',
    rememberMe: '记住我',
    welcomeBack: '欢迎回来',
    welcome: '欢迎',
    signUp: '注册',
    alreadyHaveAccount: '已有账户？',
    dontHaveAccount: '没有账户？',
  },
  errors: {
    generic: '发生意外错误',
    networkError: '网络错误',
    unauthorized: '未授权',
    forbidden: '访问被拒绝',
    notFound: '未找到',
    serverError: '服务器错误',
    sessionExpired: '会话已过期',
    loginFailed: '登录失败',
    registrationFailed: '注册失败',
  },
  success: {
    loginSuccess: '登录成功',
    registrationSuccess: '注册成功',
    profileUpdated: '个人资料更新成功',
    settingsSaved: '设置保存成功',
    applicationSubmitted: '申请提交成功',
    importCreated: '进口创建成功',
    reportGenerated: '报告生成成功',
  },
};

// Spanish translations
const esTranslations: Translations = {
  navigation: {
    dashboard: 'Panel',
    credit: 'Crédito',
    imports: 'Importaciones',
    reports: 'Informes',
    settings: 'Configuración',
    adminArea: 'Área Admin',
    importerArea: 'Área Importador',
    users: 'Usuarios',
    logout: 'Cerrar Sesión',
  },
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    view: 'Ver',
    create: 'Crear',
    update: 'Actualizar',
    loading: 'Cargando',
    error: 'Error',
    success: 'Éxito',
    date: 'Fecha',
    amount: 'Cantidad',
    status: 'Estado',
    actions: 'Acciones',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    total: 'Total',
    available: 'Disponible',
    used: 'Usado',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    active: 'Activo',
    inactive: 'Inactivo',
    yes: 'Sí',
    no: 'No',
    all: 'Todo',
  },
  dashboard: {
    title: 'Panel',
    welcome: 'Bienvenido',
    creditSummary: 'Resumen de Crédito',
    recentImports: 'Importaciones Recientes',
    quickActions: 'Acciones Rápidas',
    metrics: 'Métricas',
  },
  credit: {
    title: 'Gestión de Crédito',
    application: 'Solicitud',
    applications: 'Solicitudes',
    limit: 'Límite',
    available: 'Disponible',
    used: 'Usado',
    requestedAmount: 'Cantidad Solicitada',
    purpose: 'Propósito',
    status: 'Estado',
    applyForCredit: 'Solicitar Crédito',
    viewDetails: 'Ver Detalles',
  },
  imports: {
    title: 'Gestión de Importaciones',
    addNew: 'Nueva Importación',
    productDescription: 'Descripción del Producto',
    supplier: 'Proveedor',
    value: 'Valor',
    currency: 'Moneda',
    location: 'Ubicación',
    estimatedDate: 'Fecha Estimada',
    status: 'Estado',
    tracking: 'Seguimiento',
    details: 'Detalles',
  },
  reports: {
    title: 'Informes',
    creditReport: 'Informe de Crédito',
    importReport: 'Informe de Importaciones',
    userReport: 'Informe de Usuarios',
    financialReport: 'Informe Financiero',
    generateReport: 'Generar Informe',
    dateRange: 'Rango de Fechas',
    fromDate: 'Fecha Desde',
    toDate: 'Fecha Hasta',
    reportType: 'Tipo de Informe',
    download: 'Descargar',
    preview: 'Vista Previa',
    customReport: 'Informe Personalizado',
    scheduledReports: 'Informes Programados',
    weeklyReports: 'Informes Semanales',
    selectReport: 'Seleccionar Informe',
  },
  settings: {
    title: 'Configuración',
    profile: 'Perfil',
    notifications: 'Notificaciones',
    security: 'Seguridad',
    billing: 'Facturación',
    language: 'Idioma',
    preferences: 'Preferencias',
    account: 'Cuenta',
    privacy: 'Privacidad',
  },
  auth: {
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    email: 'Correo',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    companyName: 'Nombre de la Empresa',
    cnpj: 'CNPJ',
    fullName: 'Nombre Completo',
    phone: 'Teléfono',
    loginButton: 'Iniciar Sesión',
    registerButton: 'Registrarse',
    forgotPassword: 'Olvidé mi Contraseña',
    rememberMe: 'Recordarme',
    welcomeBack: 'Bienvenido de Vuelta',
    welcome: 'Bienvenido',
    signUp: 'Registrarse',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
  },
  errors: {
    generic: 'Ocurrió un error inesperado',
    networkError: 'Error de red',
    unauthorized: 'No autorizado',
    forbidden: 'Acceso denegado',
    notFound: 'No encontrado',
    serverError: 'Error del servidor',
    sessionExpired: 'Sesión expirada',
    loginFailed: 'Error en el inicio de sesión',
    registrationFailed: 'Error en el registro',
  },
  success: {
    loginSuccess: 'Inicio de sesión exitoso',
    registrationSuccess: 'Registro exitoso',
    profileUpdated: 'Perfil actualizado con éxito',
    settingsSaved: 'Configuración guardada con éxito',
    applicationSubmitted: 'Solicitud enviada con éxito',
    importCreated: 'Importación creada con éxito',
    reportGenerated: 'Informe generado con éxito',
  },
};

// Available translations
const translations = {
  pt: ptTranslations,
  en: enTranslations,
  zh: zhTranslations,
  es: esTranslations,
};

export type Language = keyof typeof translations;

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