import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { calculateAdminFee, getAdminFeeFromCredit, getDownPaymentFromCredit } from "@/lib/adminFeeCalculator";
import { useUnifiedEndpoints } from "@/hooks/useUnifiedEndpoints";
import { 
  ArrowLeft, 
  Package, 
  Ship, 
  Calendar, 
  MapPin, 
  DollarSign,
  FileText,
  Building,
  Truck,
  Plane,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Calculator,
  Percent,
  Users,
  Phone,
  Mail,
  Globe,
  Box,
  Scale,
  Target
} from "lucide-react";

export default function ImportDetailsPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/imports/details/:id");
  const importId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const { isAdmin, isFinanceira, getEndpoint } = useUnifiedEndpoints();

  const { data: importData, isLoading } = useQuery({
    queryKey: [`${getEndpoint("imports")}/${importId}`],
    enabled: !!importId
  });

  const { data: creditApplication } = useQuery({
    queryKey: [getEndpoint("credit"), importData?.creditApplicationId],
    enabled: !!importData?.creditApplicationId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Importação não encontrada ou você não tem permissão para visualizá-la.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Função para obter informações do status
  const getStatusInfo = (status: string) => {
    const statusMap = {
      estimativa: { label: "Estimativa", color: "bg-gray-100 text-gray-700", icon: Clock },
      producao: { label: "Produção", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
      entregue_agente: { label: "Entregue ao Agente", color: "bg-yellow-100 text-yellow-700", icon: Building },
      transporte_maritimo: { label: "Transporte Marítimo", color: "bg-indigo-100 text-indigo-700", icon: Ship },
      transporte_aereo: { label: "Transporte Aéreo", color: "bg-purple-100 text-purple-700", icon: Plane },
      desembaraco: { label: "Desembaraço", color: "bg-orange-100 text-orange-700", icon: FileText },
      transporte_nacional: { label: "Transporte Nacional", color: "bg-cyan-100 text-cyan-700", icon: Truck },
      concluido: { label: "Concluído", color: "bg-green-100 text-green-700", icon: CheckCircle },
      planning: { label: "Planejamento", color: "bg-gray-100 text-gray-700", icon: Clock },
      in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
      shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-700", icon: Ship },
      completed: { label: "Concluído", color: "bg-green-100 text-green-700", icon: CheckCircle },
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock }
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, color: "bg-gray-100 text-gray-700", icon: Clock };
  };

  const statusInfo = getStatusInfo(importData.status);

  // Financial calculations
  const importValue = parseFloat(importData.totalValue || '0');
  const adminFeePercentage = creditApplication ? getAdminFeeFromCredit(creditApplication) : 0;
  const downPaymentPercentage = creditApplication ? getDownPaymentFromCredit(creditApplication) : 30;
  
  const financialData = calculateAdminFee(importValue, downPaymentPercentage, adminFeePercentage);

  // Timeline dos estágios
  const timelineStages = [
    { key: 'estimativa', label: 'Estimativa Criada', icon: Clock, completed: true },
    { key: 'producao', label: 'Início da Produção', icon: AlertCircle, completed: ['producao', 'entregue_agente', 'transporte_maritimo', 'transporte_aereo', 'desembaraco', 'transporte_nacional', 'concluido'].includes(importData.status) },
    { key: 'entregue_agente', label: 'Entregue ao Agente', icon: Building, completed: ['entregue_agente', 'transporte_maritimo', 'transporte_aereo', 'desembaraco', 'transporte_nacional', 'concluido'].includes(importData.status) },
    { key: 'transporte_maritimo', label: 'Transporte Marítimo', icon: Ship, completed: ['transporte_maritimo', 'transporte_aereo', 'desembaraco', 'transporte_nacional', 'concluido'].includes(importData.status) },
    { key: 'transporte_aereo', label: 'Transporte Aéreo', icon: Plane, completed: ['transporte_aereo', 'desembaraco', 'transporte_nacional', 'concluido'].includes(importData.status) },
    { key: 'desembaraco', label: 'Desembaraço', icon: FileText, completed: ['desembaraco', 'transporte_nacional', 'concluido'].includes(importData.status) },
    { key: 'transporte_nacional', label: 'Transporte Nacional', icon: Truck, completed: ['transporte_nacional', 'concluido'].includes(importData.status) },
    { key: 'concluido', label: 'Concluído', icon: CheckCircle, completed: importData.status === 'concluido' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/imports')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Importações
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {importData.importName || `Importação #${importData.id}`}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Importação ID: #{importData.id} • Criada em {new Date(importData.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <Badge className={`px-4 py-2 text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados da Importação</TabsTrigger>
              <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-6">
              {/* Import Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Informações da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Nome da Importação</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {importData.importName || `Importação #${importData.id}`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge className={`${statusInfo.color} border-0 text-sm px-3 py-1`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Tipo de Carga</label>
                      <p className="text-base font-medium text-gray-900">{importData.cargoType}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Método de Envio</label>
                      <p className="text-base font-medium text-gray-900">{importData.shippingMethod}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Incoterms</label>
                      <p className="text-base font-medium text-gray-900">{importData.incoterms}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Entrega Prevista</label>
                      <p className="text-base font-medium text-gray-900">
                        {importData.estimatedDelivery ? new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR') : 'Não definida'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-green-600" />
                    Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {importData.products && importData.products.length > 0 ? (
                    <div className="space-y-4">
                      {importData.products.map((product: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Produto</label>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Quantidade</label>
                              <p className="font-semibold text-gray-900">{product.quantity?.toLocaleString()}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Preço Unitário</label>
                              <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(product.unitPrice || '0')).replace('R$', 'US$')}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Valor Total</label>
                              <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(product.totalValue || '0')).replace('R$', 'US$')}</p>
                            </div>
                          </div>
                          {product.description && (
                            <div className="mt-3">
                              <label className="text-sm font-medium text-gray-500">Descrição</label>
                              <p className="text-gray-700">{product.description}</p>
                            </div>
                          )}
                           {product.supplierName && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Fornecedor</label>
                              <p className="text-blue-600">{product.supplierName}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Box className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum produto cadastrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Supplier Information */}
              {importData.supplierName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      Informações do Fornecedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Nome do Fornecedor</label>
                          <p className="text-lg font-semibold text-gray-900">{importData.supplierName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Localização</label>
                          <p className="text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-600" />
                            {importData.supplierLocation || 'China'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pagamentos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Informações de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Funcionalidade em desenvolvimento</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Nenhum documento anexado</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Análise Financeira */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-green-600" />
                Análise Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor Total</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(importData.totalValue).replace('R$', 'US$')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Moeda</span>
                  <span className="font-semibold text-gray-900">USD</span>
                </div>
                {importData.products && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Produtos</span>
                    <span className="font-semibold text-gray-900">{importData.products.length}</span>
                  </div>
                )}
                 {creditApplication && adminFeePercentage > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor da Importação:</span>
                    <span className="font-medium">{formatCurrency(financialData.importValue).replace('R$', 'US$')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Entrada ({financialData.downPaymentPercentage}%):</span>
                    <span className="font-medium text-blue-600">
                      -{formatCurrency(financialData.downPaymentAmount).replace('R$', 'US$')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Financiado:</span>
                    <span className="font-medium">{formatCurrency(financialData.financedAmount).replace('R$', 'US$')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa Admin ({financialData.adminFeePercentage}%):</span>
                    <span className="font-medium text-orange-600">
                      +{formatCurrency(financialData.adminFeeAmount).replace('R$', 'US$')}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total a Pagar:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(financialData.totalWithFee).replace('R$', 'US$')}
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      * Taxa administrativa aplicada apenas no valor financiado
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Análise financeira disponível após aprovação do crédito
                  </p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineStages.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <div key={stage.key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stage.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-sm ${
                        stage.completed ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

           {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Resumo Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Moeda:</span>
                <span className="font-medium">{importData.currency || 'USD'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Produtos:</span>
                <span className="font-medium">{importData.products?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Container:</span>
                <span className="font-medium">{importData.containerType || 'N/A'}</span>
              </div>
              {(isAdmin || isFinanceira) && importData.companyName && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Empresa:</span>
                    <span className="font-medium text-blue-600">{importData.companyName}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}