import { useAuth } from '@/hooks/useAuth';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useImporterDashboard } from '@/hooks/useImporterDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { formatCompactCurrency } from '@/lib/numberFormat';
import { Link } from 'wouter';
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
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { data: adminMetrics, isLoading: adminMetricsLoading } = useAdminMetrics(isAdmin);
  const { data: importerData, isLoading: importerDataLoading, error } = useImporterDashboard();

  if ((adminMetricsLoading && isAdmin) || (importerDataLoading && !isAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600"></div>
      </div>
    );
  }

  if (error && !isAdmin) {
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
      {/* Welcome Section with Quick Actions */}
      <div className="from-spark-500 to-spark-600 rounded-xl p-6 text-white bg-[#15ad7a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Bom dia, {user?.companyName?.split(' ')[0] || 'Usuário'}! 👋
            </h1>
            <p className="text-spark-100 text-sm">
              {isAdmin ? 'Administrador na Spark Comex Admin2' : 'Gerencie seus créditos e importações da China de forma simples e eficiente.'}
            </p>
          </div>
          <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center">
            <span className="text-2xl font-bold">{user?.companyName?.charAt(0) || 'U'}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
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

          <button
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-left transition-all duration-200 border border-white/20"
            onClick={() => window.location.href = '/credit'}
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Ver Crédito</span>
            </div>
          </button>
        </div>
      </div>
      {/* Main Metrics Row */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Importadores</p>
                  <p className="text-2xl font-bold text-gray-900">{adminMetrics?.totalImporters || 5}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aplicações de Crédito</p>
                  <p className="text-2xl font-bold text-gray-900">{adminMetrics?.totalApplications || 4}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volume Total Solicitado</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(968499)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volume Aprovado</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(150000)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Crédito Aprovado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCompactCurrency(importerData?.creditMetrics?.approvedAmount || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Crédito Disponível</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCompactCurrency(importerData?.creditMetrics?.availableAmount || 0)}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volume Importado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCompactCurrency(importerData?.importMetrics?.totalValue || 0)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Importações</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {importerData?.importMetrics?.totalImports || 0}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhes do Crédito usando dados reais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Detalhes do Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importerData?.creditMetrics?.approvedAmount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-green-800">Crédito Aprovado</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCompactCurrency(importerData.creditMetrics.approvedAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <PiggyBank className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-blue-800">Em Uso</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCompactCurrency(importerData.creditMetrics.usedAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="font-medium text-emerald-800">Disponível</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCompactCurrency(importerData.creditMetrics.availableAmount)}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span className="font-medium">Taxa de Utilização</span>
                    <span className="text-lg font-semibold text-gray-800">
                      {importerData.creditMetrics.utilizationRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(importerData.creditMetrics.utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
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
                  <Button>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Solicitar Crédito
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline de Importações */}
        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5" />
                Pipeline de Importações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">
                    {importerData?.statusBreakdown?.planning || 0}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Planejamento</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    {importerData?.statusBreakdown?.production || 0}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">Produção</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">
                    {importerData?.statusBreakdown?.shipping || 0}
                  </div>
                  <div className="text-sm text-purple-600 font-medium">Transporte</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {importerData?.statusBreakdown?.completed || 0}
                  </div>
                  <div className="text-sm text-green-600 font-medium">Concluído</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente */}
        {!isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Importações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importerData?.recentActivity?.imports?.length > 0 ? (
                <div className="space-y-3">
                  {importerData.recentActivity.imports.map((import_) => (
                    <div key={import_.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-gray-500" />
                          <p className="font-medium text-sm">{import_.name}</p>
                        </div>
                        <p className="text-xs text-gray-500">{formatCurrency(parseFloat(import_.value))}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          import_.status === 'concluido' ? 'default' : 
                          import_.status === 'planejamento' ? 'secondary' : 
                          'outline'
                        }>
                          {import_.status === 'planejamento' ? 'Planejamento' :
                           import_.status === 'producao' ? 'Produção' :
                           import_.status === 'concluido' ? 'Concluído' : 
                           'Em Andamento'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(import_.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma importação</h3>
                  <p className="text-gray-500 mb-4">Você ainda não possui importações. Crie sua primeira importação.</p>
                  <Link href="/imports/new">
                    <Button>
                      <Package className="w-4 h-4 mr-2" />
                      Nova Importação
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Aplicações de Crédito Recentes */}
        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Aplicações de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importerData?.recentActivity?.creditApplications?.length > 0 ? (
                <div className="space-y-3">
                  {importerData.recentActivity.creditApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <p className="font-medium text-sm">Aplicação #{app.id}</p>
                        </div>
                        <p className="text-xs text-gray-500">{formatCurrency(parseFloat(app.amount))}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          app.status === 'finalized' ? 'default' : 
                          app.status === 'approved' ? 'default' : 
                          app.status === 'pending' ? 'secondary' : 
                          'outline'
                        }>
                          {app.status === 'finalized' ? 'Finalizado' :
                           app.status === 'approved' ? 'Aprovado' :
                           app.status === 'pending' ? 'Pendente' : 
                           'Em Análise'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
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
                  <p className="text-gray-500 mb-4">Você ainda não possui aplicações de crédito.</p>
                  <Link href="/credit/new">
                    <Button>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Solicitar Crédito
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin activity section */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Crédito</span>
                      <p className="font-medium text-sm">Empresa do Marcio</p>
                    </div>
                    <p className="text-xs text-gray-500">{formatCompactCurrency(150000)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Aprovado
                    </span>
                    <p className="text-xs text-gray-500 mt-1">25/06/2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}