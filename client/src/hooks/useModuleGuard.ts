
import { useEffect } from 'react';
import { useAuth } from './useAuth';

interface ModuleGuardOptions {
  allowedRoles: string[];
  componentName: string;
  onUnauthorized?: () => void;
}

export function useModuleGuard({ allowedRoles, componentName, onUnauthorized }: ModuleGuardOptions) {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role)) {
      console.error(`🔒 PROTEÇÃO MODULAR: ${user?.role} não autorizado para ${componentName}`);
      console.error(`🔒 Roles permitidos: ${allowedRoles.join(', ')}`);
      
      if (onUnauthorized) {
        onUnauthorized();
      }
      
      // Previne renderização não autorizada
      throw new Error(`Acesso não autorizado ao componente ${componentName}`);
    }
  }, [user, allowedRoles, componentName, onUnauthorized]);
  
  return {
    isAuthorized: user && allowedRoles.includes(user.role),
    userRole: user?.role
  };
}
