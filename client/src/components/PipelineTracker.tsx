
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  Pause, 
  FileText,
  Ship,
  Truck,
  Anchor,
  FileCheck,
  Package,
  MapPin,
  Calendar
} from "lucide-react";

interface PipelineStage {
  id: string;
  name: string;
  icon: any;
  status: "pending" | "in_progress" | "completed" | "delayed" | "cancelled";
  startDate?: string;
  endDate?: string;
  estimatedDate?: string;
  actualDate?: string;
  notes?: string;
  documents?: string[];
  location?: string;
  responsiblePerson?: string;
}

interface PipelineTrackerProps {
  importId: number;
  currentStage: string;
  stages: Record<string, any>;
  onUpdateStage: (stage: string, data: any) => void;
  readOnly?: boolean;
}

const PIPELINE_STAGES = [
  { id: "estimativa", name: "Estimativa", icon: FileText },
  { id: "invoice", name: "Invoice", icon: FileCheck },
  { id: "producao", name: "Produção", icon: Package },
  { id: "embarque", name: "Embarque", icon: Ship },
  { id: "transporte", name: "Transporte Marítimo", icon: Ship },
  { id: "atracacao", name: "Atracação", icon: Anchor },
  { id: "desembaraco", name: "Desembaraço", icon: FileCheck },
  { id: "transporte_terrestre", name: "Transporte Terrestre", icon: Truck },
  { id: "entrega", name: "Entrega", icon: CheckCircle },
];

