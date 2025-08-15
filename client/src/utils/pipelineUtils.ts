import { Calendar, Package, Truck, Ship, Plane, FileText, CheckCircle, MapPin } from "lucide-react";
import { TFunction } from 'i18next';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
  estimatedDays: number;
}

export interface ImportProgress {
  currentStage: string;
  completedStages: string[];
  stageProgress: Record<string, {
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    startDate?: Date;
    completedDate?: Date;
    estimatedDate?: Date;
    notes?: string;
  }>;
  overallProgress: number;
}

export function getPipelineStages(t?: TFunction): PipelineStage[] {
  return [
    {
      id: 'planejamento',
      name: t?.('pipeline.planning') || 'Planejamento',
      description: t?.('pipeline.planningDesc') || 'Definição da importação e documentação inicial',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      order: 1,
      estimatedDays: 3
    },
    {
      id: 'producao',
      name: t?.('pipeline.production') || 'Produção',
      description: t?.('pipeline.productionDesc') || 'Fabricação dos produtos pelo fornecedor',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      order: 2,
      estimatedDays: 15
    },
    {
      id: 'entregue_agente',
      name: t?.('pipeline.deliveredAgent') || 'Entregue ao Agente',
      description: t?.('pipeline.deliveredAgentDesc') || 'Produtos entregues ao agente de carga na China',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      order: 3,
      estimatedDays: 2
    },
    {
      id: 'transporte_maritimo',
      name: t?.('pipeline.seaTransport') || 'Transporte Marítimo',
      description: t?.('pipeline.seaTransportDesc') || 'Envio por navio para o Brasil',
      icon: Ship,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      order: 4,
      estimatedDays: 30
    },
    {
      id: 'transporte_aereo',
      name: t?.('pipeline.airTransport') || 'Transporte Aéreo',
      description: t?.('pipeline.airTransportDesc') || 'Envio por avião para o Brasil',
      icon: Plane,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      order: 4,
      estimatedDays: 5
    },
    {
      id: 'desembaraco',
      name: t?.('pipeline.clearance') || 'Desembaraço',
      description: t?.('pipeline.clearanceDesc') || 'Liberação alfandegária no Brasil',
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      order: 5,
      estimatedDays: 7
    },
    {
      id: 'transporte_nacional',
      name: t?.('pipeline.nationalTransport') || 'Transporte Nacional',
      description: t?.('pipeline.nationalTransportDesc') || 'Entrega do porto/aeroporto ao destino final',
      icon: MapPin,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      order: 6,
      estimatedDays: 3
    },
    {
      id: 'concluido',
      name: t?.('pipeline.completed') || 'Concluído',
      description: t?.('pipeline.completedDesc') || 'Importação finalizada e entregue',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      order: 7,
      estimatedDays: 0
    }
  ];
}

// Legacy constant for backward compatibility
export const PIPELINE_STAGES: PipelineStage[] = getPipelineStages();

export function getStageByStatus(status: string, t?: TFunction): PipelineStage | undefined {
  const stages = getPipelineStages(t);
  return stages.find(stage => stage.id === status);
}

export function getNextStage(currentStage: string, t?: TFunction): PipelineStage | undefined {
  const stages = getPipelineStages(t);
  const current = stages.find(s => s.id === currentStage);
  if (!current) return stages[0];
  
  return stages.find(s => s.order === current.order + 1);
}

export function getPreviousStage(currentStage: string, t?: TFunction): PipelineStage | undefined {
  const stages = getPipelineStages(t);
  const current = stages.find(s => s.id === currentStage);
  if (!current || current.order === 1) return undefined;
  
  return stages.find(s => s.order === current.order - 1);
}

export function getStagesForShippingMethod(shippingMethod: 'sea' | 'air', t?: TFunction): PipelineStage[] {
  const stages = getPipelineStages(t);
  return stages.filter(stage => {
    if (stage.id === 'transporte_maritimo') return shippingMethod === 'sea';
    if (stage.id === 'transporte_aereo') return shippingMethod === 'air';
    return true;
  });
}

export function calculateOverallProgress(currentStage: string, shippingMethod: 'sea' | 'air' = 'sea', t?: TFunction): number {
  const relevantStages = getStagesForShippingMethod(shippingMethod, t);
  const currentStageData = relevantStages.find(s => s.id === currentStage);
  
  if (!currentStageData) return 0;
  
  const totalStages = relevantStages.length;
  const currentStageIndex = relevantStages.findIndex(s => s.id === currentStage);
  
  return Math.round(((currentStageIndex + 1) / totalStages) * 100);
}

export function calculateEstimatedDelivery(
  startDate: Date, 
  shippingMethod: 'sea' | 'air' = 'sea',
  t?: TFunction
): Date {
  const relevantStages = getStagesForShippingMethod(shippingMethod, t);
  const totalDays = relevantStages.reduce((sum, stage) => sum + stage.estimatedDays, 0);
  
  const deliveryDate = new Date(startDate);
  deliveryDate.setDate(deliveryDate.getDate() + totalDays);
  
  return deliveryDate;
}

export function getStageProgress(
  currentStage: string,
  completedStages: string[] = [],
  t?: TFunction
): Record<string, 'pending' | 'completed' | 'current'> {
  const progress: Record<string, 'pending' | 'completed' | 'current'> = {};
  const stages = getPipelineStages(t);
  
  stages.forEach(stage => {
    if (completedStages.includes(stage.id)) {
      progress[stage.id] = 'completed';
    } else if (stage.id === currentStage) {
      progress[stage.id] = 'current';
    } else {
      progress[stage.id] = 'pending';
    }
  });
  
  return progress;
}

export function getDelayedStages(
  stageProgress: Record<string, {
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    estimatedDate?: Date;
  }>
): string[] {
  const today = new Date();
  const delayed: string[] = [];
  
  Object.entries(stageProgress).forEach(([stageId, progress]) => {
    if (progress.status !== 'completed' && progress.estimatedDate) {
      if (today > progress.estimatedDate) {
        delayed.push(stageId);
      }
    }
  });
  
  return delayed;
}

export function formatStageDuration(days: number, t?: TFunction): string {
  if (days === 0) return t?.('time.immediate') || 'Imediato';
  if (days === 1) return `1 ${t?.('time.day') || 'dia'}`;
  if (days < 7) return `${days} ${t?.('time.days') || 'dias'}`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? `1 ${t?.('time.week') || 'semana'}` : `${weeks} ${t?.('time.weeks') || 'semanas'}`;
  }
  const months = Math.round(days / 30);
  return months === 1 ? `1 ${t?.('time.month') || 'mês'}` : `${months} ${t?.('time.months') || 'meses'}`;
}

export function getStageStatusColor(status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'current'): {
  text: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case 'completed':
      return {
        text: 'text-green-700',
        bg: 'bg-green-100',
        border: 'border-green-300'
      };
    case 'current':
    case 'in_progress':
      return {
        text: 'text-blue-700',
        bg: 'bg-blue-100',
        border: 'border-blue-300'
      };
    case 'delayed':
      return {
        text: 'text-red-700',
        bg: 'bg-red-100',
        border: 'border-red-300'
      };
    default:
      return {
        text: 'text-gray-600',
        bg: 'bg-gray-100',
        border: 'border-gray-300'
      };
  }
}