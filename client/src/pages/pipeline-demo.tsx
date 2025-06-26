import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import StageManager from "@/components/imports/StageManager";
import ImportTimeline from "@/components/imports/ImportTimeline";
import { PIPELINE_STAGES, calculateEstimatedDelivery } from "@/utils/pipelineUtils";

export default function PipelineDemoPage() {
  const [selectedDemo, setSelectedDemo] = useState<'sea' | 'air'>('sea');
  
  // Dados de demonstração
  const demoImport = {
    id: 999,
    currentStage: 'producao',
    shippingMethod: selectedDemo,
    createdAt: new Date('2025-06-01'),
    estimatedDelivery: calculateEstimatedDelivery(new Date('2025-06-01'), selectedDemo),
    completedStages: ['planejamento'],
    stageDetails: {
      planejamento: {
        startDate: new Date('2025-06-01T09:00:00'),
        completedDate: new Date('2025-06-03T17:30:00'),
        notes: 'Documentação inicial aprovada e especificações definidas'
      },
      producao: {
        startDate: new Date('2025-06-04T08:00:00'),
        estimatedDate: new Date('2025-06-19'),
        notes: 'Produção iniciada pelo fornecedor em Guangzhou'
      }
    }
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
                Visualização completa do sistema de tracking de importações
              </p>
            </div>
          </div>
          
          {/* Demo Controls */}
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

        {/* Demo Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Sprint 3.1 - Sistema de Pipeline Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Componentes Implementados:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ImportTimeline - Visualização temporal com progresso</li>
                  <li>• StageCard - Gestão individual de estágios</li>
                  <li>• StageManager - Controle completo do pipeline</li>
                  <li>• Pipeline Utils - 8 estágios configurados</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Features Demonstradas:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Timeline visual com ícones e cores</li>
                  <li>• Progresso percentual calculado</li>
                  <li>• Datas estimadas vs reais</li>
                  <li>• Diferenciação marítimo vs aéreo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ID:</span>
                <span className="text-sm font-medium">#999</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Método:</span>
                <Badge variant="outline">
                  {selectedDemo === 'sea' ? '🚢 Marítimo' : '✈️ Aéreo'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status Atual:</span>
                <Badge variant="secondary">Produção</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Início:</span>
                <span className="text-sm font-medium">01/06/2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Previsão:</span>
                <span className="text-sm font-medium">
                  {demoImport.estimatedDelivery.toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estágios do Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PIPELINE_STAGES
                  .filter(stage => {
                    if (stage.id === 'transporte_maritimo') return selectedDemo === 'sea';
                    if (stage.id === 'transporte_aereo') return selectedDemo === 'air';
                    return true;
                  })
                  .map((stage) => {
                    const isCompleted = demoImport.completedStages.includes(stage.id);
                    const isCurrent = stage.id === demoImport.currentStage;
                    
                    return (
                      <div key={stage.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          isCompleted ? 'bg-green-500' :
                          isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <span className={`text-sm ${
                          isCompleted || isCurrent ? 'font-medium' : 'text-gray-600'
                        }`}>
                          {stage.name}
                        </span>
                        {stage.estimatedDays > 0 && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            {stage.estimatedDays}d
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progresso Geral:</span>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estágios Completos:</span>
                <span className="text-sm font-medium">1/8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tempo Decorrido:</span>
                <span className="text-sm font-medium">25 dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tempo Restante:</span>
                <span className="text-sm font-medium">
                  {selectedDemo === 'sea' ? '40 dias' : '15 dias'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Timeline Component Demo */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Timeline Visual - ImportTimeline Component
          </h2>
          <ImportTimeline
            currentStage={demoImport.currentStage}
            shippingMethod={selectedDemo}
            createdAt={demoImport.createdAt}
            estimatedDelivery={demoImport.estimatedDelivery}
            completedStages={demoImport.completedStages}
            stageDetails={demoImport.stageDetails}
            interactive={true}
            onStageClick={(stage) => {
              console.log('Stage clicked:', stage.name);
            }}
          />
        </div>

        <Separator />

        {/* Stage Manager Demo */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Gerenciador Completo - StageManager Component
          </h2>
          <StageManager
            importId={demoImport.id}
            currentStage={demoImport.currentStage}
            shippingMethod={selectedDemo}
            createdAt={demoImport.createdAt}
            estimatedDelivery={demoImport.estimatedDelivery}
            completedStages={demoImport.completedStages}
            stageDetails={demoImport.stageDetails}
            canManage={true}
          />
        </div>

        {/* Implementation Notes */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Sprint 3.1 Concluído ✅</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-3">Funcionalidades Implementadas:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ 8 estágios definidos e configurados</li>
                  <li>✅ Timeline visual com ícones e cores</li>
                  <li>✅ Datas estimadas vs reais</li>
                  <li>✅ Sistema de progresso percentual</li>
                  <li>✅ Diferenciação marítimo/aéreo</li>
                  <li>✅ Interface de gestão para admins</li>
                  <li>✅ Componentes reutilizáveis</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-3">Próximos Passos (Sprint 3.2):</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>🔄 Página de detalhes com layout 3 colunas</li>
                  <li>🔄 Timeline interativa integrada</li>
                  <li>🔄 Seção de documentos por estágio</li>
                  <li>🔄 Responsividade mobile completa</li>
                  <li>🔄 Integração com dados reais</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}