import { Badge } from "@/components/ui/badge";
import { getImportStatusLabel, getImportStatusColor } from "@/utils/importStatus";

interface StatusBadgeProps {
  status: string;
  type?: 'credit' | 'import' | 'default';
}

export default function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
  const getStatusConfig = (): { label: string; className: string } => {
    const configs: Record<string, Record<string, { label: string; className: string }>> = {
      credit: {
        pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
        pre_approved: { label: "Pré-análise Completa", className: "bg-green-100 text-green-800" },
        approved: { label: "Aprovado", className: "bg-green-100 text-green-800" },
        rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800" },
        under_review: { label: "Em Análise", className: "bg-blue-100 text-blue-800" },
        submitted_to_financial: { label: "Análise Final", className: "bg-blue-100 text-blue-800" },
        pending_financial: { label: "Análise Final", className: "bg-blue-100 text-blue-800" },
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
        active: { label: "Ativo", className: "bg-green-100 text-green-800" },
        inactive: { label: "Inativo", className: "bg-gray-100 text-gray-800" },
        pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
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