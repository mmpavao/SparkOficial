import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Import, type User } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import AdminImportFilters from "@/components/AdminImportFilters";
import { useUnifiedEndpoints } from "@/hooks/useUnifiedEndpoints";
import { useAuth } from "@/hooks/useAuth";
import { 
  MoreVertical, 
  Plus, 
  Package,
  Eye,
  Edit,
  X,
  FileText,
  CheckCircle,
  Clock,
  Palette,
  Filter,
  Calendar,
  DollarSign,
  Building2,
  Truck,
  Ship,
  AlertTriangle,
  Anchor,
  FileCheck,
  Play,
  TrendingUp,
  Search,
  AlertCircle,
  Box
} from "lucide-react";

// Pipeline stages with icons
const pipelineStages = [
  { id: "planning", name: "Planejamento", icon: FileText },
  { id: "invoice", name: "Invoice", icon: FileCheck },
  { id: "producao", name: "Produção", icon: Package },
  { id: "embarque", name: "Embarque", icon: Ship },
  { id: "transporte", name: "Transporte Marítimo", icon: Ship },
  { id: "atracacao", name: "Atracação", icon: Anchor },
  { id: "desembaraco", name: "Desembaraço", icon: FileCheck },
  { id: "transporte_terrestre", name: "Transporte Terrestre", icon: Truck },
  { id: "entrega", name: "Entrega", icon: CheckCircle },
];

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
      invalidateAllRelatedQueries(queryClient, "imports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ importId, newStatus }: { importId: number; newStatus: string }) => {
      return apiRequest(`/api/imports/${importId}/status`, 'PUT', { status: newStatus });
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da importação foi atualizado com sucesso.",
      });
      invalidateAllRelatedQueries(queryClient, "imports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update pipeline mutation
  const updatePipelineMutation = useMutation({
    mutationFn: async ({ importId, stage, status }: { importId: number; stage: string; status?: string }) => {
      return apiRequest(`/api/imports/${importId}/pipeline`, "PUT", {
        stage,
        currentStage: stage,
        status: status || "in_progress",
        data: { status: status || "in_progress", updatedAt: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      toast({
        title: "Pipeline atualizado!",
        description: "A etapa do pipeline foi alterada com sucesso.",
      });
      invalidateAllRelatedQueries(queryClient, "imports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar pipeline",
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

    const getStatusBadge = (status: string) => {
    const statusColor = getStatusColor(status);
    const statusLabel = getStatusLabel(status);
    const statusIcon = getStatusIcon(status);

    return (
      <Badge className={`${statusColor} px-2 py-1 text-xs gap-1`}>
        {statusIcon}
        {statusLabel}
      </Badge>
    );
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
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando importações...</p>
          </div>
        ) : filteredImports.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma importação encontrada</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? "Tente alterar o termo de busca" : "Clique em 'Nova Importação' para começar"}
            </p>
          </div>
        ) : (
          filteredImports.map((importItem: any) => (
            <Card 
              key={importItem.id} 
              className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => setLocation(`/imports/details/${importItem.id}`)}
            >
              <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        IMP-{String(importItem.id).padStart(3, '0')}-2024
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Box className="w-4 h-4" />
                        {importItem.importName || "Importação de produtos"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {getStatusBadge(importItem.status)}</div>

                    {/* Action Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-green-600" />
                      Alterar Etapa
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {pipelineStages.map((stage) => {
                        const Icon = stage.icon;
                        let currentStage = importItem.status;
                        if (currentStage === 'planning') currentStage = 'planning';
                        else if (currentStage === 'in_progress') currentStage = importItem.currentStage || 'producao';
                        else if (currentStage === 'shipped') currentStage = 'transporte';
                        else if (currentStage === 'completed') currentStage = 'entrega';
                        
                        if (stage.id === currentStage) return null;

                        return (
                          <DropdownMenuItem
                            key={stage.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              // Determinar o novo status baseado na etapa
                              let newStatus = 'in_progress';
                              if (stage.id === 'planning') newStatus = 'planning';
                              else if (stage.id === 'transporte') newStatus = 'shipped';
                              else if (stage.id === 'entrega') newStatus = 'completed';
                              
                              // Atualizar pipeline e status em uma única operação
                              updatePipelineMutation.mutate({
                                importId: importItem.id,
                                stage: stage.id,
                                status: newStatus
                              });
                            }}
                            className="flex items-center gap-2"
                          >
                            <Icon className="w-4 h-4 text-blue-600" />
                            {stage.name}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {["planejamento", "planning"].includes(importItem.status) && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/imports/edit/${importItem.id}`);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                      Editar Importação
                    </DropdownMenuItem>
                  )}

                  {["planejamento", "planning", "em_andamento", "in_progress"].includes(importItem.status) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({
                            importId: importItem.id,
                            newStatus: "cancelada"
                          });
                        }}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        Cancelar Importação
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Data de Criação
                    </div>
                    <div className="font-semibold text-gray-900">
                      {new Date(importItem.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Previsão de Entrega
                    </div>
                    <div className="font-semibold text-gray-900">
                      {importItem.estimatedDelivery ? 
                        new Date(importItem.estimatedDelivery).toLocaleDateString('pt-BR') : 
                        'Não informado'
                      }
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                      Valor FOB
                    </div>
                    <div className="font-semibold text-gray-900">
                      {importItem.totalValue ? 
                        `${importItem.currency || 'USD'} ${formatCurrency(parseFloat(importItem.totalValue))}` : 
                        'Não informado'
                      }
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <Package className="w-4 h-4" />
                      Tipo de Carga
                    </div>
                    <div className="font-semibold text-gray-900">
                      {importItem.cargoType || 'FCL'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      Progresso da Importação
                    </span>
                    <span className="font-semibold text-gray-900">
                      {(() => {
                        // Usar currentStage diretamente se disponível, senão mapear do status
                        const currentStage = importItem.currentStage || (() => {
                          if (importItem.status === 'planning') return 'planning';
                          if (importItem.status === 'shipped') return 'transporte';
                          if (importItem.status === 'completed') return 'entrega';
                          return 'producao'; // default para in_progress
                        })();
                        
                        const currentIndex = pipelineStages.findIndex(stage => stage.id === currentStage);
                        const progress = currentIndex >= 0 ? Math.round(((currentIndex + 1) / pipelineStages.length) * 100) : 0;
                        return `${progress}%`;
                      })()}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${(() => {
                            // Usar currentStage diretamente se disponível, senão mapear do status
                            const currentStage = importItem.currentStage || (() => {
                              if (importItem.status === 'planning') return 'planning';
                              if (importItem.status === 'shipped') return 'transporte';
                              if (importItem.status === 'completed') return 'entrega';
                              return 'producao'; // default para in_progress
                            })();
                            
                            const currentIndex = pipelineStages.findIndex(stage => stage.id === currentStage);
                            return currentIndex >= 0 ? ((currentIndex + 1) / pipelineStages.length) * 100 : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>

                    {/* Progress dots with icons */}
                    <div className="absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between px-1">
                      {pipelineStages.map((stage, index) => {
                        // Usar currentStage diretamente se disponível, senão mapear do status
                        const currentStage = importItem.currentStage || (() => {
                          if (importItem.status === 'planning') return 'planning';
                          if (importItem.status === 'shipped') return 'transporte';
                          if (importItem.status === 'completed') return 'entrega';
                          return 'producao'; // default para in_progress
                        })();
                        
                        const currentIndex = pipelineStages.findIndex(s => s.id === currentStage);
                        const isActive = index <= currentIndex;
                        const StageIcon = stage.icon;
                        
                        return (
                          <div
                            key={index}
                            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                              isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                            }`}
                            title={stage.name}
                          >
                            <StageIcon className="w-3 h-3" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}