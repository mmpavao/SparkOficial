import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  ArrowLeft, Package, Ship, Calendar, DollarSign, Building2, Truck, MapPin, 
  FileText, CreditCard, Calculator, MoreHorizontal, Eye, Edit, Trash2,
  TrendingUp, Clock, CheckCircle, AlertCircle, Info, User, Percent, Target,
  Weight, Ruler, Container, Anchor, Globe, Plane, Archive, Receipt,
  PieChart, BarChart, Activity, Zap, Shield, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/formatters";
import { ImportFinancialSummary } from "@/components/imports/ImportFinancialSummary";
import ImportPaymentsList from "@/components/payments/ImportPaymentsList";
import ImportTimeline from "@/components/imports/ImportTimeline";
import StageManager from "@/components/imports/StageManager";

// Status mapping for display
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    planejamento: { label: "Planejamento", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
    producao: { label: "Produção", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
    embarque: { label: "Embarcado", color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
    transporte: { label: "Em Trânsito", color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
    desembaraco: { label: "Desembaraço", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200" },
    entrega: { label: "Entregue", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
    completed: { label: "Concluído", color: "text-green-700", bgColor: "bg-green-100 border-green-300" },
    cancelled: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  };

  return statusMap[status] || { label: status, color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" };
};

export default function ImportDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: importData, isLoading, error } = useQuery({
    queryKey: ['/api/imports', id],
    queryFn: async () => {
      const response = await fetch(`/api/imports/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Importação não encontrada');
      }
      const data = await response.json();
      console.log('📋 Import data received:', {
        origin: data.origin,
        destination: data.destination,
        estimatedDelivery: data.estimatedDelivery,
        estimatedArrival: data.estimatedArrival,
        fullData: data
      });
      return data;
    },
  });

  // Fetch credit application data for cost calculation
  const { data: creditApplication } = useQuery({
    queryKey: ['/api/credit/applications', importData?.creditApplicationId],
    queryFn: async () => {
      if (!importData?.creditApplicationId) return null;
      const response = await fetch(`/api/credit/applications/${importData.creditApplicationId}`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!importData?.creditApplicationId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !importData) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/imports">
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Importação não encontrada</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Importação não encontrada</h3>
            <p className="text-gray-600 mb-4">A importação solicitada não existe ou foi removida.</p>
            <Link href="/imports">
              <Button>Voltar para Importações</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(importData.status);
  const products = importData.products ? 
    (typeof importData.products === 'string' ? JSON.parse(importData.products) : importData.products) : [];

  // Determine if this is an operational import (own funds)
  const isOperationalImport = !importData.creditApplicationId;
  
  // Cost calculations for operational imports
  const totalValue = parseFloat(importData.totalValue || "0");
  const fobValue = totalValue;
  const freightCost = parseFloat(importData.freightCost || "0");
  const insuranceCost = parseFloat(importData.insuranceCost || "0");
  const cifValue = fobValue + freightCost + insuranceCost;
  
  // Tax estimations (typical Brazilian import taxes)
  const importTax = cifValue * 0.15; // 15% II (Imposto de Importação)
  const ipi = (cifValue + importTax) * 0.10; // 10% IPI
  const pis = (cifValue + importTax + ipi) * 0.0165; // 1.65% PIS
  const cofins = (cifValue + importTax + ipi) * 0.076; // 7.6% COFINS
  const icms = (cifValue + importTax + ipi + pis + cofins) * 0.18; // 18% ICMS
  
  const totalTaxes = importTax + ipi + pis + cofins + icms;
  const totalImportCost = cifValue + totalTaxes;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/imports">
          <Button variant="ghost" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{importData.importName}</h1>
            <Badge 
              variant="outline" 
              className={`${statusInfo.bgColor} ${statusInfo.color} border`}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-gray-600">{importData.importNumber}</p>
        </div>
        <div className="flex gap-2">
          {importData.status === 'planejamento' && (
            <Link href={`/imports/${id}/edit`}>
              <Button variant="outline">Editar</Button>
            </Link>
          )}
        </div>
      </div>

      

      {/* Enhanced Tabs Layout */}
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Custos
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="fornecedor" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Fornecedor
          </TabsTrigger>
          <TabsTrigger value="logistica" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Logística
          </TabsTrigger>
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Card */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Package className="w-5 h-5" />
                    Resumo da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Valor Total</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalValue, importData.currency)}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Produtos</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Ship className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Transporte</span>
                      </div>
                      <p className="text-lg font-semibold text-purple-600">
                        {importData.transportMethod === 'maritimo' ? 'Marítimo' : 
                         importData.transportMethod === 'aereo' ? 'Aéreo' : 'Terrestre'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tipo de Carga:</span>
                      <p className="font-medium">{importData.cargoType === 'FCL' ? 'FCL - Container Completo' : 'LCL - Carga Consolidada'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Incoterms:</span>
                      <p className="font-medium">{importData.priceType || 'FOB'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Moeda:</span>
                      <p className="font-medium">{importData.currency}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="outline" className={`${statusInfo.bgColor} ${statusInfo.color} border`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Detalhes dos Produtos ({products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length > 0 ? (
                    <div className="space-y-4">
                      {products.map((product: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 text-lg">{product.productName || product.name}</h5>
                              {product.description && (
                                <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                              )}
                            </div>
                            {product.imageUrl && (
                              <div className="w-16 h-16 ml-4 rounded-lg overflow-hidden bg-white border">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.productName || product.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-500" />
                              <div>
                                <span className="text-gray-600">Quantidade:</span>
                                <p className="font-medium">{product.quantity || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <div>
                                <span className="text-gray-600">Preço Unit.:</span>
                                <p className="font-medium">
                                  {product.unitPrice ? formatCurrency(parseFloat(product.unitPrice), 'USD') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-purple-500" />
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <p className="font-medium">
                                  {product.totalValue ? formatCurrency(parseFloat(product.totalValue), 'USD') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Weight className="w-4 h-4 text-orange-500" />
                              <div>
                                <span className="text-gray-600">Peso:</span>
                                <p className="font-medium">{product.weight || 'N/A'} kg</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Nenhum produto encontrado para esta importação.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Activity className="w-5 h-5" />
                    Status da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></div>
                      <span className="font-semibold text-lg">{statusInfo.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">Estágio atual da importação</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Criado em:</span>
                      <span className="font-medium">
                        {new Date(importData.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {importData.updatedAt && importData.updatedAt !== importData.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Atualizado:</span>
                        <span className="font-medium">
                          {new Date(importData.updatedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {importData.estimatedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Previsão de Entrega:</span>
                        <span className="font-medium">
                          {new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {importData.status === 'planning' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href={`/imports/${id}/edit`}>
                      <Button className="w-full" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Importação
                      </Button>
                    </Link>
                    <Button className="w-full" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Custos */}
        <TabsContent value="custos" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cost Breakdown */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <PieChart className="w-5 h-5" />
                  Análise de Custos da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* FOB, CIF Values */}
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="font-medium">Valor FOB (Produtos):</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(fobValue, 'USD')}
                    </span>
                  </div>
                  
                  {freightCost > 0 && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-medium">Frete Internacional:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(freightCost, 'USD')}
                      </span>
                    </div>
                  )}
                  
                  {insuranceCost > 0 && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-medium">Seguro Internacional:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(insuranceCost, 'USD')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-indigo-100 rounded-lg border border-indigo-300">
                    <span className="font-semibold">Valor CIF:</span>
                    <span className="text-xl font-bold text-indigo-700">
                      {formatCurrency(cifValue, 'USD')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Breakdown */}
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Receipt className="w-5 h-5" />
                  Estimativa de Impostos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>II - Imposto de Importação (15%):</span>
                    <span className="font-medium">{formatCurrency(importTax, 'BRL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IPI (10%):</span>
                    <span className="font-medium">{formatCurrency(ipi, 'BRL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PIS (1.65%):</span>
                    <span className="font-medium">{formatCurrency(pis, 'BRL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COFINS (7.6%):</span>
                    <span className="font-medium">{formatCurrency(cofins, 'BRL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ICMS (18%):</span>
                    <span className="font-medium">{formatCurrency(icms, 'BRL')}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
                    <span className="font-semibold">Total de Impostos:</span>
                    <span className="text-lg font-bold text-red-700">
                      {formatCurrency(totalTaxes, 'BRL')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg">
                    <span className="font-bold">Custo Total da Importação:</span>
                    <span className="text-xl font-bold text-purple-700">
                      {formatCurrency(totalImportCost, 'BRL')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Resumo Financeiro da Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(fobValue, 'USD')}</div>
                  <div className="text-sm text-blue-700">Valor FOB</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(cifValue, 'USD')}</div>
                  <div className="text-sm text-green-700">Valor CIF</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalTaxes, 'BRL')}</div>
                  <div className="text-sm text-red-700">Total Impostos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalImportCost, 'BRL')}</div>
                  <div className="text-sm text-purple-700">Custo Final</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Timeline */}
        <TabsContent value="timeline" className="space-y-6">
          <ImportTimeline
            currentStage={importData.currentStage || 'estimativa'}
            shippingMethod={importData.transportMethod === 'maritimo' ? 'sea' : 'air'}
            createdAt={new Date(importData.createdAt)}
            estimatedDelivery={importData.estimatedDelivery ? new Date(importData.estimatedDelivery) : undefined}
            completedStages={[]}
            interactive={false}
          />
          
          {/* Stage Management for authorized users */}
          <StageManager
            importId={parseInt(id)}
            currentStage={importData.currentStage || 'estimativa'}
            shippingMethod={importData.transportMethod === 'maritimo' ? 'sea' : 'air'}
            createdAt={new Date(importData.createdAt)}
            estimatedDelivery={importData.estimatedDelivery ? new Date(importData.estimatedDelivery) : undefined}
            canManage={importData.status === 'planning' || importData.status === 'producao'}
          />
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Documentos da Importação</h3>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Upload Documento
              </Button>
            </div>
            
            {/* Documentos Pré-Embarque */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentos Pré-Embarque
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Invoice Comercial</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">Documento com valores e descrição dos produtos</p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Packing List</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">Lista detalhada de embalagem e pesos</p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Contrato de Compra</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">Acordo comercial entre importador e fornecedor</p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Certificados de Origem</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">Comprovação da origem dos produtos</p>
                </div>
              </div>
            </div>
            
            {/* Documentos de Transporte */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Documentos de Transporte
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-900">Bill of Lading (BL)</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Conhecimento de embarque marítimo</p>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-900">Container Packing Certificate</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Certificado de container stuffing</p>
                </div>
              </div>
            </div>
            
            {/* Documentos Alfandegários */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Documentos Alfandegários
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-900">DI (Declaração de Importação)</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">Declaração para Receita Federal</p>
                </div>
                
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-900">DARF de Impostos</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">Documento para pagamento de impostos</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Fornecedor */}
        <TabsContent value="fornecedor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informações do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importData.supplierId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 mb-2">Fornecedor Cadastrado</p>
                    <Link href={`/suppliers/${importData.supplierId}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes do Fornecedor
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum fornecedor associado a esta importação</p>
                  <Button variant="outline" className="mt-4">
                    <Building2 className="w-4 h-4 mr-2" />
                    Associar Fornecedor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Logística */}
        <TabsContent value="logistica" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Shipping Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="w-5 h-5" />
                  Detalhes do Transporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origem:</span>
                    <span className="font-medium">{importData.origin || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destino:</span>
                    <span className="font-medium">{importData.destination || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de Transporte:</span>
                    <span className="font-medium">
                      {importData.transportMethod === 'maritimo' ? '🚢 Marítimo' : 
                       importData.transportMethod === 'aereo' ? '✈️ Aéreo' : '🚛 Terrestre'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de Carga:</span>
                    <span className="font-medium">{importData.cargoType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Incoterms:</span>
                    <span className="font-medium">{importData.priceType || 'FOB'}</span>
                  </div>
                  
                  {importData.containerNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Container:</span>
                      <span className="font-medium">{importData.containerNumber}</span>
                    </div>
                  )}
                  
                  {importData.sealNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lacre:</span>
                      <span className="font-medium">{importData.sealNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Rastreamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {importData.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Rastreamento:</span>
                      <span className="font-medium">{importData.trackingNumber}</span>
                    </div>
                  )}
                  
                  {importData.bl_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">BL Number:</span>
                      <span className="font-medium">{importData.bl_number}</span>
                    </div>
                  )}
                  
                  {importData.portOfLoading && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Porto de Embarque:</span>
                      <span className="font-medium">{importData.portOfLoading}</span>
                    </div>
                  )}
                  
                  {importData.portOfDischarge && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Porto de Descarga:</span>
                      <span className="font-medium">{importData.portOfDischarge}</span>
                    </div>
                  )}
                  
                  {importData.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Previsão de Entrega:</span>
                      <span className="font-medium">
                        {new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
                
                {(!importData.trackingNumber && !importData.bl_number) && (
                  <div className="text-center py-6 text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Informações de rastreamento serão atualizadas quando disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Logistics Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="w-5 h-5" />
                Informações Físicas da Carga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Weight className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-bold text-blue-600">
                    {importData.weight || 'N/A'}
                  </div>
                  <div className="text-sm text-blue-700">Peso Total (kg)</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Ruler className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-lg font-bold text-green-600">
                    {importData.volume || 'N/A'}
                  </div>
                  <div className="text-sm text-green-700">Volume (m³)</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Container className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-lg font-bold text-purple-600">
                    {importData.cargoType || 'N/A'}
                  </div>
                  <div className="text-sm text-purple-700">Tipo de Container</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}