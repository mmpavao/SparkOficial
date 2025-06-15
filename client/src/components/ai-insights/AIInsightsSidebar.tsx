import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Minimize2, AlertTriangle, TrendingUp, Target, Lightbulb } from "lucide-react";

import { useTranslation } from '@/contexts/I18nContext';
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

// Generate insights function
function generateInsights(credits: any[], importData: any[], userData: any): Insight[] {
  const insights: Insight[] = [];

  // Credit utilization analysis
  if (credits.length > 0) {
    const totalRequested = credits.reduce((sum, credit) => sum + (credit.requestedAmount || 0), 0);
    const totalApproved = credits.reduce((sum, credit) => 
      credit.status === 'approved' ? sum + (credit.approvedAmount || 0) : sum, 0);
    
    const utilizationRate = totalApproved > 0 ? (totalRequested / totalApproved) : 0;
    
    if (utilizationRate > 0.8) {
      insights.push({
        id: 'credit-utilization-high',
        type: 'warning',
        priority: 'high',
        title: 'High Credit Utilization',
        description: `You're using ${Math.round(utilizationRate * 100)}% of your approved credit. Consider requesting additional credit to support growth.`,
        action: {
          label: 'Request Credit Increase',
          href: '/credit'
        },
        metrics: {
          value: `${Math.round(utilizationRate * 100)}%`,
          change: 'High usage detected'
        }
      });
    } else if (utilizationRate < 0.3) {
      insights.push({
        id: 'credit-underutilized',
        type: 'opportunity',
        priority: 'medium',
        title: 'Underutilized Credit Available',
        description: `You have significant unused credit capacity. Consider expanding your import operations.`,
        action: {
          label: 'Plan New Imports',
          href: '/imports'
        },
        metrics: {
          value: `${Math.round((1 - utilizationRate) * 100)}%`,
          change: 'Available capacity'
        }
      });
    }
  }

  // Import pattern analysis
  if (importData.length > 0) {
    const activeImports = importData.filter(imp => 
      ['planning', 'in_transit', 'customs'].includes(imp.status)).length;
    
    if (activeImports > 0) {
      insights.push({
        id: 'active-imports',
        type: 'recommendation',
        priority: 'medium',
        title: 'Active Import Monitoring',
        description: `You have ${activeImports} active imports requiring attention. Monitor customs clearance and delivery schedules.`,
        action: {
          label: 'Track Imports',
          href: '/imports'
        },
        metrics: {
          value: activeImports.toString(),
          change: 'Requiring attention'
        }
      });
    }

    // Supplier diversification analysis
    const uniqueSuppliers = importData.map(imp => imp.supplierName).filter((name, index, arr) => arr.indexOf(name) === index);
    const suppliers = uniqueSuppliers;
    if (suppliers.length < 3 && importData.length > 5) {
      insights.push({
        id: 'supplier-diversification',
        type: 'recommendation',
        priority: 'medium',
        title: 'Supplier Diversification Opportunity',
        description: 'Consider working with additional suppliers to reduce dependency risk and improve negotiation power.',
        action: {
          label: 'Find New Suppliers',
          href: '/imports'
        },
        metrics: {
          value: suppliers.length.toString(),
          change: 'Current suppliers'
        }
      });
    }
  }

  // Seasonal opportunity
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 10 || currentMonth <= 1) { // Nov, Dec, Jan
    insights.push({
      id: 'seasonal-opportunity',
      type: 'opportunity',
      priority: 'high',
      title: 'End-of-Year Import Planning',
      description: 'Plan ahead for Chinese New Year factory closures. Place orders early to avoid supply chain disruptions.',
      action: {
        label: 'Plan Imports',
        href: '/imports'
      },
      metrics: {
        value: 'Q1 Planning',
        change: 'Critical timing'
      }
    });
  }

  // Currency optimization
  if (importData.some(imp => imp.currency === 'USD')) {
    insights.push({
      id: 'currency-optimization',
      type: 'recommendation',
      priority: 'low',
      title: 'Currency Risk Management',
      description: 'Monitor USD/BRL exchange rates for optimal timing of payments and currency hedging opportunities.',
      action: {
        label: 'View Reports',
        href: '/reports'
      },
      metrics: {
        value: 'USD Exposure',
        change: 'Monitor rates'
      }
    });
  }

  return insights.slice(0, 6); // Limit to 6 insights
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
  const insights = creditSuccess && importsSuccess && userSuccess 
    ? generateInsights(
        Array.isArray(creditApplications) ? creditApplications : [],
        Array.isArray(imports) ? imports : [],
        user || {}
      )
    : [];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity':
        return <Target className="h-4 w-4" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">{t.common.aiinsights}</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="h-8 w-8 p-0"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">
                  No insights available yet. Create some credit applications or imports to get personalized recommendations.
                </p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {insight.title}
                        </CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={`mt-1 ${getPriorityColor(insight.priority)}`}
                        >
                          {insight.priority} priority
                        </Badge>
                      </div>
                    </div>
                    {insight.metrics && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {insight.metrics.value}
                        </div>
                        {insight.metrics.change && (
                          <div className="text-xs text-gray-500">
                            {insight.metrics.change}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-3">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (insight.action?.href) {
                          window.location.href = insight.action.href;
                        } else if (insight.action?.onClick) {
                          insight.action.onClick();
                        }
                      }}
                      className="w-full"
                    >
                      {insight.action.label}
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