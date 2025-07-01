
import { useEffect } from 'react';
import { useTranslation } from '@/contexts/I18nContext';

interface I18nValidationOptions {
  componentName: string;
  requiredKeys: string[];
  warnOnMissingTranslations?: boolean;
}

/**
 * Hook para validar implementação de i18n em componentes
 * Ajuda a garantir que todos os componentes sigam os padrões estabelecidos
 */
export const useI18nValidation = ({
  componentName,
  requiredKeys,
  warnOnMissingTranslations = true
}: I18nValidationOptions) => {
  const { t, language } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && warnOnMissingTranslations) {
      // Validar se todas as chaves requeridas existem
      const missingKeys: string[] = [];
      
      requiredKeys.forEach(key => {
        const translation = t(key);
        // Se a tradução retornou a própria chave, significa que não foi encontrada
        if (translation === key) {
          missingKeys.push(key);
        }
      });

      if (missingKeys.length > 0) {
        console.group(`🌍 I18n Validation - ${componentName}`);
        console.warn(`Missing translations for language: ${language}`);
        console.table(missingKeys.map(key => ({ key, component: componentName })));
        console.groupEnd();
      }
    }
  }, [componentName, requiredKeys, t, language, warnOnMissingTranslations]);

  return { t, language };
};

/**
 * Decorator para componentes que precisam de validação de i18n
 */
export const withI18nValidation = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  validationOptions: I18nValidationOptions
) => {
  return (props: T) => {
    useI18nValidation(validationOptions);
    return <Component {...props} />;
  };
};

/**
 * Utilitário para verificar se uma chave de tradução existe
 */
export const hasTranslation = (key: string, t: (key: string) => string): boolean => {
  return t(key) !== key;
};

/**
 * Utilitário para obter tradução com fallback customizado
 */
export const getTranslationWithFallback = (
  key: string,
  fallback: string,
  t: (key: string) => string
): string => {
  const translation = t(key);
  return translation === key ? fallback : translation;
};
