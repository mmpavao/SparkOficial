import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

interface AdminImportFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function AdminImportFilters({ onFiltersChange }: AdminImportFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [cargoTypeFilter, setCargoTypeFilter] = useState("all");

  const handleFilterChange = () => {
    onFiltersChange({
      search: searchTerm,
      status: statusFilter === "all" ? "" : statusFilter,
      company: companyFilter === "all" ? "" : companyFilter,
      cargoType: cargoTypeFilter === "all" ? "" : cargoTypeFilter,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCompanyFilter("all");
    setCargoTypeFilter("all");
    onFiltersChange({
      search: "",
      status: "",
      company: "",
      cargoType: "",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por importação, produto ou importador..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setTimeout(handleFilterChange, 300);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setTimeout(handleFilterChange, 100);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="planning">Planejamento</SelectItem>
            <SelectItem value="invoice">Aguard. Invoice</SelectItem>
            <SelectItem value="production">Produção</SelectItem>
            <SelectItem value="shipping">Embarque</SelectItem>
            <SelectItem value="transit">Em Trânsito</SelectItem>
            <SelectItem value="customs">Desembaraço</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cargoTypeFilter} onValueChange={(value) => {
          setCargoTypeFilter(value);
          setTimeout(handleFilterChange, 100);
        }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="FCL">FCL</SelectItem>
            <SelectItem value="LCL">LCL</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearFilters}
          className="whitespace-nowrap"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>
    </div>
  );
}