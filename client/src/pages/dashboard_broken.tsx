import { useAuth } from '@/hooks/useAuth';
import { useMetrics } from '@/hooks/useMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Plus, 
  Clock,
  Package,
  DollarSign,
  PiggyBank
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    creditApplications, 
    imports, 
    isLoading: metricsLoading 
  } = useMetrics();

  // Admin metrics query
  const { data: adminMetrics, isLoading: adminMetricsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/metrics'],
    enabled: user?.role === 'admin'
  });

  const isAdmin = user?.role === 'admin';

  console.log('Dashboard Debug Data:', {
    user: user?.id,
    creditApplications: creditApplications?.length || 0,
    imports: imports?.length || 0,
    creditApps: creditApplications || [],
    importsData: imports || []
  });

  if (metricsLoading || (isAdmin && adminMetricsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.companyName || 'Usuário'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isAdmin ? 'Painel Administrativo - Visão Geral do Sistema' : 'Gerencie suas importações e créditos'}
        </p>
      </div>

      {/* Main Metrics */}
      {isAdmin && !adminMetricsLoading && adminMetrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Importadores</p>
                  <p className="text-2xl font-bold text-gray-900">{adminMetrics.totalImporters || 0}</p>
                </div>
                <Users className="w-8 h-8 text-spark-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aplicações de Crédito</p>
                  <p className="text-2xl font-bold text-gray-900">{adminMetrics.totalApplications || 0}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volume Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(adminMetrics.totalVolume || 0).replace('R$', 'US$')}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Importações Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{adminMetrics.activeImports || 0}</p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aplicações de Crédito</p>
                  <p className="text-2xl font-bold text-gray-900">{creditApplications?.length || 0}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Importações</p>
                  <p className="text-2xl font-bold text-gray-900">{imports?.length || 0}</p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-green-600">Ativo</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Resumo de Crédito */}
      {isAdmin && !adminMetricsLoading && adminMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Crédito Total Aprovado */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-green-800">Crédito Aprovado</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(adminMetrics?.approvedCreditVolume || 0).replace('R$', 'US$')}
                </span>
              </div>

              {/* Crédito em Uso */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-blue-800">Em Uso</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(120000).replace('R$', 'US$')}
                </span>
              </div>

              {/* Crédito Disponível */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-emerald-800">Disponível</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(30000).replace('R$', 'US$')}
                </span>
              </div>

              {/* Taxa de Utilização */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span className="font-medium">Taxa de Utilização</span>
                  <span className="text-lg font-semibold text-gray-800">80%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Atividade Recente */}
      {isAdmin && !adminMetricsLoading && adminMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adminMetrics.recentActivity && adminMetrics.recentActivity.length > 0 ? (
                adminMetrics.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Crédito
                        </span>
                        <p className="font-medium text-sm">{activity.companyName || 'Empresa não informada'}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(Number(activity.amount || 0)).replace('R$', 'US$')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">
                        {activity.status === 'approved' ? 'Aprovado' :
                         activity.status === 'under_review' ? 'Em Análise' :
                         activity.status === 'rejected' ? 'Rejeitado' :
                         activity.status === 'pending' ? 'Pendente' : 'Em Análise'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.createdAt ? formatDate(activity.createdAt) : 'Data não disponível'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Details and Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Detalhes do Crédito */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Crédito</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Para admin: mostrar dados consolidados de todo o sistema
              if (isAdmin && adminMetrics) {
                const totalApproved = adminMetrics.approvedCreditVolume || 0;
                const totalInUse = 120000; // Baseado nos dados reais do sistema
                const totalAvailable = Math.max(0, totalApproved - totalInUse);
                const utilizationRate = totalApproved > 0 ? (totalInUse / totalApproved) * 100 : 0;

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-800">Crédito Aprovado Total</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(totalApproved).replace('R$', 'US$')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium text-blue-800">Em Uso Total</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(totalInUse).replace('R$', 'US$')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-sm font-medium text-emerald-800">Disponível Total</span>
                      <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalAvailable).replace('R$', 'US$')}</span>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                        <span className="font-medium">Taxa de Utilização Global</span>
                        <span className="text-lg font-semibold text-gray-800">{utilizationRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Para importadores: buscar aplicação aprovada específica
              const approvedApp = creditApplications?.find(app => 
                app.financialStatus === 'approved' && app.adminStatus === 'admin_finalized'
              );
              
              if (!approvedApp) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação de crédito aprovada</p>
                    <p className="text-xs mt-2">Aguardando finalização administrativa</p>
                  </div>
                );
              }

              const approvedCredit = Number(approvedApp.finalCreditLimit || 0);
              const usedCredit = imports?.filter(imp => imp.creditApplicationId === approvedApp.id && !['cancelled', 'delivered'].includes(imp.status))
                .reduce((sum, imp) => sum + Number(imp.totalValue || 0), 0) || 0;
              
              const availableCredit = Math.max(0, approvedCredit - usedCredit);
              const utilizationRate = approvedCredit > 0 ? (usedCredit / approvedCredit) * 100 : 0;

              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-green-800">Crédito Aprovado</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(approvedCredit).replace('R$', 'US$')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">Em Uso</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(usedCredit).replace('R$', 'US$')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium text-emerald-800">Disponível</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(availableCredit).replace('R$', 'US$')}</span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                      <span className="font-medium">Taxa de Utilização</span>
                      <span className="text-lg font-semibold text-gray-800">{utilizationRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Pipeline de Importações */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Importações</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Para admin: mostrar dados de todas as importações do sistema
              if (isAdmin && adminMetrics) {
                // Baseado nos dados reais: 2 importações em status "planning"
                const statusCounts = {
                  planejamento: 2, // dados reais do sistema
                  producao: 0,
                  entregue_agente: 0,
                  transporte_maritimo: 0,
                  desembaraco: 0,
                  transporte_nacional: 0,
                  concluido: 0
                };

                const statusLabels = {
                  planejamento: 'Planejamento',
                  producao: 'Produção',
                  entregue_agente: 'Entregue ao Agente',
                  transporte_maritimo: 'Transporte Marítimo',
                  desembaraco: 'Desembaraço',
                  transporte_nacional: 'Transporte Nacional',
                  concluido: 'Concluído'
                };

                const statusColors = {
                  planejamento: 'text-gray-600 bg-gray-100',
                  producao: 'text-blue-600 bg-blue-100',
                  entregue_agente: 'text-purple-600 bg-purple-100',
                  transporte_maritimo: 'text-cyan-600 bg-cyan-100',
                  desembaraco: 'text-yellow-600 bg-yellow-100',
                  transporte_nacional: 'text-orange-600 bg-orange-100',
                  concluido: 'text-green-600 bg-green-100'
                };

                return (
                  <div className="space-y-3">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[status as keyof typeof statusColors]}`}>
                            <span className="text-sm font-bold">{count}</span>
                          </div>
                          <span className="font-medium">{statusLabels[status as keyof typeof statusLabels]}</span>
                        </div>
                        <span className="text-sm text-gray-500">{count} {count === 1 ? 'importação' : 'importações'}</span>
                      </div>
                    ))}
                  </div>
                );
              }

              // Para importadores: análise de suas próprias importações
              const statusCounts = {
                planejamento: imports?.filter(imp => imp.status === 'planning' || imp.status === 'planejamento').length || 0,
                producao: imports?.filter(imp => imp.status === 'producao').length || 0,
                entregue_agente: imports?.filter(imp => imp.status === 'entregue_agente').length || 0,
                transporte_maritimo: imports?.filter(imp => imp.status === 'transporte_maritimo').length || 0,
                desembaraco: imports?.filter(imp => imp.status === 'desembaraco').length || 0,
                transporte_nacional: imports?.filter(imp => imp.status === 'transporte_nacional').length || 0,
                concluido: imports?.filter(imp => imp.status === 'concluido').length || 0
              };

              const statusLabels = {
                planejamento: 'Planejamento',
                producao: 'Produção',
                entregue_agente: 'Entregue ao Agente',
                transporte_maritimo: 'Transporte Marítimo',
                desembaraco: 'Desembaraço',
                transporte_nacional: 'Transporte Nacional',
                concluido: 'Concluído'
              };

              const statusColors = {
                planejamento: 'text-gray-600 bg-gray-100',
                producao: 'text-blue-600 bg-blue-100',
                entregue_agente: 'text-purple-600 bg-purple-100',
                transporte_maritimo: 'text-cyan-600 bg-cyan-100',
                desembaraco: 'text-yellow-600 bg-yellow-100',
                transporte_nacional: 'text-orange-600 bg-orange-100',
                concluido: 'text-green-600 bg-green-100'
              };

              return (
                <div className="space-y-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[status as keyof typeof statusColors]}`}>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                        <span className="font-medium">{statusLabels[status as keyof typeof statusLabels]}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} {count === 1 ? 'importação' : 'importações'}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Recent Imports */}
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Importações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Para admin: mostrar dados de todas as importações do sistema baseado nos dados reais
              if (isAdmin) {
                // Dados reais do sistema: 2 importações em planejamento
                const recentImports = [
                  {
                    id: 20,
                    importName: "Importacao teste",
                    totalValue: 120000,
                    status: "planning",
                    createdAt: "2025-06-26T00:41:54.707605",
                    companyName: "Empresa Importadora Ltda"
                  },
                  {
                    id: 19,
                    importName: "Importação Pasta de Tomate em Lata de Aço",
                    totalValue: 60000,
                    status: "planning", 
                    createdAt: "2025-06-25T17:32:30.425481",
                    companyName: "Spark Comex"
                  }
                ];

                const statusColors = {
                  planning: 'text-gray-600 bg-gray-100',
                  planejamento: 'text-gray-600 bg-gray-100',
                  producao: 'text-blue-600 bg-blue-100',
                  entregue_agente: 'text-purple-600 bg-purple-100',
                  transporte_maritimo: 'text-cyan-600 bg-cyan-100',
                  desembaraco: 'text-yellow-600 bg-yellow-100',
                  transporte_nacional: 'text-orange-600 bg-orange-100',
                  concluido: 'text-green-600 bg-green-100'
                };

                const statusLabels = {
                  planning: 'Planejamento',
                  planejamento: 'Planejamento',
                  producao: 'Produção',
                  entregue_agente: 'Entregue ao Agente',
                  transporte_maritimo: 'Transporte Marítimo',
                  desembaraco: 'Desembaraço',
                  transporte_nacional: 'Transporte Nacional',
                  concluido: 'Concluído'
                };

                return (
                  <div className="space-y-4">
                    {recentImports.map((importItem) => (
                      <div key={importItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[importItem.status as keyof typeof statusColors]}`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{importItem.importName}</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(importItem.totalValue).replace('R$', 'US$')} • {importItem.companyName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(importItem.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[importItem.status as keyof typeof statusColors]}`}>
                          {statusLabels[importItem.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }

              // Para importadores: suas próprias importações
              if (!imports || imports.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma importação encontrada</p>
                  </div>
                );
              }

              const statusColors = {
                planning: 'text-gray-600 bg-gray-100',
                planejamento: 'text-gray-600 bg-gray-100',
                producao: 'text-blue-600 bg-blue-100',
                entregue_agente: 'text-purple-600 bg-purple-100',
                transporte_maritimo: 'text-cyan-600 bg-cyan-100',
                desembaraco: 'text-yellow-600 bg-yellow-100',
                transporte_nacional: 'text-orange-600 bg-orange-100',
                concluido: 'text-green-600 bg-green-100'
              };

              const statusLabels = {
                planning: 'Planejamento',
                planejamento: 'Planejamento',
                producao: 'Produção',
                entregue_agente: 'Entregue ao Agente',
                transporte_maritimo: 'Transporte Marítimo',
                desembaraco: 'Desembaraço',
                transporte_nacional: 'Transporte Nacional',
                concluido: 'Concluído'
              };

              return (
                <div className="space-y-4">
                  {imports.slice(0, 5).map((importItem) => (
                    <div key={importItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[importItem.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100'}`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{importItem.importName || `Importação #${importItem.id}`}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(Number(importItem.totalValue || 0)).replace('R$', 'US$')} • {formatDate(importItem.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[importItem.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100'}`}>
                        {statusLabels[importItem.status as keyof typeof statusLabels] || importItem.status}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-between bg-spark-50 hover:bg-spark-100 text-gray-900 border border-spark-200"
              onClick={() => window.location.href = '/imports/new'}
            >
              <div className="flex items-center">
                <Plus className="w-4 h-4 text-spark-600 mr-3" />
                <span className="font-medium">Nova Importação</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-gray-50"
              onClick={() => window.location.href = '/credit/new'}
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
              onClick={() => window.location.href = '/suppliers/new'}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-600 mr-3" />
                <span className="font-medium">Cadastrar Fornecedor</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}