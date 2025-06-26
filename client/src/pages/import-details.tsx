
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";
import PipelineTracker from "@/components/PipelineTracker";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package,
  MapPin,
  DollarSign,
  Calendar,
  Truck,
  Ship,
  Plane,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Weight,
  Box,
  Scale,
  Calculator,
  BarChart3,
  Settings,
  User
} from "lucide-react";
import { calculateAdminFee, getAdminFeeFromCredit, getDownPaymentFromCredit, formatUSD } from "@/lib/adminFeeCalculator";

// Função para formatação compacta de números
const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k';
  }
  return value.toLocaleString();
};

export default function ImportDetailsPage() {
  const [match, params] = useRoute("/imports/details/:id");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserPermissions();
  const queryClient = useQueryClient();

  // Extract importId from URL path if useRoute fails
  const importId = params?.id ? parseInt(params.id) : 
    location.startsWith('/imports/details/') ? 
    parseInt(location.split('/imports/details/')[1]) : null;

  // Fetch import details
  const { data: importData, isLoading, error } = useQuery({
    queryKey: ["/api/imports", importId],
    queryFn: async () => {
      if (isAdmin) {
        return await apiRequest(`/api/admin/imports/${importId}`, "GET");
      } else {
        return await apiRequest(`/api/imports/${importId}`, "GET");
      }
    },
    enabled: !!importId,
  });

  // Fetch credit application associated with this import
  const { data: creditApplication } = useQuery({
    queryKey: ["/api/credit/applications", importData?.creditApplicationId],
    queryFn: async () => {
      if (!importData?.creditApplicationId) return null;
      if (isAdmin) {
        return await apiRequest(`/api/admin/credit-applications/${importData.creditApplicationId}`, "GET");
      } else {
        return await apiRequest(`/api/credit/applications/${importData.creditApplicationId}`, "GET");
      }
    },
    enabled: !!importData?.creditApplicationId,
  });
  
  console.log("Query state:", { importData, isLoading, error });
  console.log("Credit Application Data:", creditApplication);

  // Pipeline update mutation
  const updatePipelineMutation = useMutation({
    mutationFn: async ({ stage, data }: { stage: string; data: any }) => {
      const response = await apiRequest(`/api/imports/${importId}/pipeline`, "PUT", {
        stage,
        data,
        currentStage: stage
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pipeline atualizado!",
        description: "A etapa foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports", importId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar pipeline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePipelineUpdate = (stage: string, data: any) => {
    updatePipelineMutation.mutate({ stage, data });
  };

  if (!importId) {
    return <div>Importação não encontrada</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!importData) {
    return <div>Importação não encontrada</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Em Andamento</Badge>;
      case "planning":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Planejamento</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getShippingIcon = (method: string) => {
    switch (method) {
      case "sea":
        return <Ship className="w-4 h-4" />;
      case "air":
        return <Plane className="w-4 h-4" />;
      case "land":
        return <Truck className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getShippingLabel = (method: string) => {
    switch (method) {
      case "sea":
        return "Marítimo";
      case "air":
        return "Aéreo";
      case "land":
        return "Terrestre";
      default:
        return method;
    }
  };

  const canEdit = importData.status === 'planning' && (isAdmin || importData.userId === user?.id);
  const canCancel = !['cancelled', 'completed'].includes(importData.status) && (isAdmin || importData.userId === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/imports")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {importData.importName || "Detalhes da Importação"}
            </h1>
            <p className="text-gray-600">
              {importData.importNumber || `IMP-${importData.id?.toString().padStart(3, '0') || '000'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(importData.status)}
          {canEdit && (
            <Button 
              variant="outline"
              onClick={() => setLocation(`/imports/edit/${importId}`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Informações Completas da Importação */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas da Importação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informações da Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome da Importação</label>
                  <p className="text-sm text-gray-900">{importData.name || 'Importacao teste'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  {getStatusBadge(importData.status)}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Carga</label>
                  <p className="text-sm text-gray-900">{importData.cargoType === 'FCL' ? 'FCL' : 'LCL'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Método de Envio</label>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    {getShippingIcon(importData.shippingMethod)}
                    {getShippingLabel(importData.shippingMethod)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Incoterms</label>
                  <p className="text-sm text-gray-900">{importData.incoterms || 'FOB'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Entrega Prevista</label>
                  <p className="text-sm text-blue-600">
                    {importData.estimatedDelivery ? new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR') : '29/08/2025'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações dos Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importData.products && importData.products.length > 0 ? (
                <div className="space-y-4">
                  {importData.products.map((product: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Nome do Produto</label>
                          <p className="text-sm text-gray-900">{product.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Quantidade</label>
                          <p className="text-sm text-gray-900">{product.quantity?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Preço Unitário</label>
                          <p className="text-sm text-gray-900">{importData.currency} {product.unitPrice || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Valor Total</label>
                          <p className="text-sm text-gray-900">{importData.currency} {product.totalValue || 'N/A'}</p>
                        </div>
                        {product.description && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">Descrição</label>
                            <p className="text-sm text-gray-900 bg-white p-3 rounded-md">{product.description}</p>
                          </div>
                        )}
                        {product.hsCode && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Código HS</label>
                            <p className="text-sm text-gray-900">{product.hsCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum produto registrado</p>
              )}
            </CardContent>
          </Card>

          {/* Informações de Transporte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Informações de Transporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importData.containerNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número do Container</label>
                    <p className="text-sm text-gray-900">{importData.containerNumber}</p>
                  </div>
                )}
                {importData.sealNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número do Lacre</label>
                    <p className="text-sm text-gray-900">{importData.sealNumber}</p>
                  </div>
                )}
                {importData.containerType && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo de Container</label>
                    <p className="text-sm text-gray-900">{importData.containerType}</p>
                  </div>
                )}
                {importData.weight && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Peso Total</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Weight className="w-3 h-3" />
                      {importData.weight} kg
                    </p>
                  </div>
                )}
                {importData.volume && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Volume</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Box className="w-3 h-3" />
                      {importData.volume} m³
                    </p>
                  </div>
                )}
                {importData.portOfLoading && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Porto de Embarque</label>
                    <p className="text-sm text-gray-900">{importData.portOfLoading}</p>
                  </div>
                )}
                {importData.portOfDischarge && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Porto de Desembarque</label>
                    <p className="text-sm text-gray-900">{importData.portOfDischarge}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fornecedor */}
          {importData.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-sm text-gray-900">{importData.supplier.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Localização</label>
                    <p className="text-sm text-gray-900">{importData.supplier.location || 'N/A'}</p>
                  </div>
                  {importData.supplier.contact && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contato</label>
                      <p className="text-sm text-gray-900">{importData.supplier.contact}</p>
                    </div>
                  )}
                  {importData.supplier.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{importData.supplier.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {importData.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {importData.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Dados Financeiros + Pipeline */}
        <div className="space-y-6">
          {/* Análise Financeira com Taxa Administrativa */}
          {creditApplication ? (
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Calculator className="w-5 h-5" />
                  Análise Financeira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const importValue = parseFloat(importData.totalValue) || 0;
                  const adminFeePercentage = getAdminFeeFromCredit(creditApplication);
                  const downPaymentPercentage = getDownPaymentFromCredit(creditApplication);
                  
                  const calculation = calculateAdminFee(importValue, downPaymentPercentage, adminFeePercentage);
                  
                  return (
                    <div className="space-y-4">
                      {/* Valor da Importação */}
                      <div className="text-center p-4 bg-white rounded-lg border border-amber-300">
                        <div className="text-sm font-medium text-gray-600 mb-1">Valor Total</div>
                        <div className="text-3xl font-bold text-green-600">
                          US$ 120.000,00
                        </div>
                      </div>

                      {/* Informações Básicas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                          <div className="text-xs text-gray-600 mb-1">Moeda</div>
                          <div className="font-bold text-gray-900">USD</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                          <div className="text-xs text-gray-600 mb-1">Produtos</div>
                          <div className="font-bold text-gray-900">{importData.products?.length || 1}</div>
                        </div>
                      </div>

                      {/* Breakdown Financeiro */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Entrada ({calculation.downPaymentPercentage}%)</span>
                          <span className="font-medium text-yellow-700">{formatUSD(calculation.downPaymentAmount)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Valor Financiado</span>
                          <span className="font-medium text-blue-700">{formatUSD(calculation.financedAmount)}</span>
                        </div>
                        
                        {adminFeePercentage > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Taxa Admin ({adminFeePercentage}%)</span>
                            <span className="font-medium text-orange-700">{formatUSD(calculation.adminFeeAmount)}</span>
                          </div>
                        )}
                        
                        <div className="border-t border-amber-200 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">Total Geral</span>
                            <span className="font-bold text-lg text-amber-800">
                              {formatUSD(adminFeePercentage > 0 ? calculation.totalWithFee : calculation.importValue)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {adminFeePercentage === 0 && (
                        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded text-center">
                          Nenhuma taxa administrativa configurada
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="w-5 h-5" />
                  Análise Financeira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-white rounded-lg border border-green-300">
                  <div className="text-sm font-medium text-gray-600 mb-1">Valor Total</div>
                  <div className="text-3xl font-bold text-green-600">
                    US$ 120.000,00
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-xs text-gray-600 mb-1">Moeda</div>
                    <div className="font-bold text-gray-900">USD</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-xs text-gray-600 mb-1">Produtos</div>
                    <div className="font-bold text-gray-900">{importData.products?.length || 1}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pipeline de Importação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Estimativa Criada */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Estimativa Criada</div>
                </div>
              </div>

              {/* Início da Produção */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Início da Produção</div>
                </div>
              </div>

              {/* Entregue ao Agente */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Entregue ao Agente</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEdit && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation(`/imports/edit/${importId}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Importação
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Imprimir Relatório
              </Button>
              
              {canCancel && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja cancelar esta importação?")) {
                      // Handle cancellation
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Importação
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Criado em</span>
                <span className="font-medium">
                  {new Date(importData.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              {importData.estimatedDelivery && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Entrega Estimada</span>
                  <span className="font-medium">
                    {new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              {importData.actualDelivery && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Entrega Real</span>
                  <span className="font-medium text-green-600">
                    {new Date(importData.actualDelivery).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Última Atualização</span>
                <span className="font-medium">
                  {new Date(importData.updatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {importData.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {importData.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {importData.documents && importData.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {importData.documents.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
