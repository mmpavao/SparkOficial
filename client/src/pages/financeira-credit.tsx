import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  CreditCard, 
  Calendar,
  Building2,
  DollarSign,
  FileText,
  Clock
} from "lucide-react";
import MetricsCard from "@/components/common/MetricsCard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FinanceiraCreditPage() {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [creditLimit, setCreditLimit] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<number[]>([]);
  const [financialNotes, setFinancialNotes] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar aplicações pré-aprovadas
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/financeira/credit-applications'],
    queryFn: () => apiRequest('/api/financeira/credit-applications')
  });

  // Mutação para atualizar status financeiro
  const updateFinancialStatusMutation = useMutation({
    mutationFn: ({ id, status, data }: { id: number; status: string; data: any }) => 
      apiRequest(`/api/financeira/credit-applications/${id}/financial-status`, {
        method: 'PUT',
        body: JSON.stringify({ status, ...data })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financeira/credit-applications'] });
      toast({ title: "Status atualizado com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Erro ao atualizar status", 
        description: "Tente novamente",
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setSelectedApplication(null);
    setCreditLimit("");
    setSelectedTerms([]);
    setFinancialNotes("");
    setShowApprovalForm(false);
  };

  const handleApprove = () => {
    if (!selectedApplication || !creditLimit || selectedTerms.length === 0) {
      toast({ 
        title: "Dados incompletos", 
        description: "Preencha limite de crédito e termos de pagamento",
        variant: "destructive" 
      });
      return;
    }

    updateFinancialStatusMutation.mutate({
      id: selectedApplication.id,
      status: 'approved_financial',
      data: {
        creditLimit: parseFloat(creditLimit.replace(/[^0-9.]/g, '')),
        approvedTerms: selectedTerms,
        financialNotes
      }
    });
  };

  const handleReject = () => {
    if (!selectedApplication || !financialNotes.trim()) {
      toast({ 
        title: "Justificativa obrigatória", 
        description: "Informe o motivo da rejeição",
        variant: "destructive" 
      });
      return;
    }

    updateFinancialStatusMutation.mutate({
      id: selectedApplication.id,
      status: 'rejected_financial',
      data: { financialNotes }
    });
  };

  const toggleTerm = (term: number) => {
    setSelectedTerms(prev => 
      prev.includes(term) 
        ? prev.filter(t => t !== term)
        : [...prev, term]
    );
  };

  const availableTerms = [30, 60, 90, 120, 150, 180];

  // Métricas calculadas
  const totalApplications = applications.length;
  const avgCreditAmount = applications.length > 0 
    ? applications.reduce((sum: number, app: any) => sum + (app.creditAmount || 0), 0) / applications.length 
    : 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise Financeira</h1>
          <p className="text-gray-600">Solicitações pré-aprovadas para análise final</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricsCard
          title="Aguardando Análise"
          value={totalApplications}
          icon={Clock}
          color="blue"
        />
        <MetricsCard
          title="Valor Médio Solicitado"
          value={formatCurrency(avgCreditAmount)}
          icon={DollarSign}
          color="green"
        />
        <MetricsCard
          title="Tempo Médio de Análise"
          value="2-3 dias"
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Lista de Aplicações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Solicitações Pré-Aprovadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação pré-aprovada encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application: any) => (
                <div 
                  key={application.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{application.companyData?.companyName}</span>
                        <StatusBadge status="pre_approved" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Valor Solicitado:</span> {formatCurrency(application.creditAmount)}
                        </div>
                        <div>
                          <span className="font-medium">Setor:</span> {application.commercialData?.businessSector}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {formatDate(application.createdAt)}
                        </div>
                      </div>
                      {application.riskAssessment && (
                        <div className="mt-2">
                          <Badge variant={
                            application.riskAssessment === 'low' ? 'default' :
                            application.riskAssessment === 'medium' ? 'secondary' : 'destructive'
                          }>
                            Risco: {application.riskAssessment === 'low' ? 'Baixo' : 
                                    application.riskAssessment === 'medium' ? 'Médio' : 'Alto'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowApprovalForm(true);
                        }}
                      >
                        Analisar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Aprovação */}
      {showApprovalForm && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Análise Financeira - {selectedApplication.companyData?.companyName}
                <Button variant="ghost" size="sm" onClick={resetForm}>×</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações da Empresa */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Dados da Solicitação</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Valor Solicitado:</span>
                    <p>{formatCurrency(selectedApplication.creditAmount)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Setor:</span>
                    <p>{selectedApplication.commercialData?.businessSector}</p>
                  </div>
                  <div>
                    <span className="font-medium">Faturamento Anual:</span>
                    <p>{selectedApplication.commercialData?.annualRevenue}</p>
                  </div>
                  <div>
                    <span className="font-medium">Avaliação de Risco:</span>
                    <Badge variant={
                      selectedApplication.riskAssessment === 'low' ? 'default' :
                      selectedApplication.riskAssessment === 'medium' ? 'secondary' : 'destructive'
                    }>
                      {selectedApplication.riskAssessment === 'low' ? 'Baixo' : 
                       selectedApplication.riskAssessment === 'medium' ? 'Médio' : 'Alto'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Limite de Crédito Aprovado */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Limite de Crédito Aprovado (USD) *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 500,000.00"
                  value={creditLimit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    const formatted = new Intl.NumberFormat('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(parseFloat(value) || 0);
                    setCreditLimit(formatted);
                  }}
                />
              </div>

              {/* Termos de Pagamento */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Termos de Pagamento Aprovados (dias) *
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTerms.map(term => (
                    <Button
                      key={term}
                      variant={selectedTerms.includes(term) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTerm(term)}
                      className="min-w-[60px]"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione os prazos de pagamento que serão oferecidos
                </p>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Observações da Análise
                </label>
                <Textarea
                  placeholder="Comentários sobre a análise financeira, condições especiais, etc."
                  value={financialNotes}
                  onChange={(e) => setFinancialNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleApprove}
                  disabled={updateFinancialStatusMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={updateFinancialStatusMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={updateFinancialStatusMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}