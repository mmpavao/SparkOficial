import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, CreditCard, Package, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { User, CreditApplication, Import } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";

  // Admin queries - fetch ALL data for administrative purposes
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  }) as { data: User[] };

  const { data: allCreditApplications = [] } = useQuery({
    queryKey: ["/api/admin/credit-applications"],
    enabled: isAdmin,
  }) as { data: CreditApplication[] };

  const { data: allImports = [], isLoading: importsLoading } = useQuery({
    queryKey: ["/api/admin/imports"],
    enabled: isAdmin,
    retry: 3,
    staleTime: 30000,
  }) as { data: Import[], isLoading: boolean };

  // Debug logging
  console.log('Admin page - isAdmin:', isAdmin);
  console.log('Admin page - allImports:', allImports);
  console.log('Admin page - importsLoading:', importsLoading);

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">{t("auth.accessDenied")}</h2>
            <p className="text-gray-600">
              {t("auth.noPermission")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("dashboard.adminPanel")}</h1>
            <p className="text-gray-600">{t("dashboard.adminDescription")}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{t("dashboard.systemActive")}</span>
          </div>
        </div>
      </div>

      {/* Admin Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Importadores */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.registeredImporters")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allUsers.filter(user => user.role === 'importer').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total de Aplicações */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-10 w-10 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.creditApplications")}</p>
                <p className="text-2xl font-bold text-gray-900">{allCreditApplications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total de Importações */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-10 w-10 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.totalImports")}</p>
                <p className="text-2xl font-bold text-gray-900">{allImports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume Financeiro */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-10 w-10 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.financialVolume")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    allImports.reduce((sum, imp) => sum + Number(imp.totalValue || 0), 0)
                  ).replace('R$', 'US$')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Status das Aplicações de Crédito */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.creditApplicationsStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const statusCounts = {
                pending: allCreditApplications.filter(app => app.status === 'pending').length,
                under_review: allCreditApplications.filter(app => app.preAnalysisStatus === 'under_review').length,
                pre_approved: allCreditApplications.filter(app => app.preAnalysisStatus === 'pre_approved').length,
                approved: allCreditApplications.filter(app => app.financialStatus === 'approved').length,
                rejected: allCreditApplications.filter(app => app.financialStatus === 'rejected').length,
              };

              const statusLabels = {
                pending: 'Pendente Análise',
                under_review: 'Em Análise',
                pre_approved: 'Pré-aprovado',
                approved: 'Aprovado Final',
                rejected: 'Rejeitado'
              };

              const statusColors = {
                pending: 'text-gray-600 bg-gray-100',
                under_review: 'text-blue-600 bg-blue-100',
                pre_approved: 'text-yellow-600 bg-yellow-100',
                approved: 'text-green-600 bg-green-100',
                rejected: 'text-red-600 bg-red-100'
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
                      <span className="text-sm text-gray-500">
                        {allCreditApplications.length > 0 && count > 0 ? `${((count / allCreditApplications.length) * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Análise de Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Taxa de Aprovação */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-800">Taxa de Aprovação</span>
                  <span className="text-lg font-bold text-green-600">
                    {allCreditApplications.length > 0 
                      ? `${((allCreditApplications.filter(app => app.financialStatus === 'approved').length / allCreditApplications.length) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${allCreditApplications.length > 0 
                        ? (allCreditApplications.filter(app => app.financialStatus === 'approved').length / allCreditApplications.length) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Volume Médio de Crédito */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Volume Médio Solicitado</span>
                  <span className="text-lg font-bold text-blue-600">
                    {allCreditApplications.length > 0 
                      ? formatCurrency(
                          allCreditApplications.reduce((sum, app) => sum + Number(app.requestedAmount || 0), 0) / allCreditApplications.length
                        ).replace('R$', 'US$')
                      : 'US$ 0'
                    }
                  </span>
                </div>
              </div>

              {/* Aplicações Este Mês */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-800">Aplicações Este Mês</span>
                  <span className="text-lg font-bold text-purple-600">
                    {allCreditApplications.filter(app => {
                      if (!app.createdAt) return false;
                      const appDate = new Date(app.createdAt);
                      const now = new Date();
                      return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Aplicações Recentes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Aplicações de Crédito Recentes</h4>
              {allCreditApplications.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma aplicação encontrada</p>
              ) : (
                <div className="space-y-2">
                  {allCreditApplications.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{app.legalCompanyName}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(Number(app.requestedAmount || 0)).replace('R$', 'US$')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.financialStatus === 'approved' ? 'text-green-600 bg-green-100' :
                        app.preAnalysisStatus === 'pre_approved' ? 'text-yellow-600 bg-yellow-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {app.financialStatus === 'approved' ? 'Aprovado' :
                         app.preAnalysisStatus === 'pre_approved' ? 'Pré-aprovado' :
                         'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Importações Recentes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Importações Recentes</h4>
              {allImports.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma importação encontrada</p>
              ) : (
                <div className="space-y-2">
                  {allImports.slice(0, 3).map((importItem) => {
                    const user = allUsers.find(u => u.id === importItem.userId);
                    return (
                      <div key={importItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{importItem.importName || `Importação #${importItem.id}`}</p>
                            <p className="text-sm text-gray-600">
                              {user?.companyName} • {formatCurrency(Number(importItem.totalValue || 0)).replace('R$', 'US$')}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          importItem.status === 'delivered' ? 'text-green-600 bg-green-100' :
                          importItem.status === 'in_transit' ? 'text-blue-600 bg-blue-100' :
                          'text-gray-600 bg-gray-100'
                        }`}>
                          {importItem.status === 'delivered' ? 'Entregue' :
                           importItem.status === 'in_transit' ? 'Em Trânsito' :
                           importItem.status === 'planning' ? 'Planejamento' :
                           'Em Processo'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```