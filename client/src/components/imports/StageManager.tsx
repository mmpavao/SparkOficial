import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Clock,
  AlertTriangle
} from "lucide-react";
import { 
  PIPELINE_STAGES,
  getStagesForShippingMethod,
  getNextStage,
  getPreviousStage,
  calculateOverallProgress,
  type PipelineStage
} from "@/utils/pipelineUtils";
import StageCard from "./StageCard";
import ImportTimeline from "./ImportTimeline";

interface StageManagerProps {
  importId: number;
  currentStage: string;
  shippingMethod: 'sea' | 'air';
  createdAt: Date;
  estimatedDelivery?: Date;
  completedStages?: string[];
  stageDetails?: Record<string, {
    startDate?: Date;
    completedDate?: Date;
    estimatedDate?: Date;
    notes?: string;
  }>;
  canManage?: boolean;
}

export default function StageManager({
  importId,
  currentStage,
  shippingMethod,
  createdAt,
  estimatedDelivery,
  completedStages = [],
  stageDetails = {},
  canManage = false
}: StageManagerProps) {
  const [activeTab, setActiveTab] = useState("timeline");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const relevantStages = getStagesForShippingMethod(shippingMethod);
  const currentStageData = relevantStages.find(s => s.id === currentStage);
  const nextStage = getNextStage(currentStage);
  const previousStage = getPreviousStage(currentStage);
  const overallProgress = calculateOverallProgress(currentStage, shippingMethod);

  // Mutation para atualizar estágio
  const updateStageMutation = useMutation({
    mutationFn: async (data: {
      stageId: string;
      status?: string;
      startDate?: Date;
      completedDate?: Date;
      notes?: string;
    }) => {
      return apiRequest(`/api/imports/${importId}/stages/${data.stageId}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Estágio atualizado",
        description: "As informações do estágio foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/imports', importId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar estágio",
        description: error.message || "Ocorreu um erro ao atualizar o estágio.",
        variant: "destructive",
      });
    }
  });

  // Mutation para avançar estágio
  const advanceStageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/imports/${importId}/advance-stage`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Estágio avançado",
        description: "A importação foi movida para o próximo estágio.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/imports', importId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao avançar estágio",
        description: error.message || "Ocorreu um erro ao avançar o estágio.",
        variant: "destructive",
      });
    }
  });

  // Mutation para retroceder estágio
  const revertStageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/imports/${importId}/revert-stage`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Estágio revertido",
        description: "A importação foi movida para o estágio anterior.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/imports', importId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reverter estágio",
        description: error.message || "Ocorreu um erro ao reverter o estágio.",
        variant: "destructive",
      });
    }
  });

  const handleStageUpdate = (stageId: string, updates: any) => {
    updateStageMutation.mutate({
      stageId,
      ...updates
    });
  };

  const handleAdvanceStage = () => {
    advanceStageMutation.mutate();
  };

  const handleRevertStage = () => {
    revertStageMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gerenciamento de Pipeline</CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {overallProgress}% Concluído
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {currentStageData?.icon && (
                  <currentStageData.icon className="w-5 h-5 text-blue-600" />
                )}
                <span className="font-medium">
                  Estágio Atual: {currentStageData?.name || 'Não definido'}
                </span>
              </div>
              
              <Badge variant="secondary">
                {shippingMethod === 'sea' ? '🚢 Marítimo' : '✈️ Aéreo'}
              </Badge>
            </div>

            {/* Stage Controls */}
            {canManage && (
              <div className="flex items-center gap-2">
                {previousStage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Voltar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reverter Estágio</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja reverter para o estágio "{previousStage.name}"?
                          Esta ação pode afetar o cronograma da importação.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevertStage}>
                          Reverter
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {nextStage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm">
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Avançar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Avançar Estágio</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja avançar para o estágio "{nextStage.name}"?
                          Confirme que todas as atividades do estágio atual foram concluídas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAdvanceStage}>
                          Avançar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="stages">Estágios Detalhados</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <ImportTimeline
            currentStage={currentStage}
            shippingMethod={shippingMethod}
            createdAt={createdAt}
            estimatedDelivery={estimatedDelivery}
            completedStages={completedStages}
            stageDetails={stageDetails}
            interactive={canManage}
            onStageClick={(stage) => {
              setActiveTab("stages");
              // Scroll to stage card (could be implemented)
            }}
          />
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantStages.map((stage) => {
              const stageStatus = completedStages.includes(stage.id) 
                ? 'completed' 
                : stage.id === currentStage 
                ? 'in_progress' 
                : 'pending';

              return (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  status={stageStatus}
                  details={stageDetails[stage.id]}
                  canEdit={canManage}
                  onUpdate={handleStageUpdate}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => handleStageUpdate(currentStage, { 
                  startDate: new Date(),
                  status: 'in_progress'
                })}
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Estágio Atual
              </Button>

              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => handleStageUpdate(currentStage, { 
                  completedDate: new Date(),
                  status: 'completed'
                })}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Concluído
              </Button>

              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => handleStageUpdate(currentStage, { 
                  status: 'delayed'
                })}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reportar Atraso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}