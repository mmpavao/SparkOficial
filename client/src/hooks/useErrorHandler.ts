import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

import { useTranslation } from '@/contexts/I18nContext';
export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: any, customMessage?: string) => {
    console.error('Error occurred:', error);
    
    let message = customMessage || 'Ocorreu um erro inesperado';
    
    if (error?.message) {
      if (error.message.includes('401')) {
        message = 'Sessão expirada. Faça login novamente.';
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else if (error.message.includes('403')) {
        message = 'Você não tem permissão para esta ação.';
      } else if (error.message.includes('404')) {
        message = 'Recurso não encontrado.';
      } else if (error.message.includes('500')) {
        message = 'Erro interno do servidor. Tente novamente.';
      }
    }

    toast({
      title: "Erro",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  const handleSuccess = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  }, [toast]);

  return { handleError, handleSuccess };
}