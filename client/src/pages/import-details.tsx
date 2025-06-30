import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Package, Ship, Calendar, DollarSign, Building2, Truck, MapPin, FileText, CreditCard, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/formatters";
import { ImportFinancialSummary } from "@/components/imports/ImportFinancialSummary";

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
      return response.json();
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

      {/* Financial Tabs Menu - TOPO DA PÁGINA */}
      {creditApplication && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs defaultValue="custos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="custos" className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Cálculo de Custos
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="pagamentos" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pagamentos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="custos" className="mt-6">
                <ImportFinancialSummary 
                  importData={importData} 
                  creditApplication={creditApplication}
                />
              </TabsContent>
              
              <TabsContent value="documentos" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Documentos Necessários para Importação</h3>
                  
                  {/* Documentos Pré-Embarque */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">📋 Documentos Pré-Embarque</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Invoice Comercial</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Fatura comercial da mercadoria</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Packing List</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Lista detalhada de embalagem</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Contrato de Compra</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Contrato firmado com fornecedor</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Certificados de Origem</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Documentos de origem das mercadorias</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Documentos de Transporte */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">🚢 Documentos de Transporte</h4>
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
                      
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-900">Booking Confirmation</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Confirmação de reserva no navio</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-900">Surrender BL</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Documento de entrega da carga</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Documentos do Agente de Cargas */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">📦 Documentos do Agente de Cargas</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-900">Chegada da Embarcação</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-purple-700 mt-1">Notificação de chegada no porto</p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-900">Liberação da Carga</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-purple-700 mt-1">Autorização para retirada do container</p>
                      </div>
                      
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
              
              <TabsContent value="pagamentos" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Cronograma de Pagamentos</h3>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Adicionar Pagamento
                    </Button>
                  </div>
                  
                  {/* Pagamentos Planejados */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">💰 Pagamentos Programados</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-orange-900">Entrada (30%)</span>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Vencido</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <p className="font-semibold text-orange-900">{formatCurrency(parseFloat(importData.totalValue || "0") * 0.30, importData.currency)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <p className="font-semibold text-orange-900">15/12/2024</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-semibold text-red-700">Em atraso</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-900">1ª Parcela (17.5%)</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Pendente</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <p className="font-semibold text-blue-900">{formatCurrency(parseFloat(importData.totalValue || "0") * 0.175, importData.currency)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <p className="font-semibold text-blue-900">30/01/2025</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-semibold text-blue-700">Aguardando</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-900">2ª Parcela (17.5%)</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Pendente</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <p className="font-semibold text-blue-900">{formatCurrency(parseFloat(importData.totalValue || "0") * 0.175, importData.currency)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <p className="font-semibold text-blue-900">28/02/2025</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-semibold text-blue-700">Aguardando</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-900">3ª Parcela (17.5%)</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Pendente</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <p className="font-semibold text-blue-900">{formatCurrency(parseFloat(importData.totalValue || "0") * 0.175, importData.currency)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <p className="font-semibold text-blue-900">30/03/2025</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-semibold text-blue-700">Aguardando</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-900">4ª Parcela (17.5%)</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Pendente</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <p className="font-semibold text-blue-900">{formatCurrency(parseFloat(importData.totalValue || "0") * 0.175, importData.currency)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <p className="font-semibold text-blue-900">30/04/2025</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-semibold text-blue-700">Aguardando</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Products Section - DEPOIS DO SUBMENU */}
      {products.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos da Importação ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product: any, index: number) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      )}
                    </div>
                    <Package className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Quantidade:</span>
                      <span className="font-semibold text-gray-900">{product.quantity || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Preço Unit.:</span>
                      <span className="font-semibold text-blue-700">
                        {product.unitPrice ? formatCurrency(parseFloat(product.unitPrice), 'USD') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="text-sm font-medium text-gray-600">Valor Total:</span>
                      <span className="font-bold text-lg text-blue-800">
                        {product.totalValue ? formatCurrency(parseFloat(product.totalValue), 'USD') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Resumo Total dos Produtos */}
            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">Valor Total da Importação:</span>
                </div>
                <span className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(parseFloat(importData.totalValue || "0"), importData.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Detalhes do Pedido */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Carga</p>
                  <p className="text-lg">{importData.cargoType === 'FCL' ? 'FCL - Container Completo' : 'LCL - Carga Consolidada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Método de Envio</p>
                  <p className="text-lg">{importData.transportMethod === 'maritimo' ? 'Marítimo' : importData.transportMethod === 'aereo' ? 'Aéreo' : 'Terrestre'}</p>
                </div>
              </div>

              {importData.containerNumber && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Número do Container</p>
                    <p className="text-lg">{importData.containerNumber}</p>
                  </div>
                  {importData.sealNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Número do Lacre</p>
                      <p className="text-lg">{importData.sealNumber}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-600">Incoterms</p>
                <p className="text-lg">{importData.priceType || 'FOB'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Informações de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Origem</p>
                  <p className="text-lg">{importData.origin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Destino</p>
                  <p className="text-lg">{importData.destination || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Estimada de Chegada</p>
                  <p className="text-lg">
                    {importData.estimatedArrival 
                      ? new Date(importData.estimatedArrival).toLocaleDateString('pt-BR')
                      : 'N/A'
                    }
                  </p>
                </div>
                {importData.actualArrival && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Real de Chegada</p>
                    <p className="text-lg">
                      {new Date(importData.actualArrival).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {importData.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Observações</p>
                  <p className="text-lg">{importData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-600 font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(parseFloat(importData.totalValue || "0"), importData.currency)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Moeda:</span>
                  <span className="font-medium">{importData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de Carga:</span>
                  <span className="font-medium">{importData.cargoType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={`${statusInfo.bgColor} ${statusInfo.color} border`}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline/Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informações da Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Criado em</p>
                <p className="text-lg">
                  {new Date(importData.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              {importData.updatedAt && importData.updatedAt !== importData.createdAt && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Última atualização</p>
                  <p className="text-lg">
                    {new Date(importData.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-600">Status Atual</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></div>
                  <span className="font-medium">{statusInfo.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Tabs Section - EMBAIXO DOS DETALHES */}
      {creditApplication && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="custos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="custos" className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Cálculo de Custos
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="pagamentos" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pagamentos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="custos" className="mt-6">
                <ImportFinancialSummary 
                  importData={importData} 
                  creditApplication={creditApplication}
                />
              </TabsContent>
              
              <TabsContent value="documentos" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Documentos Necessários para Importação</h3>
                  
                  {/* Documentos Pré-Embarque */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">📋 Documentos Pré-Embarque</h4>
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
                    <h4 className="text-md font-medium text-gray-800 mb-3">🚢 Documentos de Transporte</h4>
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
                      
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-900">Booking Confirmation</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Confirmação de reserva no navio</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-900">Surrender BL</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Documento de entrega da carga</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Documentos do Agente de Cargas */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">📦 Documentos do Agente de Cargas</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-900">Chegada da Embarcação</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-purple-700 mt-1">Notificação de chegada no porto</p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-900">Liberação da Carga</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                        </div>
                        <p className="text-sm text-purple-700 mt-1">Autorização para retirada do container</p>
                      </div>
                      
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
              
              <TabsContent value="pagamentos" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Cronograma de Pagamentos</h3>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Adicionar Pagamento
                    </Button>
                  </div>
                  
                  {/* Pagamentos Planejados */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">💰 Pagamentos Programados</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-orange-900">Entrada (30%)</span>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Vencido</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <span className="ml-2 font-medium">{formatCurrency(36000, 'USD')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <span className="ml-2 font-medium">15/06/2025</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-2 font-medium text-red-600">Pendente</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-900">1ª Parcela (60 dias)</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Programado</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <span className="ml-2 font-medium">{formatCurrency(42000, 'USD')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <span className="ml-2 font-medium">15/08/2025</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-2 font-medium text-blue-600">Aguardando</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-900">2ª Parcela (120 dias)</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Programado</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <span className="ml-2 font-medium">{formatCurrency(42000, 'USD')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Vencimento:</span>
                            <span className="ml-2 font-medium">15/10/2025</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-2 font-medium text-blue-600">Aguardando</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resumo dos Pagamentos */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
                    <h4 className="text-md font-medium text-gray-800 mb-3">📊 Resumo Financeiro</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">Total do Financiamento</p>
                        <p className="font-bold text-lg">{formatCurrency(120000, 'USD')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Pago</p>
                        <p className="font-bold text-lg text-green-600">{formatCurrency(0, 'USD')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Pendente</p>
                        <p className="font-bold text-lg text-red-600">{formatCurrency(120000, 'USD')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Taxa Admin Total</p>
                        <p className="font-bold text-lg text-blue-600">{formatCurrency(8400, 'USD')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}