import { Badge } from "@/components/ui/badge";
import { getImportStatusLabel, getImportStatusColor } from "@/utils/importStatus";
import { useTranslation } from "react-i18next";

interface StatusBadgeProps {
  status: string;
  type?: 'credit' | 'import' | 'default';
}

export default function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  const getStatusConfig = (): { label: string; className: string } => {
    const configs: Record<string, Record<string, { label: string; className: string }>> = {
      credit: {
        pending: { label: t("status.pending"), className: "bg-yellow-100 text-yellow-800" },
        pre_approved: { label: t("credit.preAnalysisComplete"), className: "bg-green-100 text-green-800" },
        approved: { label: t("status.approved"), className: "bg-green-100 text-green-800" },
        rejected: { label: t("status.rejected"), className: "bg-red-100 text-red-800" },
        under_review: { label: t("status.underReview"), className: "bg-blue-100 text-blue-800" },
        submitted_to_financial: { label: t("credit.finalAnalysis"), className: "bg-blue-100 text-blue-800" },
        pending_financial: { label: t("credit.finalAnalysis"), className: "bg-blue-100 text-blue-800" },
      },
      import: {
        // Using centralized import status system
        planejamento: { label: getImportStatusLabel('planejamento'), className: getImportStatusColor('planejamento') },
        producao: { label: getImportStatusLabel('producao'), className: getImportStatusColor('producao') },
        entregue_agente: { label: getImportStatusLabel('entregue_agente'), className: getImportStatusColor('entregue_agente') },
        transporte_maritimo: { label: getImportStatusLabel('transporte_maritimo'), className: getImportStatusColor('transporte_maritimo') },
        transporte_aereo: { label: getImportStatusLabel('transporte_aereo'), className: getImportStatusColor('transporte_aereo') },
        desembaraco: { label: getImportStatusLabel('desembaraco'), className: getImportStatusColor('desembaraco') },
        transporte_nacional: { label: getImportStatusLabel('transporte_nacional'), className: getImportStatusColor('transporte_nacional') },
        concluido: { label: getImportStatusLabel('concluido'), className: getImportStatusColor('concluido') },
        cancelado: { label: getImportStatusLabel('cancelado'), className: getImportStatusColor('cancelado') },
      },
      default: {
        active: { label: t("status.active"), className: "bg-green-100 text-green-800" },
        inactive: { label: t("status.inactive"), className: "bg-gray-100 text-gray-800" },
        pending: { label: t("status.pending"), className: "bg-yellow-100 text-yellow-800" },
      }
    };

    const typeConfig = configs[type] || configs.default;
    return typeConfig[status] || { 
      label: status, 
      className: "bg-gray-100 text-gray-800" 
    };
  };

  const config = getStatusConfig();

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}