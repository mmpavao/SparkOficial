
import { useAuth } from '@/hooks/useAuth';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useImporterDashboard } from '@/hooks/useImporterDashboard';
import { useFinanceiraMetrics } from '@/hooks/useFinanceiraMetrics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffects } from '@/utils/soundEffects';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { formatCompactCurrency } from '@/lib/numberFormat';
import { Link, useLocation } from 'wouter';
import { 
  Users, 
  CreditCard, 
  Clock,
  DollarSign,
  PiggyBank,
  Building2,
  FileText,
  TrendingUp,
  Package,
  Truck,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Factory,
  BarChart3,
  Volume2,
  Plus,
  Calculator,
  Percent,
  Bell,
  TestTube,
  Target,
  Activity,
  Banknote,
  TrendingDown,
  Ship,
  ArrowRight,
  Calendar
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isFinanceira = user?.role === 'financeira';
  const isImporter = !isAdmin && !isFinanceira;
  
  const { data: adminMetrics, isLoading: adminMetricsLoading } = useAdminMetrics(isAdmin);
  const { data: importerData, isLoading: importerDataLoading, error } = useImporterDashboard(isImporter);
  const { data: financeiraMetrics, isLoading: financeiraMetricsLoading } = useFinanceiraMetrics(isFinanceira);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playApprovalSound, playPaymentSound, playStatusChangeSound, playNotificationSound } = useSoundEffects();

  // Navigation handlers
  const handleCreditClick = (creditId: number) => {
    console.log('Navegando para crédito:', creditId);
    setLocation(`/credit/details/${creditId}`);
  };

  const handleImportClick = (importId: number) => {
    console.log('Navegando para importação:', importId);
    setLocation(`/imports/${importId}`);
  };

  const handleSupplierClick = (supplierId: number) => {
    console.log('Navegando para fornecedor:', supplierId);
    setLocation(`/suppliers/details/${supplierId}`);
  };

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async (type: string) => {
      return apiRequest('/api/test/notification', 'POST', { type, applicationId: 42 });
    },
    onSuccess: () => {
      toast({
        title: "Notificação Criada",
        description: "Notificação de teste enviada com sucesso!",
      });
      // Invalidate notifications to refresh the bell icon
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar notificação de teste",
        variant: "destructive",
      });
    },
  });

  if ((isAdmin && adminMetricsLoading) || (isImporter && importerDataLoading) || (isFinanceira && financeiraMetricsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600"></div>
      </div>
    );
  }

  if (error && isImporter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar dashboard</h3>
          <p className="text-muted-foreground">Ocorreu um erro ao carregar os dados do dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section - Different for Admin vs Financeira vs Importer */}
      <div className="from-spark-500 to-spark-600 rounded-xl p-6 text-white bg-[#15ad7a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {isAdmin ? t("dashboard.adminPanel") : 
               isFinanceira ? t("dashboard.financePanel") : 
               `${t("dashboard.goodMorning")}, ${user?.companyName?.split(' ')[0] || t("common.user")}!`} 👋
            </h1>
            <p className="text-spark-100 text-sm">
              {isAdmin ? t("dashboard.adminDescription") : 
               isFinanceira ? t("dashboard.financeDescription") :
               t("dashboard.importerDescription")}
            </p>
          </div>
          <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center">
            <span className="text-2xl font-bold">{user?.companyName?.charAt(0) || 'U'}</span>
          </div>
        </div>
        
        {/* Quick Actions - Only for Importers */}
        {isImporter && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <button
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-left transition-all duration-200 border border-white/20"
              onClick={() => window.location.href = '/credit/new'}
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Solicitar Crédito</span>
              </div>
            </button>

            <button
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-left transition-all duration-200 border border-white/20"
              onClick={() => window.location.href = '/suppliers/new'}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Cadastrar Fornecedor</span>
              </div>
            </button>

            <button
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-left transition-all duration-200 border border-white/20"
              onClick={() => window.location.href = '/imports/new'}
            >
              <div className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Iniciar Importação</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Main Metrics Row */}
      {isAdmin ? (
        // ===== ADMIN DASHBOARD =====
        <>
          {/* Admin Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("dashboard.totalImporters")}</p>
                    <p className="text-2xl font-bold text-gray-900">{adminMetrics?.totalImporters || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("dashboard.activeUsers")}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("dashboard.creditApplications")}</p>
                    <p className="text-2xl font-bold text-gray-900">{adminMetrics?.totalApplications || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("dashboard.totalProcessed")}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("dashboard.totalVolumeRequested")}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(adminMetrics?.totalCreditVolume || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("dashboard.inCreditRequests")}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("dashboard.approvedVolume")}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(adminMetrics?.approvedCreditVolume || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("dashboard.creditGranted")}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("dashboard.totalImports")}</p>
                    <p className="text-2xl font-bold text-gray-900">{adminMetrics?.totalImports || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("dashboard.operationsCompleted")}</p>
                  </div>
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("dashboard.totalSuppliers")}</p>
                    <p className="text-2xl font-bold text-gray-900">{adminMetrics?.totalSuppliers || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("dashboard.registeredOnPlatform")}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-cyan-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("dashboard.approvalRate")}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {adminMetrics?.totalApplications > 0 
                        ? Math.round((adminMetrics?.approvedCreditVolume / adminMetrics?.totalCreditVolume) * 100) || 0
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t("dashboard.approvedCredits")}</p>
                  </div>
                  <Target className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita em Taxas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactCurrency((adminMetrics?.approvedCreditVolume || 0) * 0.025)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Taxa administrativa 2.5%</p>
                  </div>
                  <Calculator className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          

          {/* Admin Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status das Aplicações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Status das Aplicações de Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminMetrics?.applicationsByStatus && Object.entries(adminMetrics.applicationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'approved' ? 'bg-green-500' :
                          status === 'under_review' ? 'bg-yellow-500' :
                          status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="font-medium">
                          {status === 'approved' ? t("status.approved") :
                           status === 'under_review' ? t("status.underReview") :
                           status === 'rejected' ? t("status.rejected") : t("status.other")}
                        </span>
                      </div>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projeção de Faturamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Projeção de Faturamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">Receita com Taxas Admin</span>
                      <Percent className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCompactCurrency((adminMetrics?.approvedCreditVolume || 0) * 0.025)}
                    </div>
                    <p className="text-xs text-green-600 mt-1">2.5% sobre crédito aprovado</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-800">Projeção Mensal</span>
                      <Banknote className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCompactCurrency((adminMetrics?.approvedCreditVolume || 0) * 0.025 * 0.1)}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">10% da receita total por mês</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-800">Volume Potencial</span>
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCompactCurrency((adminMetrics?.totalCreditVolume || 0) - (adminMetrics?.approvedCreditVolume || 0))}
                    </div>
                    <p className="text-xs text-purple-600 mt-1">Crédito pendente de aprovação</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Atividade Recente Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Atividade Recente do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adminMetrics?.recentActivity?.length > 0 ? (
                <div className="space-y-3">
                  {adminMetrics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{activity.companyName}</p>
                            <p className="text-xs text-gray-500">Aplicação #{activity.id}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatCompactCurrency(parseFloat(activity.amount))}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          activity.status === 'approved' ? 'default' : 
                          activity.status === 'pending' ? 'secondary' : 
                          'outline'
                        }>
                          {activity.status === 'approved' ? 'Aprovado' :
                           activity.status === 'pending' ? 'Pendente' :
                           'Em Análise'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade recente</h3>
                  <p className="text-gray-500">Atividades do sistema aparecerão aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : isFinanceira ? (
        // ===== FINANCEIRA DASHBOARD =====
        <>
          {/* Financeira Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Créditos Submetidos</p>
                    <p className="text-2xl font-bold text-gray-900">{financeiraMetrics?.totalApplicationsSubmitted || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Total de aplicações</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crédito Solicitado</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(financeiraMetrics?.totalCreditRequested || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Volume total pedido</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crédito Aprovado</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(financeiraMetrics?.totalCreditApproved || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Volume concedido</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
                    <p className="text-2xl font-bold text-gray-900">{financeiraMetrics?.approvalRate || 0}%</p>
                    <p className="text-xs text-gray-500 mt-1">Eficiência de aprovação</p>
                  </div>
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financeira Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crédito Em Uso</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(financeiraMetrics?.totalCreditInUse || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Sendo utilizado</p>
                  </div>
                  <PiggyBank className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crédito Disponível</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(financeiraMetrics?.totalCreditAvailable || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Livre para uso</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-cyan-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tempo Médio Aprovação</p>
                    <p className="text-2xl font-bold text-gray-900">{financeiraMetrics?.averageApprovalTime || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Dias para aprovar</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Utilização</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {financeiraMetrics?.totalCreditApproved > 0 
                        ? Math.round(((financeiraMetrics?.totalCreditInUse || 0) / financeiraMetrics.totalCreditApproved) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Do crédito aprovado</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financeira Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status das Aplicações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Status das Aplicações de Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="font-medium">Pendentes</span>
                    </div>
                    <span className="text-lg font-bold">{financeiraMetrics?.applicationsByStatus?.pending || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium">Em Análise</span>
                    </div>
                    <span className="text-lg font-bold">{financeiraMetrics?.applicationsByStatus?.under_review || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-medium">Aprovadas</span>
                    </div>
                    <span className="text-lg font-bold">{financeiraMetrics?.applicationsByStatus?.approved || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="font-medium">Rejeitadas</span>
                    </div>
                    <span className="text-lg font-bold">{financeiraMetrics?.applicationsByStatus?.rejected || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="font-medium">Canceladas</span>
                    </div>
                    <span className="text-lg font-bold">{financeiraMetrics?.applicationsByStatus?.cancelled || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Mensais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Estatísticas do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-800">Aplicações Recebidas</span>
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {financeiraMetrics?.monthlyStats?.applications || 0}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Este mês</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">Aprovações</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {financeiraMetrics?.monthlyStats?.approvals || 0}
                    </div>
                    <p className="text-xs text-green-600 mt-1">Este mês</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-800">Volume Aprovado</span>
                      <DollarSign className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCompactCurrency(financeiraMetrics?.monthlyStats?.volume || 0)}
                    </div>
                    <p className="text-xs text-purple-600 mt-1">Este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Atividade Recente Financeira */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {financeiraMetrics?.recentActivity?.length > 0 ? (
                <div className="space-y-3">
                  {financeiraMetrics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{activity.companyName}</p>
                            <p className="text-xs text-gray-500">Aplicação #{activity.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-600">
                            Solicitado: <span className="font-semibold">{formatCompactCurrency(parseFloat(activity.requestedAmount))}</span>
                          </p>
                          {activity.approvedAmount && (
                            <p className="text-sm text-gray-600">
                              Aprovado: <span className="font-semibold text-green-600">{formatCompactCurrency(parseFloat(activity.approvedAmount))}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          activity.status === 'approved' ? 'default' : 
                          activity.status === 'rejected' ? 'destructive' :
                          activity.status === 'under_review' ? 'secondary' : 
                          'outline'
                        }>
                          {activity.status === 'approved' ? 'Aprovado' :
                           activity.status === 'rejected' ? 'Rejeitado' :
                           activity.status === 'under_review' ? 'Em Análise' :
                           activity.status === 'pending' ? 'Pendente' :
                           'Outro'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.submittedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade recente</h3>
                  <p className="text-gray-500">Aplicações de crédito aparecerão aqui conforme forem submetidas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // ===== IMPORTER DASHBOARD =====
        <>
          {/* Modern Metrics Cards with Enhanced Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Crédito Aprovado */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/80 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-blue-800">Crédito Aprovado</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">
                      {formatCompactCurrency(importerData?.creditMetrics?.approvedAmount || 0)}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">↗ +178 este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crédito Disponível */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/80 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-emerald-800">Crédito Disponível</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">
                      {formatCompactCurrency(importerData?.creditMetrics?.availableAmount || 0)}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">↗ +20% desde ontem</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volume Importado */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/80 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-purple-800">Volume Importado</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">
                      {formatCompactCurrency(importerData?.importMetrics?.totalValue || 0)}
                    </p>
                    <p className="text-xs text-purple-600 font-medium">↗ +190 produtos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total de Importações */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/80 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-orange-800">Total de Importações</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-1">
                      {importerData?.importMetrics?.totalImports || 0}+
                    </p>
                    <p className="text-xs text-orange-600 font-medium">↗ +12 aplicações</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Data Sections with Real Platform Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalhes do Crédito com Design Moderno */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Detalhes do Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(importerData?.creditMetrics?.approvedAmount || 0) > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-green-800">Crédito Aprovado</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {formatCompactCurrency(importerData?.creditMetrics?.approvedAmount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <PiggyBank className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-blue-800">Em Uso</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCompactCurrency(importerData?.creditMetrics?.usedAmount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-emerald-800">Disponível</span>
                      </div>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCompactCurrency(importerData?.creditMetrics?.availableAmount || 0)}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                        <span className="font-semibold">Taxa de Utilização</span>
                        <span className="text-lg font-bold text-gray-800">
                          {(importerData?.creditMetrics?.utilizationRate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 shadow-sm" 
                          style={{ width: `${Math.min(importerData?.creditMetrics?.utilizationRate || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum crédito aprovado</h3>
                    <p className="text-gray-500 mb-4">Você ainda não possui crédito aprovado. Solicite seu crédito para começar a importar.</p>
                    <Link href="/credit/new">
                      <Button className="hover:bg-blue-700 bg-[#22c55d]">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Solicitar Crédito
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pipeline de Importações com Design Moderno */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-purple-600" />
                  Pipeline de Importações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200/50 hover:shadow-md transition-all duration-200">
                    <div className="text-3xl font-bold text-yellow-700 mb-1">
                      {importerData?.statusBreakdown?.planning || 0}
                    </div>
                    <div className="text-sm text-yellow-600 font-semibold">Planejamento</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-200">
                    <div className="text-3xl font-bold text-blue-700 mb-1">
                      {importerData?.statusBreakdown?.production || 0}
                    </div>
                    <div className="text-sm text-blue-600 font-semibold">Produção</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-200">
                    <div className="text-3xl font-bold text-purple-700 mb-1">
                      {importerData?.statusBreakdown?.shipping || 0}
                    </div>
                    <div className="text-sm text-purple-600 font-semibold">Transporte</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-200">
                    <div className="text-3xl font-bold text-green-700 mb-1">
                      {importerData?.statusBreakdown?.completed || 0}
                    </div>
                    <div className="text-sm text-green-600 font-semibold">Concluído</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Data Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Importações Recentes */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Ship className="w-5 h-5 text-blue-600" />
                    Importações Recentes
                  </CardTitle>
                  <Link href="/imports">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {(importerData?.recentActivity?.imports?.length || 0) > 0 ? (
                  <div className="space-y-3">
                    {importerData?.recentActivity?.imports?.map((imp) => (
                      <div 
                        key={imp.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleImportClick(imp.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-blue-900 text-sm">{imp.name}</p>
                            </div>
                            <p className="text-xs text-blue-600">{formatCompactCurrency(parseFloat(imp.totalValue))}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            imp.status === 'completed' ? 'default' : 
                            imp.status === 'planning' ? 'secondary' : 
                            'outline'
                          } className="mb-1">
                            {imp.status === 'completed' ? 'Concluído' :
                             imp.status === 'planning' ? 'Planejamento' :
                             imp.status === 'production' ? 'Produção' :
                             'Em Andamento'}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {formatDate(imp.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Ship className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma importação</h3>
                    <p className="text-gray-500 mb-4">Você ainda não possui importações. Crie sua primeira importação.</p>
                    <Link href="/imports/new">
                      <Button className="bg-[#22c55d] hover:bg-[#16a34a]">
                        <Ship className="w-4 h-4 mr-2" />
                        Nova Importação
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aplicações de Crédito Recentes */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Aplicações de Crédito
                  </CardTitle>
                  <Link href="/credit">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {(importerData?.recentActivity?.creditApplications?.length || 0) > 0 ? (
                  <div className="space-y-3">
                    {importerData?.recentActivity?.creditApplications?.map((app) => (
                      <div 
                        key={app.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleCreditClick(app.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-green-900 text-sm">Aplicação #{app.id}</p>
                            </div>
                            <p className="text-xs text-green-600">{formatCompactCurrency(parseFloat(app.amount))}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            app.status === 'approved' || app.status === 'finalized' ? 'default' : 
                            app.status === 'pending' ? 'secondary' : 
                            'outline'
                          } className="mb-1">
                            {app.status === 'finalized' ? 'Finalizado' :
                             app.status === 'approved' ? 'Aprovado' :
                             app.status === 'pending' ? 'Pendente' : 
                             'Em Análise'}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {formatDate(app.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aplicação</h3>
                    <p className="text-gray-500 mb-4">Você ainda não possui aplicações de crédito. Solicite seu crédito.</p>
                    <Link href="/credit/new">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Solicitar Crédito
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Próximos Pagamentos - Cards em Linha */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Próximos Pagamentos
                </CardTitle>
                <Link href="/payments">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {(importerData?.upcomingPayments?.length || 0) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {importerData?.upcomingPayments?.map((payment, index) => (
                    <div 
                      key={payment.id || index} 
                      className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-purple-900 text-sm">
                              {payment.type === 'installment' ? 'Parcela' : 'Entrada'}
                            </p>
                            <p className="text-xs text-purple-600">
                              {payment.importName || `Importação #${payment.importId}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          payment.daysUntilDue <= 3 ? 'destructive' : 
                          payment.daysUntilDue <= 7 ? 'secondary' : 
                          'outline'
                        } className="text-xs">
                          {payment.daysUntilDue === 0 ? 'Hoje' :
                           payment.daysUntilDue === 1 ? 'Amanhã' :
                           `${payment.daysUntilDue} dias`}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Valor:</span>
                          <span className="font-bold text-purple-800">
                            {formatCompactCurrency(payment.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Vencimento:</span>
                          <span className="text-sm text-gray-800">
                            {formatDate(payment.dueDate)}
                          </span>
                        </div>
                        {payment.supplier && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Fornecedor:</span>
                            <span className="text-sm text-gray-800 truncate max-w-[100px]">
                              {payment.supplier}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento pendente</h3>
                  <p className="text-gray-500">Você não possui pagamentos programados no momento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
