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

  const products = importData?.products ? (
    typeof importData.products === 'string' 
      ? JSON.parse(importData.products) 
      : importData.products
  ) : [];

  // Status mapping
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      planejamento: { label: 'Planejamento', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      producao: { label: 'Produção', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      entregue_agente: { label: 'Entregue ao Agente', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      transporte_maritimo: { label: 'Transporte Marítimo', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      transporte_aereo: { label: 'Transporte Aéreo', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      desembaraco: { label: 'Desembaraço', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      transporte_nacional: { label: 'Transporte Nacional', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      concluido: { label: 'Concluído', color: 'text-green-600', bgColor: 'bg-green-50' }
    };
    return statusMap[status] || { label: 'Desconhecido', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  const statusInfo = getStatusInfo(importData?.status || '');

  useEffect(() => {
    const fetchImportData = async () => {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        // Fetch import data
        const importResponse = await fetch(`/api/imports/${params.id}`, {
          credentials: 'include'
        });
        
        if (!importResponse.ok) {
          throw new Error('Failed to fetch import data');
        }
        
        const importResult = await importResponse.json();
        
        // Validate that we have actual data
        if (!importResult || !importResult.id) {
          throw new Error('Invalid import data received');
        }
        
        setImportData(importResult);

        // Fetch credit application if needed
        if (importResult.creditApplicationId) {
          try {
            const creditResponse = await fetch(`/api/credit-applications/${importResult.creditApplicationId}`, {
              credentials: 'include'
            });
            
            if (creditResponse.ok) {
              const creditResult = await creditResponse.json();
              setCreditApplication(creditResult);
            }
          } catch (creditErr) {
            console.error('Error fetching credit data:', creditErr);
            // Don't fail the whole page if credit data fails
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
          <div className="space-y-6">
            {/* Cálculo de Custos da Importação */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                    <Calculator className="h-5 w-5" />
                    Resumo Financeiro da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Valor FOB */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Valor FOB:</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(importData.totalValue || "0"), importData.currency)}</span>
                  </div>

                  {creditApplication && (
                    <>
                      {/* Entrada a pagar */}
                      <div className="flex justify-between items-center p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Entrada (30%):
                          </span>
                        </div>
                        <span className="font-bold text-lg text-yellow-800">
                          {formatCurrency(parseFloat(importData.totalValue || "0") * 0.30, importData.currency)}
                        </span>
                      </div>

                      <Separator />

                      {/* Valor financiado */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Valor Financiado:</span>
                        <span className="font-semibold">{formatCurrency(parseFloat(importData.totalValue || "0") * 0.70, importData.currency)}</span>
                      </div>

                      {/* Taxa administrativa */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Taxa Admin (10%):</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(parseFloat(importData.totalValue || "0") * 0.70 * 0.10, importData.currency)}
                        </span>
                      </div>

                      <Separator />

                      {/* Valor total */}
                      <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Valor Total:</span>
                        </div>
                        <span className="font-bold text-lg text-blue-800">
                          {formatCurrency(parseFloat(importData.totalValue || "0") + (parseFloat(importData.totalValue || "0") * 0.70 * 0.10), importData.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                    <CreditCard className="h-5 w-5" />
                    Cronograma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {creditApplication ? (
                    <>
                      <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-1">💰 Para iniciar:</p>
                        <p className="text-sm text-green-700">
                          Pague {formatCurrency(parseFloat(importData.totalValue || "0") * 0.30, importData.currency)} de entrada
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          + Parcelas do valor financiado conforme termos aprovados
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-green-800">Termos de Pagamento Aprovados:</h4>
                        <div className="flex flex-wrap gap-1">
                          {creditApplication.finalApprovedTerms && creditApplication.finalApprovedTerms.map((term: string) => (
                            <Badge key={term} variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {term} dias
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aguardando aprovação de crédito para exibir cronograma de pagamento
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="documentos" className="mt-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Sistema de Documentos da Importação</h3>
            
            {/* Documentos Pré-Embarque */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                📋 Documentos Pré-Embarque
                <Badge variant="outline" className="bg-blue-50 text-blue-700">4 documentos</Badge>
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">Invoice Comercial</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">Documento com valores e descrição detalhada dos produtos</p>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">Packing List</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">Lista detalhada de embalagem, pesos e dimensões</p>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">Contrato de Compra</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">Contrato firmado com o fornecedor chinês</p>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">Certificados de Origem</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">Certificação da origem dos produtos</p>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos de Transporte */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                🚢 Documentos de Transporte
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700">4 documentos</Badge>
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-cyan-900">Bill of Lading (BL)</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-cyan-700 mb-2">Conhecimento de embarque marítimo</p>
                  <div className="flex items-center gap-2 text-xs text-cyan-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-cyan-900">Certificado do Container</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-cyan-700 mb-2">Certificação e lacre do container</p>
                  <div className="flex items-center gap-2 text-xs text-cyan-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-cyan-900">Booking Confirmation</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-cyan-700 mb-2">Confirmação da reserva de espaço no navio</p>
                  <div className="flex items-center gap-2 text-xs text-cyan-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-cyan-900">Surrender BL</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-cyan-700 mb-2">Entrega do conhecimento de embarque</p>
                  <div className="flex items-center gap-2 text-xs text-cyan-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos do Agente de Frete */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                🏢 Documentos do Agente de Frete
                <Badge variant="outline" className="bg-purple-50 text-purple-700">4 documentos</Badge>
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-900">Chegada do Navio</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">Notificação de chegada ao porto brasileiro</p>
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-900">Liberação da Carga</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">Autorização para retirada da carga</p>
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-900">Declaração DI</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">Declaração de importação na Receita Federal</p>
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-900">DARF de Impostos</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">Comprovante de pagamento dos impostos</p>
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOC ou IMG • Até 10MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo dos Documentos */}
            <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                  <FileText className="h-5 w-5" />
                  Resumo do Status dos Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">12</div>
                    <div className="text-sm text-yellow-600">Documentos Pendentes</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">0</div>
                    <div className="text-sm text-green-600">Documentos Aprovados</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">0%</div>
                    <div className="text-sm text-blue-600">Progresso Geral</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="pagamentos" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Cronograma de Pagamentos</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {creditApplication ? 'Crédito Aprovado' : 'Aguardando Aprovação'}
              </Badge>
            </div>
            
            {creditApplication ? (
              <div className="space-y-4">
                {/* Resumo do Pagamento */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                      <DollarSign className="h-5 w-5" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-green-600">Valor Total da Importação</p>
                      <p className="text-xl font-bold text-green-800">
                        {formatCurrency(parseFloat(importData.totalValue || "0"), importData.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Entrada Necessária (30%)</p>
                      <p className="text-xl font-bold text-green-800">
                        {formatCurrency(parseFloat(importData.totalValue || "0") * 0.30, importData.currency)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Cronograma de Pagamentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Agenda de Pagamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Entrada */}
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="font-medium text-yellow-800">Entrada (30%)</p>
                        <p className="text-sm text-yellow-600">Pagamento no início da importação</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-800">
                          {formatCurrency(parseFloat(importData.totalValue || "0") * 0.30, importData.currency)}
                        </p>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">À vista</Badge>
                      </div>
                    </div>

                    {/* Parcelas do Financiamento */}
                    {creditApplication.finalApprovedTerms && creditApplication.finalApprovedTerms.map((term: string, index: number) => {
                      const installmentValue = (parseFloat(importData.totalValue || "0") * 0.70) / creditApplication.finalApprovedTerms.length;
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div>
                            <p className="font-medium text-blue-800">Parcela {index + 1}</p>
                            <p className="text-sm text-blue-600">Vencimento em {term} dias após entrega ao agente</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-800">
                              {formatCurrency(installmentValue, importData.currency)}
                            </p>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">{term} dias</Badge>
                          </div>
                        </div>
                      );
                    })}

                    {/* Taxa Administrativa */}
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-800">Taxa Administrativa (10%)</p>
                        <p className="text-sm text-red-600">Sobre o valor financiado</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-800">
                          {formatCurrency(parseFloat(importData.totalValue || "0") * 0.70 * 0.10, importData.currency)}
                        </p>
                        <Badge variant="outline" className="bg-red-100 text-red-700">Incluído nas parcelas</Badge>
                      </div>
                    </div>

                    {/* Total Final */}
                    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <div>
                        <p className="text-lg font-bold text-gray-800">Total a Pagar</p>
                        <p className="text-sm text-gray-600">Valor total com taxa administrativa</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">
                          {formatCurrency(parseFloat(importData.totalValue || "0") + (parseFloat(importData.totalValue || "0") * 0.70 * 0.10), importData.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações Importantes */}
                <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                  <CardContent className="pt-6">
                    <h4 className="font-medium text-orange-800 mb-2">ℹ️ Informações Importantes:</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• O pagamento da entrada deve ser realizado antes do início da produção</li>
                      <li>• As parcelas vencem conforme os prazos aprovados após entrega ao agente de carga</li>
                      <li>• A taxa administrativa já está incluída no valor das parcelas</li>
                      <li>• Pagamentos em atraso podem gerar juros e multa conforme contrato</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aguardando Aprovação de Crédito
                </h3>
                <p className="text-gray-600 mb-4">
                  O cronograma de pagamentos será gerado após a aprovação do crédito para esta importação.
                </p>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  Status: Pendente
                </Badge>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}