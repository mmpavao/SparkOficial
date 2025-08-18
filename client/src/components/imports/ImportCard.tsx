import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, X, Package, MapPin, Calendar, DollarSign, Truck, Globe, Clock } from "lucide-react";
import { StatusChanger } from "./StatusChanger";
import { ImportPipeline } from "./ImportPipeline";
import { Import } from "@shared/imports-schema";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { UniversalCard } from "@/components/shared/UniversalCard";
import { getImportStatusLabel, getImportStatusColor } from "@/utils/importStatus";
import { useTranslation } from "react-i18next";

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

export function ImportCard({ importData, onEdit, onCancel, onViewDetails }: ImportCardProps) {
  const permissions = useUserPermissions();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

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
      setLocation(`/imports/edit/${importData.id}`);
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
    const statusColor = getImportStatusColor(importData.status || '');
    const statusLabel = getImportStatusLabel(importData.status || '');
    
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
          label: t('imports.type'),
          value: `${importData.cargoType}`,
          color: "bg-purple-50 border-purple-200"
        },
        {
          icon: <DollarSign className="w-4 h-4 text-green-600" />,
          label: t('imports.value'),
          value: formatCurrency(importData.totalValue, importData.currency || 'USD'),
          color: "bg-green-50 border-green-200"
        },
        {
          icon: <Globe className="w-4 h-4 text-blue-600" />,
          label: t('imports.origin'),
          value: importData.origin || 'N/A',
          color: "bg-blue-50 border-blue-200"
        },
        {
          icon: <Clock className="w-4 h-4 text-orange-600" />,
          label: t('imports.created'),
          value: formatDate(importData.createdAt || new Date()),
          color: "bg-orange-50 border-orange-200"
        }
      ]}
      actions={[
        {
          icon: <Eye className="w-4 h-4" />,
          label: t('imports.viewDetails'),
          onClick: handleViewDetails
        },
        {
          icon: <Edit className="w-4 h-4" />,
          label: t('common.edit'),
          onClick: handleEdit,
          show: canEdit
        },
        {
          icon: <X className="w-4 h-4" />,
          label: t('imports.cancel'),
          onClick: handleCancel,
          variant: 'destructive',
          show: canCancel
        }
      ]}
      customActions={
        <StatusChanger 
          importId={importData.id} 
          currentStatus={importData.status}
          shippingMethod={importData.shippingMethod || 'sea'}
        />
      }
      footer={
        <div className="space-y-3">
          {/* Pipeline de Status */}
          <ImportPipeline 
            currentStatus={importData.status}
            cargoType={importData.cargoType}
          />
          
          {/* Produtos (se LCL) */}
          {importData.cargoType === 'LCL' && importData.products && importData.products.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t('nav.products')}:</span>
                <Badge variant="secondary" className="text-xs">
                  {importData.products.length} {importData.products.length === 1 ? t('imports.product') : t('nav.products')}
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
                    +{importData.products.length - 3} {t('imports.more')}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      }
      onClick={handleViewDetails}
    />
  );
}