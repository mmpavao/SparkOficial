
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
  Scale
} from "lucide-react";

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
  
  console.log("Query state:", { importData, isLoading, error });

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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informações dos Produtos
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

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor Total</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {importData.currency} {parseFloat(importData.totalValue).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Moeda</label>
                  <p className="text-sm text-gray-900">{importData.currency}</p>
                </div>
                {importData.incoterms && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Incoterms</label>
                    <p className="text-sm text-gray-900">{importData.incoterms}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cargo Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Informações da Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Carga</label>
                  <p className="text-sm text-gray-900">{importData.cargoType === 'FCL' ? 'Container Completo (FCL)' : 'Carga Fracionada (LCL)'}</p>
                </div>
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
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Informações de Transporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Método de Envio</label>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    {getShippingIcon(importData.shippingMethod)}
                    {getShippingLabel(importData.shippingMethod)}
                  </p>
                </div>
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

          {/* Status e Progresso Simplificado */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status Atual</span>
                  {getStatusBadge(importData.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Etapa do Pipeline</span>
                  <Badge variant="outline" className="text-blue-600">
                    {importData.currentStage === 'estimativa' ? 'Estimativa' :
                     importData.currentStage === 'invoice' ? 'Invoice' :
                     importData.currentStage === 'producao' ? 'Produção' :
                     importData.currentStage === 'embarque' ? 'Embarque' :
                     importData.currentStage === 'transporte' ? 'Transporte Marítimo' :
                     importData.currentStage === 'atracacao' ? 'Atracação' :
                     importData.currentStage === 'desembaraco' ? 'Desembaraço' :
                     importData.currentStage === 'transporte_terrestre' ? 'Transporte Terrestre' :
                     importData.currentStage === 'entrega' ? 'Entrega' : 'Em Andamento'}
                  </Badge>
                </div>

                {importData.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Previsão de Entrega</span>
                    <span className="text-sm text-gray-900">
                      {new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
