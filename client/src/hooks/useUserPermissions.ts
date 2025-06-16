import { useAuth } from "./useAuth";

export function useUserPermissions() {
  const { user } = useAuth();
  
  // Verificar se é administrador
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";
  
  // Verificar se é financeira
  const isFinanceira = user?.role === "financeira";
  
  // Verificar se é super admin
  const isSuperAdmin = user?.email === "pavaosmart@gmail.com";
  
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