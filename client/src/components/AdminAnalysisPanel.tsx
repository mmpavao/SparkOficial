// CRITICAL - DO NOT MODIFY WITHOUT AUTHORIZATION
// This component handles the 4-tier approval workflow:
// 1. Importador applies → 2. Admin pre-approves → 3. Financeira approves → 4. Admin finalizes
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { CheckCircle, XCircle, FileText, AlertTriangle, MessageSquare, DollarSign, Edit, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";
import { useSoundEffects } from "@/utils/soundEffects";
import { useAuth } from '../hooks/useAuth';
import { useModuleGuard } from '../hooks/useModuleGuard';

// Currency formatting function
const formatCurrency = (value: string | number): string => {
  if (!value || value === '') return '';
  
  // Convert to number and format
  const numericValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) : value;
  
  if (isNaN(numericValue) || numericValue === 0) return '';
  
  return `$${numericValue.toLocaleString('en-US')}`;
};

interface AdminAnalysisPanelProps {
  application: any;
}

export default function AdminAnalysisPanel({ application }: AdminAnalysisPanelProps) {
  // 🔒 PROTEÇÃO MODULAR - CRÍTICA
  const { isAuthorized } = useModuleGuard({
    allowedRoles: ['admin', 'super_admin', 'financeira'],
    componentName: 'AdminAnalysisPanel',
    onUnauthorized: () => {
      console.error('❌ ACESSO NEGADO: AdminAnalysisPanel protegido');
    }
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Bloqueia renderização se não autorizado
  if (!isAuthorized) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 font-medium">🔒 Componente Protegido</p>
        <p className="text-sm text-red-500">Acesso restrito a administradores</p>
      </div>
    );
  }

  const permissions = useUserPermissions();
  const { toast } = useToast();
  const { playApprovalSound, playStatusChangeSound, playSubmitSound } = useSoundEffects();

  // Fetch user-specific financial settings for this application
  const { data: userSettings } = useQuery({
    queryKey: [`/api/admin/users/${application.userId}/financial-settings`],
    enabled: !!application.userId && permissions.isFinanceira
  });

  console.log("👤 User Financial Settings for Application:", userSettings);
  console.log("📝 Application Data:", { userId: application.userId, creditLimit: application.creditLimit });

  const [analysisData, setAnalysisData] = useState({
    status: application.preAnalysisStatus || "pending",
    riskLevel: application.riskLevel || "medium",
    notes: application.analysisNotes || "",
    requestedDocuments: application.requestedDocuments || "",
    observations: application.adminObservations || ""
  });

  // Financeira-specific state - initialize with user settings when available
  const [financialData, setFinancialData] = useState({
    creditLimit: application.creditLimit || "",
    approvedTerms: userSettings?.paymentTerms ? userSettings.paymentTerms.split(',') : (application.approvedTerms ? application.approvedTerms.split(',') : []),
    financialNotes: application.financialNotes || "",
    attachments: [] as File[]
  });

  // Update financial data when user settings are loaded
  useEffect(() => {
    if (userSettings && permissions.isFinanceira) {
      setFinancialData(prev => ({
        ...prev,
        approvedTerms: userSettings.paymentTerms ? userSettings.paymentTerms.split(',') : prev.approvedTerms
      }));
    }
  }, [userSettings, permissions.isFinanceira]);

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
    onSuccess: (data, variables) => {
      // For submit to financial action, force immediate cache invalidation
      if (variables.status === 'submitted_to_financial') {
        // Force refresh of this specific application
        queryClient.invalidateQueries({ queryKey: [`/api/admin/credit-applications/${application.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${application.id}`] });
        
        // Force refresh of all application lists
        queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/financeira/credit-applications"] });
        
        // Update the local application object immediately to reflect changes
        application.status = 'submitted_to_financial';
        
        toast({
          title: "Aplicação enviada à financeira!",
          description: "Aplicação enviada à financeira - aguardando análise",
        });
        
        playSubmitSound();
        return;
      }

      // Standard invalidation for other actions
      queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${application.id}`] });
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      }, 100);

      // Play appropriate sound based on action type
      const { status } = variables;
      if (status === 'pre_approved' || status === 'approved') {
        playApprovalSound();
      } else {
        playStatusChangeSound();
      }

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
              downPayment: "10",
              financialNotes: financialData.financialNotes,
              financialStatus: 'approved'
            }
          }, {
            onSuccess: (data) => {
              // Atualização otimística do cache com dados da resposta
              queryClient.setQueryData(
                [`/api/financeira/credit-applications/${application.id}`],
                (oldData: any) => ({
                  ...oldData,
                  financialStatus: 'approved',
                  creditLimit: financialData.creditLimit,
                  approvedTerms: financialData.approvedTerms.join(','),
                  downPayment: "10",
                  financialNotes: financialData.financialNotes
                })
              );

              // Invalidar queries relacionadas
              queryClient.invalidateQueries({ 
                queryKey: ["/api/financeira/credit-applications"] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/credit/applications/${application.id}`] 
              });

              // Força refetch para garantir sincronização
              setTimeout(() => {
                queryClient.refetchQueries({ 
                  queryKey: [`/api/financeira/credit-applications/${application.id}`] 
                });
              }, 100);

              toast({
                title: "Crédito Aprovado!",
                description: "A aprovação foi processada com sucesso.",
              });
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

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, type }: { message: string; type: string }) => {
      return apiRequest(`/api/credit-applications/${application.id}/admin-message`, "PUT", {
        message,
        type
      });
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/credit/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credit-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financeira/credit-applications'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  });

  const handleRequestDocuments = () => {
    if (!analysisData.requestedDocuments.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, especifique quais documentos são necessários.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      message: analysisData.requestedDocuments,
      type: 'document_request'
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

    sendMessageMutation.mutate({
      message: analysisData.observations,
      type: 'observation'
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
              {permissions.isFinanceira && application.financialStatus === 'approved' ? (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Aprovado
                </Badge>
              ) : (
                getStatusBadge(application.preAnalysisStatus || application.status)
              )}
            </div>
            {!permissions.isFinanceira && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nível de Risco:</span>
                {getRiskBadge(analysisData.riskLevel)}
              </div>
            )}
          </div>

          <Separator />


          {permissions.isFinanceira && application.financialStatus === 'approved' ? (
            // Financeira Interface - Already approved, show approved credit details
            <>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="w-full">
                    <h4 className="font-medium text-green-800">Crédito Aprovado</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Esta solicitação já foi aprovada pela instituição financeira.
                    </p>

                    {/* Approved Credit Details */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Limite Aprovado:</span>
                        <span className="font-medium text-green-800">
                          US$ {Number(application.creditLimit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {application.approvedTerms && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Prazos Aprovados:</span>
                          <span className="font-medium text-green-800">
                            {application.approvedTerms} dias
                          </span>
                        </div>
                      )}
                      {application.downPayment && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Entrada Requerida:</span>
                          <span className="font-medium text-green-800">
                            10% do valor do pedido
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Termos
                </Button>
                <Button 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Bloquear Crédito
                </Button>
              </div>
            </>
          ) : permissions.isFinanceira && application.financialStatus !== 'approved' ? (
            // Financeira Interface - Final Approval with Credit Limits and Payment Terms (only if not already approved)
            <>
              {/* Credit Limit Input */}
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Limite de Crédito Aprovado (USD)</Label>
                <Input
                  id="creditLimit"
                  type="text"
                  placeholder="Ex: $150,000"
                  value={formatCurrency(financialData.creditLimit)}
                  onChange={(e) => {
                    // Remove formatting and keep only numbers
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setFinancialData(prev => ({ ...prev, creditLimit: numericValue }));
                  }}
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

              {/* Insurance Policy Coverage - Information Display */}
              <div className="space-y-2">
                <Label>Cobertura da Apólice</Label>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm font-medium text-blue-800">
                    90% (Down payment 10%)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    A apólice de seguro cobrirá 90% do valor financiado, com entrada obrigatória de 10%
                  </p>
                </div>
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
              <div className="flex flex-col gap-2 pt-4">
                <Button 
                  onClick={handleApprove}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovação Final
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={updateStatusMutation.isPending}
                  className="w-full"
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



              {/* Action Buttons for Admin - Only show for pending applications */}
              <div className="pt-4">
                {/* Show pre-approval buttons for admin when application needs pre-analysis */}
                {!permissions.isFinanceira && 
                 (application.status === 'pending' || application.status === 'under_review' || application.status === 'pre_analysis') && 
                 (!application.preAnalysisStatus || application.preAnalysisStatus === 'pending' || application.preAnalysisStatus === 'pending_admin') && 
                 application.preAnalysisStatus !== 'pre_approved' && (
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleApprove}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Pré-aprovar
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleReject}
                      disabled={updateStatusMutation.isPending}
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}

                {/* Status: PRE_APPROVED - Show submit to financial (only if not already processed) */}
                {(() => {
                  const shouldShowSubmitButton = (application.status === 'pre_approved' || application.preAnalysisStatus === 'pre_approved') && 
                   (application.financialStatus !== 'approved' && application.financialStatus !== 'rejected') && 
                   application.adminStatus !== 'admin_finalized' && 
                   application.status !== 'submitted_to_financial' && 
                   application.status !== 'approved' && 
                   application.status !== 'admin_finalized';
                  
                  console.log('🔍 SUBMIT BUTTON DEBUG:', {
                    status: application.status,
                    preAnalysisStatus: application.preAnalysisStatus,
                    financialStatus: application.financialStatus,
                    adminStatus: application.adminStatus,
                    shouldShow: shouldShowSubmitButton
                  });
                  
                  return shouldShowSubmitButton;
                })() && (
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