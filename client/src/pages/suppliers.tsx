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
  TrendingUp
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
        {!isFinanceira && (
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
      <div className="space-y-4">
        {filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Nenhum fornecedor encontrado</p>
              <Button
                onClick={() => setLocation('/suppliers/new')}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro fornecedor
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredSuppliers.map((supplier: any) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">#{supplier.id}</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                        {supplier.companyName}
                      </h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Fornecedor Chinês
                        </Badge>
                        {(isAdmin || isFinanceira) && (supplier as any).importerCompanyName && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            {(supplier as any).importerCompanyName}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">
                          Local: {supplier.city}, {supplier.country}
                        </p>
                        <p className="text-xs text-gray-600">
                          Tel: {supplier.phone} • Email: {supplier.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center justify-end space-x-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">
                        Cadastrado em {new Date(supplier.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/suppliers/details/${supplier.id}`} className="flex items-center w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/suppliers/edit/${supplier.id}`} className="flex items-center w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o fornecedor "{supplier.companyName}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSupplier(supplier)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>



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