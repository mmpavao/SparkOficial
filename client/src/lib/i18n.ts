/**
 * Internationalization system for Spark Comex
 * Supports Portuguese (default), English, Simplified Chinese, and Spanish
 */

export type Language = 'pt' | 'en' | 'zh' | 'es';

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
    welcomeBack: string;
    loginDescription: string;
    platformDescription: string;
    secure: string;
    fast: string;
    efficient: string;
    rememberMe: string;
    forgotPassword: string;
    signIn: string;
    signingIn: string;
    createAccount: string;
    createAccountDescription: string;
    acceptTerms: string;
    termsOfUse: string;
    privacyPolicy: string;
    creatingAccount: string;
    haveAccount: string;
    signInNow: string;
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
    applicationSent: string;
    applicationError: string;
    purpose: string;
    notes: string;
    newApplication: string;
    cancel: string;
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

  // Not Found Page
  notFound: {
    title: string;
    message: string;
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
    welcomeBack: 'Bem-vindo de volta',
    loginDescription: 'Entre em sua conta para continuar',
    platformDescription: 'Plataforma completa de crédito e importação para empresários brasileiros que importam da China',
    secure: 'Seguro',
    fast: 'Rápido',
    efficient: 'Eficiente',
    rememberMe: 'Lembrar-me',
    forgotPassword: 'Esqueceu a senha?',
    signIn: 'Entrar',
    signingIn: 'Entrando...',
    createAccount: 'Criar conta',
    createAccountDescription: 'Cadastre sua empresa na plataforma',
    acceptTerms: 'Aceito os',
    termsOfUse: 'Termos de Uso',
    privacyPolicy: 'Política de Privacidade',
    creatingAccount: 'Criando conta...',
    haveAccount: 'Já tem uma conta?',
    signInNow: 'Faça login',
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

  notFound: {
    title: '404 - Página Não Encontrada',
    message: 'A página que você está procurando não existe ou foi movida.',
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
    welcomeBack: 'Welcome back',
    loginDescription: 'Sign in to your account to continue',
    platformDescription: 'Complete credit and import platform for Brazilian entrepreneurs importing from China',
    secure: 'Secure',
    fast: 'Fast',
    efficient: 'Efficient',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    createAccount: 'Create account',
    createAccountDescription: 'Register your company on the platform',
    acceptTerms: 'I accept the',
    termsOfUse: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    creatingAccount: 'Creating account...',
    haveAccount: 'Already have an account?',
    signInNow: 'Sign in now',
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

  notFound: {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist or has been moved.',
  },
};

// Chinese translations (Simplified Mandarin)
export const zhTranslations: Translations = {
  nav: {
    dashboard: '仪表板',
    credit: '信贷',
    imports: '进口',
    reports: '报告',
    settings: '设置',
    adminArea: '管理区',
    importerArea: '进口商区',
    users: '用户',
    logout: '注销',
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
    alreadyHaveAccount: '已有账户？',
    dontHaveAccount: '没有账户？',
    loginSuccess: '登录成功！',
    registerSuccess: '注册成功！',
    welcomeBack: '欢迎回来',
    loginDescription: '登录您的账户以继续',
    platformDescription: '为从中国进口的巴西企业家提供的完整信贷和进口平台',
    secure: '安全',
    fast: '快速',
    efficient: '高效',
    rememberMe: '记住我',
    forgotPassword: '忘记密码？',
    signIn: '登录',
    signingIn: '登录中...',
    createAccount: '创建账户',
    createAccountDescription: '在平台上注册您的公司',
    acceptTerms: '我接受',
    termsOfUse: '使用条款',
    privacyPolicy: '隐私政策',
    creatingAccount: '创建账户中...',
    haveAccount: '已有账户？',
    signInNow: '立即登录',
  },
  
  dashboard: {
    welcome: '欢迎',
    goodMorning: '早上好',
    goodAfternoon: '下午好',
    goodEvening: '晚上好',
    manageCreditsAndImports: '简单高效地管理您的信贷和中国进口业务。',
    totalCredit: '总信贷',
    availableCredit: '可用信贷',
    totalImports: '总进口',
    activeImports: '活跃进口',
    recentApplications: '最近申请',
    recentImports: '最近进口',
    viewAll: '查看全部',
    noData: '暂无数据',
  },
  
  credit: {
    title: '信贷管理',
    requestCredit: '申请信贷',
    requestedAmount: '申请金额',
    requestedCurrency: '货币',
    businessPlan: '商业计划',
    financialDocuments: '财务文件',
    expectedUsage: '预期用途',
    submitApplication: '提交申请',
    myApplications: '我的申请',
    status: {
      pending: '待处理',
      under_review: '审核中',
      approved: '已批准',
      rejected: '已拒绝',
      cancelled: '已取消',
    },
    applicationSuccess: '信贷申请提交成功！',
  },
  
  imports: {
    title: '进口管理',
    newImport: '新进口',
    supplier: '供应商',
    product: '产品',
    quantity: '数量',
    unitPrice: '单价',
    totalValue: '总价值',
    currency: '货币',
    expectedDelivery: '预计交付',
    notes: '备注',
    submitImport: '提交进口',
    myImports: '我的进口',
    status: {
      planning: '计划中',
      ordered: '已下单',
      in_transit: '运输中',
      customs: '海关',
      delivered: '已交付',
      cancelled: '已取消',
    },
    importSuccess: '进口记录成功！',
  },
  
  roles: {
    super_admin: '超级管理员',
    admin: '管理员',
    importer: '进口商',
    inactive: '未激活',
  },
  
  currency: {
    USD: '美元',
    EUR: '欧元',
    CNY: '人民币',
    BRL: '巴西雷亚尔',
  },
  
  common: {
    save: '保存',
    cancel: '取消',
    edit: '编辑',
    delete: '删除',
    view: '查看',
    create: '创建',
    update: '更新',
    loading: '加载中...',
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
    inactive: '未激活',
    yes: '是',
    no: '否',
  },
  
  admin: {
    title: '管理面板',
    userManagement: '用户管理',
    createUser: '创建用户',
    editUser: '编辑用户',
    deactivateUser: '停用用户',
    activateUser: '激活用户',
    changeRole: '更改角色',
    totalUsers: '总用户数',
    systemMetrics: '系统指标',
    recentActivity: '最近活动',
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
  },
  
  settings: {
    title: '设置',
    profile: '个人资料',
    preferences: '偏好设置',
    language: '语言',
    notifications: '通知',
    security: '安全',
    changePassword: '更改密码',
    currentPassword: '当前密码',
    newPassword: '新密码',
    confirmNewPassword: '确认新密码',
    updateProfile: '更新个人资料',
    profileUpdated: '个人资料更新成功！',
  },
  
  validation: {
    required: '此字段为必填项',
    invalidEmail: '邮箱格式无效',
    invalidCnpj: 'CNPJ格式无效',
    invalidPhone: '电话格式无效',
    passwordMismatch: '密码不匹配',
    minLength: '最少{0}个字符',
    maxLength: '最多{0}个字符',
    invalidCurrency: '货币格式无效',
  },
  
  errors: {
    generic: '发生意外错误',
    networkError: '网络连接错误',
    unauthorized: '未授权',
    forbidden: '访问被拒绝',
    notFound: '未找到',
    serverError: '服务器内部错误',
    sessionExpired: '会话已过期',
    loginFailed: '登录失败',
    registrationFailed: '注册失败',
  },

  notFound: {
    title: '404 - 页面未找到',
    message: '您正在查找的页面不存在或已被移动。',
  },
};

// Spanish translations
export const esTranslations: Translations = {
  nav: {
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
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
    loginSuccess: '¡Inicio de sesión exitoso!',
    registerSuccess: '¡Registro exitoso!',
    welcomeBack: 'Bienvenido de vuelta',
    loginDescription: 'Inicia sesión en tu cuenta para continuar',
    platformDescription: 'Plataforma completa de crédito e importación para empresarios brasileños que importan de China',
    secure: 'Seguro',
    fast: 'Rápido',
    efficient: 'Eficiente',
    rememberMe: 'Recordarme',
    forgotPassword: '¿Olvidaste tu contraseña?',
    signIn: 'Iniciar Sesión',
    signingIn: 'Iniciando sesión...',
    createAccount: 'Crear cuenta',
    createAccountDescription: 'Registra tu empresa en la plataforma',
    acceptTerms: 'Acepto los',
    termsOfUse: 'Términos de Uso',
    privacyPolicy: 'Política de Privacidad',
    creatingAccount: 'Creando cuenta...',
    haveAccount: '¿Ya tienes una cuenta?',
    signInNow: 'Iniciar sesión ahora',
  },
  
  dashboard: {
    welcome: 'Bienvenido',
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    manageCreditsAndImports: 'Gestiona tus créditos e importaciones de China de forma simple y eficiente.',
    totalCredit: 'Crédito Total',
    availableCredit: 'Crédito Disponible',
    totalImports: 'Total Importaciones',
    activeImports: 'Importaciones Activas',
    recentApplications: 'Solicitudes Recientes',
    recentImports: 'Importaciones Recientes',
    viewAll: 'Ver Todas',
    noData: 'Sin datos disponibles',
  },
  
  credit: {
    title: 'Gestión de Crédito',
    requestCredit: 'Solicitar Crédito',
    requestedAmount: 'Monto Solicitado',
    requestedCurrency: 'Moneda',
    businessPlan: 'Plan de Negocio',
    financialDocuments: 'Documentos Financieros',
    expectedUsage: 'Uso Esperado',
    submitApplication: 'Enviar Solicitud',
    myApplications: 'Mis Solicitudes',
    status: {
      pending: 'Pendiente',
      under_review: 'En Revisión',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      cancelled: 'Cancelado',
    },
    applicationSuccess: '¡Solicitud de crédito enviada exitosamente!',
  },
  
  imports: {
    title: 'Gestión de Importaciones',
    newImport: 'Nueva Importación',
    supplier: 'Proveedor',
    product: 'Producto',
    quantity: 'Cantidad',
    unitPrice: 'Precio Unitario',
    totalValue: 'Valor Total',
    currency: 'Moneda',
    expectedDelivery: 'Entrega Esperada',
    notes: 'Notas',
    submitImport: 'Enviar Importación',
    myImports: 'Mis Importaciones',
    status: {
      planning: 'Planificando',
      ordered: 'Pedido',
      in_transit: 'En Tránsito',
      customs: 'Aduanas',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    },
    importSuccess: '¡Importación registrada exitosamente!',
  },
  
  roles: {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    importer: 'Importador',
    inactive: 'Inactivo',
  },
  
  currency: {
    USD: 'Dólar Estadounidense',
    EUR: 'Euro',
    CNY: 'Yuan Chino',
    BRL: 'Real Brasileño',
  },
  
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    view: 'Ver',
    create: 'Crear',
    update: 'Actualizar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    date: 'Fecha',
    amount: 'Monto',
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
  },
  
  admin: {
    title: 'Panel de Administración',
    userManagement: 'Gestión de Usuarios',
    createUser: 'Crear Usuario',
    editUser: 'Editar Usuario',
    deactivateUser: 'Desactivar Usuario',
    activateUser: 'Activar Usuario',
    changeRole: 'Cambiar Rol',
    totalUsers: 'Total de Usuarios',
    systemMetrics: 'Métricas del Sistema',
    recentActivity: 'Actividad Reciente',
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
  },
  
  settings: {
    title: 'Configuración',
    profile: 'Perfil',
    preferences: 'Preferencias',
    language: 'Idioma',
    notifications: 'Notificaciones',
    security: 'Seguridad',
    changePassword: 'Cambiar Contraseña',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmNewPassword: 'Confirmar Nueva Contraseña',
    updateProfile: 'Actualizar Perfil',
    profileUpdated: '¡Perfil actualizado exitosamente!',
  },
  
  validation: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Correo inválido',
    invalidCnpj: 'CNPJ inválido',
    invalidPhone: 'Teléfono inválido',
    passwordMismatch: 'Las contraseñas no coinciden',
    minLength: 'Mínimo {0} caracteres',
    maxLength: 'Máximo {0} caracteres',
    invalidCurrency: 'Moneda inválida',
  },
  
  errors: {
    generic: 'Ocurrió un error inesperado',
    networkError: 'Error de conexión',
    unauthorized: 'No autorizado',
    forbidden: 'Acceso denegado',
    notFound: 'No encontrado',
    serverError: 'Error interno del servidor',
    sessionExpired: 'Sesión expirada',
    loginFailed: 'Error de inicio de sesión',
    registrationFailed: 'Error de registro',
  },

  notFound: {
    title: '404 - Página No Encontrada',
    message: 'La página que busca no existe o ha sido movida.',
  },
};

// Translation collections
export const translations: Record<Language, Translations> = {
  pt: ptTranslations,
  en: enTranslations,
  zh: zhTranslations,
  es: esTranslations,
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