import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import ImportCard from "@/components/imports/ImportCard";
import ImportFilters, { type ImportFilters as IImportFilters } from "@/components/imports/ImportFilters";
import ImportMetrics from "@/components/imports/ImportMetrics";
import type { Import, Supplier } from "@shared/schema";

export default function ImportsPage() {
  const [, setLocation] = useLocation();
  const { isAdmin, isFinanceira } = useUserPermissions();
  const [filters, setFilters] = useState<IImportFilters>({
    search: "",
    status: "all",
    supplierId: "all",
    companyId: "all",
    cargoType: "all",
    minValue: "",
    maxValue: "",
    dateFrom: "",
    dateTo: "",
  });

  const { data: imports = [], isLoading } = useQuery<Import[]>({
    queryKey: ["/api/imports"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Filter imports based on current filters
  const filteredImports = useMemo(() => {
    let filtered = imports;

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(imp => 
        (imp.importName && imp.importName.toLowerCase().includes(searchTerm)) ||
        imp.id.toString().includes(searchTerm) ||
        (Array.isArray(imp.products) && imp.products.some((product: any) => 
          product.name && product.name.toLowerCase().includes(searchTerm)
        ))
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(imp => imp.status === filters.status);
    }

    // Cargo type filter
    if (filters.cargoType !== "all") {
      filtered = filtered.filter(imp => imp.cargoType === filters.cargoType);
    }

    // Supplier filter
    if (filters.supplierId !== "all") {
      const supplierId = parseInt(filters.supplierId);
      filtered = filtered.filter(imp => {
        if (Array.isArray(imp.products)) {
          return imp.products.some((product: any) => product.supplierId === supplierId);
        }
        return false;
      });
    }

    // Value range filter
    if (filters.minValue || filters.maxValue) {
      filtered = filtered.filter(imp => {
        const value = parseFloat(imp.totalValue || "0");
        const min = filters.minValue ? parseFloat(filters.minValue) : 0;
        const max = filters.maxValue ? parseFloat(filters.maxValue) : Infinity;
        return value >= min && value <= max;
      });
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(imp => {
        if (!imp.createdAt) return false;
        const importDate = new Date(imp.createdAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
        const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
        return importDate >= fromDate && importDate <= toDate;
      });
    }

    return filtered;
  }, [imports, filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando importações...</p>
        </div>
      </div>
    );
  }

  const pageTitle = isAdmin || isFinanceira ? "Todas as Importações" : "Minhas Importações";
  const canCreateNew = !isFinanceira; // Financeira users cannot create new imports

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        {canCreateNew && (
          <Button
            onClick={() => setLocation("/imports/new")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Importação
          </Button>
        )}
      </div>

      {/* Metrics Dashboard */}
      <ImportMetrics imports={filteredImports} isLoading={isLoading} />

      {/* Filters */}
      <ImportFilters
        onFiltersChange={setFilters}
        suppliers={suppliers}
        companies={isAdmin || isFinanceira ? [] : []} // TODO: Add companies data for admin users
      />

      {/* Imports Grid */}
      {filteredImports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            {imports.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma importação encontrada
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  Comece criando sua primeira importação para acompanhar seus processos.
                </p>
                {canCreateNew && (
                  <Button
                    onClick={() => setLocation("/imports/new")}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Nova Importação
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma importação corresponde aos filtros
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  Tente ajustar os filtros para encontrar as importações desejadas.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredImports.map((importItem) => (
            <ImportCard key={importItem.id} importData={importItem} />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {imports.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Mostrando {filteredImports.length} de {imports.length} importações
        </div>
      )}
    </div>
  );
}