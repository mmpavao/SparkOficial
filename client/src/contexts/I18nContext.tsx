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
      registerSuccess: 'Cadastro realizado com sucesso'
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