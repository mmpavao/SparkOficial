import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Clock, CheckCircle, AlertCircle, Ship, Truck, Target } from "lucide-react";
import { formatCurrency, formatCompactNumber } from "@/lib/formatters";

interface ImportMetricsProps {
  metrics: {
    totalImports: number;
    activeImports: number;
    completedImports: number;
    totalValue: number;
    planningStage: number;
    productionStage: number;
    transportStage: number;
    successRate: number;
  };
}

export function ImportMetrics({ metrics }: ImportMetricsProps) {
  const metricsData = [
    {
      title: "Total de Importações",
      value: formatCompactNumber(metrics.totalImports),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Importações Ativas",
      value: formatCompactNumber(metrics.activeImports),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Concluídas",
      value: formatCompactNumber(metrics.completedImports),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Valor Total",
      value: formatCurrency(metrics.totalValue, 'USD'),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Em Planejamento",
      value: formatCompactNumber(metrics.planningStage),
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Em Produção",
      value: formatCompactNumber(metrics.productionStage),
      icon: Ship,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50"
    },
    {
      title: "Em Transporte",
      value: formatCompactNumber(metrics.transportStage),
      icon: Truck,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Taxa de Sucesso",
      value: `${metrics.successRate.toFixed(1)}%`,
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricsData.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <IconComponent className={`h-5 w-5 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}