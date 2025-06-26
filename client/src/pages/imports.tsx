import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Package, Plus, Search, Filter, MoreVertical, Eye, Edit3, X } from "lucide-react";
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

interface ImportItem {
  id: number;
  userId: number;
  importName: string;
  importNumber?: string;
  cargoType: 'FCL' | 'LCL';
  totalValue: string;
  currency: string;
  currentStage: string;
  status: string;
  estimatedDelivery?: string;
  supplierId?: number;
  supplierName?: string;
  companyName?: string;
  products: any[];
  createdAt: string;
}

export default function ImportsPage() {
  const { user } = useAuth();
  const { isAdmin, isFinanceira } = useUserPermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportItem | null>(null);

  // Determinar endpoint baseado no papel do usuário
  const endpoint = (isAdmin || isFinanceira) ? "/api/admin/imports" : "/api/imports";

  const { data: imports = [], isLoading } = useQuery<ImportItem[]>({
    queryKey: [endpoint],
    enabled: !!user,
  });

  const handleCancelImport = (importItem: ImportItem) => {
    setSelectedImport(importItem);
    setCancelDialogOpen(true);
  };

  const confirmCancelImport = () => {
    // TODO: Implementar cancelamento via API
    console.log("Cancelando importação:", selectedImport?.id);
    setCancelDialogOpen(false);
    setSelectedImport(null);
  };

  const getStatusBadge = (status: string, stage: string) => {
    const statusConfig = {
      planning: { label: "Planejamento", variant: "secondary" as const, color: "bg-blue-100 text-blue-800 border-blue-200" },
      active: { label: "Em Andamento", variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
      completed: { label: "Concluída", variant: "outline" as const, color: "bg-gray-100 text-gray-800 border-gray-200" },
      cancelled: { label: "Cancelada", variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;
    
    return (
      <Badge variant={config.variant} className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  const getStageLabel = (stage: string) => {
    const stages = {
      estimativa: "Estimativa",
      producao: "Produção",
      entregue_agente: "Entregue ao Agente",
      transporte_maritimo: "Transporte Marítimo",
      transporte_aereo: "Transporte Aéreo",
      desembaraco: "Desembaraço",
      transporte_nacional: "Transporte Nacional",
      concluido: "Concluído"
    };
    return stages[stage as keyof typeof stages] || stage;
  };

  const formatCurrency = (value: string, currency: string = "USD") => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const filteredImports = imports.filter(imp => {
    const matchesSearch = imp.importName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (imp.importNumber && imp.importNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || imp.status === statusFilter;
    const matchesSupplier = supplierFilter === "all" || imp.supplierId?.toString() === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Calcular métricas
  const totalImports = imports.length;
  const activeImports = imports.filter(imp => imp.status === 'active').length;
  const completedImports = imports.filter(imp => imp.status === 'completed').length;
  const totalValue = imports.reduce((sum, imp) => sum + (parseFloat(imp.totalValue) || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
              {isFinanceira ? "Análise de Importações" : isAdmin ? "Todas as Importações" : "Minhas Importações"}
            </h2>
            <p className="text-muted-foreground">
              Carregando importações...
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {isFinanceira ? "Análise de Importações" : isAdmin ? "Todas as Importações" : "Minhas Importações"}
          </h2>
          <p className="text-muted-foreground">
            Gerencie e acompanhe suas importações
          </p>
        </div>
        {!isFinanceira && (
          <Link href="/imports/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Importação
            </Button>
          </Link>
        )}
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Importações</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImports}</div>
            <p className="text-xs text-muted-foreground">
              Todas as importações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeImports}</div>
            <p className="text-xs text-muted-foreground">
              Importações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedImports}</div>
            <p className="text-xs text-muted-foreground">
              Importações finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue.toString())}</div>
            <p className="text-xs text-muted-foreground">
              Volume importado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="active">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Importações */}
      <div className="grid gap-4">
        {filteredImports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma importação encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                {imports.length === 0 
                  ? "Você ainda não tem importações cadastradas." 
                  : "Nenhuma importação corresponde aos filtros aplicados."}
              </p>
              {!isFinanceira && imports.length === 0 && (
                <Link href="/imports/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Importação
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredImports.map((importItem) => (
            <Card key={importItem.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{importItem.importName}</h3>
                      {importItem.importNumber && (
                        <Badge variant="outline">#{importItem.importNumber}</Badge>
                      )}
                      {(isAdmin || isFinanceira) && importItem.companyName && (
                        <Badge variant="secondary">{importItem.companyName}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      {getStatusBadge(importItem.status, importItem.currentStage)}
                      <span className="text-sm text-muted-foreground">
                        {getStageLabel(importItem.currentStage)}
                      </span>
                      <Badge variant="outline">
                        {importItem.cargoType}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/imports/${importItem.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                      {importItem.status === 'planning' && (
                        <DropdownMenuItem asChild>
                          <Link href={`/imports/${importItem.id}/edit`}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {importItem.status !== 'completed' && importItem.status !== 'cancelled' && (
                        <DropdownMenuItem 
                          onClick={() => handleCancelImport(importItem)}
                          className="text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium">{formatCurrency(importItem.totalValue, importItem.currency)}</p>
                  </div>
                  
                  {importItem.supplierName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fornecedor</p>
                      <p className="font-medium">{importItem.supplierName}</p>
                    </div>
                  )}
                  
                  {importItem.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                      <p className="font-medium">
                        {new Date(importItem.estimatedDelivery).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {importItem.products && importItem.products.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Produtos</p>
                    <div className="flex gap-2 flex-wrap">
                      {importItem.products.slice(0, 3).map((product: any, index: number) => (
                        <Badge key={index} variant="outline">
                          {product.name}
                        </Badge>
                      ))}
                      {importItem.products.length > 3 && (
                        <Badge variant="outline">
                          +{importItem.products.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a importação "{selectedImport?.importName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelImport} className="bg-red-600 hover:bg-red-700">
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}