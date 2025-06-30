import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, X, Package, MapPin, Calendar, DollarSign } from "lucide-react";
import { Import } from "@shared/imports-schema";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface ImportCardProps {
  importData: Import & {
    supplier?: any;
    user?: any;
    products?: any[];
  };
  onEdit?: (id: number) => void;
  onCancel?: (id: number) => void;
  onViewDetails?: (id: number) => void;
}

const getStatusColor = (status: string) => {
  const statusColors = {
    planejamento: "bg-blue-100 text-blue-800 border-blue-200",
    producao: "bg-orange-100 text-orange-800 border-orange-200", 
    entregue_agente: "bg-purple-100 text-purple-800 border-purple-200",
    transporte_maritimo: "bg-cyan-100 text-cyan-800 border-cyan-200",
    transporte_aereo: "bg-sky-100 text-sky-800 border-sky-200",
    desembaraco: "bg-yellow-100 text-yellow-800 border-yellow-200",
    transporte_nacional: "bg-indigo-100 text-indigo-800 border-indigo-200",
    concluido: "bg-green-100 text-green-800 border-green-200",
    cancelado: "bg-red-100 text-red-800 border-red-200"
  };
  return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200";
};

const getStatusLabel = (status: string) => {
  const statusLabels = {
    planejamento: "Planejamento",
    producao: "Produção",
    entregue_agente: "Entregue ao Agente",
    transporte_maritimo: "Transporte Marítimo", 
    transporte_aereo: "Transporte Aéreo",
    desembaraco: "Desembaraço",
    transporte_nacional: "Transporte Nacional",
    concluido: "Concluído",
    cancelado: "Cancelado"
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
};

export function ImportCard({ importData, onEdit, onCancel, onViewDetails }: ImportCardProps) {
  const permissions = useUserPermissions();
  const [, setLocation] = useLocation();

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(importData.id);
    } else {
      setLocation(`/imports/${importData.id}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(importData.id);
    } else {
      setLocation(`/imports/${importData.id}/edit`);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(importData.id);
    }
  };

  const canEdit = permissions.canViewOwnDataOnly && importData.status === 'planejamento';
  const canCancel = permissions.canViewOwnDataOnly && !['concluido', 'cancelado'].includes(importData.status || '');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{importData.importName}</h3>
              {importData.importCode && (
                <p className="text-sm text-gray-600">{importData.importCode}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(importData.status || '')} border`}>
              {getStatusLabel(importData.status || '')}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </DropdownMenuItem>
                
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                
                {canCancel && (
                  <DropdownMenuItem onClick={handleCancel} className="text-red-600">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company Badge for Admin/Financeira */}
        {(permissions.isAdmin || permissions.isFinanceira) && importData.user && (
          <div className="mb-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {importData.user.companyName}
            </Badge>
          </div>
        )}

        {/* Import Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>{importData.cargoType} - {importData.transportMethod}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(importData.totalValue, importData.currency || 'USD')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{importData.origin} → {importData.destination}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(importData.createdAt)}</span>
          </div>
        </div>

        {/* Supplier Info */}
        {importData.supplier && (
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Fornecedor:</span> {importData.supplier.companyName}
            </p>
            <p className="text-xs text-gray-500">
              {importData.supplier.city}, {importData.supplier.country}
            </p>
          </div>
        )}

        {/* Products Preview for LCL */}
        {importData.cargoType === 'LCL' && importData.products && importData.products.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Produtos:</span>
              <Badge variant="secondary" className="text-xs">
                {importData.products.length} {importData.products.length === 1 ? 'produto' : 'produtos'}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {importData.products.slice(0, 3).map((product, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {product.productName}
                </Badge>
              ))}
              {importData.products.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{importData.products.length - 3} mais
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}