import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const useI18nToast = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  return {
    // Success messages
    success: (titleKey: string, descriptionKey: string, options?: any) => {
      toast({
        title: t(titleKey, options),
        description: t(descriptionKey, options),
        variant: 'default'
      });
    },

    // Error messages
    error: (titleKey: string, descriptionKey: string, options?: any) => {
      toast({
        title: t(titleKey, options),
        description: t(descriptionKey, options),
        variant: 'destructive'
      });
    },

    // Warning messages
    warning: (titleKey: string, descriptionKey: string, options?: any) => {
      toast({
        title: t(titleKey, options),
        description: t(descriptionKey, options),
        variant: 'default'
      });
    },

    // Info messages
    info: (titleKey: string, descriptionKey: string, options?: any) => {
      toast({
        title: t(titleKey, options),
        description: t(descriptionKey, options),
        variant: 'default'
      });
    },

    // Common toast messages
    common: {
      saved: () => toast({
        title: t('toast.success'),
        description: t('toast.savedSuccessfully'),
        variant: 'default'
      }),

      deleted: () => toast({
        title: t('toast.success'),
        description: t('toast.deletedSuccessfully'),
        variant: 'default'
      }),

      updated: () => toast({
        title: t('toast.success'),
        description: t('toast.updatedSuccessfully'),
        variant: 'default'
      }),

      error: () => toast({
        title: t('toast.error'),
        description: t('toast.genericError'),
        variant: 'destructive'
      }),

      validationError: () => toast({
        title: t('toast.validationError'),
        description: t('toast.checkFields'),
        variant: 'destructive'
      }),

      loginSuccess: () => toast({
        title: t('toast.success'),
        description: t('auth.loginSuccess'),
        variant: 'default'
      }),

      loginError: () => toast({
        title: t('toast.error'),
        description: t('auth.loginError'),
        variant: 'destructive'
      }),

      registerSuccess: () => toast({
        title: t('toast.success'),
        description: t('auth.registerSuccess'),
        variant: 'default'
      }),

      registerError: () => toast({
        title: t('toast.error'),
        description: t('auth.registerError'),
        variant: 'destructive'
      })
    }
  };
};