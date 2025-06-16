import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  MapPin, 
  Calendar, 
  DollarSign,
  Package,
  Building2,
  Ship,
  Clock
} from "lucide-react";
import { MetricsCard } from "@/components/common/MetricsCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";

export default function FinanceiraImports() {
  // Buscar importações de usuários pré-aprovados
  const { data: imports = [], isLoading } = useQuery({
    queryKey: ['/api/financeira/imports'],
    queryFn: () => apiRequest('/api/financeira/imports')
  });

  // Calcular métricas
  const importsArray = Array.isArray(imports) ? imports : [];
  const totalImports = importsArray.length;
  const totalValue = importsArray.reduce((sum: number, imp: any) => sum + (imp.totalValue || 0), 0);
  const activeImports = importsArray.filter((imp: any) => 
    ['planejamento', 'em_transito', 'desembaraco'].includes(imp.status)
  ).length;

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any } } = {
      'planejamento': { label: 'Planejamento', variant: 'outline' },
      'em_transito': { label: 'Em Trânsito', variant: 'default' },
      'desembaraco': { label: 'Desembaraço', variant: 'secondary' },
      'finalizada': { label: 'Finalizada', variant: 'default' },
      'cancelada': { label: 'Cancelada', variant: 'destructive' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getCargoTypeBadge = (cargoType: string) => {
    const typeMap: { [key: string]: { label: string; icon: any } } = {
      'FCL': { label: 'FCL (Container Completo)', icon: Ship },
      'LCL': { label: 'LCL (Carga Fracionada)', icon: Package }
    };
    
    const typeInfo = typeMap[cargoType] || { label: cargoType, icon: Package };
    const Icon = typeInfo.icon;
    
    return (
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        <span className="text-xs">{typeInfo.label}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importações Aprovadas</h1>
          <p className="text-gray-600">Importações de clientes com crédito pré-aprovado</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricsCard
          title="Total de Importações"
          value={totalImports}
          icon={Truck}
          color="blue"
        />
        <MetricsCard
          title="Valor Total"
          value={formatCurrency(totalValue)}
          icon={DollarSign}
          color="green"
        />
        <MetricsCard
          title="Importações Ativas"
          value={activeImports}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Lista de Importações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Importações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importsArray.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma importação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {imports.map((importItem: any) => (
                <Card key={importItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {importItem.importName || `Importação #${importItem.id}`}
                          </h3>
                          {getStatusBadge(importItem.status)}
                        </div>
                        
                        {/* Badge do Importador */}
                        {importItem.user && (
                          <Badge variant="outline" className="text-xs mb-3">
                            {importItem.user.companyName}
                          </Badge>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium">Valor:</span> {formatCurrency(importItem.totalValue)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Criado:</span> {formatDate(importItem.createdAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Origem:</span> {importItem.originPort}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Destino:</span> {importItem.destinationPort}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informações de Carga */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Tipo de Carga</span>
                        {getCargoTypeBadge(importItem.cargoType)}
                      </div>
                      
                      {importItem.cargoType === 'FCL' && importItem.containerInfo && (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Container:</span> {importItem.containerInfo.number}
                          </div>
                          <div>
                            <span className="font-medium">Selo:</span> {importItem.containerInfo.seal}
                          </div>
                        </div>
                      )}

                      {importItem.cargoType === 'LCL' && importItem.products && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Produtos ({importItem.products.length})</span>
                          <div className="mt-1 space-y-1">
                            {importItem.products.slice(0, 3).map((product: any, index: number) => (
                              <div key={index} className="text-sm text-gray-600 flex justify-between">
                                <span>{product.description}</span>
                                <span>{product.quantity} x {formatCurrency(product.unitPrice)}</span>
                              </div>
                            ))}
                            {importItem.products.length > 3 && (
                              <div className="text-sm text-gray-500">
                                +{importItem.products.length - 3} produtos adicionais
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Informações do Fornecedor */}
                    {importItem.supplier && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Fornecedor</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{importItem.supplier.companyName}</p>
                          <p>{importItem.supplier.city}, {importItem.supplier.state} - {importItem.supplier.country}</p>
                          {importItem.supplier.email && (
                            <p>{importItem.supplier.email}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informações de Pagamento */}
                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Incoterm:</span>
                          <p className="text-gray-600">{importItem.incoterm}</p>
                        </div>
                        {importItem.paymentTerms && (
                          <div>
                            <span className="font-medium text-gray-700">Prazo de Pagamento:</span>
                            <p className="text-gray-600">{importItem.paymentTerms} dias</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}