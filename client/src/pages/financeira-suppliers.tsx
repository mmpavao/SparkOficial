import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MapPin, 
  Phone, 
  Mail,
  Building2,
  Globe,
  Star
} from "lucide-react";
import MetricsCard from "@/components/common/MetricsCard";
import { apiRequest } from "@/lib/queryClient";

export default function FinanceiraSuppliers() {
  // Buscar fornecedores de usuários pré-aprovados
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['/api/financeira/suppliers'],
    queryFn: () => apiRequest('/api/financeira/suppliers')
  });

  // Calcular métricas
  const suppliersArray = Array.isArray(suppliers) ? suppliers : [];
  const totalSuppliers = suppliersArray.length;
  const activeSuppliers = suppliersArray.filter((s: any) => s.status === 'active').length;
  const avgRating = suppliersArray.length > 0 
    ? suppliersArray.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / suppliersArray.length 
    : 0;

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any } } = {
      'active': { label: 'Ativo', variant: 'default' },
      'inactive': { label: 'Inativo', variant: 'secondary' },
      'pending': { label: 'Pendente', variant: 'outline' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
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
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores Aprovados</h1>
          <p className="text-gray-600">Fornecedores de clientes com crédito pré-aprovado</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricsCard
          title="Total de Fornecedores"
          value={totalSuppliers}
          icon={Users}
          color="blue"
        />
        <MetricsCard
          title="Fornecedores Ativos"
          value={activeSuppliers}
          icon={Building2}
          color="green"
        />
        <MetricsCard
          title="Avaliação Média"
          value={avgRating.toFixed(1)}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum fornecedor encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {suppliers.map((supplier: any) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {supplier.companyName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {supplier.contactName}
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(supplier.status)}
                          {supplier.rating && (
                            <div className="flex items-center gap-1">
                              {getRatingStars(supplier.rating)}
                              <span className="text-sm text-gray-600 ml-1">
                                ({supplier.rating.toFixed(1)})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Badge do Importador */}
                      {supplier.user && (
                        <Badge variant="outline" className="text-xs">
                          {supplier.user.companyName}
                        </Badge>
                      )}
                    </div>

                    {/* Informações de Contato */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{supplier.city}, {supplier.state} - {supplier.country}</span>
                      </div>
                      
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Informações Comerciais */}
                    {(supplier.specialization || supplier.productCategories) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {supplier.specialization && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Especialização
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              {supplier.specialization}
                            </p>
                          </div>
                        )}
                        
                        {supplier.productCategories && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Categorias
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {supplier.productCategories.split(',').slice(0, 3).map((category: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {category.trim()}
                                </Badge>
                              ))}
                              {supplier.productCategories.split(',').length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{supplier.productCategories.split(',').length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Informações Financeiras */}
                    {(supplier.minimumOrderValue || supplier.preferredPaymentTerms) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                          {supplier.minimumOrderValue && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Pedido Mínimo
                              </span>
                              <p className="text-sm text-gray-700 mt-1">
                                ${supplier.minimumOrderValue.toLocaleString()}
                              </p>
                            </div>
                          )}
                          
                          {supplier.preferredPaymentTerms && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Pagamento
                              </span>
                              <p className="text-sm text-gray-700 mt-1">
                                {supplier.preferredPaymentTerms}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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