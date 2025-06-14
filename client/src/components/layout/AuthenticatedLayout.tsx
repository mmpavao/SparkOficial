import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import AIInsightsButton from "@/components/ai-insights/AIInsightsButton";
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
  ChevronRight
} from "lucide-react";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no logout",
        description: error.message || "Erro ao fazer logout.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigationItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/credit", icon: CreditCard, label: "Crédito" },
    { path: "/imports", icon: Truck, label: "Importações" },
    { path: "/reports", icon: BarChart3, label: "Relatórios" },
    { path: "/settings", icon: Settings, label: "Configurações" },
    ...(user?.email === "pavaosmart@gmail.com" ? [{ path: "/admin", icon: Shield, label: "Administração" }] : []),
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

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
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
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className={`flex items-center mb-3 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <div className="w-8 h-8 bg-spark-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.fullName && getInitials(user.fullName)}
            </div>
            <div className={`ml-3 min-w-0 flex-1 transition-opacity duration-300 ${
              sidebarCollapsed ? "lg:opacity-0 lg:pointer-events-none" : "opacity-100"
            }`}>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.companyName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className={`w-full text-red-600 hover:bg-red-50 hover:text-red-700 ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-start"
            }`}
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 lg:mr-0 mr-2" />
            <span className={`transition-opacity duration-300 ${
              sidebarCollapsed ? "lg:opacity-0 lg:absolute lg:pointer-events-none" : "opacity-100"
            }`}>
              {logoutMutation.isPending ? "Saindo..." : "Sair"}
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
                <Menu className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* AI Insights Button */}
      <AIInsightsButton />
    </div>
  );
}