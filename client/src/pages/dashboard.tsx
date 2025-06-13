import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Menu, 
  X, 
  Home, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Plus,
  FileText,
  Package,
  PiggyBank
} from "lucide-react";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-xl font-bold text-spark-600">SPARK</h1>
            <p className="text-sm text-gray-600">COMEX</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-spark-600 bg-spark-50 hover:bg-spark-100"
          >
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
            <CreditCard className="w-4 h-4 mr-3" />
            Crédito
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
            <Truck className="w-4 h-4 mr-3" />
            Importações
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
            <BarChart3 className="w-4 h-4 mr-3" />
            Relatórios
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
            <Settings className="w-4 h-4 mr-3" />
            Configurações
          </Button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-spark-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.fullName && getInitials(user.fullName)}
            </div>
            <div className="ml-3 min-w-0 flex-1">
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
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Saindo..." : "Sair"}
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
      <div className="lg:ml-64">
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
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-spark-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.fullName && getInitials(user.fullName)}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.fullName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Welcome Section */}
          <div className="bg-gradient-spark rounded-xl p-6 text-white mb-8">
            <h2 className="text-2xl font-bold mb-2">Bem-vindo à Spark Comex!</h2>
            <p className="opacity-90">
              Gerencie seus créditos e importações da China de forma simples e eficiente.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Crédito Disponível</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                    <p className="text-xs text-gray-500 mt-1">Configure seu limite</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Importações Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-1">Nenhuma importação</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Importado</p>
                    <p className="text-2xl font-bold text-gray-900">R$ 0</p>
                    <p className="text-xs text-gray-500 mt-1">Comece agora</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Economia Total</p>
                    <p className="text-2xl font-bold text-gray-900">R$ 0</p>
                    <p className="text-xs text-gray-500 mt-1">Potencial de economia</p>
                  </div>
                  <div className="w-12 h-12 bg-spark-100 rounded-lg flex items-center justify-center">
                    <PiggyBank className="w-6 h-6 text-spark-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Importações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Nenhuma importação encontrada</p>
                  <p className="text-sm text-gray-400">
                    Suas importações aparecerão aqui quando você começar a usar a plataforma.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-between bg-spark-50 hover:bg-spark-100 text-gray-900 border border-spark-200">
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 text-spark-600 mr-3" />
                    <span className="font-medium">Nova Importação</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 text-gray-600 mr-3" />
                    <span className="font-medium">Solicitar Crédito</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-600 mr-3" />
                    <span className="font-medium">Gerar Relatório</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
