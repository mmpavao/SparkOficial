import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";
import { ImportCard } from "@/components/imports/ImportCard";
import { ImportFilters } from "@/components/imports/ImportFilters";
import { ImportMetrics } from "@/components/imports/ImportMetrics";
import { Import } from "@shared/imports-schema";

export default function ImportsPageIntegrated() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const permissions = useUserPermissions();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({});
  const [cancelImportId, setCancelImportId] = useState<number | null>(null);

  // Fetch imports data
  const { data: importsResponse, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/imports', filters],
    queryFn: async () => {
      console.log('🔍 Fetching imports with filters:', filters);
      
      const url = new URL('/api/imports', window.location.origin);
      
      // Apply filters to query parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          url.searchParams.append(key, value as string);
        }
      });

      console.log('🌐 Request URL:', url.toString());

      const response = await fetch(url.toString(), {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Import fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch imports: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Import data received:', data);
      return data;
    },
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Extract imports array from response (handle both direct array and paginated response)
  const imports = Array.isArray(importsResponse) 
    ? importsResponse 
    : importsResponse?.imports || [];

  console.log('📊 Final imports array:', imports.length, 'items');

  // Calculate metrics from imports data
  const metrics = useMemo(() => {
    if (!imports.length) {
      return {
        totalImports: 0,
        activeImports: 0,
        completedImports: 0,
        totalValue: 0,
        planningStage: 0,
        productionStage: 0,
        transportStage: 0,
        successRate: 0
      };
    }

    const totalImports = imports.length;
    const completedImports = imports.filter((imp: Import) => imp.status === 'concluido').length;
    const activeImports = imports.filter((imp: Import) => 
      !['concluido', 'cancelado'].includes(imp.status || '')
    ).length;
    
    const totalValue = imports.reduce((sum: number, imp: Import) => 
      sum + parseFloat(imp.totalValue || '0'), 0
    );
    
    const planningStage = imports.filter((imp: Import) => imp.status === 'planejamento').length;
    const productionStage = imports.filter((imp: Import) => imp.status === 'producao').length;
    const transportStage = imports.filter((imp: Import) => 
      ['transporte_maritimo', 'transporte_aereo', 'transporte_nacional'].includes(imp.status || '')
    ).length;
    
    const successRate = totalImports > 0 ? (completedImports / totalImports) * 100 : 0;

    return {
      totalImports,
      activeImports,
      completedImports,
      totalValue,
      planningStage,
      productionStage,
      transportStage,
      successRate
    };
  }, [imports]);

  // Cancel import mutation
  const cancelImportMutation = useMutation({
    mutationFn: async (importId: number) => {
      return apiRequest(`/api/imports/${importId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      toast({
        title: "Sucesso",
        description: "Importação cancelada com sucesso"
      });
      setCancelImportId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar importação",
        variant: "destructive"
      });
    }
  });

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleNewImport = () => {
    setLocation('/imports/new');
  };

  const handleViewDetails = (importId: number) => {
    setLocation(`/imports/${importId}`);
  };

  const handleEdit = (importId: number) => {
    setLocation(`/imports/${importId}/edit`);
  };

  const handleCancelImport = (importId: number) => {
    setCancelImportId(importId);
  };

  const confirmCancel = () => {
    if (cancelImportId) {
      cancelImportMutation.mutate(cancelImportId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Carregando importações...</span>
      </div>
    );
  }

  if (error) {
    console.error('Import loading error:', error);
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Erro ao carregar importações</div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {permissions.canViewAllApplications ? 'Todas as Importações' : 'Minhas Importações'}
          </h1>
          <p className="text-gray-600 mt-1">
            {permissions.canViewAllApplications 
              ? 'Gerencie todas as importações do sistema'
              : 'Gerencie suas importações e acompanhe o progresso'
            }
          </p>
        </div>
        
        {!permissions.isFinanceira && (
          <Button onClick={handleNewImport} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Importação
          </Button>
        )}
      </div>

      {/* Metrics */}
      <ImportMetrics metrics={metrics} />

      {/* Filters */}
      <ImportFilters 
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Imports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Importações ({imports.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {imports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                Nenhuma importação encontrada
              </div>
              <p className="text-gray-400 mb-4">
                {Object.keys(filters).some(key => filters[key as keyof typeof filters] && filters[key as keyof typeof filters] !== 'all')
                  ? "Tente ajustar os filtros para ver mais resultados"
                  : "Comece criando sua primeira importação"
                }
              </p>
              {!permissions.isFinanceira && (
                <Button onClick={handleNewImport} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Importação
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {imports.map((importData: Import) => (
                <ImportCard
                  key={importData.id}
                  importData={importData}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onCancel={handleCancelImport}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelImportId} onOpenChange={() => setCancelImportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja cancelar esta importação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelImportMutation.isPending}
            >
              {cancelImportMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}