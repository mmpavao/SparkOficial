
import type { User } from "@shared/schema";

export function getUserRole(user?: User | null) {
  if (!user) return null;
  
  const isSuperAdmin = user.email === "pavaosmart@gmail.com";
  const isAdmin = user.role === "admin" || isSuperAdmin;
  const isFinanceira = user.role === "financeira";
  const isImporter = user.role === "importer" || (!isAdmin && !isFinanceira);
  
  return {
    isSuperAdmin,
    isAdmin,
    isFinanceira,
    isImporter,
    role: user.role
  };
}

export function checkPermissions(user?: User | null) {
  const roles = getUserRole(user);
  
  if (!roles) {
    return {
      canViewAdminPanel: false,
      canManageUsers: false,
      canViewAllData: false,
      canApproveCredit: false,
      canPreApproveCredit: false,
      canViewOwnDataOnly: true
    };
  }
  
  return {
    canViewAdminPanel: roles.isAdmin,
    canManageUsers: roles.isSuperAdmin,
    canViewAllData: roles.isAdmin || roles.isFinanceira,
    canApproveCredit: roles.isFinanceira,
    canPreApproveCredit: roles.isAdmin,
    canViewOwnDataOnly: roles.isImporter
  };
}
