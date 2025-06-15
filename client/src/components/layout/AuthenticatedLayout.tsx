import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/contexts/I18nContext";
import LanguageSelector from "@/components/ui/language-selector";
import sparkLogo from "@assets/SPARK-COMEX-SITE_1749848527200.png";
import { 
  Menu, 
  X, 
  Home, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Settings, 
  Shield,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCog,
  FileCheck
} from "lucide-react";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        return await apiRequest("POST", "/api/auth/logout");
      } catch (error) {
        console.error("Logout API error:", error);
        // Even if API fails, proceed with client-side cleanup
        throw error;
      }
    },
    onSuccess: () => {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear any localStorage/sessionStorage data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to home page
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Logout error:", error);
      
      // Even on error, clear client-side data and redirect
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      // Show error but still redirect after a short delay
      toast({
        title: "Logout",
        description: "Logout realizado (sessão pode persistir no servidor)",
        variant: "default",
      });
      
      // Force redirect after 1 second
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Navegação unificada - mesmas telas para todos, com funcionalidades condicionais
  const navigation = [
    { path: "/", icon: Home, label: t.nav.dashboard },
    { path: "/credit", icon: CreditCard, label: t.nav.credit },
    { path: "/imports", icon: Truck, label: t.nav.imports },
    { path: "/reports", icon: BarChart3, label: t.nav.reports },
    { path: "/settings", icon: Settings, label: t.nav.settings },
  ];

  // Navegação adicional apenas para admins
  const adminOnlyNavigation = [
    { path: "/users", icon: Users, label: "Gerenciar Usuários" },
  ];

  // Verificar se o usuário tem acesso administrativo
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";

  const isActiveRoute = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 bg-white shadow-lg transform transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        } lg:translate-x-0 w-64`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className={`transition-opacity duration-300 ${sidebarCollapsed ? "lg:opacity-0 lg:pointer-events-none" : "opacity-100"}`}>
            <img 
              src={sparkLogo} 
              alt="Spark Comex" 
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <nav className="p-4 space-y-4">
          {/* Navegação Principal */}
          <div>
            <div className={`mb-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
                SPARK COMEX
              </h3>
            </div>
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.path);
                
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={`w-full transition-colors ${
                      sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-start"
                    } ${
                      active 
                        ? "text-spark-600 bg-spark-50 hover:bg-spark-100" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setLocation(item.path)}
                  >
                    <Icon className="w-4 h-4 lg:mr-0 mr-3" />
                    <span className={`transition-opacity duration-300 ${
                      sidebarCollapsed ? "lg:opacity-0 lg:absolute lg:pointer-events-none" : "opacity-100"
                    }`}>
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Navegação Administrativa */}
          {isAdmin && (
            <div>
              <div className={`mb-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
                  ADMINISTRAÇÃO
                </h3>
              </div>
              <div className="space-y-1">
                {adminOnlyNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(item.path);
                  
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className={`w-full transition-colors ${
                        sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-start"
                      } ${
                        active 
                          ? "text-spark-600 bg-spark-50 hover:bg-spark-100" 
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setLocation(item.path)}
                    >
                      <Icon className="w-4 h-4 lg:mr-0 mr-3" />
                      <span className={`transition-opacity duration-300 ${
                        sidebarCollapsed ? "lg:opacity-0 lg:absolute lg:pointer-events-none" : "opacity-100"
                      }`}>
                        {item.label}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className={`flex items-center mb-3 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <div className="w-8 h-8 bg-spark-600 rounded-full flex items-center justify-center text-white text-sm font-medium text-center ml-[0px] mr-[0px] pl-[9px] pr-[9px]">
              {user?.fullName && getInitials(user.fullName)}
            </div>
            <div className={`ml-3 min-w-0 flex-1 transition-opacity duration-300 ${
              sidebarCollapsed ? "lg:opacity-0 lg:pointer-events-none" : "opacity-100"
            }`}>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role === "admin" ? t.roles.admin : t.roles.importer}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className={`w-full transition-colors hover:bg-red-50 hover:text-red-600 ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-start"
            }`}
          >
            <LogOut className="w-4 h-4 lg:mr-0 mr-3" />
            <span className={`transition-opacity duration-300 ${
              sidebarCollapsed ? "lg:opacity-0 lg:absolute lg:pointer-events-none" : "opacity-100"
            }`}>
              {logoutMutation.isPending ? `${t.nav.logout}...` : t.nav.logout}
            </span>
          </Button>
        </div>
      </div>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      }`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="mr-4 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Spark Comex
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}