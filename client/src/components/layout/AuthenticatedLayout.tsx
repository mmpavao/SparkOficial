import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

import NotificationCenter from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import sparkLogo from "@assets/logo-spark_1751323949667.png";
import sparkIcon from "@assets/APP-ICON_1751299739129.png";
import LanguageSelector from "@/components/ui/language-selector";
import { 
  Menu, 
  X, 
  Home, 
  CreditCard, 
  Building,
  BarChart3, 
  DollarSign,
  Settings, 
  Shield,
  LogOut,
  Bell,
  ChevronLeft,
  LayoutDashboard,
  ChevronRight,
  Users,
  UserCog,
  FileCheck,
  Truck,
  Package,
  MessageSquare
} from "lucide-react";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        return await apiRequest("/api/auth/logout", "POST");
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

  // Verificar se o usuário tem acesso administrativo
  const isSuperAdmin = user?.email === "pavaosmart@gmail.com";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || isSuperAdmin;
  const isFinanceira = user?.role === "financeira";
  const isCustomsBroker = user?.role === "customs_broker";
  const isImporter = user?.role === "importer" || (!isAdmin && !isFinanceira && !isCustomsBroker);

  // Navegação adaptada por role
  const getNavigation = () => {
    if (isCustomsBroker) {
      return [
        { path: "/", icon: Home, label: t("navigation.dashboard") },
        { 
          path: "/imports", 
          icon: Package, 
          label: t("navigation.assignedImports")
        },
        { 
          path: "/suppliers", 
          icon: Building, 
          label: t("navigation.suppliers")
        },
        { 
          path: "/products", 
          icon: Package, 
          label: "Produtos"
        },
        { path: "/reports", icon: BarChart3, label: "Relatórios" },
      ];
    }

    return [
      { path: "/", icon: Home, label: t("navigation.dashboard") },
      { 
        path: "/credit", 
        icon: CreditCard, 
        label: (isAdmin || isFinanceira) ? t("navigation.creditAnalysis") : t("navigation.credit") 
      },
      { 
        path: "/imports", 
        icon: Package, 
        label: isFinanceira 
          ? t("navigation.importsAnalysis")
          : isAdmin 
            ? t("navigation.allImports")
            : t("navigation.myImports")
      },
      { 
        path: "/suppliers", 
        icon: Building, 
        label: isFinanceira 
          ? t("navigation.allSuppliers")
          : isAdmin 
            ? t("navigation.allSuppliers")
            : t("navigation.suppliers")
      },
      { 
        path: "/products", 
        icon: Package, 
        label: t("navigation.products")
      },
      { path: "/payments", icon: DollarSign, label: t("navigation.payments") },
      // Suporte só aparece para importadores na navegação principal
      ...(isImporter ? [{ path: "/support", icon: MessageSquare, label: t("navigation.support") }] : []),
      { path: "/reports", icon: BarChart3, label: t("navigation.reports") },
    ];
  };

  const navigation = getNavigation();

  // Navegação adicional apenas para admins
  const adminOnlyNavigation = [
    { path: "/users", icon: Users, label: t("navigation.manageUsers") },
    { path: "/importers", icon: UserCog, label: t("navigation.importers") },
    { path: "/admin/support", icon: MessageSquare, label: t("navigation.support") },
  ];

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
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } lg:translate-x-0 w-64`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className={`transition-opacity duration-300 ${sidebarCollapsed ? "lg:opacity-0 lg:pointer-events-none" : "opacity-100"}`}>
            <img 
              src={sparkLogo} 
              alt="Spark Comex" 
              className="h-12 w-auto ml-[12px] mr-[12px]"
            />
          </div>
          {/* Ícone do Spark Comex quando sidebar está fechada */}
          <div className={`transition-opacity duration-300 ${sidebarCollapsed ? "lg:opacity-100 lg:absolute lg:left-6 lg:top-6" : "lg:opacity-0 lg:pointer-events-none"}`}>
            <img 
              src={sparkIcon} 
              alt="Spark Comex" 
              className="h-8 w-8"
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
                  <div key={item.path}>
                    <Button
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
                      <Icon className={`lg:mr-0 mr-3 ${sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"}`} />
                      <span className={`transition-opacity duration-300 ${
                        sidebarCollapsed ? "lg:opacity-0 lg:absolute lg:pointer-events-none" : "opacity-100"
                      }`}>
                        {item.label}
                      </span>
                    </Button>


                  </div>
                );
              })}
            </div>
          </div>



          {/* Navegação Administrativa - APENAS para admins e super admins */}
          {(isAdmin && !isImporter) && (
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
                      <Icon className={`lg:mr-0 mr-3 ${sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"}`} />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full p-3 h-auto hover:bg-gray-50 justify-start"
              >
                <div className="flex items-center w-full">
                  <div className={`flex ${sidebarCollapsed ? "lg:justify-center lg:w-full" : "items-center w-full"}`}>
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={user?.avatar ? user.avatar : undefined} />
                      <AvatarFallback className="bg-spark-600 text-white text-sm font-medium">
                        {user?.fullName && getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`ml-3 min-w-0 flex-1 text-left transition-opacity duration-300 ${
                      sidebarCollapsed ? "lg:opacity-0 lg:absolute lg:pointer-events-none" : "opacity-100"
                    }`}>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.role === "admin" ? "Administrador" : user?.role === "financeira" ? "Financeira" : "Importador"}
                      </p>
                    </div>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 mb-2">
              {/* Header do usuário no dropdown */}
              <div className="px-3 py-3 border-b">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.avatar ? user.avatar : undefined} />
                    <AvatarFallback className="bg-spark-600 text-white text-sm font-medium">
                      {user?.fullName && getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {user?.email}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user?.role === "admin" 
                          ? "bg-blue-100 text-blue-800" 
                          : user?.role === "financeira" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-green-100 text-green-800"
                      }`}>
                        {user?.role === "admin" ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Spark Admin
                          </>
                        ) : user?.role === "financeira" ? (
                          <>
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Financeira
                          </>
                        ) : (
                          <>
                            <Truck className="w-3 h-3 mr-1" />
                            Importador
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center w-full px-3 py-2">
                    <Settings className="w-4 h-4 mr-3" />
                    {t("navigation.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* Versão Beta */}
                <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Spark Comex Beta</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>v1.0.3</span>
                    </div>
                  </div>
                  <div className="mt-1 text-gray-400">
                    09/07/2025 - 2:45 AM
                  </div>
                  <div className="mt-1 text-gray-400">
                    Sistema Estável
                  </div>
                </div>
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-red-600 focus:text-red-600 px-3 py-2"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {logoutMutation.isPending ? `${t("navigation.logout")}...` : t("navigation.logout")}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      {/* Fixed Top Header */}
      <header className={`fixed top-0 right-0 bg-white shadow-sm border-b z-30 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "lg:left-20" : "lg:left-64"
      } left-0`}>
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

          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <NotificationCenter />
          </div>
        </div>
      </header>

      {/* Main Content with top padding for fixed header */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      }`}>
        <main className="p-6 pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}