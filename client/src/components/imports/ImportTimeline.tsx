import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { 
  PIPELINE_STAGES, 
  getStagesForShippingMethod, 
  calculateOverallProgress,
  getStageProgress,
  formatStageDuration,
  getStageStatusColor,
  type PipelineStage 
} from "@/utils/pipelineUtils";

interface ImportTimelineProps {
  currentStage: string;
  shippingMethod: 'sea' | 'air';
  createdAt: Date;
  estimatedDelivery?: Date;
  completedStages?: string[];
  stageDetails?: Record<string, {
    startDate?: Date;
    completedDate?: Date;
    notes?: string;
    isDelayed?: boolean;
  }>;
  interactive?: boolean;
  onStageClick?: (stage: PipelineStage) => void;
}

export default function ImportTimeline({
  currentStage,
  shippingMethod,
  createdAt,
  estimatedDelivery,
  completedStages = [],
  stageDetails = {},
  interactive = false,
  onStageClick
}: ImportTimelineProps) {
  const relevantStages = getStagesForShippingMethod(shippingMethod);
  const overallProgress = calculateOverallProgress(currentStage, shippingMethod);
  const stageProgress = getStageProgress(currentStage, completedStages);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header with Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Timeline da Importação</h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {overallProgress}% Concluído
            </Badge>
          </div>
          
          <Progress value={overallProgress} className="h-3" />
          
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Iniciado em {format(createdAt, "dd/MM/yyyy", { locale: ptBR })}</span>
            {estimatedDelivery && (
              <span>Previsão: {format(estimatedDelivery, "dd/MM/yyyy", { locale: ptBR })}</span>
            )}
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="space-y-4">
          {relevantStages.map((stage, index) => (
            <TimelineStage
              key={stage.id}
              stage={stage}
              status={stageProgress[stage.id] || 'pending'}
              isLast={index === relevantStages.length - 1}
              details={stageDetails[stage.id]}
              interactive={interactive}
              onClick={() => onStageClick?.(stage)}
            />
          ))}
        </div>

        {/* Summary Info */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Método de Envio:</span>
              <div className="font-medium flex items-center gap-1 mt-1">
                {shippingMethod === 'sea' ? (
                  <>
                    <span>🚢</span>
                    Marítimo
                  </>
                ) : (
                  <>
                    <span>✈️</span>
                    Aéreo
                  </>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Estágio Atual:</span>
              <div className="font-medium mt-1">
                {PIPELINE_STAGES.find(s => s.id === currentStage)?.name || 'Não definido'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineStageProps {
  stage: PipelineStage;
  status: 'pending' | 'completed' | 'current';
  isLast: boolean;
  details?: {
    startDate?: Date;
    completedDate?: Date;
    notes?: string;
    isDelayed?: boolean;
  };
  interactive: boolean;
  onClick: () => void;
}

function TimelineStage({ 
  stage, 
  status, 
  isLast, 
  details, 
  interactive, 
  onClick 
}: TimelineStageProps) {
  const Icon = stage.icon;
  const colors = getStageStatusColor(details?.isDelayed ? 'delayed' : status);
  
  const getStatusIcon = () => {
    if (details?.isDelayed) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (status === 'current') {
      return <Clock className="w-4 h-4 text-blue-600" />;
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Timeline Line */}
      {!isLast && (
        <div 
          className={`absolute left-6 top-12 w-0.5 h-6 ${
            status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
          }`}
        />
      )}
      
      {/* Stage Content */}
      <div 
        className={`flex items-start gap-4 p-3 rounded-lg transition-all ${
          interactive ? 'cursor-pointer hover:bg-gray-50' : ''
        } ${colors.bg} ${colors.border} border`}
        onClick={interactive ? onClick : undefined}
      >
        {/* Stage Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          status === 'completed' ? 'bg-green-100' :
          status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            status === 'completed' ? 'text-green-600' :
            status === 'current' ? 'text-blue-600' : 'text-gray-400'
          }`} />
        </div>

        {/* Stage Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${colors.text}`}>
              {stage.name}
            </h4>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant="outline" className="text-xs">
                {formatStageDuration(stage.estimatedDays)}
              </Badge>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">
            {stage.description}
          </p>

          {/* Stage Details */}
          {details && (
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              {details.startDate && (
                <div>
                  Iniciado: {format(details.startDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              )}
              {details.completedDate && (
                <div>
                  Concluído: {format(details.completedDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              )}
              {details.notes && (
                <div className="italic">
                  {details.notes}
                </div>
              )}
              {details.isDelayed && (
                <div className="text-red-600 font-medium">
                  ⚠️ Atrasado
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}