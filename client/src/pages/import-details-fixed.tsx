import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Package, Ship, Calendar, DollarSign, Calculator, FileText, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { formatCurrency } from '@/lib/formatters';
import { ImportFinancialSummary } from '@/components/imports/ImportFinancialSummary';

export default function ImportDetailsPage() {
  const [, params] = useRoute('/imports/:id');
  const [, navigate] = useLocation();
  const [importData, setImportData] = useState<any>(null);
  const [creditApplication, setCreditApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const products = importData?.products ? JSON.parse(importData.products) : [];

  // Status mapping
  const statusInfo = {
    planejamento: { label: 'Planejamento', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    producao: { label: 'Produção', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    entregue_agente: { label: 'Entregue ao Agente', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    transporte_maritimo: { label: 'Transporte Marítimo', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    transporte_aereo: { label: 'Transporte Aéreo', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    desembaraco: { label: 'Desembaraço', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    transporte_nacional: { label: 'Transporte Nacional', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    concluido: { label: 'Concluído', color: 'text-green-600', bgColor: 'bg-green-50' }
  }[importData?.status] || { label: 'Desconhecido', color: 'text-gray-600', bgColor: 'bg-gray-50' };

  useEffect(() => {
    const fetchImportData = async () => {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch import data
        const importResponse = await fetch(`/api/imports/${params.id}`, {
          credentials: 'include'
        });
        
        if (!importResponse.ok) {
          throw new Error('Failed to fetch import data');
        }
        
        const importResult = await importResponse.json();
        setImportData(importResult);

        // Fetch credit application if needed
        if (importResult.creditApplicationId) {
          const creditResponse = await fetch(`/api/credit-applications/${importResult.creditApplicationId}`, {
            credentials: 'include'
          });
          
          if (creditResponse.ok) {
            const creditResult = await creditResponse.json();
            setCreditApplication(creditResult);
          }
        }

      } catch (err) {
        console.error('Error fetching import data:', err);
        setError('Erro ao carregar dados da importação');
      } finally {
        setLoading(false);
      }
    };

    fetchImportData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !importData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Importação não encontrada'}
          </h2>
          <Button onClick={() => navigate('/imports')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Importações
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/imports')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {importData.importName || `Importação #${importData.id}`}
            </h1>
            <p className="text-gray-600">
              Detalhes da importação
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border`}>
            {statusInfo.label}
          </Badge>
          {importData.status === 'planejamento' && (
            <Link href={`/imports/${importData.id}/edit`}>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Tabs System */}
      <Tabs defaultValue="envio" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="envio" className="flex items-center gap-2">
            <Ship className="w-4 h-4" />
            Dados do Envio
          </TabsTrigger>
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
        
        <TabsContent value="envio" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
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
                <CardContent>
                  <div className="space-y-4">
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
                  </div>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.length > 0 ? (
                      <div className="space-y-3">
                        {products.map((product: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900">{product.name}</h5>
                                {product.description && (
                                  <p className="text-sm text-gray-600">{product.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">Quantidade:</span>
                                <span className="ml-2 font-medium">{product.quantity || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Preço Unit.:</span>
                                <span className="ml-2 font-medium">
                                  {product.unitPrice ? formatCurrency(parseFloat(product.unitPrice), 'USD') : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <span className="ml-2 font-medium">
                                  {product.totalValue ? formatCurrency(parseFloat(product.totalValue), 'USD') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Summary */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-blue-900">Total Geral dos Produtos:</span>
                            <span className="text-lg font-bold text-blue-800">
                              {formatCurrency(parseFloat(importData.totalValue || "0"), importData.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum produto encontrado para esta importação.</p>
                      </div>
                    )}
                  </div>
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
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="pagamentos" className="mt-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Cronograma de Pagamentos</h3>
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
              <p className="text-center text-gray-600">Sistema de pagamentos em desenvolvimento</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}