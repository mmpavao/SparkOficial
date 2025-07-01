import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";

interface AdminFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function AdminFilters({ onFiltersChange }: AdminFiltersProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    status: "all",
    company: "",
    minAmount: "",
    maxAmount: "",
    riskLevel: "all",
    preAnalysisStatus: "all",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: "all",
      company: "",
      minAmount: "",
      maxAmount: "",
      riskLevel: "all",
      preAnalysisStatus: "all",
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' || key === 'riskLevel' || key === 'preAnalysisStatus') {
      return value !== "all" && value !== "";
    }
    return value !== "" && value !== undefined;
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Administrativos
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Ativo
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="under_review">Em Análise</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Filter */}
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Buscar por empresa"
                value={filters.company}
                onChange={(e) => handleFilterChange("company", e.target.value)}
              />
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label>Valor Mínimo</Label>
              <Input
                placeholder="Ex: 50000"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange("minAmount", e.target.value)}
              />
            </div>

            {/* Risk Level Filter */}
            <div className="space-y-2">
              <Label htmlFor="riskLevel">Nível de Risco</Label>
              <Select
                value={filters.riskLevel}
                onValueChange={(value) => handleFilterChange("riskLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pre-Analysis Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="preAnalysisStatus">Pré-Análise</Label>
              <Select
                value={filters.preAnalysisStatus}
                onValueChange={(value) => handleFilterChange("preAnalysisStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="pre_approved">Pré-Aprovado</SelectItem>
                  <SelectItem value="needs_documents">Precisa Documentos</SelectItem>
                  <SelectItem value="needs_clarification">Precisa Esclarecimentos</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Máximo</Label>
              <Input
                placeholder="Ex: 500000"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}