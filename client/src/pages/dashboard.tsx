import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMetrics } from "@/hooks/useMetrics";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { useTranslation } from "@/contexts/I18nContext";
import { useCreditUsage } from "@/hooks/useCreditManagement";
import MetricsCard from "@/components/common/MetricsCard";
import StatusBadge from "@/components/common/StatusBadge";
import CreditUsageCard from "@/components/CreditUsageCard";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getGreeting, getFirstName, getRoleDisplayName } from "@/utils/roleUtils";

import { 
  Plus,
  FileText,
  Package,
  PiggyBank,
  CreditCard,
  Truck,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Only fetch admin metrics if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { data: adminMetrics, isLoading: adminMetricsLoading } = useAdminMetrics(isAdmin);
  
  // For importers, use regular metrics. For admins, skip to avoid duplicate queries
  const { metrics, creditApplications, imports } = useMetrics();

  // Debug logging
  console.log('Dashboard Debug Data:', {
    user: user?.id,
    creditApplications: creditApplications.length,
    imports: imports.length,
    creditApps: creditApplications,
    importsData: imports
  });





  return (
    <div className="space-y-6">
        {/* Personalized Welcome Section */}
        <div className="bg-gradient-spark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {getGreeting()}, {getFirstName(user?.fullName)}! 👋
            </h2>
            <p className="opacity-90 mb-1">
              {getRoleDisplayName(user?.role as any)} na {user?.companyName}
            </p>
            <p className="opacity-75 text-sm">
              {t.dashboard.manageCreditsAndImports}
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

      {/* Conditional Metrics Based on User Role */}
      {isAdmin ? (
        /* Admin Dashboard Metrics */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminMetricsLoading ? (
            <div className="col-span-4 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando métricas administrativas...</p>
            </div>
          ) : (
            <>
              {/* Total de Importadores */}
              <MetricsCard
                title="Total de Importadores"
                value={adminMetrics?.totalImporters || 0}
                icon={Users}
                iconColor="text-blue-600"
              />

              {/* Total de Aplicações */}
              <MetricsCard
                title="Aplicações de Crédito"
                value={adminMetrics?.totalApplications || 0}
                icon={FileText}
                iconColor="text-green-600"
              />

              {/* Volume Total de Crédito */}
              <MetricsCard
                title="Volume Total Solicitado"
                value={formatCurrency(adminMetrics?.totalCreditVolume || 0).replace('R$', 'US$')}
                icon={DollarSign}
                iconColor="text-yellow-600"
              />

              {/* Volume Aprovado */}
              <MetricsCard
                title="Volume Aprovado"
                value={formatCurrency(adminMetrics?.approvedCreditVolume || 0).replace('R$', 'US$')}
                icon={TrendingUp}
                iconColor="text-emerald-600"
              />

              {/* Total de Importações */}
              <MetricsCard
                title="Total de Importações"
                value={adminMetrics?.totalImports || 0}
                icon={Truck}
                iconColor="text-orange-600"
              />

              {/* Total de Fornecedores */}
              <MetricsCard
                title="Total de Fornecedores"
                value={adminMetrics?.totalSuppliers || 0}
                icon={Package}
                iconColor="text-purple-600"
              />
            </>
          )}
        </div>
      ) : (
        /* Importer Dashboard Metrics */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Crédito Aprovado - Importador só vê valores finalizados pelo admin */}
          <MetricsCard
            title="Crédito Aprovado"
            value={formatCurrency(
              creditApplications
                .filter(app => app.financialStatus === 'approved' && app.adminStatus === 'admin_finalized')
                .reduce((sum, app) => sum + Number(app.finalCreditLimit || 0), 0)
            ).replace('R$', 'US$')}
            icon={CreditCard}
            iconColor="text-green-600"
          />

          {/* Em Uso - usando função de cálculo de crédito */}
          <MetricsCard
            title="Em Uso"
            value={formatCurrency(metrics.usedCredit || 0).replace('R$', 'US$')}
            icon={PiggyBank}
            iconColor="text-blue-600"
          />

          {/* Disponível - crédito restante */}
          <MetricsCard
            title="Disponível"
            value={formatCurrency(metrics.availableCredit || 0).replace('R$', 'US$')}
            icon={BarChart3}
            iconColor="text-green-600"
          />

          {/* Importações Ativas */}
          <MetricsCard
            title="Importações Ativas"
            value={imports.filter(imp => ['planning', 'ordered', 'in_transit', 'customs'].includes(imp.status)).length}
            icon={Truck}
            iconColor="text-orange-600"
          />

          {/* Total de Importações */}
          <MetricsCard
            title="Total de Importações"
            value={imports.length}
            icon={Package}
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* Admin Status Overview */}
      {isAdmin && !adminMetricsLoading && adminMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aplicações por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Aplicações por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(adminMetrics.applicationsByStatus).map(([status, count]) => {
                  const statusLabels: { [key: string]: string } = {
                    'approved': 'approved',
                    'under_review': 'under_review',
                    'rejected': 'rejected',
                    'pending': 'pending'
                  };
                  
                  const displayStatus = statusLabels[status] || status;
                  
                  return (
                    <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={displayStatus} />
                        <span className="font-medium">{displayStatus}</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Atividade Recente */}
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
                        <p className="font-medium text-sm">{activity.companyName || 'Empresa não informada'}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(Number(activity.amount || 0)).replace('R$', 'US$')}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={activity.status || 'pending'} />
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
        </div>
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
              // Importadores só veem aplicações finalizadas pelo admin
              const approvedApp = creditApplications.find(app => 
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

              // Valores corretos baseados nos dados reais
              const approvedCredit = Number(approvedApp.finalCreditLimit || 0);
              
              // Calcular uso real baseado nas importações vinculadas
              const usedCredit = imports
                .filter(imp => imp.creditApplicationId === approvedApp.id && !['cancelled', 'delivered'].includes(imp.status))
                .reduce((sum, imp) => sum + Number(imp.totalValue || 0), 0);
              
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
              const statusCounts = {
                planning: imports.filter(imp => imp.status === 'planning').length,
                ordered: imports.filter(imp => imp.status === 'ordered').length,
                in_transit: imports.filter(imp => imp.status === 'in_transit').length,
                customs: imports.filter(imp => imp.status === 'customs').length,
                delivered: imports.filter(imp => imp.status === 'delivered').length,
              };

              const statusLabels = {
                planning: 'Planejamento',
                ordered: 'Pedido Feito',
                in_transit: 'Em Trânsito',
                customs: 'Alfândega',
                delivered: 'Entregue'
              };

              const statusColors = {
                planning: 'text-gray-600 bg-gray-100',
                ordered: 'text-blue-600 bg-blue-100',
                in_transit: 'text-orange-600 bg-orange-100',
                customs: 'text-yellow-600 bg-yellow-100',
                delivered: 'text-green-600 bg-green-100'
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
            {imports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma importação encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {imports.slice(0, 5).map((importItem) => {
                  const statusColors = {
                    planning: 'text-gray-600 bg-gray-100',
                    ordered: 'text-blue-600 bg-blue-100',
                    in_transit: 'text-orange-600 bg-orange-100',
                    customs: 'text-yellow-600 bg-yellow-100',
                    delivered: 'text-green-600 bg-green-100'
                  };

                  const statusLabels = {
                    planning: 'Planejamento',
                    ordered: 'Pedido Feito',
                    in_transit: 'Em Trânsito',
                    customs: 'Alfândega',
                    delivered: 'Entregue'
                  };

                  return (
                    <div key={importItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[importItem.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100'}`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{importItem.importName || `Importação #${importItem.id}`}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(Number(importItem.totalValue || 0))} • {formatDate(importItem.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[importItem.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100'}`}>
                        {statusLabels[importItem.status as keyof typeof statusLabels] || importItem.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
                <FileText className="w-4 h-4 text-gray-600 mr-3" />
                <span className="font-medium">Cadastrar Fornecedor</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-gray-50"
              onClick={() => window.location.href = '/credit'}
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 text-gray-600 mr-3" />
                <span className="font-medium">Ver Crédito</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
