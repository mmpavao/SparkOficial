import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { 
  ArrowLeft, 
  Package, 
  Truck,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  Container,
  Ship
} from "lucide-react";

interface ImportData {
  id: number;
  userId: number;
  creditApplicationId: number;
  name: string;
  status: string;
  cargoType: 'FCL' | 'LCL';
  totalValue: string;
  currency: string;
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  supplierId: number;
  supplier: {
    id: number;
    name: string;
    city: string;
    province: string;
    phone: string;
    email: string;
  };
  portOfOrigin: string;
  portOfDestination: string;
  incoterm: string;
  containerNumber?: string;
  sealNumber?: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  observations?: string;
  createdAt: string;
}

const statusConfig = {
  'planejamento': { label: 'Planejamento', color: 'bg-blue-100 text-blue-800' },
  'estimativa': { label: 'Estimativa', color: 'bg-yellow-100 text-yellow-800' },
  'producao': { label: 'Produção', color: 'bg-orange-100 text-orange-800' },
  'entregue_agente': { label: 'Entregue ao Agente', color: 'bg-purple-100 text-purple-800' },
  'transporte_maritimo': { label: 'Transporte Marítimo', color: 'bg-indigo-100 text-indigo-800' },
  'transporte_aereo': { label: 'Transporte Aéreo', color: 'bg-sky-100 text-sky-800' },
  'desembaraco': { label: 'Desembaraço', color: 'bg-teal-100 text-teal-800' },
  'transporte_nacional': { label: 'Transporte Nacional', color: 'bg-emerald-100 text-emerald-800' },
  'concluido': { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

export default function ImportDetailsPage() {
  const [match, params] = useRoute("/imports/details/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const permissions = useUserPermissions();

  const importId = params?.id ? parseInt(params.id) : null;

  // Fetch import details
  const { data: importData, isLoading } = useQuery({
    queryKey: ["/api/imports", importId],
    queryFn: async () => {
      if (permissions.isAdmin || permissions.isFinanceira) {
        return await apiRequest(`/api/admin/imports/${importId}`, "GET");
      } else {
        return await apiRequest(`/api/imports/${importId}`, "GET");
      }
    },
    enabled: !!importId,
  }) as { data: ImportData, isLoading: boolean };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Importação não encontrada</h2>
          <p className="text-gray-600 mb-4">A importação solicitada não foi encontrada.</p>
          <Button onClick={() => setLocation('/imports')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Importações
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[importData.status as keyof typeof statusConfig] || statusConfig.planejamento;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/imports')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{importData.name}</h1>
            <p className="text-sm text-gray-600">Importação ID: #{importData.id}</p>
          </div>
        </div>
        <Badge className={statusInfo.color}>
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Financial Summary */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <DollarSign className="w-5 h-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    US$ 120.000
                  </div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    US$ 36.000
                  </div>
                  <div className="text-sm text-gray-600">Entrada (30%)</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    US$ 84.000
                  </div>
                  <div className="text-sm text-gray-600">Valor Financiado</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    US$ 8.400
                  </div>
                  <div className="text-sm text-gray-600">Taxa Admin (10%)</div>
                </div>
              </div>
              
              <Separator className="mb-4" />
              
              <div className="flex justify-between items-center p-4 bg-white rounded-lg border-2 border-green-300">
                <span className="text-lg font-semibold text-gray-800">Total Geral</span>
                <span className="text-2xl font-bold text-green-700">US$ 128.400</span>
              </div>
            </CardContent>
          </Card>

          {/* Import Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informações da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nome da Importação</Label>
                    <p className="text-gray-900 font-medium">{importData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Carga</Label>
                    <Badge variant={importData.cargoType === 'FCL' ? 'default' : 'secondary'} className="mt-1">
                      {importData.cargoType === 'FCL' ? 'FCL (Container Completo)' : 'LCL (Carga Consolidada)'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Moeda</Label>
                    <p className="text-gray-900">{importData.currency || 'USD'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Incoterm</Label>
                    <p className="text-gray-900">{importData.incoterm || 'FOB'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Data de Criação</Label>
                    <p className="text-gray-900">{new Date(importData.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Número de Produtos</Label>
                    <p className="text-gray-900">{importData.products?.length || 1}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importData.products && importData.products.length > 0 ? (
                  importData.products.map((product, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <Badge variant="secondary">{formatCurrency(parseFloat(product.totalPrice))}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Quantidade:</span> {product.quantity.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Preço Unitário:</span> {formatCurrency(parseFloat(product.unitPrice))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">Pasta de Tomate</h4>
                      <Badge variant="secondary">US$ 120.000,00</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Quantidade:</span> 40.000 unidades
                      </div>
                      <div>
                        <span className="font-medium">Preço Unitário:</span> US$ 3,00
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transport Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Informações de Transporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Porto de Origem</Label>
                    <p className="text-gray-900">{importData.portOfOrigin || 'Shanghai, China'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Porto de Destino</Label>
                    <p className="text-gray-900">{importData.portOfDestination || 'Santos, Brasil'}</p>
                  </div>
                  {importData.containerNumber && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Número do Container</Label>
                      <p className="text-gray-900">{importData.containerNumber}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Partida Estimada</Label>
                    <p className="text-gray-900">{new Date(importData.estimatedDeparture).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Chegada Estimada</Label>
                    <p className="text-gray-900">{new Date(importData.estimatedArrival).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {importData.sealNumber && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Número do Lacre</Label>
                      <p className="text-gray-900">{importData.sealNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informações do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nome do Fornecedor</Label>
                  <p className="text-gray-900 font-medium">{importData.supplier?.name || 'Shanghai Food Industries Ltd.'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {importData.supplier ? 
                        `${importData.supplier.city}, ${importData.supplier.province}` : 
                        'Shanghai, China'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{importData.supplier?.phone || '+86 21 1234-5678'}</span>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{importData.supplier?.email || 'contact@shanghaifood.com'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          {importData.observations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{importData.observations}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pipeline de Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(statusConfig).filter(([key]) => key !== 'cancelado').map(([key, config], index) => {
                  const isCurrentStatus = key === importData.status;
                  const currentIndex = Object.keys(statusConfig).indexOf(importData.status);
                  const isPastStatus = index < currentIndex;
                  const isActive = isCurrentStatus || isPastStatus;
                  
                  return (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-lg ${
                      isCurrentStatus ? 'bg-blue-50 border-2 border-blue-200' :
                      isPastStatus ? 'bg-green-50 border border-green-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCurrentStatus ? 'bg-blue-600' :
                        isPastStatus ? 'bg-green-600' :
                        'bg-gray-300'
                      }`}>
                        {isPastStatus ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : isCurrentStatus ? (
                          <Clock className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {config.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Datas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Partida Estimada</div>
                <div className="text-blue-700">{new Date(importData.estimatedDeparture).toLocaleDateString('pt-BR')}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-1">Chegada Estimada</div>
                <div className="text-green-700">{new Date(importData.estimatedArrival).toLocaleDateString('pt-BR')}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Criado em</div>
                <div className="text-gray-600">{new Date(importData.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setLocation(`/imports/edit/${importData.id}`)} 
                className="w-full"
                variant="outline"
                disabled={importData.status === 'concluido' || importData.status === 'cancelado'}
              >
                Editar Importação
              </Button>
              <Button 
                onClick={() => setLocation(`/payments/schedule/${importData.id}`)} 
                className="w-full"
                variant="outline"
              >
                Ver Cronograma de Pagamentos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}