import { useAuth } from '@/hooks/useAuth';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
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
  PiggyBank,
  Building2,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { data: adminMetrics, isLoading: adminMetricsLoading } = useAdminMetrics(isAdmin);
  const { metrics, creditApplications, imports } = useMetrics();

  if (adminMetricsLoading && isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
          <button 
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-left transition-all duration-200 border border-white/20"
            onClick={() => window.location.href = '/imports/new'}
          >
            <div className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Nova Importação</span>
            </div>
          </button>

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
                  <p className="text-2xl font-bold text-gray-900">US$ 968.499,00</p>
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
                  <p className="text-2xl font-bold text-gray-900">US$ 150.000,00</p>
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
                  <p className="text-sm font-medium text-gray-600">Total de Importações</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Fornecedores</p>
                  <p className="text-2xl font-bold text-gray-900">4</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhes do Crédito / Resumo de Crédito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {isAdmin ? 'Resumo de Crédito' : 'Detalhes do Crédito'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-green-800">Crédito Aprovado</span>
                </div>
                <span className="text-lg font-bold text-green-600">US$ 150.000,00</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-blue-800">Em Uso</span>
                </div>
                <span className="text-lg font-bold text-blue-600">US$ 120.000,00</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-emerald-800">Disponível</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">US$ 30.000,00</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span className="font-medium">Taxa de Utilização</span>
                  <span className="text-lg font-semibold text-gray-800">80,0%</span>
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

        {/* Pipeline de Importações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Pipeline de Importações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 bg-gray-100">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <span className="font-medium">Planejamento</span>
                </div>
                <span className="text-sm text-gray-500">2 importações</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100">
                    <span className="text-sm font-bold">0</span>
                  </div>
                  <span className="font-medium">Produção</span>
                </div>
                <span className="text-sm text-gray-500">0 importações</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-600 bg-purple-100">
                    <span className="text-sm font-bold">0</span>
                  </div>
                  <span className="font-medium">Entregue ao Agente</span>
                </div>
                <span className="text-sm text-gray-500">0 importações</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-cyan-600 bg-cyan-100">
                    <span className="text-sm font-bold">0</span>
                  </div>
                  <span className="font-medium">Transporte Marítimo</span>
                </div>
                <span className="text-sm text-gray-500">0 importações</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-yellow-600 bg-yellow-100">
                    <span className="text-sm font-bold">0</span>
                  </div>
                  <span className="font-medium">Desembaraço</span>
                </div>
                <span className="text-sm text-gray-500">0 importações</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-600 bg-orange-100">
                    <span className="text-sm font-bold">0</span>
                  </div>
                  <span className="font-medium">Transporte Nacional</span>
                </div>
                <span className="text-sm text-gray-500">0 importações</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600 bg-green-100">
                    <span className="text-sm font-bold">0</span>
                  </div>
                  <span className="font-medium">Concluído</span>
                </div>
                <span className="text-sm text-gray-500">0 importações</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente */}
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
                    <p className="text-xs text-gray-500">US$ 150.000,00</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Aprovado
                    </span>
                    <p className="text-xs text-gray-500 mt-1">25/06/2025</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Crédito</span>
                      <p className="font-medium text-sm">Spark Global Commerce Ltda</p>
                    </div>
                    <p className="text-xs text-gray-500">US$ 600.000,00</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">
                      Em Análise
                    </span>
                    <p className="text-xs text-gray-500 mt-1">25/06/2025</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Crédito</span>
                      <p className="font-medium text-sm">Jazz Piracicaba LTDA</p>
                    </div>
                    <p className="text-xs text-gray-500">US$ 100.000,00</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">
                      Em Análise
                    </span>
                    <p className="text-xs text-gray-500 mt-1">25/06/2025</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Crédito</span>
                      <p className="font-medium text-sm">PROW IMPORTADORA E DISTRIBUIDORA DE PRODUTOS PARA SAÚDE LTDA</p>
                    </div>
                    <p className="text-xs text-gray-500">US$ 217.500,00</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">
                      Em Análise
                    </span>
                    <p className="text-xs text-gray-500 mt-1">24/06/2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Importações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Importações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 bg-gray-100">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Importacao teste</p>
                    <p className="text-sm text-gray-600">
                      US$ 120.000,00 • {isAdmin ? 'Empresa Importadora Ltda' : ''}
                    </p>
                    <p className="text-xs text-gray-500">25/06/2025</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                  Planejamento
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 bg-gray-100">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Importação Pasta de Tomate em Lata de Aço</p>
                    <p className="text-sm text-gray-600">
                      US$ 60.000,00 • {isAdmin ? 'Spark Comex' : ''}
                    </p>
                    <p className="text-xs text-gray-500">25/06/2025</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                  Planejamento
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}