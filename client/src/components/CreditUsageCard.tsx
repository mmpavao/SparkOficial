import { useCreditUsage } from "@/hooks/useCreditManagement";
import { formatCurrency } from "@/lib/formatters";
import MetricsCard from "@/components/common/MetricsCard";
import { LucideIcon } from "lucide-react";

interface CreditUsageCardProps {
  creditApplicationId?: number;
  title: string;
  icon: LucideIcon;
  iconColor: string;
}

export default function CreditUsageCard({ 
  creditApplicationId, 
  title, 
  icon, 
  iconColor 
}: CreditUsageCardProps) {
  const { data: creditUsage, isLoading } = useCreditUsage(creditApplicationId || 0);

  if (isLoading) {
    return (
      <MetricsCard
        title={title}
        value="Carregando..."
        icon={icon}
        iconColor={iconColor}
      />
    );
  }

  if (!creditApplicationId || !creditUsage) {
    return (
      <MetricsCard
        title={title}
        value="US$ 0,00"
        icon={icon}
        iconColor={iconColor}
      />
    );
  }

  return (
    <MetricsCard
      title={title}
      value={formatCurrency(creditUsage.used).replace('R$', 'US$')}
      icon={icon}
      iconColor={iconColor}
    />
  );
}