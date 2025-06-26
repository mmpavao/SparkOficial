import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingUp, 
  CheckCircle, 
  DollarSign,
  Clock,
  AlertCircle,
  Ship,
  Factory
} from "lucide-react";
import { formatCompactNumber } from "@/lib/formatters";
import type { Import } from "@shared/schema";

interface ImportMetricsProps {
  imports: Import[];
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  color?: string;
  subtitle?: string;
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = "neutral", 
  color = "text-blue-600", 
  subtitle 
}: MetricCardProps) {
  const changeColors = {
    positive: "text-green-600 bg-green-50",
    negative: "text-red-600 bg-red-50",
    neutral: "text-gray-600 bg-gray-50"
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {change && (
          <Badge 
            variant="secondary" 
            className={`text-xs mt-2 ${changeColors[changeType]}`}
          >
            {change}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportMetrics({ imports, isLoading }: ImportMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate metrics
  const totalImports = imports.length;
  
  const statusCounts = imports.reduce((acc, imp) => {
    acc[imp.status] = (acc[imp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeImports = imports.filter(imp => 
    !['completed', 'cancelled'].includes(imp.status)
  ).length;

  const completedImports = statusCounts.completed || 0;
  
  const totalValue = imports.reduce((sum, imp) => {
    return sum + parseFloat(imp.totalValue || "0");
  }, 0);

  const activeValue = imports
    .filter(imp => !['completed', 'cancelled'].includes(imp.status))
    .reduce((sum, imp) => {
      return sum + parseFloat(imp.totalValue || "0");
    }, 0);

  const pendingImports = statusCounts.planning || 0;
  const inProductionImports = statusCounts.production || 0;
  const inTransitImports = (statusCounts.shipped || 0) + (statusCounts.in_transit || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total de Importações"
        value={totalImports}
        icon={Package}
        color="text-blue-600"
        subtitle={`${activeImports} ativas`}
      />

      <MetricCard
        title="Em Andamento"
        value={activeImports}
        icon={Clock}
        color="text-orange-600"
        subtitle={`${Math.round((activeImports / totalImports) * 100) || 0}% do total`}
      />

      <MetricCard
        title="Concluídas"
        value={completedImports}
        icon={CheckCircle}
        color="text-green-600"
        subtitle={`${Math.round((completedImports / totalImports) * 100) || 0}% do total`}
      />

      <MetricCard
        title="Valor Total"
        value={`$${formatCompactNumber(totalValue)}`}
        icon={DollarSign}
        color="text-emerald-600"
        subtitle={`$${formatCompactNumber(activeValue)} ativos`}
      />

      {/* Secondary metrics row for detailed view */}
      <MetricCard
        title="Planejamento"
        value={pendingImports}
        icon={AlertCircle}
        color="text-blue-500"
        subtitle="Aguardando execução"
      />

      <MetricCard
        title="Produção"
        value={inProductionImports}
        icon={Factory}
        color="text-yellow-600"
        subtitle="Em fabricação"
      />

      <MetricCard
        title="Transporte"
        value={inTransitImports}
        icon={Ship}
        color="text-purple-600"
        subtitle="Enviados e em trânsito"
      />

      <MetricCard
        title="Taxa de Sucesso"
        value={`${Math.round((completedImports / Math.max(totalImports, 1)) * 100)}%`}
        icon={TrendingUp}
        color="text-indigo-600"
        subtitle="Importações concluídas"
      />
    </div>
  );
}