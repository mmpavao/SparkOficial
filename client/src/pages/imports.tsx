import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Package, Ship, Truck, CheckCircle2, XCircle, Clock, AlertCircle, Building2, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { formatCurrency, formatCompactNumber } from "@/lib/formatters";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

// Database structure for imports
interface Import {
  id: number;
  userId: number;
  importName: string;
  importNumber: string;
  totalValue: string;
  currency: string;
  status: string;
  cargoType: 'FCL' | 'LCL';
  containerNumber?: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  companyName?: string;
  supplierName?: string;
  createdAt: string;
  products?: any;
  currentStage?: string;
}

// Status mapping for display
const getStatusInfo = (status: string, currentStage: string) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    planning: { label: "Planejamento", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
    production: { label: "Produção", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
    shipped: { label: "Embarcado", color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
    in_transit: { label: "Em Trânsito", color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
    customs: { label: "Desembaraço", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200" },
    delivered: { label: "Entregue", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
    completed: { label: "Concluído", color: "text-green-700", bgColor: "bg-green-100 border-green-300" },
    cancelled: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  };

  return statusMap[status] || { label: status, color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" };
};

// Metrics calculation
interface ImportMetrics {
  totalImports: number;
  activeImports: number;
  completedImports: number;
  totalValue: number;
  planningCount: number;
  productionCount: number;
  transitCount: number;
  successRate: number;
}

const calculateMetrics = (imports: Import[]): ImportMetrics => {
  return {
    totalImports: imports.length,
    activeImports: imports.filter(imp => !['completed', 'cancelled'].includes(imp.status)).length,
    completedImports: imports.filter(imp => imp.status === 'completed').length,
    totalValue: imports.reduce((sum, imp) => sum + parseFloat(imp.totalValue), 0),
    planningCount: imports.filter(imp => imp.status === 'planning').length,
    productionCount: imports.filter(imp => imp.status === 'production').length,
    transitCount: imports.filter(imp => ['shipped', 'in_transit'].includes(imp.status)).length,
    successRate: imports.length > 0 ? (imports.filter(imp => imp.status === 'completed').length / imports.length) * 100 : 0,
  };
};

export default function ImportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cargoFilter, setCargoFilter] = useState("all");
  const { toast } = useToast();
  const permissions = useUserPermissions();
  const { t } = useTranslation();

  // Fetch real imports data from API
  const { data: imports = [], isLoading, error } = useQuery({
    queryKey: ['/api/imports'],
  });

  const typedImports = imports as Import[];
  const metrics = calculateMetrics(typedImports);

  // Filter imports
  const filteredImports = typedImports.filter((imp: Import) => {
    const matchesSearch = imp.importName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          imp.importNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (imp.companyName && imp.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || imp.status === statusFilter;
    const matchesCargo = cargoFilter === "all" || imp.cargoType === cargoFilter;
    return matchesSearch && matchesStatus && matchesCargo;
  });

  const handleCancelImport = async (importId: number) => {
    try {
      // API call will be implemented here
      toast({
        title: "Importação cancelada",
        description: "A importação foi cancelada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar importação.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar importações</h3>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar os dados das importações.
          </p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permissions.isFinanceira 
              ? "Análise de Importações" 
              : permissions.isAdmin 
                ? "Todas as Importações" 
                : t('imports.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {permissions.isAdmin || permissions.isFinanceira 
              ? "Gerencie e monitore todas as importações da plataforma"
              : "Gerencie suas importações e acompanhe o status de cada operação"}
          </p>
        </div>
        {!permissions.isFinanceira && !permissions.canViewAllApplications && (
          <div className="flex gap-2">
            <Link href="/imports/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                {t('imports.newCredit')}
              </Button>
            </Link>
            <Link href="/imports/new-expanded">
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                <Plus className="w-4 h-4 mr-2" />
                {t('imports.newOperational')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('imports.totalImports')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalImports}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('imports.activeImports')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeImports}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.completedImports}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCompactNumber(metrics.totalValue)}</p>
              </div>
              <Ship className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Buscar importações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="shipped">Embarcado</SelectItem>
                  <SelectItem value="in_transit">Em Trânsito</SelectItem>
                  <SelectItem value="customs">Desembaraço</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={cargoFilter} onValueChange={setCargoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Carga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="FCL">FCL (Container Completo)</SelectItem>
                  <SelectItem value="LCL">LCL (Carga Consolidada)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imports List */}
      <div className="grid gap-4">
        {filteredImports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('imports.noImportsFound')}</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || cargoFilter !== "all"
                  ? t('imports.adjustSearchFilters')
                  : t('imports.startCreating')}
              </p>
              {!permissions.isFinanceira && (
                <Link href="/imports/new">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.newImport')}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredImports.map((importItem) => {
            const statusInfo = getStatusInfo(importItem.status, importItem.currentStage || importItem.status);
            return (
              <Card key={importItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{importItem.importName}</h3>
                          <p className="text-sm text-gray-600">{importItem.importNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${statusInfo.bgColor} ${statusInfo.color} border`}
                          >
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            {importItem.cargoType}
                          </Badge>
                        </div>
                      </div>

                      {(permissions.isAdmin || permissions.isFinanceira) && importItem.companyName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{importItem.companyName}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Valor Total</p>
                          <p className="font-medium">{formatCurrency(parseFloat(importItem.totalValue || "0"), importItem.currency)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Produtos</p>
                          <p className="font-medium">{importItem.products?.length || 0} item{(importItem.products?.length || 0) > 1 ? 's' : ''}</p>
                        </div>
                        {importItem.containerNumber && (
                          <div>
                            <p className="text-gray-600">Container</p>
                            <p className="font-medium">{importItem.containerNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Entrega Prevista</p>
                          <p className="font-medium">{importItem.estimatedDelivery ? new Date(importItem.estimatedDelivery).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        </div>
                      </div>

                      {/* Products Preview */}
                      {importItem.products && importItem.products.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {importItem.products.slice(0, 3).map((product: any, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                              {product.name} ({product.quantity || 'N/A'})
                            </Badge>
                          ))}
                          {importItem.products.length > 3 && (
                            <Badge variant="secondary" className="bg-gray-50 text-gray-600">
                              +{importItem.products.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/imports/${importItem.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          {(!permissions.isFinanceira && importItem.status === 'planejamento') && (
                            <DropdownMenuItem asChild>
                              <Link href={`/imports/${importItem.id}/edit`} className="flex items-center">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {(!permissions.isFinanceira && !['completed', 'cancelled'].includes(importItem.status)) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancelar Importação</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja cancelar a importação "{importItem.importName}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelImport(importItem.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Cancelar Importação
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}