import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building, 
  CreditCard,
  Package,
  Clock,
  Star,
  Edit
} from "lucide-react";

export default function SupplierDetailsPage() {
  const [, setLocation] = useLocation();
  const supplierId = window.location.pathname.split('/').pop();

  const { data: supplier, isLoading } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Fornecedor não encontrado</h2>
          <p className="text-gray-600 mt-2">O fornecedor solicitado não existe ou foi removido.</p>
          <Button 
            onClick={() => setLocation('/suppliers')}
            className="mt-4"
          >
            Voltar para Fornecedores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/suppliers')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{supplier.companyName}</h1>
            <p className="text-gray-600">Detalhes do fornecedor chinês</p>
          </div>
        </div>
        <Button onClick={() => setLocation(`/suppliers/edit/${supplier.id}`)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome da Empresa</label>
                  <p className="text-lg font-semibold">{supplier.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Pessoa de Contato</label>
                  <p className="text-lg">{supplier.contactName || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">E-mail</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p>{supplier.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Telefone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p>{supplier.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Endereço</label>
                  <p>{supplier.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cidade</label>
                  <p>{supplier.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado/Província</label>
                  <p>{supplier.state || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">País</label>
                  <p>{supplier.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informações Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Registro Empresarial</label>
                  <p>{supplier.businessRegistration || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Fiscal</label>
                  <p>{supplier.taxId || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Banco</label>
                  <p>{supplier.bankName || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Conta Bancária</label>
                  <p>{supplier.bankAccount || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Código SWIFT</label>
                  <p>{supplier.swiftCode || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Termos de Pagamento</label>
                  <p>{supplier.preferredPaymentTerms || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Status and Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Status e Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                    {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Avaliação</label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (supplier.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {supplier.rating || 0}/5
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories and Specialization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Especialização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Especialização</label>
                <p className="mt-1">{supplier.specialization || 'Não informado'}</p>
              </div>
              {supplier.productCategories && supplier.productCategories.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Categorias de Produtos</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {supplier.productCategories.map((category: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Valor Mínimo do Pedido</label>
                <p className="mt-1">{supplier.minimumOrderValue || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Lead Time</label>
                <p className="mt-1">{supplier.leadTime || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Data de Cadastro</label>
                <p className="mt-1">
                  {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('pt-BR') : 'Não informado'}
                </p>
              </div>
              {supplier.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Observações</label>
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded-md">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}