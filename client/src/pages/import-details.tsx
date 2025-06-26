
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
import { apiRequest } from "@/lib/queryClient";
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

  // Status configuration
  const getStatusInfo = (status: string) => {
    const statusMap = {
      estimativa: { label: "Estimativa", color: "bg-gray-100 text-gray-700 border-gray-200", bgColor: "bg-gray-50", borderColor: "border-l-gray-500" },
      producao: { label: "Produção", color: "bg-blue-100 text-blue-700 border-blue-200", bgColor: "bg-blue-50", borderColor: "border-l-blue-500" },
      entregue_agente: { label: "Entregue ao Agente", color: "bg-yellow-100 text-yellow-700 border-yellow-200", bgColor: "bg-yellow-50", borderColor: "border-l-yellow-500" },
      transporte_maritimo: { label: "Transporte Marítimo", color: "bg-indigo-100 text-indigo-700 border-indigo-200", bgColor: "bg-indigo-50", borderColor: "border-l-indigo-500" },
      transporte_aereo: { label: "Transporte Aéreo", color: "bg-purple-100 text-purple-700 border-purple-200", bgColor: "bg-purple-50", borderColor: "border-l-purple-500" },
      desembaraco: { label: "Desembaraço", color: "bg-orange-100 text-orange-700 border-orange-200", bgColor: "bg-orange-50", borderColor: "border-l-orange-500" },
      transporte_nacional: { label: "Transporte Nacional", color: "bg-cyan-100 text-cyan-700 border-cyan-200", bgColor: "bg-cyan-50", borderColor: "border-l-cyan-500" },
      concluido: { label: "Concluído", color: "bg-green-100 text-green-700 border-green-200", bgColor: "bg-green-50", borderColor: "border-l-green-500" },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.estimativa;
  };

  const statusInfo = getStatusInfo(importData.status);

  // Financial calculations
  const importValue = parseFloat(importData.totalValue || '0');
  const adminFeePercentage = creditApplication ? getAdminFeeFromCredit(creditApplication) : 0;
  const downPaymentPercentage = creditApplication ? getDownPaymentFromCredit(creditApplication) : 30;
  
  const financialData = calculateAdminFee(importValue, downPaymentPercentage, adminFeePercentage);

  // Timeline steps
  const timelineSteps = [
    { key: 'estimativa', label: 'Estimativa Criada', icon: Clock, status: 'completed' },
    { key: 'producao', label: 'Início da Produção', icon: AlertCircle, status: importData.status === 'estimativa' ? 'pending' : 'completed' },
    { key: 'entregue_agente', label: 'Entregue ao Agente', icon: Package, status: ['estimativa', 'producao'].includes(importData.status) ? 'pending' : 'completed' },
    { key: 'transporte_maritimo', label: 'Transporte Marítimo', icon: Ship, status: ['estimativa', 'producao', 'entregue_agente'].includes(importData.status) ? 'pending' : 'completed' },
    { key: 'transporte_aereo', label: 'Transporte Aéreo', icon: Plane, status: ['estimativa', 'producao', 'entregue_agente', 'transporte_maritimo'].includes(importData.status) ? 'pending' : 'completed' },
    { key: 'desembaraco', label: 'Desembaraço', icon: AlertCircle, status: ['concluido', 'transporte_nacional'].includes(importData.status) ? 'completed' : 'pending' },
    { key: 'transporte_nacional', label: 'Transporte Nacional', icon: Truck, status: importData.status === 'concluido' ? 'completed' : 'pending' },
    { key: 'concluido', label: 'Concluído', icon: CheckCircle, status: importData.status === 'concluido' ? 'completed' : 'pending' }
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
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nome da Importação</label>
                        <p className="text-lg font-semibold text-gray-900">{importData.importName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tipo de Carga</label>
                        <p className="text-gray-900">{importData.cargoType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Incoterms</label>
                        <p className="text-gray-900">{importData.incoterms || 'FOB'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="mt-1">
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Método de Envio</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          {importData.shippingMethod === 'sea' ? <Ship className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                          {importData.shippingMethod === 'sea' ? 'Marítimo' : 'Aéreo'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Entrega Prevista</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {importData.estimatedDelivery ? new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR') : 'A definir'}
                        </p>
                      </div>
                    </div>
                  </div>
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

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-blue-600" />
                    Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {importData.products && importData.products.length > 0 ? (
                    <div className="space-y-4">
                      {importData.products.map((product: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Produto</label>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Quantidade</label>
                              <p className="text-gray-900">{product.quantity?.toLocaleString()}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Preço Unitário</label>
                              <p className="text-green-600 font-medium">
                                {formatCurrency(parseFloat(product.unitPrice || '0')).replace('R$', 'US$')}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Valor Total</label>
                              <p className="text-green-600 font-semibold">
                                {formatCurrency(parseFloat(product.totalValue || '0')).replace('R$', 'US$')}
                              </p>
                            </div>
                          </div>
                          {product.description && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Descrição</label>
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
            </TabsContent>

            <TabsContent value="pagamentos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Cronograma de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Cronograma de pagamentos será gerado após aprovação do crédito</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documentos da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Documentos serão disponibilizados durante o processo de importação</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Analysis */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Calculator className="h-5 w-5" />
                Análise Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(importValue).replace('R$', 'US$')}
                </div>
                <p className="text-sm text-gray-600">Valor Total da Importação</p>
              </div>
              
              <Separator />
              
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
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Timeline do Processo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = step.status === 'completed';
                  const isCurrent = step.key === importData.status;
                  
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : isCurrent 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isCompleted 
                            ? 'text-green-600' 
                            : isCurrent 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
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
