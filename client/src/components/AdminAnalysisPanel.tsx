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
    downPayment: application.downPayment || "10",
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutação para upload de apólices
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
      formData.append('applicationId', application.id.toString());
      
      return await apiRequest(`/api/credit/applications/${application.id}/attachments`, "POST", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${application.id}`] });
      toast({
        title: "Sucesso!",
        description: "Apólices anexadas com sucesso.",
      });
      setFinancialData(prev => ({ ...prev, attachments: [] }));
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao anexar apólices. Tente novamente.",
        variant: "destructive",
      });
    },
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
          : `/api/financeira/credit-applications/${application.id}/update-financial`;
      } else {
        // Admin endpoints for pre-approval
        endpoint = status === 'pre_approved' 
          ? `/api/admin/credit/applications/${application.id}/approve`
          : status === 'rejected'
          ? `/api/admin/credit/applications/${application.id}/reject`
          : `/api/admin/credit/applications/${application.id}/update-analysis`;
      }
      
      return await apiRequest(endpoint, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${application.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      
      // Clear form fields after successful submission
      setAnalysisData({
        status: "pending",
        riskLevel: "medium",
        notes: "",
        requestedDocuments: "",
        observations: ""
      });
      
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
        "Aprovar Crédito",
        "Tem certeza que deseja aprovar esta solicitação de crédito com limite final?",
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
      // Financeira final rejection
      handleConfirmAction(
        "Rejeitar Crédito",
        "Tem certeza que deseja rejeitar esta solicitação de crédito definitivamente?",
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
      pending: { label: "Pendente", variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      under_review: { label: "Em Análise", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      pre_approved: { label: "Pré-análise Completa", variant: "default" as const, color: "bg-green-100 text-green-800" },
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
          {permissions.isFinanceira ? (
            <>
              <DollarSign className="w-5 h-5" />
              Análise Financeira
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Gestão Administrativa
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Atual:</span>
            {getStatusBadge(application.status)}
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
                placeholder="Ex: 100000"
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
                placeholder="Ex: 10"
                value={financialData.downPayment}
                onChange={(e) => setFinancialData(prev => ({ ...prev, downPayment: e.target.value }))}
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500">
                {financialData.downPayment}% de entrada do valor do pedido
              </p>
            </div>

            {/* Financial Notes */}
            <div className="space-y-2">
              <Label htmlFor="financialNotes">Observações Financeiras</Label>
              <Textarea
                id="financialNotes"
                placeholder="Adicione observações sobre a aprovação financeira..."
                value={financialData.financialNotes}
                onChange={(e) => setFinancialData(prev => ({ ...prev, financialNotes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Document Attachments */}
            <div className="space-y-2">
              <Label>Anexar Apólices e Documentos Adicionais</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setFinancialData(prev => ({
                      ...prev,
                      attachments: [...prev.attachments, ...files]
                    }));
                  }}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB por arquivo)
                </p>
              </div>
              
              {financialData.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Arquivos Selecionados:</p>
                  {financialData.attachments.map((file: File, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFinancialData(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    onClick={() => {
                      if (financialData.attachments.length > 0) {
                        uploadAttachmentsMutation.mutate(financialData.attachments);
                      }
                    }}
                    disabled={uploadAttachmentsMutation.isPending}
                    className="w-full mt-2"
                  >
                    {uploadAttachmentsMutation.isPending ? "Enviando..." : "Anexar Arquivos"}
                  </Button>
                </div>
              )}

              {/* Display existing attachments (only for admin/financeira) */}
              {(permissions.isAdmin || permissions.isFinanceira) && application.attachments && application.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Apólices Anexadas:</p>
                  {application.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{attachment.filename}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/api/credit/applications/${application.id}/attachments/${attachment.id}`, '_blank')}
                        title="Baixar arquivo"
                      >
                        📥
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Final Approval Actions - Only show if not already approved/rejected */}
            {application.status !== 'approved' && application.status !== 'rejected' && (
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
            )}

            {/* Status Display for Already Processed Applications */}
            {(application.status === 'approved' || application.status === 'rejected') && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  {application.status === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {application.status === 'approved' ? 'Aplicação Aprovada' : 'Aplicação Rejeitada'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Esta aplicação já foi processada e não pode ser alterada.
                </p>
              </div>
            )}
          </>
        ) : (
          // Admin Interface - Pre-approval with Risk Analysis
          <>
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
                  Pré-aprovar
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
          </>
        )}
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