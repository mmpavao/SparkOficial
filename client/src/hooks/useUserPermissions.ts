import { useAuth } from "./useAuth";

export function useUserPermissions() {
  const { user } = useAuth();
  
  // Verificar se é administrador (baseado apenas no role da database)
  const isAdmin = user?.role === "admin";
  
  // Verificar se é financeira
  const isFinanceira = user?.role === "financeira";
  
  // Verificar se é super admin (baseado apenas no role da database)
  const isSuperAdmin = user?.role === "super_admin";
  
  return {
    isAdmin,
    isFinanceira,
    isSuperAdmin,
    canViewAllApplications: isAdmin || isFinanceira,
    canManageApplications: isAdmin,
    canViewAdminFilters: isAdmin || isFinanceira,
    canPerformPreAnalysis: isAdmin,
    canApproveCredit: isFinanceira,
    canManageUsers: isSuperAdmin,
    canViewOwnDataOnly: !isAdmin && !isFinanceira,
  };
}