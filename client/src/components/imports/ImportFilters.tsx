import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Search } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface ImportFiltersProps {
  onFiltersChange: (filters: ImportFilters) => void;
  suppliers?: Array<{ id: number; companyName: string }>;
  companies?: Array<{ id: number; companyName: string }>;
}

export interface ImportFilters {
  search: string;
  status: string;
  supplierId: string;
  companyId: string;
  cargoType: string;
  minValue: string;
  maxValue: string;
  dateFrom: string;
  dateTo: string;
}

const statusOptions = [
  { value: "all", label: "Todos os Status" },
  { value: "planning", label: "Planejamento" },
  { value: "production", label: "Produção" },
  { value: "shipped", label: "Enviado" },
  { value: "in_transit", label: "Em Trânsito" },
  { value: "customs", label: "Desembaraço" },
  { value: "delivered", label: "Entregue" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
];

const cargoTypeOptions = [
  { value: "all", label: "Todos os Tipos" },
  { value: "FCL", label: "FCL (Container Completo)" },
  { value: "LCL", label: "LCL (Carga Consolidada)" },
];

export default function ImportFilters({ 
  onFiltersChange, 
  suppliers = [], 
  companies = [] 
}: ImportFiltersProps) {
  const { isAdmin, isFinanceira } = useUserPermissions();
  const [filters, setFilters] = useState<ImportFilters>({
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

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof ImportFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ImportFilters = {
      search: "",
      status: "all",
      supplierId: "all",
      companyId: "all",
      cargoType: "all",
      minValue: "",
      maxValue: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== "all") count++;
    if (filters.supplierId !== "all") count++;
    if (filters.companyId !== "all") count++;
    if (filters.cargoType !== "all") count++;
    if (filters.minValue) count++;
    if (filters.maxValue) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              {isExpanded ? "Menos" : "Mais"} Filtros
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, código ou descrição..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cargoType" className="text-sm font-medium">
              Tipo de Carga
            </Label>
            <Select
              value={filters.cargoType}
              onValueChange={(value) => updateFilter("cargoType", value)}
            >
              <SelectTrigger>
                <SelectValue />
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

          {suppliers.length > 0 && (
            <div>
              <Label htmlFor="supplier" className="text-sm font-medium">
                Fornecedor
              </Label>
              <Select
                value={filters.supplierId}
                onValueChange={(value) => updateFilter("supplierId", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Admin-only company filter */}
        {(isAdmin || isFinanceira) && companies.length > 0 && (
          <div>
            <Label htmlFor="company" className="text-sm font-medium">
              Empresa Importadora
            </Label>
            <Select
              value={filters.companyId}
              onValueChange={(value) => updateFilter("companyId", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Value Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Faixa de Valor (USD)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Valor mínimo"
                  type="number"
                  value={filters.minValue}
                  onChange={(e) => updateFilter("minValue", e.target.value)}
                />
                <Input
                  placeholder="Valor máximo"
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) => updateFilter("maxValue", e.target.value)}
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Período de Criação
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}