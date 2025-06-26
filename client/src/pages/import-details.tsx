import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { ArrowLeft, Package, MapPin, Calendar, DollarSign, FileText, Truck, Building } from "lucide-react";
import ImportFinancialSummary from "@/components/imports/ImportFinancialSummary";

interface ImportDetails {
  id: number;
  userId: number;
  importName: string;
  importNumber?: string;
  cargoType: 'FCL' | 'LCL';
  totalValue: string;
  currency: string;
  currentStage: string;
  status: string;
  estimatedDelivery?: string;
  supplierId?: number;
  supplierName?: string;
  products: any[];
  createdAt: string;
  shippingMethod?: string;
  incoterms?: string;
  containerType?: string;
  containerNumber?: string;
  sealNumber?: string;
}

export default function ImportDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin, isFinanceira } = useUserPermissions();

  // Determinar endpoint baseado no papel do usuário
  const endpoint = (isAdmin || isFinanceira) ? `/api/admin/imports/${id}` : `/api/imports/${id}`;

  const { data: importData, isLoading, error } = useQuery<ImportDetails>({
    queryKey: [endpoint],
    enabled: !!user && !!id,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { label: "Planejamento", variant: "secondary" as const, color: "bg-blue-100 text-blue-800 border-blue-200" },
      active: { label: "Em Andamento", variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
      completed: { label: "Concluída", variant: "outline" as const, color: "bg-gray-100 text-gray-800 border-gray-200" },
      cancelled: { label: "Cancelada", variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;
    
    return (
      <Badge variant={config.variant} className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  const getStageLabel = (stage: string) => {
    const stages = {
      estimativa: "Estimativa",
      producao: "Produção",
      entregue_agente: "Entregue ao Agente",
      transporte_maritimo: "Transporte Marítimo",
      transporte_aereo: "Transporte Aéreo",
      desembaraco: "Desembaraço",
      transporte_nacional: "Transporte Nacional",
      concluido: "Concluído"
    };
    return stages[stage as keyof typeof stages] || stage;
  };

  const formatCurrency = (value: string, currency: string = "USD") => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !importData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/imports")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Importação não encontrada</h2>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Importação não encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              A importação solicitada não foi encontrada ou você não tem permissão para visualizá-la.
            </p>
            <Button onClick={() => setLocation("/imports")}>
              Voltar para Importações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/imports")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl font-bold tracking-tight">{importData.importName}</h2>
            {importData.importNumber && (
              <Badge variant="outline">#{importData.importNumber}</Badge>
            )}
            {getStatusBadge(importData.status)}
          </div>
          <p className="text-muted-foreground">
            Detalhes da importação • {getStageLabel(importData.currentStage)}
          </p>
        </div>
        <div className="flex gap-2">
          {importData.status === 'planning' && (
            <Button variant="outline" onClick={() => setLocation(`/imports/${id}/edit`)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Resumo Financeiro Completo */}
      <ImportFinancialSummary 
        fobValue={parseFloat(importData.totalValue) || 0}
        adminFeePercentage={10}
        downPaymentPercentage={30}
        currency={importData.currency}
        incoterms={importData.incoterms || "FOB"}
      />

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Informações da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Envio</p>
                    <p className="font-medium">
                      {importData.shippingMethod === 'sea' ? 'Marítimo' : 
                       importData.shippingMethod === 'air' ? 'Aéreo' : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status Atual</p>
                    <p className="font-medium">{getStageLabel(importData.currentStage)}</p>
                  </div>
                </div>

                {importData.containerNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Container</p>
                    <p className="font-medium">{importData.containerNumber}</p>
                    {importData.sealNumber && (
                      <p className="text-xs text-muted-foreground">Lacre: {importData.sealNumber}</p>
                    )}
                  </div>
                )}

                {importData.estimatedDelivery && (
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                    <p className="font-medium">
                      {new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações do Fornecedor */}
            {importData.supplierName && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Fornecedor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-medium text-lg">{importData.supplierName}</p>
                    <p className="text-sm text-muted-foreground">Fornecedor ID: {importData.supplierId}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline do Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Timeline em Desenvolvimento</h3>
                <p className="text-muted-foreground mb-4">
                  A funcionalidade de timeline será implementada no Sprint 3.1
                </p>
                <p className="text-sm text-muted-foreground">
                  Estágio atual: <strong>{getStageLabel(importData.currentStage)}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importData.products && importData.products.length > 0 ? (
                <div className="space-y-4">
                  {importData.products.map((product: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade</p>
                          <p className="font-medium">{product.quantity || 1}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="font-medium">
                            {formatCurrency((product.totalValue || product.unitPrice || 0).toString())}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground">
                    Esta importação não possui produtos cadastrados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sistema de Documentos em Desenvolvimento</h3>
                <p className="text-muted-foreground mb-4">
                  O sistema de upload e gestão de documentos será implementado no Sprint 5.1
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}