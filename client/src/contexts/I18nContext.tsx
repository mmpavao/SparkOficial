import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'pt' | 'en' | 'zh' | 'es' | 'ru';

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
    // Financial module (Financeira)
    financial: {
      title: 'Análise Financeira',
      dashboard: 'Dashboard Financeiro',
      applications: 'Aplicações Submetidas',
      analysis: 'Análise de Crédito',
      approve: 'Aprovar Crédito',
      reject: 'Rejeitar Aplicação',
      pending: 'Aguardando Análise',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      underAnalysis: 'Em Análise',
      creditLimit: 'Limite de Crédito',
      paymentTerms: 'Condições de Pagamento',
      riskAssessment: 'Avaliação de Risco',
      financialNotes: 'Observações Financeiras',
      approvalDate: 'Data de Aprovação',
      submittedApplications: 'Aplicações Submetidas',
      totalApproved: 'Total Aprovado',
      totalRejected: 'Total Rejeitado',
      avgAnalysisTime: 'Tempo Médio de Análise',
      lowRisk: 'Baixo Risco',
      mediumRisk: 'Médio Risco',
      highRisk: 'Alto Risco',
      confirmApproval: 'Confirmar Aprovação',
      confirmRejection: 'Confirmar Rejeição',
      approvalConfirmation: 'Tem certeza de que deseja aprovar esta aplicação de crédito?',
      rejectionConfirmation: 'Tem certeza de que deseja rejeitar esta aplicação?',
      approvalSuccess: 'Aplicação aprovada com sucesso',
      rejectionSuccess: 'Aplicação rejeitada com sucesso',
      enterCreditLimit: 'Informe o limite de crédito',
      selectPaymentTerms: 'Selecione as condições de pagamento',
      addFinancialNotes: 'Adicione observações financeiras',
      requiredField: 'Campo obrigatório',
      invalidAmount: 'Valor inválido',
      days30: '30 dias',
      days60: '60 dias',
      days90: '90 dias',
      days120: '120 dias',
      days150: '150 dias',
      days180: '180 dias',
      monthlyStatistics: 'Estatísticas do Mês',
      receivedApplications: 'Aplicações Recebidas',
      approvals: 'Aprovações',
      approvedVolume: 'Volume Aprovado',
      recentActivity: 'Atividade Recente',
      requested: 'Solicitado',
      underReview: 'Em Análise',
      other: 'Outro',
      thisMonth: 'Este mês'
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
    // Financial module (Financeira)
    financial: {
      title: 'Financial Analysis',
      dashboard: 'Financial Dashboard',
      applications: 'Submitted Applications',
      analysis: 'Credit Analysis',
      approve: 'Approve Credit',
      reject: 'Reject Application',
      pending: 'Awaiting Analysis',
      approved: 'Approved',
      rejected: 'Rejected',
      underAnalysis: 'Under Analysis',
      creditLimit: 'Credit Limit',
      paymentTerms: 'Payment Terms',
      riskAssessment: 'Risk Assessment',
      financialNotes: 'Financial Notes',
      approvalDate: 'Approval Date',
      submittedApplications: 'Submitted Applications',
      totalApproved: 'Total Approved',
      totalRejected: 'Total Rejected',
      avgAnalysisTime: 'Average Analysis Time',
      lowRisk: 'Low Risk',
      mediumRisk: 'Medium Risk',
      highRisk: 'High Risk',
      confirmApproval: 'Confirm Approval',
      confirmRejection: 'Confirm Rejection',
      approvalConfirmation: 'Are you sure you want to approve this credit application?',
      rejectionConfirmation: 'Are you sure you want to reject this application?',
      approvalSuccess: 'Application approved successfully',
      rejectionSuccess: 'Application rejected successfully',
      enterCreditLimit: 'Enter credit limit',
      selectPaymentTerms: 'Select payment terms',
      addFinancialNotes: 'Add financial notes',
      requiredField: 'Required field',
      invalidAmount: 'Invalid amount',
      days30: '30 days',
      days60: '60 days',
      days90: '90 days',
      days120: '120 days',
      days150: '150 days',
      days180: '180 days',
      monthlyStatistics: 'Monthly Statistics',
      receivedApplications: 'Received Applications',
      approvals: 'Approvals',
      approvedVolume: 'Approved Volume',
      recentActivity: 'Recent Activity',
      requested: 'Requested',
      underReview: 'Under Review',
      other: 'Other',
      thisMonth: 'This month'
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
    // Financial module (Financeira)
    financial: {
      title: '金融分析',
      dashboard: '金融仪表板',
      applications: '已提交申请',
      analysis: '信贷分析',
      approve: '批准信贷',
      reject: '拒绝申请',
      pending: '等待分析',
      approved: '已批准',
      rejected: '已拒绝',
      underAnalysis: '分析中',
      creditLimit: '信贷额度',
      paymentTerms: '付款条件',
      riskAssessment: '风险评估',
      financialNotes: '财务备注',
      approvalDate: '批准日期',
      submittedApplications: '已提交申请',
      totalApproved: '总批准额',
      totalRejected: '总拒绝数',
      avgAnalysisTime: '平均分析时间',
      lowRisk: '低风险',
      mediumRisk: '中等风险',
      highRisk: '高风险',
      confirmApproval: '确认批准',
      confirmRejection: '确认拒绝',
      approvalConfirmation: '您确定要批准此信贷申请吗？',
      rejectionConfirmation: '您确定要拒绝此申请吗？',
      approvalSuccess: '申请已成功批准',
      rejectionSuccess: '申请已成功拒绝',
      enterCreditLimit: '输入信贷额度',
      selectPaymentTerms: '选择付款条件',
      addFinancialNotes: '添加财务备注',
      requiredField: '必填字段',
      invalidAmount: '无效金额',
      days30: '30天',
      days60: '60天',
      days90: '90天',
      days120: '120天',
      days150: '150天',
      days180: '180天',
      monthlyStatistics: '月度统计',
      receivedApplications: '收到的申请',
      approvals: '批准',
      approvedVolume: '批准金额',
      recentActivity: '最近活动',
      requested: '已申请',
      underReview: '审核中',
      other: '其他',
      thisMonth: '本月'
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
    // Financial module (Financeira)
    financial: {
      title: 'Análisis Financiero',
      dashboard: 'Dashboard Financiero',
      applications: 'Solicitudes Enviadas',
      analysis: 'Análisis de Crédito',
      approve: 'Aprobar Crédito',
      reject: 'Rechazar Solicitud',
      pending: 'Esperando Análisis',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      underAnalysis: 'En Análisis',
      creditLimit: 'Límite de Crédito',
      paymentTerms: 'Condiciones de Pago',
      riskAssessment: 'Evaluación de Riesgo',
      financialNotes: 'Notas Financieras',
      approvalDate: 'Fecha de Aprobación',
      submittedApplications: 'Solicitudes Enviadas',
      totalApproved: 'Total Aprobado',
      totalRejected: 'Total Rechazado',
      avgAnalysisTime: 'Tiempo Promedio de Análisis',
      lowRisk: 'Bajo Riesgo',
      mediumRisk: 'Riesgo Medio',
      highRisk: 'Alto Riesgo',
      confirmApproval: 'Confirmar Aprobación',
      confirmRejection: 'Confirmar Rechazo',
      approvalConfirmation: '¿Está seguro de que desea aprobar esta solicitud de crédito?',
      rejectionConfirmation: '¿Está seguro de que desea rechazar esta solicitud?',
      approvalSuccess: 'Solicitud aprobada exitosamente',
      rejectionSuccess: 'Solicitud rechazada exitosamente',
      enterCreditLimit: 'Ingrese el límite de crédito',
      selectPaymentTerms: 'Seleccione las condiciones de pago',
      addFinancialNotes: 'Agregar notas financieras',
      requiredField: 'Campo requerido',
      invalidAmount: 'Monto inválido',
      days30: '30 días',
      days60: '60 días',
      days90: '90 días',
      days120: '120 días',
      days150: '150 días',
      days180: '180 días',
      monthlyStatistics: 'Estadísticas Mensuales',
      receivedApplications: 'Solicitudes Recibidas',
      approvals: 'Aprobaciones',
      approvedVolume: 'Volumen Aprobado',
      recentActivity: 'Actividad Reciente',
      requested: 'Solicitado',
      underReview: 'En Revisión',
      other: 'Otro',
      thisMonth: 'Este mes'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito'
    }
  },
  ru: {
    auth: {
      platformDescription: 'Полная платформа кредитования и импорта для бразильских предприятий',
      secure: 'Безопасно',
      fast: 'Быстро',
      efficient: 'Эффективно',
      login: 'Войти',
      register: 'Регистрация',
      email: 'Email',
      password: 'Пароль',
      rememberMe: 'Запомнить меня',
      forgotPassword: 'Забыли пароль?',
      dontHaveAccount: 'Нет аккаунта?',
      alreadyHaveAccount: 'Уже есть аккаунт?',
      loginSuccess: 'Успешный вход',
      registerSuccess: 'Успешная регистрация'
    },
    credit: {
      title: 'Кредитные заявки',
      newApplication: 'Новая заявка',
      requestedAmount: 'Запрашиваемая сумма',
      status: 'Статус',
      details: 'Подробности',
      edit: 'Редактировать',
      cancel: 'Отменить',
      pending: 'В ожидании',
      approved: 'Одобрено',
      rejected: 'Отклонено',
      underReview: 'На рассмотрении'
    },
    // Financial module (Financeira)
    financial: {
      title: 'Финансовый анализ',
      dashboard: 'Финансовая панель',
      applications: 'Поданные заявки',
      analysis: 'Кредитный анализ',
      approve: 'Одобрить кредит',
      reject: 'Отклонить заявку',
      pending: 'Ожидает анализа',
      approved: 'Одобрено',
      rejected: 'Отклонено',
      underAnalysis: 'В процессе анализа',
      creditLimit: 'Кредитный лимит',
      paymentTerms: 'Условия платежа',
      riskAssessment: 'Оценка рисков',
      financialNotes: 'Финансовые заметки',
      approvalDate: 'Дата одобрения',
      submittedApplications: 'Поданные заявки',
      totalApproved: 'Всего одобрено',
      totalRejected: 'Всего отклонено',
      avgAnalysisTime: 'Среднее время анализа',
      lowRisk: 'Низкий риск',
      mediumRisk: 'Средний риск',
      highRisk: 'Высокий риск',
      confirmApproval: 'Подтвердить одобрение',
      confirmRejection: 'Подтвердить отклонение',
      approvalConfirmation: 'Вы уверены, что хотите одобрить эту кредитную заявку?',
      rejectionConfirmation: 'Вы уверены, что хотите отклонить эту заявку?',
      approvalSuccess: 'Заявка успешно одобрена',
      rejectionSuccess: 'Заявка успешно отклонена',
      enterCreditLimit: 'Введите кредитный лимит',
      selectPaymentTerms: 'Выберите условия платежа',
      addFinancialNotes: 'Добавить финансовые заметки',
      requiredField: 'Обязательное поле',
      invalidAmount: 'Неверная сумма',
      days30: '30 дней',
      days60: '60 дней',
      days90: '90 дней',
      days120: '120 дней',
      days150: '150 дней',
      days180: '180 дней',
      monthlyStatistics: 'Месячная статистика',
      receivedApplications: 'Полученные заявки',
      approvals: 'Одобрения',
      approvedVolume: 'Одобренный объем',
      recentActivity: 'Недавняя активность',
      requested: 'Запрошено',
      underReview: 'На рассмотрении',
      other: 'Другое',
      thisMonth: 'В этом месяце'
    },
    common: {
      save: 'Сохранить',
      cancel: 'Отменить',
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успех'
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