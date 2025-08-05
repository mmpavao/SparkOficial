import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Ship,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Import {
  id: number;
  referenceNumber: string;
  status: string;
  totalValue: number;
  importerName: string;
  createdAt: string;
  estimatedDelivery?: string;
  customsStatus?: string;
}

export default function CustomsBrokerDashboard() {
  // Fetch imports assigned to this customs broker
  const { data: assignedImports = [], isLoading } = useQuery({
    queryKey: ['/api/customs-broker/imports'],
    queryFn: async () => {
      const response = await fetch('/api/customs-broker/imports');
      if (!response.ok) throw new Error('Erro ao buscar importações');
      return response.json();
    }
  });

  // Calculate metrics
  const totalImports = assignedImports.length;
  const pendingImports = assignedImports.filter((imp: Import) => 
    imp.status === 'pending' || imp.status === 'in_customs'
  ).length;
  const completedImports = assignedImports.filter((imp: Import) => 
    imp.status === 'delivered'
  ).length;
  const totalValue = assignedImports.reduce((sum: number, imp: Import) => 
    sum + (imp.totalValue || 0), 0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_customs': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_customs': return 'Em Desembaraço';
      case 'delivered': return 'Entregue';
      case 'delayed': return 'Atrasado';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel do Despachante</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as importações sob sua responsabilidade
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Importações</p>
                <p className="text-2xl font-bold">{totalImports}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold">{pendingImports}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">{completedImports}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue, 'USD')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="imports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="imports">Importações Designadas</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="imports" className="space-y-4">
          {assignedImports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Ship className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma importação designada
                </h3>
                <p className="text-gray-600">
                  Você ainda não possui importações sob sua responsabilidade.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignedImports.map((importItem: Import) => (
                <Card key={importItem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Importação #{importItem.referenceNumber}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Importador: {importItem.importerName}
                        </p>
                      </div>
                      <Badge className={getStatusColor(importItem.status)}>
                        {getStatusText(importItem.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Valor:</span>
                        <p className="font-medium">
                          {formatCurrency(importItem.totalValue, 'USD')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Data de Criação:</span>
                        <p className="font-medium">
                          {new Date(importItem.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Previsão de Entrega:</span>
                        <p className="font-medium">
                          {importItem.estimatedDelivery 
                            ? new Date(importItem.estimatedDelivery).toLocaleDateString('pt-BR')
                            : 'Não definida'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Módulo de Documentos
              </h3>
              <p className="text-gray-600">
                Funcionalidade de gerenciamento de documentos em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Relatórios de Performance
              </h3>
              <p className="text-gray-600">
                Análise de performance e métricas em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}