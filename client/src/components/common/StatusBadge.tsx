import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type?: 'credit' | 'import' | 'default';
}

export default function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
  const getStatusConfig = (): { label: string; className: string } => {
    const configs: Record<string, Record<string, { label: string; className: string }>> = {
      credit: {
        pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
        approved: { label: "Aprovado", className: "bg-green-100 text-green-800" },
        rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800" },
        under_review: { label: "Em Análise", className: "bg-blue-100 text-blue-800" },
      },
      import: {
        planning: { label: "Planejamento", className: "bg-gray-100 text-gray-800" },
        ordered: { label: "Pedido Feito", className: "bg-blue-100 text-blue-800" },
        production: { label: "Produção", className: "bg-purple-100 text-purple-800" },
        shipped: { label: "Enviado", className: "bg-orange-100 text-orange-800" },
        in_transit: { label: "Em Trânsito", className: "bg-orange-100 text-orange-800" },
        customs: { label: "Alfândega", className: "bg-yellow-100 text-yellow-800" },
        delivered: { label: "Entregue", className: "bg-green-100 text-green-800" },
        completed: { label: "Concluído", className: "bg-green-100 text-green-800" },
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