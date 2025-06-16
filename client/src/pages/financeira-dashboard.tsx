import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricsCard from "@/components/common/MetricsCard";
import { useTranslation } from "@/contexts/I18nContext";
import { 
  CreditCard, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3
} from "lucide-react";

export default function FinanceiraDashboard() {
  const { t } = useTranslation();

  // Fetch data for Financeira metrics
  const { data: creditApplications = [] } = useQuery({
    queryKey: ["/api/financeira/credit-applications"],
  });

  const { data: imports = [] } = useQuery({
    queryKey: ["/api/financeira/imports"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/financeira/suppliers"],
  });

  // Calculate Financeira metrics
  const pendingAnalysis = creditApplications.filter((app: any) => app.status === 'pre_approved').length;
  const approvedCredit = creditApplications.filter((app: any) => app.status === 'approved').length;
  const totalCreditValue = creditApplications
    .filter((app: any) => app.status === 'approved')
    .reduce((sum: number, app: any) => sum + (app.creditAmount || 0), 0);
  const activeImports = imports.filter((imp: any) => imp.status !== 'finalizada').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeira</h1>
          <p className="text-gray-600">Análise e aprovação de crédito para importações</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Análises Pendentes"
          value={pendingAnalysis.toString()}
          icon={Clock}
          trend={pendingAnalysis > 0 ? "up" : "neutral"}
          trendValue={pendingAnalysis > 0 ? "Requer atenção" : "Em dia"}
        />
        
        <MetricsCard
          title="Créditos Aprovados"
          value={approvedCredit.toString()}
          icon={CheckCircle}
          trend="up"
          trendValue="Este mês"
        />
        
        <MetricsCard
          title="Valor Total Aprovado"
          value={`$${(totalCreditValue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          trend="up"
          trendValue="+12% vs mês anterior"
        />
        
        <MetricsCard
          title="Importações Ativas"
          value={activeImports.toString()}
          icon={Package}
          trend="up"
          trendValue="Monitoramento ativo"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Análises Pendentes</div>
                <div className="text-sm text-gray-500">
                  {pendingAnalysis} aplicações aguardando análise
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Relatório Mensal</div>
                <div className="text-sm text-gray-500">
                  Gerar relatório de aprovações
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Monitoramento</div>
                <div className="text-sm text-gray-500">
                  Acompanhar importações ativas
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Análises Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAnalysis > 0 ? (
              <div className="space-y-3">
                {creditApplications
                  .filter((app: any) => app.status === 'pre_approved')
                  .slice(0, 5)
                  .map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{app.companyName}</div>
                        <div className="text-sm text-gray-500">
                          Crédito: ${(app.creditAmount / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600">Pendente</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Todas as análises em dia</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aprovações do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {approvedCredit > 0 ? (
              <div className="space-y-3">
                {creditApplications
                  .filter((app: any) => app.status === 'approved')
                  .slice(0, 5)
                  .map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{app.companyName}</div>
                        <div className="text-sm text-gray-500">
                          Aprovado: ${(app.creditAmount / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Aprovado</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-2" />
                <p>Nenhuma aprovação este mês</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}