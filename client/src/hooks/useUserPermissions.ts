import { useAuth } from "./useAuth";

export function useUserPermissions() {
  const { user } = useAuth();
  
  // Verificar se é administrador
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";
  
  // Verificar se é super admin
  const isSuperAdmin = user?.email === "pavaosmart@gmail.com";
  
  return {
    isAdmin,
    isSuperAdmin,
    canViewAllApplications: isAdmin,
    canManageApplications: isAdmin,
    canViewAdminFilters: isAdmin,
    canPerformPreAnalysis: isAdmin,
    canManageUsers: isSuperAdmin,
    canViewOwnDataOnly: !isAdmin,
  };
}