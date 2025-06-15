import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/contexts/I18nContext";
import { Search, Filter, X } from "lucide-react";

interface AdminImportFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function AdminImportFilters({ onFiltersChange }: AdminImportFiltersProps) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    supplier: "",
    minValue: "",
    maxValue: ""
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
      supplier: "",
      minValue: "",
      maxValue: ""
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Pesquisar importações..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
        {Object.values(filters).some(value => value && value !== "all") && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex items-center gap-2 text-gray-600"
          >
            <X className="w-4 h-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="ordered">Pedido Feito</SelectItem>
                    <SelectItem value="in_transit">Em Trânsito</SelectItem>
                    <SelectItem value="customs">Alfândega</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-filter">Fornecedor</Label>
                <Input
                  id="supplier-filter"
                  placeholder="Nome do fornecedor"
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange("supplier", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-value">Valor Mínimo (USD)</Label>
                <Input
                  id="min-value"
                  type="number"
                  placeholder="0"
                  value={filters.minValue}
                  onChange={(e) => handleFilterChange("minValue", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-value">Valor Máximo (USD)</Label>
                <Input
                  id="max-value"
                  type="number"
                  placeholder="1000000"
                  value={filters.maxValue}
                  onChange={(e) => handleFilterChange("maxValue", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}