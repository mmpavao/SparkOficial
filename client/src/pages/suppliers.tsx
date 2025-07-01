import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUnifiedEndpoints } from "@/hooks/useUnifiedEndpoints";
import { useAuth } from "@/hooks/useAuth";
import { UniversalCard } from "@/components/shared/UniversalCard";
import { 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  TrendingUp,
  Globe,
  Factory
} from "lucide-react";

export default function SuppliersPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteSupplier, setDeleteSupplier] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Navigation handler for card clicks
  const handleSupplierCardClick = (supplierId: number) => {
    setLocation(`/suppliers/details/${supplierId}`);
  };

  // Use unified endpoint system
  const { 
    isAdmin, 
    isFinanceira, 
    getEndpoint, 
    invalidateAllRelatedQueries,
    permissions
  } = useUnifiedEndpoints();

  // Fetch suppliers data - use appropriate endpoint based on user role
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: [getEndpoint("suppliers")],
    enabled: !!user
  });

  // Filter suppliers
  const filteredSuppliers = (suppliers as any[]).filter((supplier: any) =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate metrics
  const suppliersArray = suppliers as any[];
  const totalSuppliers = suppliersArray.length;
  const activeSuppliers = suppliersArray.filter((s: any) => s.status === 'active' || !s.status).length;
  const chineseSuppliers = suppliersArray.length; // All suppliers are Chinese manufacturers

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      const response = await apiRequest(`/api/suppliers/${supplierId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor excluído",
        description: "O fornecedor foi removido com sucesso.",
      });
      invalidateAllRelatedQueries(queryClient, "suppliers");
      setDeleteSupplier(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteSupplier = (supplier: any) => {
    setDeleteSupplier(supplier);
  };

  const confirmDelete = () => {
    if (deleteSupplier) {
      deleteSupplierMutation.mutate(deleteSupplier.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isFinanceira 
              ? "Análise de Fornecedores" 
              : isAdmin 
                ? "Todos os Fornecedores" 
                : "Fornecedores"}
          </h1>
          <p className="text-muted-foreground">
            {isFinanceira
              ? "Analise fornecedores de empresas aprovadas para avaliação de crédito"
              : isAdmin
                ? "Visualize e gerencie fornecedores de todos os importadores"
                : "Gerencie seus fornecedores chineses"}
          </p>
        </div>
        {!isFinanceira && !isAdmin && (
          <Button onClick={() => setLocation('/suppliers/new')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Fornecedores</p>
                <p className="text-2xl font-bold">{totalSuppliers}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fornecedores Ativos</p>
                <p className="text-2xl font-bold">{activeSuppliers}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fabricantes Chineses</p>
                <p className="text-2xl font-bold">{chineseSuppliers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <p className="text-sm text-gray-600">{filteredSuppliers.length} fornecedores encontrados</p>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum fornecedor encontrado</p>
              <Button
                onClick={() => setLocation('/suppliers/new')}
                className="mt-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro fornecedor
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuppliers.map((supplier: any) => (
                <UniversalCard
                  key={supplier.id}
                  icon={<Factory className="w-6 h-6 text-green-600" />}
                  title={supplier.companyName}
                  subtitle="Fabricante Chinês"
                  applicationNumber={supplier.id.toString()}
                  companyBadge={(isAdmin || isFinanceira) && (supplier as any).importerCompanyName ? (supplier as any).importerCompanyName : undefined}
                  status={{
                    label: "Ativo",
                    color: "text-green-600",
                    bgColor: "bg-green-50",
                    borderColor: "border-l-green-500"
                  }}
                  miniCards={[
                    {
                      icon: <Globe className="w-4 h-4 text-blue-600" />,
                      label: "Localização",
                      value: `${supplier.city}, ${supplier.country}`,
                      color: "bg-blue-50 border-blue-200"
                    },
                    {
                      icon: <Phone className="w-4 h-4 text-purple-600" />,
                      label: "Telefone",
                      value: supplier.phone || 'N/A',
                      color: "bg-purple-50 border-purple-200"
                    },
                    {
                      icon: <Mail className="w-4 h-4 text-orange-600" />,
                      label: "Email",
                      value: supplier.email || 'N/A',
                      color: "bg-orange-50 border-orange-200"
                    },
                    {
                      icon: <Building2 className="w-4 h-4 text-green-600" />,
                      label: "Contato",
                      value: supplier.contactName || 'N/A',
                      color: "bg-green-50 border-green-200"
                    }
                  ]}
                  actions={[
                    {
                      icon: <Eye className="w-4 h-4" />,
                      label: "Ver Detalhes",
                      onClick: () => setLocation(`/suppliers/details/${supplier.id}`)
                    },
                    {
                      icon: <Edit className="w-4 h-4" />,
                      label: "Editar",
                      onClick: () => setLocation(`/suppliers/edit/${supplier.id}`)
                    },
                    {
                      icon: <Trash2 className="w-4 h-4" />,
                      label: "Excluir",
                      onClick: () => handleDeleteSupplier(supplier),
                      variant: 'destructive'
                    }
                  ]}
                  onClick={() => handleSupplierCardClick(supplier.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSupplier} onOpenChange={() => setDeleteSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{deleteSupplier?.companyName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}