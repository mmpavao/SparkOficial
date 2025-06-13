import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Clock,
  DollarSign,
  Package,
  ChevronRight,
  X,
  Minimize2
} from "lucide-react";

interface Insight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  metrics?: {
    value: string;
    change?: string;
  };
}

interface AIInsightsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export default function AIInsightsSidebar({ isOpen, onClose, onMinimize }: AIInsightsSidebarProps) {

  // Fetch real data for analysis
  const { data: creditApplications = [], isSuccess: creditSuccess } = useQuery({
    queryKey: ["/api/credit/applications"],
  });

  const { data: imports = [], isSuccess: importsSuccess } = useQuery({
    queryKey: ["/api/imports"],
  });

  const { data: user, isSuccess: userSuccess } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Generate AI insights based on real data
  const currentInsights = creditSuccess && importsSuccess && userSuccess 
    ? generateInsights(
        Array.isArray(creditApplications) ? creditApplications : [],
        Array.isArray(imports) ? imports : [],
        user || {}
      )
    : [];

  const generateInsights = (credits: any[], importData: any[], userData: any): Insight[] => {
    const insights: Insight[] = [];

    // Credit utilization analysis
    const approvedCredits = credits.filter(c => c.status === 'approved');
    const totalApprovedAmount = approvedCredits.reduce((sum, c) => sum + parseFloat(c.approvedAmount || 0), 0);
    const pendingCredits = credits.filter(c => c.status === 'pending' || c.status === 'under_review');

    if (totalApprovedAmount > 0 && importData.length > 0) {
      const totalImportValue = importData.reduce((sum, imp) => sum + parseFloat(imp.totalValue || 0), 0);
      const utilizationRate = (totalImportValue / totalApprovedAmount) * 100;

      if (utilizationRate < 30) {
        insights.push({
          id: 'low-utilization',
          type: 'opportunity',
          priority: 'medium',
          title: 'Oportunidade de Crescimento',
          description: `Você está utilizando apenas ${utilizationRate.toFixed(1)}% do seu crédito aprovado. Considere expandir suas importações.`,
          action: {
            label: 'Ver Oportunidades',
            href: '/imports'
          },
          metrics: {
            value: `${utilizationRate.toFixed(1)}%`,
            change: 'baixa utilização'
          }
        });
      } else if (utilizationRate > 80) {
        insights.push({
          id: 'high-utilization',
          type: 'warning',
          priority: 'high',
          title: 'Alto Uso de Crédito',
          description: `Utilização de ${utilizationRate.toFixed(1)}% do crédito. Considere solicitar aumento de limite.`,
          action: {
            label: 'Solicitar Crédito',
            href: '/credit'
          },
          metrics: {
            value: `${utilizationRate.toFixed(1)}%`,
            change: 'alto risco'
          }
        });
      }
    }

    // Import pattern analysis
    if (importData.length > 0) {
      const supplierMap = new Map();
      importData.forEach((imp: any) => {
        const supplier = imp.supplierName;
        if (!supplierMap.has(supplier)) {
          supplierMap.set(supplier, { count: 0, value: 0 });
        }
        const data = supplierMap.get(supplier);
        data.count += 1;
        data.value += parseFloat(imp.totalValue || 0);
      });

      const topSupplier = Array.from(supplierMap.entries())
        .sort((a, b) => b[1].value - a[1].value)[0];

      if (topSupplier && topSupplier[1].count >= 2) {
        insights.push({
          id: 'supplier-relationship',
          type: 'recommendation',
          priority: 'medium',
          title: 'Parceria Estratégica',
          description: `${topSupplier[0]} é seu principal fornecedor. Considere negociar melhores condições ou prazos.`,
          action: {
            label: 'Analisar Fornecedor'
          },
          metrics: {
            value: `${topSupplier[1].count} importações`,
            change: 'parceiro preferencial'
          }
        });
      }

      // Diversification recommendation
      if (supplierMap.size === 1 && importData.length > 1) {
        insights.push({
          id: 'diversification',
          type: 'recommendation',
          priority: 'medium',
          title: 'Diversificação de Fornecedores',
          description: 'Considere diversificar seus fornecedores para reduzir riscos e encontrar melhores preços.',
          action: {
            label: 'Explorar Fornecedores'
          }
        });
      }
    }

    // Pending applications insight
    if (pendingCredits.length > 0) {
      insights.push({
        id: 'pending-applications',
        type: 'trend',
        priority: 'medium',
        title: 'Solicitações Pendentes',
        description: `Você tem ${pendingCredits.length} solicitação(ões) de crédito em análise. Acompanhe o status regularmente.`,
        action: {
          label: 'Ver Status',
          href: '/credit'
        },
        metrics: {
          value: pendingCredits.length.toString(),
          change: 'em análise'
        }
      });
    }

    // Seasonal opportunities
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 8 && currentMonth <= 10) { // Sep-Nov
      insights.push({
        id: 'seasonal-opportunity',
        type: 'opportunity',
        priority: 'high',
        title: 'Oportunidade Sazonal',
        description: 'Período ideal para importações visando vendas de fim de ano. Considere antecipar pedidos.',
        action: {
          label: 'Planejar Importação',
          href: '/imports'
        }
      });
    }

    // Cost optimization
    const usdImports = importData.filter((imp: any) => imp.currency === 'USD');
    if (usdImports.length > 0) {
      insights.push({
        id: 'currency-optimization',
        type: 'recommendation',
        priority: 'low',
        title: 'Otimização Cambial',
        description: 'Monitore a cotação do dólar para otimizar o timing das suas importações.',
        action: {
          label: 'Ver Cotações'
        }
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity':
        return <Target className="w-4 h-4" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: Insight['type'], priority: Insight['priority']) => {
    if (type === 'warning' && priority === 'high') return 'bg-red-50 border-red-200';
    if (type === 'opportunity' && priority === 'high') return 'bg-green-50 border-green-200';
    if (type === 'recommendation') return 'bg-blue-50 border-blue-200';
    if (type === 'trend') return 'bg-purple-50 border-purple-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getBadgeColor = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-spark-600" />
          <h2 className="font-semibold text-gray-900">Insights IA</h2>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={onMinimize}>
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-full pb-20">
        <div className="p-4 space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Analisando seus dados...</p>
              <p className="text-sm text-gray-400">
                Insights personalizados aparecerão aqui conforme você usa a plataforma.
              </p>
            </div>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className={`${getInsightColor(insight.type, insight.priority)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <Badge className={getBadgeColor(insight.priority)} variant="secondary">
                        {insight.priority === 'high' ? 'Alta' : 
                         insight.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    {insight.metrics && (
                      <div className="text-right">
                        <div className="font-semibold text-sm">{insight.metrics.value}</div>
                        {insight.metrics.change && (
                          <div className="text-xs text-gray-500">{insight.metrics.change}</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  
                  {insight.action && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      onClick={insight.action.onClick}
                    >
                      {insight.action.label}
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}