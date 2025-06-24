import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const isSuperAdmin = user?.email === "pavaosmart@gmail.com";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || isSuperAdmin;
  const isImporter = user?.role === "importer" || (!isAdmin && user?.role !== "financeira");

  useEffect(() => {
    // Se não é admin ou é importador, redireciona para dashboard
    if (!isAdmin || isImporter) {
      setLocation("/");
    }
  }, [isAdmin, isImporter, setLocation]);

  // Se não é admin ou é importador, não renderiza nada
  if (!isAdmin || isImporter) {
    return null;
  }

  return <>{children}</>;
}