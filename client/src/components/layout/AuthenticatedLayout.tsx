import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CreditCard, 
  FileInput, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut,
  Menu,
  X,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useTranslation } from "@/contexts/I18nContext";
import LanguageSelector from "@/components/ui/language-selector";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { canAccessAdmin } = useUserPermissions();

  // Usar try/catch para capturar problemas de contexto
  let t, language;
  try {
    const translation = useTranslation();
    t = translation.t;
    language = translation.language;
  } catch (error) {
    console.error('AuthenticatedLayout: useTranslation error:', error);
    // Fallback para valores padrão
    t = {
      nav: {
        dashboard: 'Dashboard',
        credit: 'Crédito',
        imports: 'Importações',
        reports: 'Relatórios',
        settings: 'Configurações',
        users: 'Usuários',
        logout: 'Sair'
      }
    };
    language = 'pt';
  }

  const navigation = [
    { name: t.nav.dashboard, href: "/", icon: LayoutDashboard },
    { name: t.nav.credit, href: "/credit", icon: CreditCard },
    { name: t.nav.imports, href: "/imports", icon: FileInput },
    { name: "Fornecedores", href: "/suppliers", icon: Truck },
    { name: t.nav.reports, href: "/reports", icon: BarChart3 },
    { name: t.nav.settings, href: "/settings", icon: Settings },
  ];

  if (canAccessAdmin) {
    navigation.push({ name: t.nav.users, href: "/users", icon: Users });
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-spark-500 to-spark-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Spark Comex</h1>
                <p className="text-xs text-gray-500">Importação Inteligente</p>
              </div>
            </div>

            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/" && location.startsWith(item.href));

              return (
                <Link key={item.name} href={item.href}>
                  <a className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-spark-50 text-spark-700 border-r-2 border-spark-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Language Selector */}
            <div className="px-2">
              <LanguageSelector />
            </div>

            {/* User info */}
            {user && (
              <div className="px-2">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
                <div className="text-xs text-gray-400 capitalize">{user.role}</div>
              </div>
            )}

            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.nav.logout}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-lg font-semibold text-gray-900">Spark Comex</div>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}