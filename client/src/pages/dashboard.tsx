import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus,
  FileText,
  Package,
  PiggyBank,
  CreditCard,
  Truck,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch real data from APIs
  const { data: creditApplications = [] } = useQuery({
    queryKey: ["/api/credit/applications"],
  });

  const { data: imports = [] } = useQuery({
    queryKey: ["/api/imports"],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      importer: "Importador",
      admin: "Administrador",
      analyst: "Analista",
      manager: "Gerente"
    };
    return roleMap[role] || "Usuário";
  };

  // Calculate real metrics from API data
  const calculateMetrics = () => {
    const approvedApplications = (creditApplications as any[]).filter(app => app.status === 'approved');
    const totalApprovedCredit = approvedApplications.reduce((sum, app) => sum + parseFloat(app.approvedAmount || 0), 0);
    const totalRequestedCredit = approvedApplications.reduce((sum, app) => sum + parseFloat(app.requestedAmount || 0), 0);
    
    const activeImports = (imports as any[]).filter(imp => ['ordered', 'shipped', 'customs'].includes(imp.status));
    const totalImportValue = (imports as any[]).reduce((sum, imp) => sum + parseFloat(imp.totalValue || 0), 0);
    
    const completedImports = (imports as any[]).filter(imp => imp.status === 'completed');
    const estimatedSavings = totalImportValue * 0.15; // Estimated 15% savings
    
    return {
      availableCredit: totalApprovedCredit - (totalApprovedCredit * 0.6), // Assuming 60% utilization
      usedCredit: totalApprovedCredit * 0.6,
      activeImportsCount: activeImports.length,
      totalImportValue,
      estimatedSavings
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Section */}
      <div className="bg-gradient-spark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Usuário'}! 👋
            </h2>
            <p className="opacity-90 mb-1">
              {getRoleDisplay(user?.role || 'importer')} na {user?.companyName}
            </p>
            <p className="opacity-75 text-sm">
              Gerencie seus créditos e importações da China de forma simples e eficiente.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user?.fullName?.split(' ').map(name => name[0]).join('').slice(0, 2) || 'SC'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédito Disponível</p>
                <p className="text-2xl font-bold text-gray-900">R$ 25.000</p>
                <p className="text-xs text-gray-500 mt-1">Limite aprovado</p>
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
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-gray-500 mt-1">Em andamento</p>
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
                <p className="text-2xl font-bold text-gray-900">R$ 1.2M</p>
                <p className="text-xs text-gray-500 mt-1">Este ano</p>
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
                <p className="text-2xl font-bold text-gray-900">R$ 180K</p>
                <p className="text-xs text-gray-500 mt-1">Com Spark Comex</p>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Smartphones Samsung</p>
                    <p className="text-sm text-gray-600">Shenzhen → Santos</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Em trânsito</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Componentes Eletrônicos</p>
                    <p className="text-sm text-gray-600">Beijing → São Paulo</p>
                  </div>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Alfândega</span>
              </div>
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
    </div>
  );
}
