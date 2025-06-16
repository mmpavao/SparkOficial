import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMetrics } from "@/hooks/useMetrics";
import { useTranslation } from "@/contexts/I18nContext";
import MetricsCard from "@/components/common/MetricsCard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getGreeting, getFirstName, getRoleDisplayName } from "@/utils/roleUtils";

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
  const { t } = useTranslation();
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

      {/* Importer Credit & Import Metrics */}
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

        {/* Valor Utilizado - calculado das importações ativas */}
        <MetricsCard
          title="Valor Utilizado"
          value={formatCurrency(
            imports
              .filter(imp => ['ordered', 'in_transit', 'customs'].includes(imp.status))
              .reduce((sum, imp) => sum + Number(imp.totalValue || 0), 0)
          )}
          icon={PiggyBank}
          iconColor="text-blue-600"
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

              // Importadores veem apenas valores finais ajustados pelo admin
              const approvedCredit = Number(approvedApp.finalCreditLimit || 0);
              
              const usedCredit = imports
                .filter(imp => ['ordered', 'in_transit', 'customs'].includes(imp.status))
                .reduce((sum, imp) => sum + Number(imp.totalValue || 0), 0);
              
              const availableCredit = approvedCredit - usedCredit;

              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Limite Aprovado</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(approvedCredit).replace('R$', 'US$')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Valor Utilizado</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(usedCredit).replace('R$', 'US$')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">Disponível</span>
                    <span className="text-lg font-bold text-gray-600">{formatCurrency(availableCredit).replace('R$', 'US$')}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Taxa de Utilização</span>
                      <span>{approvedCredit > 0 ? `${((usedCredit / approvedCredit) * 100).toFixed(1)}%` : '0%'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${approvedCredit > 0 ? Math.min((usedCredit / approvedCredit) * 100, 100) : 0}%` }}
                      ></div>
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