export default function PipelineTracker({ 
  importId, 
  currentStage, 
  stages, 
  onUpdateStage, 
  readOnly = false 
}: PipelineTrackerProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [stageData, setStageData] = useState<any>({});

  const getStageStatus = (stageId: string): "pending" | "in_progress" | "completed" | "delayed" => {
    const stageInfo = stages[`stage${stageId.charAt(0).toUpperCase() + stageId.slice(1)}`];
    if (!stageInfo) return "pending";
    return stageInfo.status || "pending";
  };

  const getStageData = (stageId: string) => {
    const stageKey = `stage${stageId.charAt(0).toUpperCase() + stageId.slice(1)}`;
    return stages[stageKey] || {};
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Play className="w-5 h-5 text-blue-600 animate-pulse" />;
      case "delayed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      case "delayed":
        return <Badge className="bg-red-100 text-red-800">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getCurrentStageIndex = () => {
    return PIPELINE_STAGES.findIndex(stage => stage.id === currentStage);
  };

  const isStageAccessible = (stageIndex: number) => {
    const currentIndex = getCurrentStageIndex();
    return stageIndex <= currentIndex + 1; // Can access current stage and next stage
  };

  const handleStageUpdate = (stageId: string, action: "start" | "complete" | "delay") => {
    const now = new Date().toISOString();
    const currentData = getStageData(stageId);
    
    let updatedData = { ...currentData };
    
    switch (action) {
      case "start":
        updatedData = {
          ...updatedData,
          status: "in_progress",
          startDate: now,
          ...stageData
        };
        break;
      case "complete":
        updatedData = {
          ...updatedData,
          status: "completed",
          endDate: now,
          actualDate: now,
          ...stageData
        };
        break;
      case "delay":
        updatedData = {
          ...updatedData,
          status: "delayed",
          ...stageData
        };
        break;
    }
    
    onUpdateStage(stageId, updatedData);
    setEditingStage(null);
    setStageData({});
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-4">
      {/* Pipeline Progress */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pipeline de Importação</h3>
          <Badge variant="outline" className="text-spark-600">
            Etapa {getCurrentStageIndex() + 1} de {PIPELINE_STAGES.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="relative mb-8">
          <div className="flex items-center justify-between">
            {PIPELINE_STAGES.map((stage, index) => {
              const status = getStageStatus(stage.id);
              const isActive = stage.id === currentStage;
              const isCompleted = status === "completed";
              const isAccessible = isStageAccessible(index);
              
              return (
                <div key={stage.id} className="flex flex-col items-center relative">
                  {/* Connection Line */}
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div 
                      className={`absolute top-6 left-6 w-24 h-0.5 ${
                        isCompleted ? "bg-green-500" : "bg-gray-300"
                      }`}
                      style={{ width: "calc(100% + 1rem)" }}
                    />
                  )}
                  
                  {/* Stage Circle */}
                  <div 
                    className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer
                      transition-all duration-200 ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isActive 
                            ? "bg-spark-500 text-white animate-pulse" 
                            : isAccessible
                              ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              : "bg-gray-100 text-gray-400"
                      }
                    `}
                    onClick={() => isAccessible && setExpandedStage(
                      expandedStage === stage.id ? null : stage.id
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <stage.icon className="w-6 h-6" />
                    )}
                  </div>
                  
                  {/* Stage Name */}
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      isActive ? "text-spark-600" : "text-gray-600"
                    }`}>
                      {stage.name}
                    </p>
                    {getStatusBadge(status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Stage Details */}
      {expandedStage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {PIPELINE_STAGES.find(s => s.id === expandedStage)?.icon && (
                  <PIPELINE_STAGES.find(s => s.id === expandedStage)!.icon className="w-5 h-5" />
                )}
                {PIPELINE_STAGES.find(s => s.id === expandedStage)?.name}
              </div>
              {getStatusBadge(getStageStatus(expandedStage))}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const data = getStageData(expandedStage);
              const status = getStageStatus(expandedStage);
              
              return (
                <>
                  {/* Stage Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.startDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data de Início</label>
                        <p className="text-sm text-gray-900">{formatDate(data.startDate)}</p>
                      </div>
                    )}
                    
                    {data.endDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data de Conclusão</label>
                        <p className="text-sm text-gray-900">{formatDate(data.endDate)}</p>
                      </div>
                    )}
                    
                    {data.estimatedDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data Estimada</label>
                        <p className="text-sm text-gray-900">{formatDate(data.estimatedDate)}</p>
                      </div>
                    )}
                    
                    {data.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Local</label>
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {data.location}
                        </p>
                      </div>
                    )}
                    
                    {data.responsiblePerson && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Responsável</label>
                        <p className="text-sm text-gray-900">{data.responsiblePerson}</p>
                      </div>
                    )}
                  </div>
                  
                  {data.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Observações</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{data.notes}</p>
                    </div>
                  )}
                  
                  {data.documents && data.documents.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Documentos</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.documents.map((doc: string, index: number) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {!readOnly && (
                    <div className="flex gap-2 pt-4 border-t">
                      {status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => setEditingStage(expandedStage)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Iniciar Etapa
                        </Button>
                      )}
                      
                      {status === "in_progress" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStageUpdate(expandedStage, "complete")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Concluir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStageUpdate(expandedStage, "delay")}
                            className="text-red-600 hover:text-red-700"
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Marcar Atraso
                          </Button>
                        </>
                      )}
                      
                      {status === "delayed" && (
                        <Button
                          size="sm"
                          onClick={() => handleStageUpdate(expandedStage, "complete")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Edit Form */}
                  {editingStage === expandedStage && (
                    <div className="space-y-4 pt-4 border-t bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium">Atualizar Etapa</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Data Estimada</label>
                          <Input
                            type="date"
                            value={stageData.estimatedDate || ""}
                            onChange={(e) => setStageData({...stageData, estimatedDate: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Local</label>
                          <Input
                            placeholder="Ex: Porto de Santos"
                            value={stageData.location || ""}
                            onChange={(e) => setStageData({...stageData, location: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Responsável</label>
                          <Input
                            placeholder="Nome do responsável"
                            value={stageData.responsiblePerson || ""}
                            onChange={(e) => setStageData({...stageData, responsiblePerson: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Observações</label>
                        <Textarea
                          placeholder="Observações sobre esta etapa..."
                          value={stageData.notes || ""}
                          onChange={(e) => setStageData({...stageData, notes: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStageUpdate(expandedStage, "start")}
                        >
                          Salvar e Iniciar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStage(null);
                            setStageData({});
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
