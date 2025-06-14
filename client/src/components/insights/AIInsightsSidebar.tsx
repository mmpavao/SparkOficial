import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Package,
  Users,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import { useTranslation } from '@/contexts/I18nContext';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    type: 'navigate' | 'modal' | 'external';
    target?: string;
  };
  metadata?: {
    impact?: string;
    timeline?: string;
    value?: number;
  };
}

interface InsightsData {
  insights: AIInsight[];
  summary: {
    totalOpportunities: number;
    potentialValue: number;
    urgentActions: number;
    completedActions: number;
  };
}

export default function AIInsightsSidebar() {
  const { t } = useTranslation();
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const { data: insightsData, isLoading } = useQuery({
    queryKey: ['/api/insights/ai-recommendations'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'trend':
        return <Target className="h-4 w-4 text-purple-600" />;
      default:
        return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleActionClick = (insight: AIInsight) => {
    if (!insight.action) return;

    switch (insight.action.type) {
      case 'navigate':
        if (insight.action.target) {
          window.location.href = insight.action.target;
        }
        break;
      case 'external':
        if (insight.action.target) {
          window.open(insight.action.target, '_blank');
        }
        break;
      case 'modal':
        // Handle modal opening logic
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const insights = insightsData?.insights || [];
  const summary = insightsData?.summary;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t.insights?.title || 'AI Insights'}
          </h2>
          <Zap className="h-4 w-4 text-yellow-500" />
        </div>
        
        {summary && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-green-50 p-2 rounded-lg">
              <div className="text-green-800 font-medium">{summary.totalOpportunities}</div>
              <div className="text-green-600 text-xs">{t.insights?.opportunities || 'Opportunities'}</div>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg">
              <div className="text-blue-800 font-medium">{summary.urgentActions}</div>
              <div className="text-blue-600 text-xs">{t.insights?.urgentActions || 'Urgent'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Insights List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {insights.map((insight) => (
            <Card 
              key={insight.id} 
              className={`cursor-pointer transition-all ${
                selectedInsight === insight.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedInsight(
                selectedInsight === insight.id ? null : insight.id
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(insight.priority)}`}
                      >
                        {insight.priority.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {insight.title}
                    </h4>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {insight.description}
                    </p>

                    {insight.metadata && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        {insight.metadata.value && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(insight.metadata.value)}
                          </span>
                        )}
                        {insight.metadata.timeline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {insight.metadata.timeline}
                          </span>
                        )}
                      </div>
                    )}

                    {selectedInsight === insight.id && insight.actionable && insight.action && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(insight);
                          }}
                        >
                          {insight.action.label}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {insights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">{t.insights?.noInsights || 'No insights available'}</p>
            <p className="text-xs mt-1">{t.insights?.checkBackLater || 'Check back later for AI recommendations'}</p>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{t.insights?.lastUpdated || 'Last updated'}</span>
          <span>{formatDate(new Date())}</span>
        </div>
      </div>
    </div>
  );
}