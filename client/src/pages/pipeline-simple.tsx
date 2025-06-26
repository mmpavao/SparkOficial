import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { PIPELINE_STAGES, calculateEstimatedDelivery } from "@/utils/pipelineUtils";

export default function PipelineSimplePage() {
  const [selectedDemo, setSelectedDemo] = useState<'sea' | 'air'>('sea');
  
  const demoImport = {
    id: 999,
    currentStage: 'producao',
    shippingMethod: selectedDemo,
    createdAt: new Date('2025-06-01'),
    estimatedDelivery: calculateEstimatedDelivery(new Date('2025-06-01'), selectedDemo),
    completedStages: ['planejamento']
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/imports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sistema de Pipeline - Demonstração
              </h1>
              <p className="text-gray-600 mt-1">
                8 estágios configurados para tracking de importações
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={selectedDemo === 'sea' ? 'default' : 'outline'}
              onClick={() => setSelectedDemo('sea')}
            >
              🚢 Marítimo
            </Button>
            <Button
              variant={selectedDemo === 'air' ? 'default' : 'outline'}
              onClick={() => setSelectedDemo('air')}
            >
              ✈️ Aéreo
            </Button>
          </div>
        </div>

        {/* Sprint Status */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Sprint 3.1 - Sistema de Pipeline Completo ✅</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Componentes Implementados:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ pipelineUtils.ts - 8 estágios configurados</li>
                  <li>✅ ImportTimeline - Timeline visual com progresso</li>
                  <li>✅ StageCard - Gestão individual de estágios</li>
                  <li>✅ StageManager - Controle completo do pipeline</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-2">Features Implementadas:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ 8 estágios com ícones e cores</li>
                  <li>✅ Diferenciação marítimo vs aéreo</li>
                  <li>✅ Progresso percentual automático</li>
                  <li>✅ Gestão administrativa de estágios</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Stages Display */}
        <Card>
          <CardHeader>
            <CardTitle>Estágios do Pipeline ({selectedDemo === 'sea' ? 'Marítimo' : 'Aéreo'})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PIPELINE_STAGES
                .filter(stage => {
                  if (stage.id === 'transporte_maritimo') return selectedDemo === 'sea';
                  if (stage.id === 'transporte_aereo') return selectedDemo === 'air';
                  return true;
                })
                .map((stage, index) => {
                  const isCompleted = demoImport.completedStages.includes(stage.id);
                  const isCurrent = stage.id === demoImport.currentStage;
                  const Icon = stage.icon;
                  
                  return (
                    <Card key={stage.id} className={`border-2 ${
                      isCompleted ? 'bg-green-50 border-green-300' :
                      isCurrent ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-100' :
                            isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isCompleted ? 'text-green-600' :
                              isCurrent ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {stage.order}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm mb-1">{stage.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {stage.estimatedDays}d
                          </span>
                          <Badge variant={
                            isCompleted ? 'default' :
                            isCurrent ? 'secondary' : 'outline'
                          } className="text-xs">
                            {isCompleted ? 'Concluído' :
                             isCurrent ? 'Atual' : 'Pendente'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Criados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <div className="font-medium">Pipeline Utilities:</div>
                <div className="text-gray-600">client/src/utils/pipelineUtils.ts</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Componentes:</div>
                <div className="text-gray-600">
                  • ImportTimeline.tsx<br/>
                  • StageCard.tsx<br/>
                  • StageManager.tsx
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estágios Configurados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <div>1. Planejamento (3 dias)</div>
                <div>2. Produção (15 dias)</div>
                <div>3. Entregue ao Agente (2 dias)</div>
                <div>4. Transporte Marítimo (30d) / Aéreo (5d)</div>
                <div>5. Desembaraço (7 dias)</div>
                <div>6. Transporte Nacional (3 dias)</div>
                <div>7. Concluído</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <div>✅ Timeline visual interativa</div>
                <div>✅ Progresso percentual</div>
                <div>✅ Gestão de estágios</div>
                <div>✅ Diferenciação transporte</div>
                <div>✅ Datas estimadas</div>
                <div>✅ Status indicators</div>
                <div>✅ Interface administrativa</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demonstration Data */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Dados da Demonstração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Importação:</span>
                <div className="text-blue-700">#999 (Demo)</div>
              </div>
              <div>
                <span className="font-medium">Status Atual:</span>
                <div className="text-blue-700">Produção</div>
              </div>
              <div>
                <span className="font-medium">Progresso:</span>
                <div className="text-blue-700">25% Concluído</div>
              </div>
              <div>
                <span className="font-medium">Previsão Entrega:</span>
                <div className="text-blue-700">
                  {demoImport.estimatedDelivery.toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}