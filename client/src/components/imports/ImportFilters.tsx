import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface ImportFiltersProps {
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
}

export function ImportFilters({ onFiltersChange, initialFilters = {} }: ImportFiltersProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    status: initialFilters.status || "all",
    cargoType: initialFilters.cargoType || "all",
    supplierId: initialFilters.supplierId || "all",
    minValue: initialFilters.minValue || "",
    maxValue: initialFilters.maxValue || "",
    startDate: initialFilters.startDate || "",
    endDate: initialFilters.endDate || "",
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get suppliers for filter dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    enabled: true
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      status: "all",
      cargoType: "all", 
      supplierId: "all",
      minValue: "",
      maxValue: "",
      startDate: "",
      endDate: ""
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== "" && value !== "all"
  );

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== "" && value !== "all"
    ).length;
  };

  const statusOptions = [
    { value: "all", label: "Todos os Status" },
    { value: "planejamento", label: "Planejamento" },
    { value: "producao", label: "Produção" },
    { value: "entregue_agente", label: "Entregue ao Agente" },
    { value: "transporte_maritimo", label: "Transporte Marítimo" },
    { value: "transporte_aereo", label: "Transporte Aéreo" },
    { value: "desembaraco", label: "Desembaraço" },
    { value: "transporte_nacional", label: "Transporte Nacional" },
    { value: "concluido", label: "Concluído" },
    { value: "cancelado", label: "Cancelado" }
  ];

  const cargoTypeOptions = [
    { value: "all", label: "Todos os Tipos" },
    { value: "FCL", label: "FCL (Container Completo)" },
    { value: "LCL", label: "LCL (Carga Consolidada)" }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Básicos" : "Avançados"}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('placeholders.searchImports')}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cargo Type Filter */}
          <Select
            value={filters.cargoType}
            onValueChange={(value) => handleFilterChange("cargoType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Carga" />
            </SelectTrigger>
            <SelectContent>
              {cargoTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier Filter */}
              <Select
                value={filters.supplierId}
                onValueChange={(value) => handleFilterChange("supplierId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div />
            </div>

            {/* Value Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Valor Mínimo (USD)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minValue}
                  onChange={(e) => handleFilterChange("minValue", e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Valor Máximo (USD)
                </label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={filters.maxValue}
                  onChange={(e) => handleFilterChange("maxValue", e.target.value)}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data Final
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === "all") return null;
                
                let label = "";
                switch(key) {
                  case "search":
                    label = `Busca: ${value}`;
                    break;
                  case "status":
                    label = `Status: ${statusOptions.find(o => o.value === value)?.label || value}`;
                    break;
                  case "cargoType":
                    label = `Tipo: ${cargoTypeOptions.find(o => o.value === value)?.label || value}`;
                    break;
                  case "supplierId":
                    const supplier = suppliers.find((s: any) => s.id.toString() === value);
                    label = `Fornecedor: ${supplier?.companyName || value}`;
                    break;
                  case "minValue":
                    label = `Min: USD ${value}`;
                    break;
                  case "maxValue":
                    label = `Max: USD ${value}`;
                    break;
                  case "startDate":
                    label = `De: ${new Date(value).toLocaleDateString('pt-BR')}`;
                    break;
                  case "endDate":
                    label = `Até: ${new Date(value).toLocaleDateString('pt-BR')}`;
                    break;
                  default:
                    return null;
                }

                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {label}
                    <button
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      onClick={() => handleFilterChange(key, key.includes("Value") || key.includes("Date") ? "" : "all")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}