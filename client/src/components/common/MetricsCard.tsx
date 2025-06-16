import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: string;
  trendValue?: string;
}

export default function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "text-blue-600",
  change,
  changeType = "neutral",
  trend,
  trendValue
}: MetricsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <Icon className={`h-8 w-8 ${iconColor}`} />
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`text-sm ${getChangeColor()}`}>{change}</p>
            )}
            {trendValue && (
              <p className={`text-sm ${getChangeColor()}`}>{trendValue}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}