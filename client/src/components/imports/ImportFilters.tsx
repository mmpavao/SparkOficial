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
    { value: "all", label: t('imports.allStatus') },
    { value: "planejamento", label: t('status.planning') },
    { value: "producao", label: t('imports.production') },
    { value: "entregue_agente", label: t('imports.deliveredAgent') },
    { value: "transporte_maritimo", label: t('imports.maritimeTransport') },
    { value: "transporte_aereo", label: t('imports.airTransport') },
    { value: "desembaraco", label: t('imports.clearance') },
    { value: "transporte_nacional", label: t('imports.nationalTransport') },
    { value: "concluido", label: t('status.completed') },
    { value: "cancelado", label: t('status.cancelled') }
  ];

  const cargoTypeOptions = [
    { value: "all", label: t('imports.allTypes') },
    { value: "FCL", label: t('cargo.fclContainer') },
    { value: "LCL", label: t('cargo.lclConsolidated') }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('imports.advancedFilters')}
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
              {showAdvanced ? t('filters.basic') : t('filters.advanced')}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                {t('filters.clear')}
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
              <SelectValue placeholder={t('common.status')} />
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
              <SelectValue placeholder={t('imports.cargoType')} />
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
                  <SelectValue placeholder={t('suppliers.supplier')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('suppliers.allSuppliers')}</SelectItem>
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
                  {t('filters.minValue')}
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
                  {t('filters.maxValue')}
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
                  {t('filters.startDate')}
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
                  {t('filters.endDate')}
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
                    label = `${t('search.general')}: ${value}`;
                    break;
                  case "status":
                    label = `${t('common.status')}: ${statusOptions.find(o => o.value === value)?.label || value}`;
                    break;
                  case "cargoType":
                    label = `${t('imports.type')}: ${cargoTypeOptions.find(o => o.value === value)?.label || value}`;
                    break;
                  case "supplierId":
                    const supplier = suppliers.find((s: any) => s.id.toString() === value);
                    label = `${t('suppliers.supplier')}: ${supplier?.companyName || value}`;
                    break;
                  case "minValue":
                    label = `${t('filters.min')}: USD ${value}`;
                    break;
                  case "maxValue":
                    label = `${t('filters.max')}: USD ${value}`;
                    break;
                  case "startDate":
                    label = `${t('filters.from')}: ${new Date(value).toLocaleDateString('pt-BR')}`;
                    break;
                  case "endDate":
                    label = `${t('filters.to')}: ${new Date(value).toLocaleDateString('pt-BR')}`;
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