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
import { useUnifiedEndpoints } from "@/hooks/useUnifiedEndpoints";
import { useAuth } from "@/hooks/useAuth";
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

  // Use unified endpoint system
  const { 
    isAdmin, 
    isFinanceira, 
    getEndpoint, 
    invalidateAllRelatedQueries,
    permissions
  } = useUnifiedEndpoints();
  const { user } = useAuth();

  const { data: imports, isLoading } = useQuery({
    queryKey: [getEndpoint("imports")],
    enabled: !!user
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
  const completedImports = Array.isArray(imports) ? imports.filter((imp: Import) => 
    imp.status === 'completed'
  ).length : 0;
  const totalValue = Array.isArray(imports) ? imports.reduce((sum: number, imp: any) => {
    const value = parseFloat(imp.totalValue || '0');
    return sum + (isNaN(value) ? 0 : value);
  }, 0) : 0;

  // Cancel import mutation
  const cancelImportMutation = useMutation({
    mutationFn: async (importId: number) => {
      const response = await apiRequest(`/api/imports/${importId}`, "DELETE");
      return response;
    },
    onSuccess: () => {
      invalidateAllRelatedQueries();
      toast({
        title: "Sucesso!",
        description: "Importação cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a importação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCancelImport = (importId: number) => {
    cancelImportMutation.mutate(importId);
  };

  // Helper functions for status handling
  function getStatusBadge(status: string) {
    const statusMap = {
      estimativa: { label: "Estimativa", variant: "secondary" as const, color: "bg-gray-100 text-gray-700", icon: Clock },
      producao: { label: "Produção", variant: "default" as const, color: "bg-blue-100 text-blue-700", icon: AlertCircle },
      entregue_agente: { label: "Entregue Agente", variant: "default" as const, color: "bg-yellow-100 text-yellow-700", icon: Package },
      transporte_maritimo: { label: "Transporte Marítimo", variant: "default" as const, color: "bg-indigo-100 text-indigo-700", icon: Ship },
      transporte_aereo: { label: "Transporte Aéreo", variant: "default" as const, color: "bg-purple-100 text-purple-700", icon: Plane },
      desembaraco: { label: "Desembaraço", variant: "default" as const, color: "bg-orange-100 text-orange-700", icon: AlertCircle },
      transporte_nacional: { label: "Transporte Nacional", variant: "default" as const, color: "bg-cyan-100 text-cyan-700", icon: Truck },
      concluido: { label: "Concluído", variant: "default" as const, color: "bg-green-100 text-green-700", icon: CheckCircle },
      planning: { label: "Planejamento", variant: "secondary" as const, color: "bg-gray-100 text-gray-700", icon: Clock },
      in_progress: { label: "Em Andamento", variant: "default" as const, color: "bg-blue-100 text-blue-700", icon: AlertCircle },
      shipped: { label: "Enviado", variant: "default" as const, color: "bg-indigo-100 text-indigo-700", icon: Ship },
      completed: { label: "Concluído", variant: "default" as const, color: "bg-green-100 text-green-700", icon: CheckCircle },
      cancelled: { label: "Cancelado", variant: "destructive" as const, color: "bg-red-100 text-red-700", icon: AlertCircle },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.planning;
    const Icon = config.icon;

    return (
      <Badge className={`flex items-center gap-1 text-xs ${config.color} border-0`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  function canEdit(importItem: any) {
    // Allow editing for all statuses except completed and cancelled
    return !["concluido", "completed", "cancelled"].includes(importItem.status);
  }

  function canCancel(importItem: any) {
    // Allow cancellation for non-finished imports
    return !["concluido", "completed", "cancelled"].includes(importItem.status);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permissions.isFinanceira 
              ? "Análise de Importações" 
              : permissions.canViewAllApplications 
                ? "Todas as Importações" 
                : "Minhas Importações"
            }
          </h1>
          <p className="text-gray-600">
            {permissions.isFinanceira 
              ? "Análise financeira das operações de importação" 
              : permissions.canViewAllApplications 
                ? "Gerenciar todas as importações do sistema" 
                : "Gerencie suas operações de importação"
            }
          </p>
        </div>
        {!isFinanceira && (
          <Button onClick={() => setLocation('/imports/new')}>
            <Plus className="w-4 h-4 mr-2" />
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
            <div className="space-y-6">
              {filteredImports.map((importItem: any) => (
                <Card 
                  key={importItem.id} 
                  className="border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
                >
                  <CardContent className="p-0">
                    {/* Card Header with Company Badge */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {importItem.importName || `Importação #${importItem.id}`}
                            </h3>
                            {(isAdmin || isFinanceira) && importItem.companyName && (
                              <Badge variant="outline" className="text-xs mt-1">
                                <Building className="w-3 h-3 mr-1" />
                                {importItem.companyName}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(importItem.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setLocation(`/imports/details/${importItem.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              {canEdit(importItem) && (
                                <DropdownMenuItem onClick={() => setLocation(`/imports/edit/${importItem.id}`)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canCancel(importItem) && (
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
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleCancelImport(importItem.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Confirmar Cancelamento
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Card Body with Information Grid */}
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => setLocation(`/imports/details/${importItem.id}`)}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <DollarSign className="w-4 h-4" />
                            <span>Valor Total</span>
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            {importItem.totalValue ? 
                              `${importItem.currency || 'USD'} ${formatCurrency(parseFloat(importItem.totalValue))}` : 
                              'Não informado'
                            }
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Box className="w-4 h-4" />
                            <span>Tipo de Carga</span>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {importItem.cargoType || 'Não especificado'}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Ship className="w-4 h-4" />
                            <span>Modal</span>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {importItem.shippingMethod === 'sea' ? 'Marítimo' : 
                             importItem.shippingMethod === 'air' ? 'Aéreo' : 
                             'Não informado'}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Entrega Prevista</span>
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {importItem.estimatedDelivery ? 
                              new Date(importItem.estimatedDelivery).toLocaleDateString('pt-BR') : 
                              'Não definida'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Products Preview */}
                      {importItem.products && importItem.products.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Package className="w-4 h-4" />
                            <span>Produtos ({importItem.products.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {importItem.products.slice(0, 3).map((product: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {product.name}
                              </Badge>
                            ))}
                            {importItem.products.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{importItem.products.length - 3} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
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