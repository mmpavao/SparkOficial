import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MetricsCard from "@/components/common/MetricsCard";
import { useTranslation } from "@/contexts/I18nContext";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Download,
  Calendar,
  Users,
  CreditCard,
  Package,
  AlertTriangle
} from "lucide-react";

export default function FinanceiraReports() {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState("30");
  const [reportType, setReportType] = useState("overview");

  // Fetch data for reports
  const { data: creditApplications = [] } = useQuery<any[]>({
    queryKey: ["/api/financeira/credit-applications"],
  });

  const { data: imports = [] } = useQuery<any[]>({
    queryKey: ["/api/financeira/imports"],
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/financeira/suppliers"],
  });

  // Calculate report metrics
  const totalApproved = creditApplications.filter((app: any) => app.status === 'approved').length;
  const totalRejected = creditApplications.filter((app: any) => app.status === 'rejected').length;
  const pendingAnalysis = creditApplications.filter((app: any) => app.status === 'pre_approved').length;
  const totalCreditValue = creditApplications
    .filter((app: any) => app.status === 'approved')
    .reduce((sum: number, app: any) => sum + (app.creditAmount || 0), 0);

  const approvalRate = totalApproved + totalRejected > 0 
    ? ((totalApproved / (totalApproved + totalRejected)) * 100).toFixed(1)
    : "0";

  const avgCreditAmount = totalApproved > 0 
    ? (totalCreditValue / totalApproved).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Financeira</h1>
          <p className="text-gray-600">Análise e insights das operações de crédito</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Visão Geral</SelectItem>
            <SelectItem value="credit">Análise de Crédito</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="risk">Análise de Risco</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Taxa de Aprovação"
          value={`${approvalRate}%`}
          icon={TrendingUp}
          trend={parseFloat(approvalRate) > 70 ? "up" : "down"}
          trendValue={parseFloat(approvalRate) > 70 ? "Excelente" : "Atenção"}
        />
        
        <MetricsCard
          title="Crédito Médio"
          value={`$${(parseInt(avgCreditAmount) / 1000).toFixed(0)}K`}
          icon={DollarSign}
          trend="up"
          trendValue="Por aprovação"
        />
        
        <MetricsCard
          title="Análises Pendentes"
          value={pendingAnalysis.toString()}
          icon={AlertTriangle}
          trend={pendingAnalysis > 5 ? "up" : "neutral"}
          trendValue={pendingAnalysis > 5 ? "Alta demanda" : "Normal"}
        />
        
        <MetricsCard
          title="Volume Total"
          value={`$${(totalCreditValue / 1000000).toFixed(1)}M`}
          icon={CreditCard}
          trend="up"
          trendValue="Aprovado no período"
        />
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Aprovados</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(totalApproved / creditApplications.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{totalApproved}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Rejeitados</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(totalRejected / creditApplications.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{totalRejected}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Pendentes</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${(pendingAnalysis / creditApplications.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{pendingAnalysis}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Faixas de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { range: "Até $100K", min: 0, max: 100000 },
                { range: "$100K - $500K", min: 100000, max: 500000 },
                { range: "$500K - $1M", min: 500000, max: 1000000 },
                { range: "Acima de $1M", min: 1000000, max: Infinity }
              ].map((bracket) => {
                const count = creditApplications.filter((app: any) => 
                  app.creditAmount >= bracket.min && app.creditAmount < bracket.max
                ).length;
                const percentage = creditApplications.length > 0 
                  ? (count / creditApplications.length * 100).toFixed(0)
                  : 0;
                
                return (
                  <div key={bracket.range} className="flex items-center justify-between">
                    <span>{bracket.range}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Importações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-3xl font-bold mb-2">{imports.length}</div>
              <p className="text-gray-600">Total de importações monitoradas</p>
            </div>
            <div className="space-y-2 pt-4 border-t">
              {['planejamento', 'em_andamento', 'finalizada'].map((status) => {
                const count = imports.filter((imp: any) => imp.status === status).length;
                const statusLabels = {
                  'planejamento': 'Planejamento',
                  'em_andamento': 'Em Andamento', 
                  'finalizada': 'Finalizada'
                };
                return (
                  <div key={status} className="flex justify-between text-sm">
                    <span>{statusLabels[status as keyof typeof statusLabels]}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Fornecedores Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-3xl font-bold mb-2">{suppliers.length}</div>
              <p className="text-gray-600">Fornecedores cadastrados</p>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>China</span>
                <span className="font-medium">
                  {suppliers.filter((s: any) => s.country === 'China').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Outros países</span>
                <span className="font-medium">
                  {suppliers.filter((s: any) => s.country !== 'China').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Relatório Detalhado (PDF)
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Dados Brutos (CSV)
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Relatório Mensal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}