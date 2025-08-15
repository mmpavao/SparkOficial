import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'pt' | 'en' | 'zh' | 'ru' | 'fr';

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
      underReview: 'Em Análise',
      analysis: {
        title: 'Análise de Crédito 360°',
        consulting: 'Consultando...',
        consultCreditScore: 'Consultar Credit Score',
        notPerformed: 'Análise de Crédito não realizada',
        clickToStartAnalysis: 'Clique em "Consultar Credit Score" para iniciar a análise completa',
        onlyForAdmins: 'Análise de crédito disponível apenas para administradores',
        updating: 'Atualizando...',
        update: 'Atualizar',
        scoreQuodTitle: 'Score QUOD - Pontuação de Crédito',
        points: '{{score}} pontos',
        outOf1000Points: 'de 1000 pontos',
        riskAnalysis: 'Análise de Risco',
        paymentCapacity: 'Capacidade de Pagamento',
        hasDebts: 'Possui Débitos',
        protests: 'Protestos',
        financialHistory: 'Histórico Financeiro',
        bankruptcyRecovery: 'Falência/Recuperação',
        lawsuits: 'Ações Judiciais',
        companyRegistrationTitle: 'Cadastro PJ Plus - Dados Empresariais',
        companyData: 'Dados da Empresa',
        legalName: 'Razão Social',
        tradingName: 'Nome Fantasia',
        shareCapital: 'Capital Social',
        contact: 'Contato',
        economicActivity: 'Atividade Econômica',
        mainActivity: 'Atividade Principal',
        secondaryActivities: 'Atividades Secundárias',
        otherActivities: '+{{count}} outras atividades',
        partners: 'Sócios',
        cndTitle: 'CND - Certidões Negativas de Débitos',
        notConsulted: 'Não Consultado',
        regularNoDebts: 'Regular - Sem Débitos',
        certificate: 'Certidão',
        consultationNotPerformed: 'Consulta não realizada',
        certificateInfo: 'Informações da Certidão',
        number: 'Número',
        validationCode: 'Código Validação',
        state: 'Estado',
        validity: 'Validade',
        issueDate: 'Emissão',
        expiryDate: 'Validade',
        debtsFound: 'Débitos Encontrados',
        debt: 'Débito',
        descriptionNotAvailable: 'Descrição não disponível',
        value: 'Valor',
        cndConsultationNotPerformed: 'Consulta CND não realizada',
        scrBacenTitle: 'SCR Bacen - Histórico Bancário',
        institutions: 'instituições',
        operations: 'operações',
        profile: 'Perfil',
        bankingRelationship: 'Relacionamento Bancário',
        situation: 'Situação',
        values: 'Valores',
        volume: 'Volume',
        toDue: 'A Vencer',
        overdue: 'Vencido',
        indices: 'Índices',
        total: 'Total',
        card: 'Cartão',
        personalCredit: 'Crédito Pessoal',
        overdraft: 'Cheque Especial',
        scrBacenConsultationNotPerformed: 'Consulta SCR Bacen não realizada',
        negativeDetailTitle: 'Detalhamento Negativo - Pendências',
        protestsLower: 'protestos',
        actionsLower: 'ações',
        checksLower: 'cheques',
        quantity: 'Quantidade',
        totalValue: 'Valor Total',
        otherRestrictions: 'Outras Restrições',
        bouncedChecks: 'Cheques sem Fundo',
        recoveries: 'Recuperações',
        bankruptcies: 'Falências',
        protestDetails: 'Detalhes dos Protestos',
        protest: 'Protesto',
        otherProtests: '+{{count}} outros protestos',
        pendenciesConsultationNotPerformed: 'Consulta de pendências não realizada',
        analysisCard: {
          pdfGenerationError: 'Erro ao gerar PDF',
          pdfDossierError: 'Erro ao gerar PDF do dossiê',
          levelHigh: 'Alto',
          levelMedium: 'Médio',
          levelLow: 'Baixo',
          levelVeryLow: 'Muito Baixo',
          has: 'Possui',
          doesNotHave: 'Não possui',
          creditScore: 'Credit Score',
          debts: 'Débitos',
          hideDetails: 'Ocultar Detalhes',
          showDetails: 'Mostrar Detalhes',
          generatingPdf: 'Gerando PDF...',
          generateDossierPdf: 'Gerar PDF do Dossiê'
        }
      }
    },
    // Common terms
    common: {
      save: 'Salvar',
      cancel: 'Cancelar',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      language: 'Idioma',
      notInformed: 'Não informado',
      yes: 'Sim',
      no: 'Não'
    },
    // Admin module
    admin: {
      accessDenied: 'Acesso Negado',
      noPermission: 'Você não tem permissão para acessar esta área.',
      administrativeDashboard: 'Dashboard Administrativo',
      systemOverview: 'Visão geral completa do sistema Spark Comex',
      systemActive: 'Sistema Ativo',
      registeredImporters: 'Importadores Registrados',
      creditApplications: 'Aplicações de Crédito',
      totalImports: 'Total de Importações',
      financialVolume: 'Volume Financeiro',
      creditApplicationStatus: 'Status das Aplicações de Crédito',
      performanceAnalysis: 'Análise de Performance',
      status: {
        pendingAnalysis: 'Pendente Análise',
        underReview: 'Em Análise',
        preApproved: 'Pré-aprovado',
        finalApproved: 'Aprovado Final',
        rejected: 'Rejeitado'
      }
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
      underReview: 'Under Review',
      analysis: {
        title: '360° Credit Analysis',
        consulting: 'Consulting...',
        consultCreditScore: 'Consult Credit Score',
        notPerformed: 'Credit Analysis not performed',
        clickToStartAnalysis: 'Click "Consult Credit Score" to start the complete analysis',
        onlyForAdmins: 'Credit analysis available only for administrators',
        updating: 'Updating...',
        update: 'Update',
        scoreQuodTitle: 'QUOD Score - Credit Rating',
        points: '{{score}} points',
        outOf1000Points: 'out of 1000 points',
        riskAnalysis: 'Risk Analysis',
        paymentCapacity: 'Payment Capacity',
        hasDebts: 'Has Debts',
        protests: 'Protests',
        financialHistory: 'Financial History',
        bankruptcyRecovery: 'Bankruptcy/Recovery',
        lawsuits: 'Lawsuits',
        companyRegistrationTitle: 'Company Registration Plus - Corporate Data',
        companyData: 'Company Data',
        legalName: 'Legal Name',
        tradingName: 'Trading Name',
        shareCapital: 'Share Capital',
        contact: 'Contact',
        economicActivity: 'Economic Activity',
        mainActivity: 'Main Activity',
        secondaryActivities: 'Secondary Activities',
        otherActivities: '+{{count}} other activities',
        partners: 'Partners',
        cndTitle: 'CND - Negative Debt Certificates',
        notConsulted: 'Not Consulted',
        regularNoDebts: 'Regular - No Debts',
        certificate: 'Certificate',
        consultationNotPerformed: 'Consultation not performed',
        certificateInfo: 'Certificate Information',
        number: 'Number',
        validationCode: 'Validation Code',
        state: 'State',
        validity: 'Validity',
        issueDate: 'Issue Date',
        expiryDate: 'Expiry Date',
        debtsFound: 'Debts Found',
        debt: 'Debt',
        descriptionNotAvailable: 'Description not available',
        value: 'Value',
        cndConsultationNotPerformed: 'CND consultation not performed',
        scrBacenTitle: 'SCR Bacen - Banking History',
        institutions: 'institutions',
        operations: 'operations',
        profile: 'Profile',
        bankingRelationship: 'Banking Relationship',
        situation: 'Situation',
        values: 'Values',
        volume: 'Volume',
        toDue: 'To Due',
        overdue: 'Overdue',
        indices: 'Indices',
        total: 'Total',
        card: 'Card',
        personalCredit: 'Personal Credit',
        overdraft: 'Overdraft',
        scrBacenConsultationNotPerformed: 'SCR Bacen consultation not performed',
        negativeDetailTitle: 'Negative Detail - Pending Issues',
        protestsLower: 'protests',
        actionsLower: 'actions',
        checksLower: 'checks',
        quantity: 'Quantity',
        totalValue: 'Total Value',
        otherRestrictions: 'Other Restrictions',
        bouncedChecks: 'Bounced Checks',
        recoveries: 'Recoveries',
        bankruptcies: 'Bankruptcies',
        protestDetails: 'Protest Details',
        protest: 'Protest',
        otherProtests: '+{{count}} other protests',
        pendenciesConsultationNotPerformed: 'Pending issues consultation not performed',
        analysisCard: {
          pdfGenerationError: 'Error generating PDF',
          pdfDossierError: 'Error generating dossier PDF',
          levelHigh: 'High',
          levelMedium: 'Medium',
          levelLow: 'Low',
          levelVeryLow: 'Very Low',
          has: 'Has',
          doesNotHave: 'Does not have',
          creditScore: 'Credit Score',
          debts: 'Debts',
          hideDetails: 'Hide Details',
          showDetails: 'Show Details',
          generatingPdf: 'Generating PDF...',
          generateDossierPdf: 'Generate Dossier PDF'
        }
      }
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      language: 'Language',
      notInformed: 'Not informed',
      yes: 'Yes',
      no: 'No'
    },
    // Admin module
    admin: {
      accessDenied: 'Access Denied',
      noPermission: 'You do not have permission to access this area.',
      administrativeDashboard: 'Administrative Dashboard',
      systemOverview: 'Complete overview of the Spark Comex system',
      systemActive: 'System Active',
      registeredImporters: 'Registered Importers',
      creditApplications: 'Credit Applications',
      totalImports: 'Total Imports',
      financialVolume: 'Financial Volume',
      creditApplicationStatus: 'Credit Application Status',
      performanceAnalysis: 'Performance Analysis',
      status: {
        pendingAnalysis: 'Pending Analysis',
        underReview: 'Under Review',
        preApproved: 'Pre-approved',
        finalApproved: 'Final Approved',
        rejected: 'Rejected'
      }
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
    common: {
      save: '保存',
      cancel: '取消',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      language: '语言'
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
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      language: 'Idioma'
    }
  },
  ru: {
    auth: {
      platformDescription: 'Полная платформа кредитования и импорта для бразильских компаний',
      secure: 'Безопасно',
      fast: 'Быстро',
      efficient: 'Эффективно',
      login: 'Войти',
      register: 'Регистрация',
      email: 'Эл. почта',
      password: 'Пароль',
      rememberMe: 'Запомнить меня',
      forgotPassword: 'Забыли пароль?',
      dontHaveAccount: 'Нет аккаунта?',
      alreadyHaveAccount: 'Уже есть аккаунт?',
      loginSuccess: 'Вход выполнен успешно',
      registerSuccess: 'Регистрация выполнена успешно'
    },
    credit: {
      title: 'Кредитные заявки',
      newApplication: 'Новая заявка',
      requestedAmount: 'Запрашиваемая сумма',
      status: 'Статус',
      details: 'Просмотр деталей',
      edit: 'Редактировать',
      cancel: 'Отмена',
      pending: 'В ожидании',
      approved: 'Одобрено',
      rejected: 'Отклонено',
      underReview: 'На рассмотрении'
    },
    common: {
      save: 'Сохранить',
      cancel: 'Отмена',
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      language: 'Язык'
    }
  },
  fr: {
    auth: {
      platformDescription: 'Plateforme complète de crédit et d\'importation pour les entreprises brésiliennes',
      secure: 'Sécurisé',
      fast: 'Rapide',
      efficient: 'Efficace',
      login: 'Connexion',
      register: 'S\'inscrire',
      email: 'E-mail',
      password: 'Mot de passe',
      rememberMe: 'Se souvenir de moi',
      forgotPassword: 'Mot de passe oublié?',
      dontHaveAccount: 'Pas de compte?',
      alreadyHaveAccount: 'Déjà un compte?',
      loginSuccess: 'Connexion réussie',
      registerSuccess: 'Inscription réussie'
    },
    credit: {
      title: 'Demandes de crédit',
      newApplication: 'Nouvelle demande',
      requestedAmount: 'Montant demandé',
      status: 'Statut',
      details: 'Voir les détails',
      edit: 'Modifier',
      cancel: 'Annuler',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      underReview: 'En cours d\'examen'
    },
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      language: 'Langue'
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