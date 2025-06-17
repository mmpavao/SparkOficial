
import { useAuth } from "./useAuth";

export function useUnifiedEndpoints() {
  const { user } = useAuth();
  
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";
  const isFinanceira = user?.role === "financeira";
  const isSuperAdmin = user?.email === "pavaosmart@gmail.com";
  
  const getEndpoint = (baseEndpoint: string) => {
    if (isFinanceira) {
      return `/api/financeira/${baseEndpoint}`;
    } else if (isAdmin) {
      return `/api/admin/${baseEndpoint}`;
    } else {
      return `/api/${baseEndpoint}`;
    }
  };
  
  const getAllQueryKeys = (baseEndpoint: string) => {
    return [
      `/api/${baseEndpoint}`,
      `/api/admin/${baseEndpoint}`,
      `/api/financeira/${baseEndpoint}`
    ];
  };
  
  const invalidateAllRelatedQueries = (queryClient: any, baseEndpoint: string) => {
    getAllQueryKeys(baseEndpoint).forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };
  
  return {
    isAdmin,
    isFinanceira,
    isSuperAdmin,
    getEndpoint,
    getAllQueryKeys,
    invalidateAllRelatedQueries,
    permissions: {
      canViewAllApplications: isAdmin || isFinanceira,
      canManageApplications: isAdmin,
      canViewAdminFilters: isAdmin || isFinanceira,
      canPerformPreAnalysis: isAdmin,
      canApproveCredit: isFinanceira,
      canManageUsers: isSuperAdmin,
      canViewOwnDataOnly: !isAdmin && !isFinanceira,
    }
  };
}
