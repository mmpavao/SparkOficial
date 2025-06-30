import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, X, Package, MapPin, Calendar, DollarSign, Truck, Globe, Clock } from "lucide-react";
import { Import } from "@shared/imports-schema";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { UniversalCard } from "@/components/shared/UniversalCard";

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

  const getStatusInfo = () => {
    const statusColor = getStatusColor(importData.status || '');
    const statusLabel = getStatusLabel(importData.status || '');
    
    return {
      label: statusLabel,
      color: statusColor,
      bgColor: statusColor.includes('blue') ? 'bg-blue-50' : 
               statusColor.includes('green') ? 'bg-green-50' : 
               statusColor.includes('orange') ? 'bg-orange-50' : 'bg-gray-50',
      borderColor: statusColor.includes('blue') ? 'border-l-blue-500' :
                   statusColor.includes('green') ? 'border-l-green-500' :
                   statusColor.includes('orange') ? 'border-l-orange-500' : 'border-l-gray-500'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <UniversalCard
      icon={<Package className="w-6 h-6 text-blue-600" />}
      title={importData.importName}
      subtitle={importData.importCode || `Importação #${importData.id}`}
      applicationNumber={importData.id.toString()}
      companyBadge={(permissions.isAdmin || permissions.isFinanceira) && importData.user ? importData.user.companyName : undefined}
      status={statusInfo}
      miniCards={[
        {
          icon: <Truck className="w-4 h-4 text-purple-600" />,
          label: "Tipo",
          value: `${importData.cargoType}`,
          color: "bg-purple-50 border-purple-200"
        },
        {
          icon: <DollarSign className="w-4 h-4 text-green-600" />,
          label: "Valor",
          value: formatCurrency(importData.totalValue, importData.currency || 'USD'),
          color: "bg-green-50 border-green-200"
        },
        {
          icon: <Globe className="w-4 h-4 text-blue-600" />,
          label: "Origem",
          value: importData.origin || 'N/A',
          color: "bg-blue-50 border-blue-200"
        },
        {
          icon: <Clock className="w-4 h-4 text-orange-600" />,
          label: "Criado",
          value: formatDate(importData.createdAt),
          color: "bg-orange-50 border-orange-200"
        }
      ]}
      actions={[
        {
          icon: <Eye className="w-4 h-4" />,
          label: "Ver Detalhes",
          onClick: handleViewDetails
        },
        {
          icon: <Edit className="w-4 h-4" />,
          label: "Editar",
          onClick: handleEdit,
          show: canEdit
        },
        {
          icon: <X className="w-4 h-4" />,
          label: "Cancelar",
          onClick: handleCancel,
          variant: 'destructive',
          show: canCancel
        }
      ]}
      footer={
        importData.cargoType === 'LCL' && importData.products && importData.products.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Produtos:</span>
              <Badge variant="secondary" className="text-xs">
                {importData.products.length} {importData.products.length === 1 ? 'produto' : 'produtos'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {importData.products.slice(0, 3).map((product: any, index: number) => (
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
        ) : undefined
      }
      onClick={handleViewDetails}
    />
  );
}