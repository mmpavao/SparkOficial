/**
 * Role-based utilities for cleaner code organization
 */
import type { UserRole } from "@/types";

export function getRoleDisplayName(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    super_admin: "Super Administrador",
    admin: "Administrador", 
    importer: "Importador",
    inactive: "Inativo"
  };
  return roleMap[role] || "Usuário";
}

export function hasAdminAccess(role?: string): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function isSuperAdmin(role?: string): boolean {
  return role === 'super_admin';
}

export function canManageUsers(role?: string): boolean {
  return isSuperAdmin(role);
}

export function canViewAdminPanel(role?: string): boolean {
  return hasAdminAccess(role);
}

export function getGreeting(t?: (key: string) => string): string {
  const hour = new Date().getHours();
  if (!t) {
    // Fallback for when t is not available
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }
  
  if (hour < 12) return t("common.goodMorning");
  if (hour < 18) return t("common.goodAfternoon");
  return t("common.goodEvening");
}

export function getFirstName(fullName?: string, t?: (key: string) => string): string {
  const fallback = t ? t("common.user") : "Usuário";
  return fullName?.split(' ')[0] || fallback;
}