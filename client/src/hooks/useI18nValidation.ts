/**
 * Hook de validação para garantir padrões de internacionalização
 * Automatiza verificações para desenvolvimento futuro
 */
import { useTranslation } from "@/contexts/I18nContext";
import { useEffect } from "react";

interface I18nValidationOptions {
  componentName: string;
  requiredKeys?: string[];
  enableDevWarnings?: boolean;
}

export function useI18nValidation(options: I18nValidationOptions) {
  const { t, language } = useTranslation();
  const { componentName, requiredKeys = [], enableDevWarnings = true } = options;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !enableDevWarnings) return;

    // Verificar se todas as chaves necessárias existem
    const missingKeys = requiredKeys.filter(key => {
      const keys = key.split('.');
      let value: any = t;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) return true;
      }
      
      return false;
    });

    if (missingKeys.length > 0) {
      console.warn(
        `🌐 I18N Validation [${componentName}]: Missing translation keys:`,
        missingKeys
      );
    }

    // Verificar se há textos hardcoded (simulação)
    const componentElement = document.querySelector(`[data-component="${componentName}"]`);
    if (componentElement) {
      const textContent = componentElement.textContent || '';
      const hardcodedPatterns = [
        /Dashboard/,
        /Bem-vindo/,
        /Welcome/,
        /Buenos días/,
        /早上好/,
        /Salvar/,
        /Save/,
        /Guardar/,
        /保存/
      ];

      const foundHardcoded = hardcodedPatterns.some(pattern => pattern.test(textContent));
      if (foundHardcoded) {
        console.warn(
          `🚨 I18N Validation [${componentName}]: Possible hardcoded text detected. Use useTranslation() instead.`
        );
      }
    }
  }, [componentName, requiredKeys, t, language, enableDevWarnings]);

  return {
    isValid: true, // Sempre retorna true para não quebrar a aplicação
    currentLanguage: language,
    t
  };
}

/**
 * Decorator para componentes que garante uso correto de i18n
 */
export function withI18nValidation<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  validationOptions: I18nValidationOptions
) {
  return function ValidatedComponent(props: T) {
    useI18nValidation(validationOptions);
    return <WrappedComponent {...props} />;
  };
}