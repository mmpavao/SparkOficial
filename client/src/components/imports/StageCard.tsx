import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X 
} from "lucide-react";
import { 
  formatStageDuration, 
  getStageStatusColor, 
  type PipelineStage 
} from "@/utils/pipelineUtils";

interface StageCardProps {
  stage: PipelineStage;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  details?: {
    startDate?: Date;
    completedDate?: Date;
    estimatedDate?: Date;
    notes?: string;
  };
  canEdit?: boolean;
  onUpdate?: (stageId: string, updates: {
    status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
    startDate?: Date;
    completedDate?: Date;
    notes?: string;
  }) => void;
}

export default function StageCard({
  stage,
  status,
  details,
  canEdit = false,
  onUpdate
}: StageCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status,
    startDate: details?.startDate ? format(details.startDate, "yyyy-MM-dd'T'HH:mm") : '',
    completedDate: details?.completedDate ? format(details.completedDate, "yyyy-MM-dd'T'HH:mm") : '',
    notes: details?.notes || ''
  });

  const Icon = stage.icon;
  const colors = getStageStatusColor(status);

  const handleSave = () => {
    const updates: any = {
      status: editData.status,
      notes: editData.notes
    };

    if (editData.startDate) {
      updates.startDate = new Date(editData.startDate);
    }

    if (editData.completedDate) {
      updates.completedDate = new Date(editData.completedDate);
    }

    onUpdate?.(stage.id, updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      status,
      startDate: details?.startDate ? format(details.startDate, "yyyy-MM-dd'T'HH:mm") : '',
      completedDate: details?.completedDate ? format(details.completedDate, "yyyy-MM-dd'T'HH:mm") : '',
      notes: details?.notes || ''
    });
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'delayed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em Progresso';
      case 'delayed':
        return 'Atrasado';
      default:
        return 'Pendente';
    }
  };

  return (
    <Card className={`${colors.border} border-2 transition-all hover:shadow-md`}>
      <CardHeader className={`${colors.bg} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              status === 'completed' ? 'bg-green-100' :
              status === 'in_progress' ? 'bg-blue-100' :
              status === 'delayed' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <Icon className={`w-6 h-6 ${
                status === 'completed' ? 'text-green-600' :
                status === 'in_progress' ? 'text-blue-600' :
                status === 'delayed' ? 'text-red-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg">{stage.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${colors.bg} ${colors.text}`}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusLabel()}</span>
            </Badge>
            {canEdit && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            {/* Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={editData.status}
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  status: e.target.value as any 
                }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Progresso</option>
                <option value="completed">Concluído</option>
                <option value="delayed">Atrasado</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={editData.startDate}
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  startDate: e.target.value 
                }))}
              />
            </div>

            {/* Completion Date */}
            {editData.status === 'completed' && (
              <div className="space-y-2">
                <Label htmlFor="completedDate">Data de Conclusão</Label>
                <Input
                  id="completedDate"
                  type="datetime-local"
                  value={editData.completedDate}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    completedDate: e.target.value 
                  }))}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Adicione observações sobre este estágio..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Duration Info */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Duração Estimada:</span>
              <Badge variant="secondary">
                {formatStageDuration(stage.estimatedDays)}
              </Badge>
            </div>

            {/* Dates */}
            {details?.startDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data de Início:</span>
                <span className="text-sm font-medium">
                  {format(details.startDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}

            {details?.completedDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data de Conclusão:</span>
                <span className="text-sm font-medium">
                  {format(details.completedDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}

            {details?.estimatedDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Previsão:</span>
                <span className="text-sm font-medium">
                  {format(details.estimatedDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}

            {/* Notes */}
            {details?.notes && (
              <div className="pt-2 border-t">
                <span className="text-sm text-gray-600">Observações:</span>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                  {details.notes}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!details?.startDate && !details?.completedDate && !details?.notes && (
              <div className="text-center py-4 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma informação de progresso ainda</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}