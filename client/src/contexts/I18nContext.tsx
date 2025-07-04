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

// Default translations (Portuguese - primary language for Brazilian platform)
const defaultTranslations: Record<Language, Translations> = {
  pt: {
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
      loginDescription: 'Entre com suas credenciais para acessar sua conta'
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
      underReview: 'Em Análise'
    },
    // Financial module
    financeira: {
      dashboard: {
        title: 'Painel Financeiro',
        submittedCredits: 'Créditos Submetidos',
        requestedCredit: 'Crédito Solicitado',
        approvedCredit: 'Crédito Aprovado',
        approvalRate: 'Taxa de Aprovação',
        creditInUse: 'Crédito Em Uso',
        availableCredit: 'Crédito Disponível',
        averageApprovalTime: 'Tempo Médio Aprovação',
        utilizationRate: 'Taxa de Utilização',
        applicationsStatus: 'Status das Aplicações de Crédito',
        recentActivity: 'Atividade Recente Financeira',
        monthlyStats: 'Estatísticas do Mês',
        volumeConceded: 'Volume concedido',
        volumeRequested: 'Volume total pedido',
        totalApplications: 'Total de aplicações',
        approvalEfficiency: 'Eficiência de aprovação',
        beingUsed: 'Sendo utilizado',
        freeForUse: 'Livre para uso',
        daysToApprove: 'Dias para aprovar',
        ofApprovedCredit: 'Do crédito aprovado'
      },
      status: {
        pending: 'Pendentes',
        underReview: 'Em Análise',
        approved: 'Aprovadas',
        rejected: 'Rejeitadas',
        cancelled: 'Canceladas'
      },
      navigation: {
        creditAnalysis: 'Análise de Crédito',
        importAnalysis: 'Análise de Importações',
        allSuppliers: 'Todos Fornecedores',
        allImports: 'Todas as Importações'
      },
      preview: {
        title: 'Pré-visualização Financeira',
        adminFee: 'Taxa Administrativa',
        downPayment: 'Entrada',
        financedAmount: 'Valor Financiado',
        totalCost: 'Custo Total',
        creditLimit: 'Limite de Crédito',
        availableBalance: 'Saldo Disponível'
      },
      terms: {
        title: 'Termos e Condições',
        financialSummary: 'Resumo Financeiro',
        fobValue: 'Valor FOB',
        totalCost: 'Custo Total',
        paymentSchedule: 'Cronograma de Pagamentos',
        downPaymentRequired: 'Entrada Requerida',
        financedValue: 'Valor a Financiar',
        administrativeFee: 'Taxa Administrativa'
      }
    },
    // Navigation
    navigation: {
      dashboard: 'Dashboard',
      credit: 'Crédito',
      imports: 'Importações',
      suppliers: 'Fornecedores',
      payments: 'Pagamentos',
      reports: 'Relatórios',
      settings: 'Configurações',
      administration: 'Administração',
      manageUsers: 'Gerenciar Usuários',
      importers: 'Importadores',
      myImports: 'Minhas Importações',
      allImports: 'Todas as Importações'
    },
    // Common terms
    common: {
      save: 'Salvar',
      cancel: 'Cancelar',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso'
    }
  },
  en: {
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
      registerSuccess: 'Registration successful'
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
      underReview: 'Under Review'
    },
    // Financial module - English
    financeira: {
      dashboard: {
        title: 'Financial Panel',
        submittedCredits: 'Submitted Credits',
        requestedCredit: 'Requested Credit',
        approvedCredit: 'Approved Credit',
        approvalRate: 'Approval Rate',
        creditInUse: 'Credit In Use',
        availableCredit: 'Available Credit',
        averageApprovalTime: 'Average Approval Time',
        utilizationRate: 'Utilization Rate',
        applicationsStatus: 'Credit Applications Status',
        recentActivity: 'Recent Financial Activity',
        monthlyStats: 'Monthly Statistics',
        volumeConceded: 'Volume granted',
        volumeRequested: 'Total volume requested',
        totalApplications: 'Total applications',
        approvalEfficiency: 'Approval efficiency',
        beingUsed: 'Being used',
        freeForUse: 'Free for use',
        daysToApprove: 'Days to approve',
        ofApprovedCredit: 'Of approved credit'
      },
      status: {
        pending: 'Pending',
        underReview: 'Under Review',
        approved: 'Approved',
        rejected: 'Rejected',
        cancelled: 'Cancelled'
      },
      navigation: {
        creditAnalysis: 'Credit Analysis',
        importAnalysis: 'Import Analysis',
        allSuppliers: 'All Suppliers',
        allImports: 'All Imports'
      },
      preview: {
        title: 'Financial Preview',
        adminFee: 'Administrative Fee',
        downPayment: 'Down Payment',
        financedAmount: 'Financed Amount',
        totalCost: 'Total Cost',
        creditLimit: 'Credit Limit',
        availableBalance: 'Available Balance'
      },
      terms: {
        title: 'Terms and Conditions',
        financialSummary: 'Financial Summary',
        fobValue: 'FOB Value',
        totalCost: 'Total Cost',
        paymentSchedule: 'Payment Schedule',
        downPaymentRequired: 'Down Payment Required',
        financedValue: 'Value to Finance',
        administrativeFee: 'Administrative Fee'
      }
    },
    // Navigation - English
    navigation: {
      dashboard: 'Dashboard',
      credit: 'Credit',
      imports: 'Imports',
      suppliers: 'Suppliers',
      payments: 'Payments',
      reports: 'Reports',
      settings: 'Settings',
      administration: 'Administration',
      manageUsers: 'Manage Users',
      importers: 'Importers',
      myImports: 'My Imports',
      allImports: 'All Imports'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    }
  },
  zh: {
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
      registerSuccess: '注册成功'
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
      underReview: '审核中'
    },
    // Financial module - Chinese
    financeira: {
      dashboard: {
        title: '财务面板',
        submittedCredits: '已提交信贷',
        requestedCredit: '申请信贷',
        approvedCredit: '已批准信贷',
        approvalRate: '批准率',
        creditInUse: '使用中信贷',
        availableCredit: '可用信贷',
        averageApprovalTime: '平均批准时间',
        utilizationRate: '使用率',
        applicationsStatus: '信贷申请状态',
        recentActivity: '最近财务活动',
        monthlyStats: '月度统计',
        volumeConceded: '已批准金额',
        volumeRequested: '申请总金额',
        totalApplications: '申请总数',
        approvalEfficiency: '批准效率',
        beingUsed: '使用中',
        freeForUse: '可使用',
        daysToApprove: '批准天数',
        ofApprovedCredit: '已批准信贷的'
      },
      status: {
        pending: '待处理',
        underReview: '审核中',
        approved: '已批准',
        rejected: '已拒绝',
        cancelled: '已取消'
      },
      navigation: {
        creditAnalysis: '信贷分析',
        importAnalysis: '进口分析',
        allSuppliers: '所有供应商',
        allImports: '所有进口'
      },
      preview: {
        title: '财务预览',
        adminFee: '管理费',
        downPayment: '首付款',
        financedAmount: '融资金额',
        totalCost: '总成本',
        creditLimit: '信贷额度',
        availableBalance: '可用余额'
      },
      terms: {
        title: '条款和条件',
        financialSummary: '财务摘要',
        fobValue: 'FOB价值',
        totalCost: '总成本',
        paymentSchedule: '付款计划',
        downPaymentRequired: '所需首付款',
        financedValue: '融资价值',
        administrativeFee: '管理费'
      }
    },
    // Navigation - Chinese
    navigation: {
      dashboard: '仪表板',
      credit: '信贷',
      imports: '进口',
      suppliers: '供应商',
      payments: '付款',
      reports: '报告',
      settings: '设置',
      administration: '管理',
      manageUsers: '管理用户',
      importers: '进口商',
      myImports: '我的进口',
      allImports: '所有进口'
    },
    common: {
      save: '保存',
      cancel: '取消',
      loading: '加载中...',
      error: '错误',
      success: '成功'
    }
  },
  es: {
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
      registerSuccess: 'Registro exitoso'
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
      underReview: 'En Revisión'
    },
    // Financial module - Spanish
    financeira: {
      dashboard: {
        title: 'Panel Financiero',
        submittedCredits: 'Créditos Enviados',
        requestedCredit: 'Crédito Solicitado',
        approvedCredit: 'Crédito Aprobado',
        approvalRate: 'Tasa de Aprobación',
        creditInUse: 'Crédito en Uso',
        availableCredit: 'Crédito Disponible',
        averageApprovalTime: 'Tiempo Promedio de Aprobación',
        utilizationRate: 'Tasa de Utilización',
        applicationsStatus: 'Estado de Solicitudes de Crédito',
        recentActivity: 'Actividad Financiera Reciente',
        monthlyStats: 'Estadísticas Mensuales',
        volumeConceded: 'Volumen concedido',
        volumeRequested: 'Volumen total solicitado',
        totalApplications: 'Total de solicitudes',
        approvalEfficiency: 'Eficiencia de aprobación',
        beingUsed: 'En uso',
        freeForUse: 'Libre para uso',
        daysToApprove: 'Días para aprobar',
        ofApprovedCredit: 'Del crédito aprobado'
      },
      status: {
        pending: 'Pendientes',
        underReview: 'En Revisión',
        approved: 'Aprobadas',
        rejected: 'Rechazadas',
        cancelled: 'Canceladas'
      },
      navigation: {
        creditAnalysis: 'Análisis de Crédito',
        importAnalysis: 'Análisis de Importaciones',
        allSuppliers: 'Todos los Proveedores',
        allImports: 'Todas las Importaciones'
      },
      preview: {
        title: 'Vista Previa Financiera',
        adminFee: 'Tarifa Administrativa',
        downPayment: 'Pago Inicial',
        financedAmount: 'Monto Financiado',
        totalCost: 'Costo Total',
        creditLimit: 'Límite de Crédito',
        availableBalance: 'Saldo Disponible'
      },
      terms: {
        title: 'Términos y Condiciones',
        financialSummary: 'Resumen Financiero',
        fobValue: 'Valor FOB',
        totalCost: 'Costo Total',
        paymentSchedule: 'Cronograma de Pagos',
        downPaymentRequired: 'Pago Inicial Requerido',
        financedValue: 'Valor a Financiar',
        administrativeFee: 'Tarifa Administrativa'
      }
    },
    // Navigation - Spanish
    navigation: {
      dashboard: 'Panel de Control',
      credit: 'Crédito',
      imports: 'Importaciones',
      suppliers: 'Proveedores',
      payments: 'Pagos',
      reports: 'Reportes',
      settings: 'Configuraciones',
      administration: 'Administración',
      manageUsers: 'Gestionar Usuarios',
      importers: 'Importadores',
      myImports: 'Mis Importaciones',
      allImports: 'Todas las Importaciones'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito'
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

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if translation not found
        return key;
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