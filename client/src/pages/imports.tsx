import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Import, type User } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import AdminImportFilters from "@/components/AdminImportFilters";
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar,
  DollarSign,
  Ship,
  Plane,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Building,
  Box,
  TrendingUp
} from "lucide-react";

export default function ImportsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adminFilters, setAdminFilters] = useState({
    search: "",
    status: "",
    company: "",
    cargoType: "",
  });
  const { toast } = useToast();

  // Fetch imports data - check if user is admin to use admin endpoint
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  const typedUser = user as User | undefined;
  const isAdmin = typedUser?.role === "admin" || typedUser?.email === "pavaosmart@gmail.com";
  const isFinanceira = typedUser?.role === "financeira";
  
  const getImportsEndpoint = () => {
    if (isFinanceira) {
      return "/api/financeira/imports";
    } else if (isAdmin) {
      return "/api/admin/imports";
    } else {
      return "/api/imports";
    }
  };

  const { data: imports, isLoading } = useQuery({
    queryKey: [getImportsEndpoint()]
  });

  // Filter imports based on admin/financeira or regular user
  const filteredImports = Array.isArray(imports) ? imports.filter((importItem: any) => {
    if (isAdmin || isFinanceira) {
      // Admin filtering using AdminImportFilters
      const matchesSearch = !adminFilters.search || 
        importItem.importName?.toLowerCase().includes(adminFilters.search.toLowerCase()) ||
        importItem.companyName?.toLowerCase().includes(adminFilters.search.toLowerCase()) ||
        (Array.isArray(importItem.products) && importItem.products.some((product: any) => 
          product.name?.toLowerCase().includes(adminFilters.search.toLowerCase())
        ));
      
      const matchesStatus = !adminFilters.status || importItem.status === adminFilters.status;
      const matchesCargoType = !adminFilters.cargoType || importItem.cargoType === adminFilters.cargoType;
      
      return matchesSearch && matchesStatus && matchesCargoType;
    } else {
      // Regular user filtering
      const matchesSearch = !searchTerm || 
        importItem.importName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(importItem.products) && importItem.products.some((product: any) => 
          product.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      
      const matchesStatus = !statusFilter || statusFilter === "all" || importItem.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }
  }) : [];

  // Calculate metrics
  const totalImports = Array.isArray(imports) ? imports.length : 0;
  const activeImports = Array.isArray(imports) ? imports.filter((imp: Import) => 
    ['planning', 'in_progress', 'shipped'].includes(imp.status)
  ).length : 0;
  const completedImports = Array.isArray(imports) ? imports.filter((imp: Import) => imp.status === 'completed').length : 0;
  const totalValue = Array.isArray(imports) ? imports.reduce((sum: number, imp: Import) => 
    sum + (parseFloat(imp.totalValue) || 0), 0
  ) : 0;

  // Handle import cancellation
  const cancelImportMutation = useMutation({
    mutationFn: async (importId: number) => {
      return apiRequest(`/api/imports/${importId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Importação cancelada",
        description: "A importação foi cancelada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/imports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Truck className="w-4 h-4" />;
      case 'shipped': return <Ship className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'planning': 'Planejamento',
      'in_progress': 'Em Andamento',
      'shipped': 'Enviado',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando importações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isFinanceira 
              ? "Análise de Importações" 
              : isAdmin 
                ? "Todas as Importações" 
                : "Minhas Importações"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isFinanceira
              ? "Monitore importações de empresas aprovadas para análise financeira"
              : isAdmin
                ? "Visualize e gerencie importações de todos os importadores"
                : "Gerencie suas importações da China"}
          </p>
        </div>
        {!isFinanceira && (
          <Button
            onClick={() => setLocation('/imports/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Importação
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Importações</p>
                <p className="text-2xl font-bold">{totalImports}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Importações Ativas</p>
                <p className="text-2xl font-bold">{activeImports}</p>
              </div>
              <Truck className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">{completedImports}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {(isAdmin || isFinanceira) ? (
        <AdminImportFilters onFiltersChange={setAdminFilters} />
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por fornecedor, produto ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Imports List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Importações</CardTitle>
          <p className="text-sm text-gray-600">{filteredImports.length} importações encontradas</p>
        </CardHeader>
        <CardContent>
          {filteredImports.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma importação encontrada</p>
              <Button
                onClick={() => setLocation('/imports/new')}
                className="mt-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira importação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredImports.map((importItem: Import) => (
                <div key={importItem.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {importItem.importName || `Importação #${importItem.id}`}
                        </h3>
                        <Badge className={`flex items-center gap-1 ${getStatusColor(importItem.status)}`}>
                          {getStatusIcon(importItem.status)}
                          {getStatusLabel(importItem.status)}
                        </Badge>
                        {(isAdmin || isFinanceira) && (importItem as any).companyName && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {(importItem as any).companyName}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Produtos: <strong>{Array.isArray(importItem.products) ? importItem.products.length : 0}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Valor: <strong>{formatCurrency(parseFloat(importItem.totalValue))}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4" />
                          <span>Tipo: <strong>{importItem.cargoType}</strong></span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/imports/details/${importItem.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {importItem.status === 'planning' && (
                          <DropdownMenuItem onClick={() => setLocation(`/imports/edit/${importItem.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {!['completed', 'cancelled'].includes(importItem.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Importação</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar esta importação? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Não, manter</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelImportMutation.mutate(importItem.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Sim, cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}