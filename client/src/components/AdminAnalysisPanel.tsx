// CRITICAL - DO NOT MODIFY WITHOUT AUTHORIZATION
// This component handles the 4-tier approval workflow:
// 1. Importador applies → 2. Admin pre-approves → 3. Financeira approves → 4. Admin finalizes
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CheckCircle, XCircle, FileText, AlertTriangle, MessageSquare, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";

interface AdminAnalysisPanelProps {
  application: any;
}

export default function AdminAnalysisPanel({ application }: AdminAnalysisPanelProps) {
  const permissions = useUserPermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [analysisData, setAnalysisData] = useState({
    status: application.preAnalysisStatus || "pending",
    riskLevel: application.riskLevel || "medium",
    notes: application.analysisNotes || "",
    requestedDocuments: application.requestedDocuments || "",
    observations: application.adminObservations || ""
  });

  // Financeira-specific state
  const [financialData, setFinancialData] = useState({
    creditLimit: application.creditLimit || "",
    approvedTerms: application.approvedTerms ? application.approvedTerms.split(',') : [],
    financialNotes: application.financialNotes || "",
    downPayment: application.downPayment || "30",
    attachments: [] as File[]
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

  // Mutation para atualizar status da aplicação
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, data }: { status: string; data?: any }) => {
      let endpoint;

      if (permissions.isFinanceira) {
        // Financeira endpoints for final approval/rejection
        endpoint = status === 'approved' 
          ? `/api/financeira/credit-applications/${application.id}/approve`
          : status === 'rejected'
          ? `/api/financeira/credit-applications/${application.id}/reject`
          : `/api/financeira/credit-applications/${application.id}/update-analysis`;
      } else {
        // Admin endpoints for pre-approval and workflow
        endpoint = status === 'pre_approved' 
          ? `/api/admin/credit/applications/${application.id}/approve`
          : status === 'rejected'
          ? `/api/admin/credit/applications/${application.id}/reject`
          : status === 'submitted_to_financial'
          ? `/api/admin/credit-applications/${application.id}/submit-financial`
          : `/api/admin/credit/applications/${application.id}/update-analysis`;
      }

      return await apiRequest(endpoint, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${application.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financeira/credit-applications"] });

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
    if (permissions.isFinanceira) {
      // Financeira final approval
      if (!financialData.creditLimit) {
        toast({
          title: "Erro",
          description: "Por favor, informe o limite de crédito aprovado.",
          variant: "destructive",
        });
        return;
      }

      handleConfirmAction(
        "Aprovação Final",
        "Tem certeza que deseja conceder a aprovação final desta solicitação de crédito?",
        () => {
          updateStatusMutation.mutate({
            status: 'approved',
            data: {
              creditLimit: financialData.creditLimit,
              approvedTerms: financialData.approvedTerms.join(','),
              downPayment: financialData.downPayment,
              financialNotes: financialData.financialNotes,
              financialStatus: 'approved'
            }
          });
        }
      );
    } else {
      // Admin pre-approval
      handleConfirmAction(
        "Pré-aprovar Solicitação",
        "Tem certeza que deseja pré-aprovar esta solicitação de crédito?",
        () => {
          updateStatusMutation.mutate({
            status: 'pre_approved',
            data: {
              reason: analysisData.notes || 'Pré-aprovado após análise administrativa',
              riskLevel: analysisData.riskLevel,
              analysisNotes: analysisData.notes,
              preAnalysisStatus: 'pre_approved'
            }
          });
        }
      );
    }
  };

  const handleReject = () => {
    if (permissions.isFinanceira) {
      // Financeira rejection
      handleConfirmAction(
        "Rejeitar Crédito",
        "Tem certeza que deseja rejeitar esta solicitação de crédito?",
        () => {
          updateStatusMutation.mutate({
            status: 'rejected',
            data: {
              financialNotes: financialData.financialNotes || 'Rejeitado após análise financeira',
              financialStatus: 'rejected'
            }
          });
        }
      );
    } else {
      // Admin rejection
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
    }
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

    // Clear the field after sending
    setAnalysisData(prev => ({ ...prev, requestedDocuments: "" }));
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

    // Clear the field after sending
    setAnalysisData(prev => ({ ...prev, observations: "" }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", color: "bg-gray-100 text-gray-800" },
      under_review: { label: "Em Análise", color: "bg-blue-100 text-blue-800" },
      pre_approved: { label: "Pré-Aprovado", color: "bg-green-100 text-green-800" },
      submitted_to_financial: { label: "Enviado à Financeira", color: "bg-yellow-100 text-yellow-800" },
      needs_documents: { label: "Precisa Documentos", color: "bg-yellow-100 text-yellow-800" },
      needs_clarification: { label: "Precisa Esclarecimentos", color: "bg-orange-100 text-orange-800" },
      approved: { label: "Aprovado pela Financeira", color: "bg-green-100 text-green-800" },
      admin_finalized: { label: "Finalizado", color: "bg-green-200 text-green-900" },
      rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
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
            {permissions.isFinanceira ? (
              <>
                <DollarSign className="w-5 h-5" />
                Análise Financeira
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Pré-Análise Administrativa
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Atual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status Atual:</span>
              {getStatusBadge(application.preAnalysisStatus || application.status)}
            </div>
            {!permissions.isFinanceira && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nível de Risco:</span>
                {getRiskBadge(analysisData.riskLevel)}
              </div>
            )}
          </div>

          <Separator />

          {permissions.isFinanceira ? (
            // Financeira Interface - Final Approval with Credit Limits and Payment Terms
            <>
              {/* Credit Limit Input */}
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Limite de Crédito Aprovado (USD)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  placeholder="Ex: 150000"
                  value={financialData.creditLimit}
                  onChange={(e) => setFinancialData(prev => ({ ...prev, creditLimit: e.target.value }))}
                />
              </div>

              {/* Payment Terms Selection - Multiple Selection */}
              <div className="space-y-2">
                <Label>Prazo de Pagamento Aprovado</Label>
                <div className="flex flex-wrap gap-2">
                  {['30', '60', '90', '120', '150', '180'].map((term) => (
                    <Button
                      key={term}
                      variant={financialData.approvedTerms.includes(term) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setFinancialData(prev => ({
                          ...prev,
                          approvedTerms: prev.approvedTerms.includes(term)
                            ? prev.approvedTerms.filter(t => t !== term)
                            : [...prev.approvedTerms, term]
                        }));
                      }}
                    >
                      {term} dias
                    </Button>
                  ))}
                </div>
                {financialData.approvedTerms.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Selecionados: {financialData.approvedTerms.join(', ')} dias
                  </p>
                )}
              </div>

              {/* Down Payment Percentage */}
              <div className="space-y-2">
                <Label htmlFor="downPayment">Entrada Requerida (%)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  placeholder="30"
                  value={financialData.downPayment}
                  onChange={(e) => setFinancialData(prev => ({ ...prev, downPayment: e.target.value }))}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500">
                  Entrada de {financialData.downPayment}% do valor total da importação
                </p>
              </div>

              {/* Financial Notes */}
              <div className="space-y-2">
                <Label htmlFor="financialNotes">Observações da Aprovação Final</Label>
                <Textarea
                  id="financialNotes"
                  placeholder="Adicione observações sobre a aprovação final do crédito..."
                  value={financialData.financialNotes}
                  onChange={(e) => setFinancialData(prev => ({ ...prev, financialNotes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Action Buttons for Financeira */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleApprove}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovação Final
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </>
          ) : (
            // Admin Interface - Pre-analysis and Document Management
            <>
              {/* Risk Assessment */}
              <div className="space-y-2">
                <Label htmlFor="riskLevel">Nível de Risco</Label>
                <Select value={analysisData.riskLevel} onValueChange={(value) => setAnalysisData(prev => ({ ...prev, riskLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Analysis Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas da Análise</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre a análise..."
                  value={analysisData.notes}
                  onChange={(e) => setAnalysisData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Request Documents Section */}
              <div className="space-y-2">
                <Label htmlFor="requestedDocuments">Solicitar Documentos</Label>
                <Textarea
                  id="requestedDocuments"
                  placeholder="Especifique quais documentos adicionais são necessários..."
                  value={analysisData.requestedDocuments}
                  onChange={(e) => setAnalysisData(prev => ({ ...prev, requestedDocuments: e.target.value }))}
                  rows={2}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRequestDocuments}
                  disabled={updateStatusMutation.isPending || !analysisData.requestedDocuments.trim()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Enviar Solicitação
                </Button>
              </div>

              {/* Admin Observations */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações para o Importador</Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações ou solicitações de esclarecimento..."
                  value={analysisData.observations}
                  onChange={(e) => setAnalysisData(prev => ({ ...prev, observations: e.target.value }))}
                  rows={2}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddObservation}
                  disabled={updateStatusMutation.isPending || !analysisData.observations.trim()}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar Observação
                </Button>
              </div>

              {/* Action Buttons for Admin - Adaptive based on status */}
              <div className="pt-4">
                {/* Status: PENDING - Show approve/reject buttons */}
                {(application.status === 'pending') && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleApprove}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Pré-aprovar
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleReject}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}
                
                {/* Status: PRE_APPROVED - Show submit to financial */}
                {application.status === 'pre_approved' && (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-700 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aplicação pré-aprovada com sucesso!
                      </p>
                      <p className="text-xs text-green-600">
                        Confira todos os documentos antes de enviar à financeira
                      </p>
                    </div>
                    <Button 
                      onClick={() => updateStatusMutation.mutate({
                        status: 'submitted_to_financial',
                        data: { submittedToFinancialAt: new Date() }
                      })}
                      disabled={updateStatusMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Submeter à Financeira
                    </Button>
                  </div>
                )}
                
                {/* Status: SUBMITTED_TO_FINANCIAL - Show waiting message */}
                {application.status === 'submitted_to_financial' && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-700 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Aplicação enviada à financeira - aguardando análise
                    </p>
                  </div>
                )}
                
                {/* Status: APPROVED by financial - Show finalize button */}
                {application.status === 'approved' && application.financialStatus === 'approved' && !application.adminStatus && (
                  <Button 
                    onClick={() => updateStatusMutation.mutate({
                      status: 'admin_finalized',
                      data: { adminStatus: 'admin_finalized', adminFinalizedAt: new Date() }
                    })}
                    disabled={updateStatusMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Termos
                  </Button>
                )}
                
                {/* Status: ADMIN_FINALIZED - Show completion message */}
                {application.adminStatus === 'admin_finalized' && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Processo concluído - termos finalizados
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.action}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}