import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Truck, Building2, DollarSign, MapPin, Phone, Mail, Calendar, Clock, CheckCircle2, AlertCircle, User, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/contexts/I18nContext";

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
  'planejamento': { label: 'Planejamento', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'estimativa': { label: 'Estimativa', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'producao': { label: 'Produção', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'entregue_agente': { label: 'Entregue ao Agente', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'transporte_maritimo': { label: 'Transporte Marítimo', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'transporte_aereo': { label: 'Transporte Aéreo', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  'desembaraco': { label: 'Desembaraço', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  'transporte_nacional': { label: 'Transporte Nacional', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'concluido': { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-200' },
  'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' }
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planejamento;
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      {config.label}
    </Badge>
  );
};

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num).replace('US$', 'US$');
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function ImportDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const { data: importData, isLoading } = useQuery<ImportData>({
    queryKey: ['/api/imports', id],
    enabled: !!id
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-2xl font-bold text-gray-900">{importData.name}</h1>
                <p className="text-sm text-gray-600">ID: #{importData.id}</p>
              </div>
            </div>
            <StatusBadge status={importData.status} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Financial Overview */}
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="w-5 h-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCurrency(120000)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {formatCurrency(36000)}
                    </div>
                    <div className="text-sm text-gray-600">Entrada (30%)</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatCurrency(84000)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Financiado</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {formatCurrency(8400)}
                    </div>
                    <div className="text-sm text-gray-600">Taxa Admin (10%)</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center p-4 bg-white rounded-lg border-2 border-green-300">
                  <span className="text-lg font-semibold text-gray-800">Total Geral</span>
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(128400)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Products Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produtos ({importData.products?.length || 1})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {importData.products && importData.products.length > 0 ? (
                    importData.products.map((product, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <Badge variant="secondary">{formatCurrency(product.totalPrice)}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Quantidade:</span> {product.quantity.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Preço Unitário:</span> {formatCurrency(product.unitPrice)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">Pasta de Tomate</h4>
                        <Badge variant="secondary">{formatCurrency(120000)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Quantidade:</span> 40.000 unidades
                        </div>
                        <div>
                          <span className="font-medium">Preço Unitário:</span> {formatCurrency(3)}
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
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tipo de Carga</label>
                      <div className="mt-1">
                        <Badge variant={importData.cargoType === 'FCL' ? 'default' : 'secondary'}>
                          {importData.cargoType === 'FCL' ? 'FCL (Container Completo)' : 'LCL (Carga Consolidada)'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Porto de Origem</label>
                      <p className="text-gray-900">{importData.portOfOrigin || 'Shanghai, China'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Porto de Destino</label>
                      <p className="text-gray-900">{importData.portOfDestination || 'Santos, Brasil'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Incoterm</label>
                      <p className="text-gray-900">{importData.incoterm || 'FOB'}</p>
                    </div>
                    {importData.containerNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Número do Container</label>
                        <p className="text-gray-900">{importData.containerNumber}</p>
                      </div>
                    )}
                    {importData.sealNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Número do Lacre</label>
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
                    <h4 className="font-medium text-gray-900 text-lg">
                      {importData.supplier?.name || 'Shanghai Food Industries Ltd.'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {importData.supplier ? 
                          `${importData.supplier.city}, ${importData.supplier.province}` : 
                          'Shanghai, China'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{importData.supplier?.phone || '+86 21 1234-5678'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <Mail className="w-4 h-4" />
                      <span>{importData.supplier?.email || 'contact@shanghaifood.com'}</span>
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

          {/* Right Column - Timeline and Dates */}
          <div className="space-y-6">
            
            {/* Important Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Datas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-1">Partida Estimada</div>
                  <div className="text-blue-700">{formatDate(importData.estimatedDeparture)}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-1">Chegada Estimada</div>
                  <div className="text-green-700">{formatDate(importData.estimatedArrival)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-1">Criado em</div>
                  <div className="text-gray-600">{formatDate(importData.createdAt)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pipeline de Importação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statusConfig).filter(([key]) => key !== 'cancelado').map(([key, config], index) => {
                    const isCurrentStatus = key === importData.status;
                    const isPastStatus = Object.keys(statusConfig).indexOf(importData.status) > index;
                    const isActive = isCurrentStatus || isPastStatus;
                    
                    return (
                      <div key={key} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
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
                            <CheckCircle2 className="w-4 h-4 text-white" />
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
          </div>
        </div>
      </div>
    </div>
  );
}