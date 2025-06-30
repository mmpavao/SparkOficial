import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ImportFinancialSummary } from "@/components/imports/ImportFinancialSummary";
import { formatCurrency } from "@/lib/formatters";
import { 
  Package, 
  Ship, 
  DollarSign, 
  Calendar, 
  FileText, 
  Calculator, 
  CreditCard 
} from "lucide-react";

export default function ImportDetails() {
  const { id } = useParams();

  const { data: importData, isLoading } = useQuery({
    queryKey: ['/api/imports', id],
    enabled: !!id
  });

  const { data: creditApplication } = useQuery({
    queryKey: ['/api/credit/applications', importData?.creditApplicationId],
    enabled: !!importData?.creditApplicationId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes da importação...</p>
        </div>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Importação não encontrada.</p>
      </div>
    );
  }

  const products = Array.isArray(importData.products) ? importData.products : [];
  
  const getStatusInfo = (status: string) => {
    const statusMap = {
      'planejamento': { label: 'Planejamento', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      'producao': { label: 'Produção', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      'entregue_agente': { label: 'Entregue ao Agente', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      'transporte_maritimo': { label: 'Transporte Marítimo', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      'transporte_aereo': { label: 'Transporte Aéreo', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      'desembaraco': { label: 'Desembaraço', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      'transporte_nacional': { label: 'Transporte Nacional', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      'concluido': { label: 'Concluído', color: 'text-green-600', bgColor: 'bg-green-50' }
    };
    return statusMap[status] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  const statusInfo = getStatusInfo(importData.status);

  const generatePaymentSchedule = () => {
    if (!creditApplication?.finalApprovedTerms) return [];
    
    const terms = creditApplication.finalApprovedTerms.split(',').map(t => parseInt(t.trim()));
    const importValue = parseFloat(importData.totalValue || "0");
    const downPayment = importValue * 0.3;
    const financedAmount = importValue * 0.7;
    const installmentValue = financedAmount / terms.length;
    
    const schedule = [];
    
    schedule.push({
      type: 'down_payment',
      installment: null,
      amount: downPayment,
      dueDate: new Date(),
      status: 'pending'
    });
    
    terms.forEach((term, index) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + term);
      
      schedule.push({
        type: 'installment',
        installment: index + 1,
        amount: installmentValue,
        dueDate,
        status: 'pending'
      });
    });
    
    return schedule;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Detalhes da Importação #{importData.id}
        </h1>
        <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border text-lg px-4 py-2`}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Produtos Cards no Topo */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product: any, index: number) => (
                <div 
                  key={index} 
                  className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
                >
                  <h4 className="font-semibold text-blue-900 mb-2">{product.name}</h4>
                  {product.description && (
                    <p className="text-sm text-blue-700 mb-3">{product.description}</p>
                  )}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Quantidade:</span>
                      <span className="font-medium">{product.quantity || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Preço Unit.:</span>
                      <span className="font-medium">
                        {product.unitPrice ? formatCurrency(parseFloat(product.unitPrice), 'USD') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Total:</span>
                      <span className="font-bold">
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

      {/* Tabs de Navegação Principal - TOPO */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <Tabs defaultValue="informacoes" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="informacoes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Informações da Importação
              </TabsTrigger>
              <TabsTrigger value="custos" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Cálculos de Custos
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
            
            <TabsContent value="informacoes" className="mt-6">
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
            </TabsContent>
            
            <TabsContent value="custos" className="mt-6">
              {creditApplication && (
                <ImportFinancialSummary 
                  importData={importData} 
                  creditApplication={creditApplication}
                />
              )}
            </TabsContent>
            
            <TabsContent value="documentos" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Documentos Necessários para Importação</h3>
                
                {/* Documentos Pré-Embarque */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📋 Documentos Pré-Embarque</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Commercial Invoice</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Packing List</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Contrato de Compra</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Certificado de Origem</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Opcional
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentos de Transporte */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">🚢 Documentos de Transporte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Bill of Lading (BL)</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Container Certificate</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Booking Confirmation</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Opcional
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Surrender BL</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Opcional
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentos Agente de Cargas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📦 Documentos Agente de Cargas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Vessel Arrival Notice</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Cargo Release Order</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">DI Declaration</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Tax DARF</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Obrigatório
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="pagamentos" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Cronograma de Pagamentos</h3>
                
                {creditApplication && generatePaymentSchedule().length > 0 ? (
                  <div className="space-y-4">
                    {generatePaymentSchedule().map((payment, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.type === 'down_payment' ? 'Entrada (30%)' : `Parcela ${payment.installment}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Vencimento: {payment.dueDate.toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(payment.amount, 'USD')}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={payment.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 
                                          payment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                          'bg-red-50 text-red-700 border-red-200'}
                              >
                                {payment.status === 'paid' ? 'Pago' : 
                                 payment.status === 'pending' ? 'Pendente' : 'Vencido'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum cronograma de pagamento disponível.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}