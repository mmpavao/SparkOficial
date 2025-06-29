import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Package, Ship, Calendar, DollarSign, Building2, Truck, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";

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
  const products = importData.products ? JSON.parse(importData.products) : [];

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
                  <p className="text-lg">{importData.shippingMethod === 'sea' ? 'Marítimo' : 'Aéreo'}</p>
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
                <p className="text-lg">{importData.incoterms}</p>
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
                  <p className="text-sm font-medium text-gray-600">Porto de Embarque</p>
                  <p className="text-lg">{importData.portOfLoading || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Porto de Desembarque</p>
                  <p className="text-lg">{importData.portOfDischarge || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Destino Final</p>
                  <p className="text-lg">{importData.finalDestination || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Estimada de Entrega</p>
                  <p className="text-lg">
                    {importData.estimatedDelivery 
                      ? new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')
                      : 'N/A'
                    }
                  </p>
                </div>
                {importData.actualDelivery && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Real de Entrega</p>
                    <p className="text-lg">
                      {new Date(importData.actualDelivery).toLocaleDateString('pt-BR')}
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

          {/* Products */}
          {products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produtos ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-gray-600">{product.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
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
                </div>
              </CardContent>
            </Card>
          )}
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
    </div>
  );
}