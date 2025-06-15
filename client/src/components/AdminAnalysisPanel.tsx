import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, FileText, AlertTriangle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminAnalysisPanelProps {
  application: any;
}

export default function AdminAnalysisPanel({ application }: AdminAnalysisPanelProps) {
  const [analysisData, setAnalysisData] = useState({
    status: application.preAnalysisStatus || "pending",
    riskLevel: application.riskLevel || "medium",
    notes: application.analysisNotes || "",
    requestedDocuments: application.requestedDocuments || "",
    observations: application.adminObservations || ""
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {}
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para atualizar status da aplicação
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, data }: { status: string; data?: any }) => {
      const endpoint = status === 'approved' 
        ? `/api/admin/credit/applications/${application.id}/approve`
        : status === 'rejected'
        ? `/api/admin/credit/applications/${application.id}/reject`
        : `/api/admin/credit/applications/${application.id}/update-analysis`;
      
      const response = await apiRequest("PUT", endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications", application.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      toast({
        title: "Sucesso!",
        description: "Status atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmAction = (title: string, description: string, action: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      description,
      action
    });
  };

  const handleApprove = () => {
    handleConfirmAction(
      "Aprovar Solicitação",
      "Tem certeza que deseja aprovar esta solicitação de crédito?",
      () => {
        updateStatusMutation.mutate({
          status: 'approved',
          data: {
            reason: analysisData.notes || 'Aprovado após análise administrativa',
            riskLevel: analysisData.riskLevel,
            analysisNotes: analysisData.notes,
            preAnalysisStatus: 'pre_approved'
          }
        });
      }
    );
  };

  const handleReject = () => {
    handleConfirmAction(
      "Rejeitar Solicitação",
      "Tem certeza que deseja rejeitar esta solicitação de crédito?",
      () => {
        updateStatusMutation.mutate({
          status: 'rejected',
          data: {
            reason: analysisData.notes || 'Rejeitado após análise administrativa',
            riskLevel: analysisData.riskLevel,
            analysisNotes: analysisData.notes,
            preAnalysisStatus: 'rejected'
          }
        });
      }
    );
  };

  const handleRequestDocuments = () => {
    if (!analysisData.requestedDocuments.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, especifique quais documentos são necessários.",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      status: 'needs_documents',
      data: {
        requestedDocuments: analysisData.requestedDocuments,
        analysisNotes: analysisData.notes,
        riskLevel: analysisData.riskLevel,
        preAnalysisStatus: 'needs_documents'
      }
    });
  };

  const handleAddObservation = () => {
    if (!analysisData.observations.trim()) {
      toast({
        title: "Erro", 
        description: "Por favor, adicione uma observação.",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      status: 'needs_clarification',
      data: {
        adminObservations: analysisData.observations,
        analysisNotes: analysisData.notes,
        riskLevel: analysisData.riskLevel,
        preAnalysisStatus: 'needs_clarification'
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      under_review: { label: "Em Análise", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      pre_approved: { label: "Pré-Aprovado", variant: "default" as const, color: "bg-green-100 text-green-800" },
      needs_documents: { label: "Precisa Documentos", variant: "destructive" as const, color: "bg-yellow-100 text-yellow-800" },
      needs_clarification: { label: "Precisa Esclarecimentos", variant: "destructive" as const, color: "bg-orange-100 text-orange-800" },
      approved: { label: "Aprovado", variant: "default" as const, color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejeitado", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const riskMap = {
      low: { label: "Baixo", color: "bg-green-100 text-green-800" },
      medium: { label: "Médio", color: "bg-yellow-100 text-yellow-800" },
      high: { label: "Alto", color: "bg-red-100 text-red-800" },
    };
    
    const config = riskMap[risk as keyof typeof riskMap] || riskMap.medium;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Gestão Administrativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Atual:</span>
            {getStatusBadge(application.status)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nível de Risco:</span>
            {getRiskBadge(analysisData.riskLevel)}
          </div>
        </div>

        <Separator />

        {/* Análise de Risco */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nível de Risco</label>
          <Select
            value={analysisData.riskLevel}
            onValueChange={(value) => setAnalysisData(prev => ({ ...prev, riskLevel: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixo Risco</SelectItem>
              <SelectItem value="medium">Médio Risco</SelectItem>
              <SelectItem value="high">Alto Risco</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notas da Análise */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notas da Análise</label>
          <Textarea
            placeholder="Adicione observações sobre a análise desta solicitação..."
            value={analysisData.notes}
            onChange={(e) => setAnalysisData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <Separator />

        {/* Ações Principais */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Aprovar
            </Button>
            
            <Button 
              onClick={handleReject}
              variant="destructive"
              disabled={updateStatusMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rejeitar
            </Button>
          </div>
        </div>

        <Separator />

        {/* Solicitar Documentos */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Solicitar Documentos</label>
          <Textarea
            placeholder="Especifique quais documentos adicionais são necessários..."
            value={analysisData.requestedDocuments}
            onChange={(e) => setAnalysisData(prev => ({ ...prev, requestedDocuments: e.target.value }))}
            rows={2}
          />
          <Button 
            variant="outline"
            onClick={handleRequestDocuments}
            className="w-full"
            disabled={updateStatusMutation.isPending}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Solicitar Documentos
          </Button>
        </div>

        {/* Adicionar Observações */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Observações para Importador</label>
          <Textarea
            placeholder="Adicione observações ou solicitações de esclarecimento..."
            value={analysisData.observations}
            onChange={(e) => setAnalysisData(prev => ({ ...prev, observations: e.target.value }))}
            rows={2}
          />
          <Button 
            variant="outline"
            onClick={handleAddObservation}
            className="w-full"
            disabled={updateStatusMutation.isPending}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Enviar Observações
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Confirmation Dialog */}
    <AlertDialog 
      open={confirmDialog.open} 
      onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmDialog.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              confirmDialog.action();
              setConfirmDialog(prev => ({ ...prev, open: false }));
            }}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}