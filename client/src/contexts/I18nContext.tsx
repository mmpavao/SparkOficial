
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'pt' | 'en' | 'zh' | 'es';

// Translation interface
interface Translations {
  [key: string]: string | Translations;
}

// Context interface
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  translations: Translations;
}

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Complete translations for all modules
const defaultTranslations: Record<Language, Translations> = {
  pt: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      credit: 'Crédito',
      imports: 'Importações',
      suppliers: 'Fornecedores',
      reports: 'Relatórios',
      admin: 'Administração',
      settings: 'Configurações',
      logout: 'Sair'
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Bem-vindo',
      metrics: 'Métricas',
      recentActivity: 'Atividade Recente',
      quickActions: 'Ações Rápidas',
      creditSummary: 'Resumo de Crédito',
      importsSummary: 'Resumo de Importações',
      notifications: 'Notificações'
    },
    // Credit module
    credit: {
      title: 'Aplicações de Crédito',
      newApplication: 'Nova Aplicação',
      requestedAmount: 'Valor Solicitado',
      status: 'Status',
      details: 'Ver Detalhes',
      edit: 'Editar',
      cancel: 'Cancelar',
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      underReview: 'Em Análise',
      draft: 'Rascunho',
      application: 'Aplicação',
      analysis: 'Análise',
      documentation: 'Documentação',
      review: 'Revisão'
    },
    // Imports module
    imports: {
      title: 'Todas as Importações',
      subtitle: 'Gerencie todas as importações do sistema',
      newImport: 'Nova Importação',
      totalImports: 'Total de Importações',
      activeImports: 'Importações Ativas',
      completed: 'Concluídas',
      totalValue: 'Valor Total',
      planning: 'Em Planejamento',
      production: 'Em Produção',
      transport: 'Em Transporte',
      successRate: 'Taxa de Sucesso',
      filters: 'Filtros',
      search: 'Buscar importações...',
      allStatus: 'Todos os Status',
      allTypes: 'Todos os Tipos',
      advanced: 'Avançados',
      refresh: 'Atualizar',
      noImportsFound: 'Nenhuma importação encontrada',
      createFirstImport: 'Comece criando sua primeira importação',
      importName: 'Nome da Importação',
      supplier: 'Fornecedor',
      value: 'Valor',
      stage: 'Estágio',
      estimatedDelivery: 'Entrega Estimada',
      actions: 'Ações'
    },
    // Admin module
    admin: {
      title: 'Administração',
      users: 'Usuários',
      creditAnalysis: 'Análise de Crédito',
      systemSettings: 'Configurações do Sistema',
      reports: 'Relatórios',
      newUser: 'Novo Usuário',
      userManagement: 'Gestão de Usuários',
      roleManagement: 'Gestão de Perfis',
      permissions: 'Permissões',
      auditLog: 'Log de Auditoria'
    },
    // Suppliers module
    suppliers: {
      title: 'Fornecedores',
      newSupplier: 'Novo Fornecedor',
      companyName: 'Nome da Empresa',
      contactPerson: 'Pessoa de Contato',
      email: 'E-mail',
      phone: 'Telefone',
      country: 'País',
      city: 'Cidade',
      address: 'Endereço',
      status: 'Status',
      rating: 'Avaliação',
      categories: 'Categorias'
    },
    // Common terms
    common: {
      save: 'Salvar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Excluir',
      create: 'Criar',
      update: 'Atualizar',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      warning: 'Aviso',
      info: 'Informação',
      confirm: 'Confirmar',
      close: 'Fechar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      clear: 'Limpar',
      reset: 'Resetar',
      apply: 'Aplicar',
      export: 'Exportar',
      import: 'Importar',
      download: 'Baixar',
      upload: 'Enviar',
      active: 'Ativo',
      inactive: 'Inativo',
      enabled: 'Habilitado',
      disabled: 'Desabilitado',
      yes: 'Sim',
      no: 'Não',
      all: 'Todos',
      none: 'Nenhum',
      total: 'Total',
      date: 'Data',
      time: 'Hora',
      name: 'Nome',
      description: 'Descrição',
      value: 'Valor',
      amount: 'Quantidade',
      price: 'Preço',
      currency: 'Moeda',
      percentage: 'Porcentagem'
    },
    // Auth module
    auth: {
      platformDescription: 'Plataforma completa de crédito e importação para empresas brasileiras',
      secure: 'Seguro',
      fast: 'Rápido',
      efficient: 'Eficiente',
      login: 'Entrar',
      register: 'Cadastrar',
      email: 'E-mail',
      password: 'Senha',
      rememberMe: 'Lembrar de mim',
      forgotPassword: 'Esqueceu a senha?',
      dontHaveAccount: 'Não tem conta?',
      alreadyHaveAccount: 'Já tem conta?',
      loginSuccess: 'Login realizado com sucesso',
      registerSuccess: 'Cadastro realizado com sucesso',
      welcomeBack: 'Bem-vindo de volta',
      loginDescription: 'Entre com suas credenciais para acessar sua conta',
      logout: 'Sair',
      profile: 'Perfil'
    },
    // Forms
    forms: {
      required: 'Campo obrigatório',
      invalid: 'Campo inválido',
      emailInvalid: 'E-mail inválido',
      passwordTooShort: 'Senha muito curta',
      passwordsDoNotMatch: 'Senhas não coincidem',
      cnpjInvalid: 'CNPJ inválido',
      cpfInvalid: 'CPF inválido',
      phoneInvalid: 'Telefone inválido',
      urlInvalid: 'URL inválida',
      numberInvalid: 'Número inválido',
      dateInvalid: 'Data inválida',
      minLength: 'Mínimo de {{min}} caracteres',
      maxLength: 'Máximo de {{max}} caracteres',
      min: 'Valor mínimo: {{min}}',
      max: 'Valor máximo: {{max}}'
    },
    // Settings
    settings: {
      title: 'Configurações',
      profile: 'Perfil',
      preferences: 'Preferências',
      language: 'Idioma',
      notifications: 'Notificações',
      security: 'Segurança',
      privacy: 'Privacidade',
      account: 'Conta',
      general: 'Geral',
      advanced: 'Avançado'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      credit: 'Credit',
      imports: 'Imports',
      suppliers: 'Suppliers',
      reports: 'Reports',
      admin: 'Administration',
      settings: 'Settings',
      logout: 'Logout'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      metrics: 'Metrics',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      creditSummary: 'Credit Summary',
      importsSummary: 'Imports Summary',
      notifications: 'Notifications'
    },
    credit: {
      title: 'Credit Applications',
      newApplication: 'New Application',
      requestedAmount: 'Requested Amount',
      status: 'Status',
      details: 'View Details',
      edit: 'Edit',
      cancel: 'Cancel',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      underReview: 'Under Review',
      draft: 'Draft',
      application: 'Application',
      analysis: 'Analysis',
      documentation: 'Documentation',
      review: 'Review'
    },
    imports: {
      title: 'All Imports',
      subtitle: 'Manage all system imports',
      newImport: 'New Import',
      totalImports: 'Total Imports',
      activeImports: 'Active Imports',
      completed: 'Completed',
      totalValue: 'Total Value',
      planning: 'Planning',
      production: 'Production',
      transport: 'Transport',
      successRate: 'Success Rate',
      filters: 'Filters',
      search: 'Search imports...',
      allStatus: 'All Status',
      allTypes: 'All Types',
      advanced: 'Advanced',
      refresh: 'Refresh',
      noImportsFound: 'No imports found',
      createFirstImport: 'Start by creating your first import',
      importName: 'Import Name',
      supplier: 'Supplier',
      value: 'Value',
      stage: 'Stage',
      estimatedDelivery: 'Estimated Delivery',
      actions: 'Actions'
    },
    admin: {
      title: 'Administration',
      users: 'Users',
      creditAnalysis: 'Credit Analysis',
      systemSettings: 'System Settings',
      reports: 'Reports',
      newUser: 'New User',
      userManagement: 'User Management',
      roleManagement: 'Role Management',
      permissions: 'Permissions',
      auditLog: 'Audit Log'
    },
    suppliers: {
      title: 'Suppliers',
      newSupplier: 'New Supplier',
      companyName: 'Company Name',
      contactPerson: 'Contact Person',
      email: 'Email',
      phone: 'Phone',
      country: 'Country',
      city: 'City',
      address: 'Address',
      status: 'Status',
      rating: 'Rating',
      categories: 'Categories'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      create: 'Create',
      update: 'Update',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      clear: 'Clear',
      reset: 'Reset',
      apply: 'Apply',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      active: 'Active',
      inactive: 'Inactive',
      enabled: 'Enabled',
      disabled: 'Disabled',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      none: 'None',
      total: 'Total',
      date: 'Date',
      time: 'Time',
      name: 'Name',
      description: 'Description',
      value: 'Value',
      amount: 'Amount',
      price: 'Price',
      currency: 'Currency',
      percentage: 'Percentage'
    },
    auth: {
      platformDescription: 'Complete credit and import platform for Brazilian businesses',
      secure: 'Secure',
      fast: 'Fast',
      efficient: 'Efficient',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      loginSuccess: 'Login successful',
      registerSuccess: 'Registration successful',
      welcomeBack: 'Welcome back',
      loginDescription: 'Enter your credentials to access your account',
      logout: 'Logout',
      profile: 'Profile'
    },
    forms: {
      required: 'Required field',
      invalid: 'Invalid field',
      emailInvalid: 'Invalid email',
      passwordTooShort: 'Password too short',
      passwordsDoNotMatch: 'Passwords do not match',
      cnpjInvalid: 'Invalid CNPJ',
      cpfInvalid: 'Invalid CPF',
      phoneInvalid: 'Invalid phone',
      urlInvalid: 'Invalid URL',
      numberInvalid: 'Invalid number',
      dateInvalid: 'Invalid date',
      minLength: 'Minimum {{min}} characters',
      maxLength: 'Maximum {{max}} characters',
      min: 'Minimum value: {{min}}',
      max: 'Maximum value: {{max}}'
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      preferences: 'Preferences',
      language: 'Language',
      notifications: 'Notifications',
      security: 'Security',
      privacy: 'Privacy',
      account: 'Account',
      general: 'General',
      advanced: 'Advanced'
    }
  },
  zh: {
    nav: {
      dashboard: '仪表板',
      credit: '信贷',
      imports: '进口',
      suppliers: '供应商',
      reports: '报告',
      admin: '管理',
      settings: '设置',
      logout: '登出'
    },
    dashboard: {
      title: '仪表板',
      welcome: '欢迎',
      metrics: '指标',
      recentActivity: '最近活动',
      quickActions: '快速操作',
      creditSummary: '信贷摘要',
      importsSummary: '进口摘要',
      notifications: '通知'
    },
    credit: {
      title: '信贷申请',
      newApplication: '新申请',
      requestedAmount: '申请金额',
      status: '状态',
      details: '查看详情',
      edit: '编辑',
      cancel: '取消',
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      underReview: '审核中',
      draft: '草稿',
      application: '申请',
      analysis: '分析',
      documentation: '文档',
      review: '审查'
    },
    imports: {
      title: '所有进口',
      subtitle: '管理所有系统进口',
      newImport: '新进口',
      totalImports: '总进口',
      activeImports: '活跃进口',
      completed: '已完成',
      totalValue: '总价值',
      planning: '计划中',
      production: '生产中',
      transport: '运输中',
      successRate: '成功率',
      filters: '筛选器',
      search: '搜索进口...',
      allStatus: '所有状态',
      allTypes: '所有类型',
      advanced: '高级',
      refresh: '刷新',
      noImportsFound: '未找到进口',
      createFirstImport: '开始创建您的第一个进口',
      importName: '进口名称',
      supplier: '供应商',
      value: '价值',
      stage: '阶段',
      estimatedDelivery: '预计交付',
      actions: '操作'
    },
    admin: {
      title: '管理',
      users: '用户',
      creditAnalysis: '信贷分析',
      systemSettings: '系统设置',
      reports: '报告',
      newUser: '新用户',
      userManagement: '用户管理',
      roleManagement: '角色管理',
      permissions: '权限',
      auditLog: '审计日志'
    },
    suppliers: {
      title: '供应商',
      newSupplier: '新供应商',
      companyName: '公司名称',
      contactPerson: '联系人',
      email: '邮箱',
      phone: '电话',
      country: '国家',
      city: '城市',
      address: '地址',
      status: '状态',
      rating: '评级',
      categories: '类别'
    },
    common: {
      save: '保存',
      cancel: '取消',
      edit: '编辑',
      delete: '删除',
      create: '创建',
      update: '更新',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
      confirm: '确认',
      close: '关闭',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      search: '搜索',
      filter: '筛选',
      clear: '清除',
      reset: '重置',
      apply: '应用',
      export: '导出',
      import: '导入',
      download: '下载',
      upload: '上传',
      active: '活跃',
      inactive: '不活跃',
      enabled: '启用',
      disabled: '禁用',
      yes: '是',
      no: '否',
      all: '全部',
      none: '无',
      total: '总计',
      date: '日期',
      time: '时间',
      name: '名称',
      description: '描述',
      value: '值',
      amount: '数量',
      price: '价格',
      currency: '货币',
      percentage: '百分比'
    },
    auth: {
      platformDescription: '巴西企业完整的信贷和进口平台',
      secure: '安全',
      fast: '快速',
      efficient: '高效',
      login: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      rememberMe: '记住我',
      forgotPassword: '忘记密码？',
      dontHaveAccount: '没有账户？',
      alreadyHaveAccount: '已有账户？',
      loginSuccess: '登录成功',
      registerSuccess: '注册成功',
      welcomeBack: '欢迎回来',
      loginDescription: '输入您的凭据以访问您的账户',
      logout: '登出',
      profile: '个人资料'
    },
    forms: {
      required: '必填字段',
      invalid: '无效字段',
      emailInvalid: '无效邮箱',
      passwordTooShort: '密码太短',
      passwordsDoNotMatch: '密码不匹配',
      cnpjInvalid: '无效CNPJ',
      cpfInvalid: '无效CPF',
      phoneInvalid: '无效电话',
      urlInvalid: '无效URL',
      numberInvalid: '无效数字',
      dateInvalid: '无效日期',
      minLength: '最少{{min}}个字符',
      maxLength: '最多{{max}}个字符',
      min: '最小值：{{min}}',
      max: '最大值：{{max}}'
    },
    settings: {
      title: '设置',
      profile: '个人资料',
      preferences: '偏好',
      language: '语言',
      notifications: '通知',
      security: '安全',
      privacy: '隐私',
      account: '账户',
      general: '一般',
      advanced: '高级'
    }
  },
  es: {
    nav: {
      dashboard: 'Panel de Control',
      credit: 'Crédito',
      imports: 'Importaciones',
      suppliers: 'Proveedores',
      reports: 'Informes',
      admin: 'Administración',
      settings: 'Configuración',
      logout: 'Cerrar Sesión'
    },
    dashboard: {
      title: 'Panel de Control',
      welcome: 'Bienvenido',
      metrics: 'Métricas',
      recentActivity: 'Actividad Reciente',
      quickActions: 'Acciones Rápidas',
      creditSummary: 'Resumen de Crédito',
      importsSummary: 'Resumen de Importaciones',
      notifications: 'Notificaciones'
    },
    credit: {
      title: 'Solicitudes de Crédito',
      newApplication: 'Nueva Solicitud',
      requestedAmount: 'Monto Solicitado',
      status: 'Estado',
      details: 'Ver Detalles',
      edit: 'Editar',
      cancel: 'Cancelar',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      underReview: 'En Revisión',
      draft: 'Borrador',
      application: 'Solicitud',
      analysis: 'Análisis',
      documentation: 'Documentación',
      review: 'Revisión'
    },
    imports: {
      title: 'Todas las Importaciones',
      subtitle: 'Gestionar todas las importaciones del sistema',
      newImport: 'Nueva Importación',
      totalImports: 'Total de Importaciones',
      activeImports: 'Importaciones Activas',
      completed: 'Completadas',
      totalValue: 'Valor Total',
      planning: 'Planificando',
      production: 'Producción',
      transport: 'Transporte',
      successRate: 'Tasa de Éxito',
      filters: 'Filtros',
      search: 'Buscar importaciones...',
      allStatus: 'Todos los Estados',
      allTypes: 'Todos los Tipos',
      advanced: 'Avanzado',
      refresh: 'Actualizar',
      noImportsFound: 'No se encontraron importaciones',
      createFirstImport: 'Comience creando su primera importación',
      importName: 'Nombre de Importación',
      supplier: 'Proveedor',
      value: 'Valor',
      stage: 'Etapa',
      estimatedDelivery: 'Entrega Estimada',
      actions: 'Acciones'
    },
    admin: {
      title: 'Administración',
      users: 'Usuarios',
      creditAnalysis: 'Análisis de Crédito',
      systemSettings: 'Configuración del Sistema',
      reports: 'Informes',
      newUser: 'Nuevo Usuario',
      userManagement: 'Gestión de Usuarios',
      roleManagement: 'Gestión de Roles',
      permissions: 'Permisos',
      auditLog: 'Registro de Auditoría'
    },
    suppliers: {
      title: 'Proveedores',
      newSupplier: 'Nuevo Proveedor',
      companyName: 'Nombre de la Empresa',
      contactPerson: 'Persona de Contacto',
      email: 'Correo',
      phone: 'Teléfono',
      country: 'País',
      city: 'Ciudad',
      address: 'Dirección',
      status: 'Estado',
      rating: 'Calificación',
      categories: 'Categorías'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      create: 'Crear',
      update: 'Actualizar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
      confirm: 'Confirmar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      clear: 'Limpiar',
      reset: 'Restablecer',
      apply: 'Aplicar',
      export: 'Exportar',
      import: 'Importar',
      download: 'Descargar',
      upload: 'Subir',
      active: 'Activo',
      inactive: 'Inactivo',
      enabled: 'Habilitado',
      disabled: 'Deshabilitado',
      yes: 'Sí',
      no: 'No',
      all: 'Todo',
      none: 'Ninguno',
      total: 'Total',
      date: 'Fecha',
      time: 'Hora',
      name: 'Nombre',
      description: 'Descripción',
      value: 'Valor',
      amount: 'Cantidad',
      price: 'Precio',
      currency: 'Moneda',
      percentage: 'Porcentaje'
    },
    auth: {
      platformDescription: 'Plataforma completa de crédito e importación para empresas brasileñas',
      secure: 'Seguro',
      fast: 'Rápido',
      efficient: 'Eficiente',
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      email: 'Correo',
      password: 'Contraseña',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidaste la contraseña?',
      dontHaveAccount: '¿No tienes cuenta?',
      alreadyHaveAccount: '¿Ya tienes cuenta?',
      loginSuccess: 'Inicio de sesión exitoso',
      registerSuccess: 'Registro exitoso',
      welcomeBack: 'Bienvenido de vuelta',
      loginDescription: 'Ingresa tus credenciales para acceder a tu cuenta',
      logout: 'Cerrar Sesión',
      profile: 'Perfil'
    },
    forms: {
      required: 'Campo requerido',
      invalid: 'Campo inválido',
      emailInvalid: 'Correo inválido',
      passwordTooShort: 'Contraseña muy corta',
      passwordsDoNotMatch: 'Las contraseñas no coinciden',
      cnpjInvalid: 'CNPJ inválido',
      cpfInvalid: 'CPF inválido',
      phoneInvalid: 'Teléfono inválido',
      urlInvalid: 'URL inválida',
      numberInvalid: 'Número inválido',
      dateInvalid: 'Fecha inválida',
      minLength: 'Mínimo {{min}} caracteres',
      maxLength: 'Máximo {{max}} caracteres',
      min: 'Valor mínimo: {{min}}',
      max: 'Valor máximo: {{max}}'
    },
    settings: {
      title: 'Configuración',
      profile: 'Perfil',
      preferences: 'Preferencias',
      language: 'Idioma',
      notifications: 'Notificaciones',
      security: 'Seguridad',
      privacy: 'Privacidad',
      account: 'Cuenta',
      general: 'General',
      advanced: 'Avanzado'
    }
  }
};

// Provider component
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt'); // Default to Portuguese
  const [translations, setTranslations] = useState<Translations>(defaultTranslations.pt);

  // Update translations when language changes
  useEffect(() => {
    setTranslations(defaultTranslations[language]);
    // Save language preference to localStorage
    localStorage.setItem('spark-comex-language', language);
  }, [language]);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('spark-comex-language') as Language;
    if (savedLanguage && Object.keys(defaultTranslations).includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Translation function with parameter replacement
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Portuguese if translation not found
        let fallbackValue: any = defaultTranslations.pt;
        for (const fallbackKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
            fallbackValue = fallbackValue[fallbackKey];
          } else {
            // Last resort: return the key
            console.warn(`Translation missing for key: ${key} in language: ${language}`);
            return key;
          }
        }
        value = fallbackValue;
        break;
      }
    }
    
    if (typeof value === 'string') {
      // Replace parameters if provided
      if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
          return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
        }, value);
      }
      return value;
    }
    
    // Fallback to key if not a string
    console.warn(`Translation key ${key} does not resolve to a string in language ${language}`);
    return key;
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    translations
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use the context
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

// Export context for advanced usage
export { I18nContext };
