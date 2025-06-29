import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useTranslation } from "@/contexts/I18nContext";
import AdminFilters from "@/components/AdminFilters";
import { apiRequest } from "@/lib/queryClient";
import { formatUSDInput, parseUSDInput, validateUSDRange, getUSDRangeDescription } from "@/lib/currency";
import { 
  Plus, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  DollarSign,
  Calendar,
  Percent,
  Eye,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Building
} from "lucide-react";
import { CreditApplication } from "@shared/schema";

const createCreditApplicationSchema = (t: any) => z.object({
  requestedAmount: z.string()
    .min(1, "Valor é obrigatório")
    .transform((val) => parseFloat(val.replace(/[,$]/g, '')))
    .refine((val) => !isNaN(val), { message: "Valor deve ser um número válido" })
    .refine((val) => val >= 100, { message: "Valor mínimo é USD $100" })
    .refine((val) => val <= 1000000, { message: "Valor máximo é USD $1.000.000" })
    .transform((val) => val.toString()),
  purpose: z.string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(500, "Descrição muito longa (máximo 500 caracteres)"),
  notes: z.string().optional(),
});

type CreditApplicationForm = {
  requestedAmount: string;
  purpose: string;
  notes?: string;
};

// Componente para calcular e exibir dados reais de crédito
function CreditSummaryCards({ applications, permissions }: { applications: any[], permissions: any }) {
  // Calcular métricas reais baseadas nas aplicações
  const metrics = applications?.reduce((acc, app) => {
    const requestedAmount = parseFloat(app.requestedAmount || '0');

    if (app.financialStatus === 'approved') {
      // Para aprovados, usar finalCreditLimit se finalizado pelo admin, senão creditLimit
      const approvedAmount = app.adminStatus === 'admin_finalized' 
        ? parseFloat(app.finalCreditLimit || app.creditLimit || '0')
        : parseFloat(app.creditLimit || '0');
      acc.totalApproved += approvedAmount;
    } else if (app.status === 'pending') {
      acc.totalPending += requestedAmount;
    } else if (app.status === 'under_review') {
      acc.totalUnderReview += requestedAmount;
    }

    acc.totalRequested += requestedAmount;
    return acc;
  }, {
    totalApproved: 0,
    totalPending: 0,
    totalUnderReview: 0,
    totalRequested: 0
  }) || { totalApproved: 0, totalPending: 0, totalUnderReview: 0, totalRequested: 0 };

  const approvedApplications = applications?.filter(app => app.financialStatus === 'approved') || [];
  const pendingApplications = applications?.filter(app => app.status === 'pending') || [];
  const underReviewApplications = applications?.filter(app => app.status === 'under_review') || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {permissions.canViewAllApplications ? "Total Aprovado" : "Crédito Aprovado"}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalApproved)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {approvedApplications.length} {approvedApplications.length === 1 ? 'aplicação' : 'aplicações'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {permissions.canViewAllApplications ? "Em Análise" : "Aguardando Análise"}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalUnderReview)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {underReviewApplications.length} {underReviewApplications.length === 1 ? 'aplicação' : 'aplicações'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {permissions.canViewAllApplications ? "Pendentes" : "Solicitações Pendentes"}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalPending)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pendingApplications.length} {pendingApplications.length === 1 ? 'aplicação' : 'aplicações'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreditPage() {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const permissions = useUserPermissions();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Navigation handler for card clicks
  const handleCreditCardClick = (creditId: number) => {
    setLocation(`/credit/details/${creditId}`);
  };

  const form = useForm<CreditApplicationForm>({
    resolver: zodResolver(createCreditApplicationSchema(t)),
    defaultValues: {
      requestedAmount: "",
      purpose: "",
      notes: "",
    },
  });

  // Fetch credit applications - adaptável baseado no tipo de usuário
  const getEndpoint = () => {
    if (user?.role === "financeira") {
      return "/api/financeira/credit-applications";
    } else if (permissions.canViewAllApplications) {
      return "/api/admin/credit-applications";
    } else {
      return "/api/credit/applications";
    }
  };

  const { data: applications = [], isLoading } = useQuery({
    queryKey: [getEndpoint()],
    enabled: !!user,
  });

  // Create credit application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: CreditApplicationForm) => {
      const response = await apiRequest("/api/credit/applications", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      toast({
        title: t.credit.applicationSuccess,
        description: t.credit.applicationSent,
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t.credit.applicationError,
        description: error.message || t.common.error,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreditApplicationForm) => {
    createApplicationMutation.mutate(data);
  };

  // Cancel application mutation
  const cancelApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest(`/api/credit/applications/${applicationId}`, "DELETE");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      toast({
        title: "Sucesso!",
        description: "Solicitação de crédito cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCancelApplication = (applicationId: number) => {
    if (confirm("Tem certeza que deseja cancelar esta solicitação de crédito?")) {
      cancelApplicationMutation.mutate(applicationId);
    }
  };

  // Administrative mutations for approval/rejection
  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest(`/api/admin/credit/applications/${applicationId}/approve`, "PUT");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      toast({
        title: "Sucesso!",
        description: "Solicitação aprovada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest(`/api/admin/credit/applications/${applicationId}/reject`, "PUT");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      toast({
        title: "Sucesso!",
        description: "Solicitação rejeitada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleApproveApplication = (applicationId: number) => {
    if (confirm("Tem certeza que deseja aprovar esta solicitação de crédito?")) {
      approveApplicationMutation.mutate(applicationId);
    }
  };

  const handleRejectApplication = (applicationId: number) => {
    if (confirm("Tem certeza que deseja rejeitar esta solicitação de crédito?")) {
      rejectApplicationMutation.mutate(applicationId);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pre_analysis: { label: "Pré-Análise", variant: "secondary" as const, icon: Clock },
      pre_approved: { label: "Pré-Aprovado", variant: "default" as const, icon: CheckCircle },
      final_analysis: { label: "Análise Final", variant: "outline" as const, icon: FileText },
      approved: { label: "Aprovado", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Rejeitado", variant: "destructive" as const, icon: XCircle },
      cancelled: { label: "Cancelado", variant: "secondary" as const, icon: XCircle },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.pre_analysis;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permissions.isFinanceira 
              ? "Análise Financeira - Aprovação de Crédito" 
              : permissions.canViewAllApplications 
                ? "Gestão de Crédito - Área Administrativa" 
                : t.credit.title}
          </h1>
          <p className="text-gray-600">
            {permissions.isFinanceira
              ? "Avalie e aprove solicitações de crédito pré-analisadas pela administração"
              : permissions.canViewAllApplications 
                ? "Visualize e gerencie todas as solicitações de crédito da plataforma"
                : t.credit.requestCredit}
          </p>
        </div>
        {!permissions.isFinanceira && (
          <Button 
            onClick={() => setLocation('/credit/new')}
            className="bg-spark-600 hover:bg-spark-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Solicitação de Crédito
          </Button>
        )}
      </div>

      {/* Filtros Administrativos - apenas para admins */}
      {permissions.canViewAdminFilters && (
        <AdminFilters onFiltersChange={setFilters} />
      )}

      {/* Application Guidelines */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Critérios para Aprovação de Crédito</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Valores entre USD $100 e USD $1.000.000</li>
                  <li>• Descrição detalhada do propósito de importação da China</li>
                  <li>• Empresa com CNPJ ativo e documentação em dia</li>
                  <li>• Análise de capacidade de pagamento e histórico comercial</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Credit Application Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Nova Solicitação de Crédito
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requestedAmount"
                    render={({ field }) => {
                      const currentValue = parseUSDInput(field.value || '0');
                      const validation = validateUSDRange(currentValue);
                      const isValid = validation.isValid && currentValue > 0;

                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            Valor Solicitado (USD)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="$50,000"
                                value={field.value ? formatUSDInput(field.value) : ''}
                                onChange={(e) => {
                                  const numValue = parseUSDInput(e.target.value);
                                  field.onChange(numValue.toString());
                                }}
                                className={`pl-8 pr-10 text-lg font-medium ${
                                  field.value && currentValue > 0
                                    ? isValid 
                                      ? 'border-green-300 focus:border-green-500' 
                                      : 'border-red-300 focus:border-red-500'
                                    : ''
                                }`}
                              />
                              <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              {field.value && currentValue > 0 && (
                                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                                  {isValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{getUSDRangeDescription()}</span>
                            {field.value && currentValue > 0 && (
                              <span className={`font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                {isValid ? '✓ Valor válido' : validation.message}
                              </span>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.auth.companyName}</label>
                    <Input
                      value={user?.companyName || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Propósito da Importação
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva detalhadamente o propósito da importação, incluindo: tipo de produtos, fornecedores na China, cronograma de entrega, e como o crédito será utilizado no processo de importação..."
                          rows={4}
                          {...field}
                          className="resize-none"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Mínimo 10 caracteres para uma descrição adequada</span>
                        <span>{field.value?.length || 0}/500</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.credit.notes}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t.credit.notes}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createApplicationMutation.isPending}
                    className="bg-spark-600 hover:bg-spark-700"
                  >
{createApplicationMutation.isPending ? t.common.loading : t.credit.submitApplication}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
{t.credit.cancel}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Credit Summary Cards - Dados Reais */}
      <CreditSummaryCards applications={(applications || []) as CreditApplication[]} permissions={permissions} />

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {permissions.canViewAllApplications 
              ? "Todas as Solicitações de Crédito" 
              : t.credit.myApplications}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t.common.loading}...</p>
            </div>
          ) : (applications as any[]).length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhuma solicitação de crédito encontrada</p>
              <p className="text-sm text-gray-400">
                Suas solicitações de crédito aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(applications as any[]).map((application: any) => {
                  // Determinar status visual baseado nos dados reais do banco
                  const getStatusInfo = () => {
                    // Aprovado pela financeira - mostrar como aprovado para usuários Financeira
                    if (application.financialStatus === 'approved') {
                      return { 
                        label: 'Aprovado', 
                        color: 'bg-green-100 text-green-800 border-green-200',
                        bgColor: 'bg-green-50',
                        borderColor: 'border-l-green-500'
                      };
                    } 
                    // Rejeitado pela financeira
                    else if (application.financialStatus === 'rejected') {
                      return { 
                        label: 'Rejeitado', 
                        color: 'bg-red-100 text-red-800 border-red-200',
                        bgColor: 'bg-red-50',
                        borderColor: 'border-l-red-500'
                      };
                    } 
                    // Status approved (aplicações antigas) OU submetido à financeira
                    else if (application.status === 'approved' || application.status === 'submitted_to_financial') {
                      return { 
                        label: 'Análise Final', 
                        color: 'bg-blue-100 text-blue-800 border-blue-200',
                        bgColor: 'bg-blue-50',
                        borderColor: 'border-l-blue-500'
                      };
                    } 
                    // Status inicial ou outros casos
                    else {
                      return { 
                        label: 'Pré-Análise', 
                        color: 'bg-gray-100 text-gray-800 border-gray-200',
                        bgColor: 'bg-gray-50',
                        borderColor: 'border-l-gray-500'
                      };
                    }
                  };

                  const statusInfo = getStatusInfo();
                  const finalCreditAmount = application.finalCreditLimit || application.creditLimit;
                  const hasApprovedCredit = application.financialStatus === 'approved' && finalCreditAmount;

                  return (
                    <Card 
                      key={application.id} 
                      className={`border-l-4 ${statusInfo.borderColor} hover:shadow-md transition-all duration-200 cursor-pointer`}
                      onClick={() => handleCreditCardClick(application.id)}
                    >
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Left Section - Icon and Company Info (4 cols) */}
                          <div className="col-span-4 flex items-center space-x-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 bg-spark-50 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-spark-600" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-spark-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">#{application.id}</span>
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                                {`${(application.legalCompanyName || 'Empresa').length > 20 
                                    ? (application.legalCompanyName || 'Empresa').substring(0, 20) + '...' 
                                    : (application.legalCompanyName || 'Empresa')} - #${application.id}`}
                              </h3>
                              <p className="text-xs text-gray-600 mb-1">
                                {new Date(application.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                                <div className="flex items-center gap-2 text-xs">
                  {(() => {
                    // Count INDIVIDUAL FILES uploaded (not document types)
                    const requiredDocs = application.requiredDocuments || {};
                    const optionalDocs = application.optionalDocuments || {};
                    
                    let totalFilesUploaded = 0;
                    
                    // Count all individual files in required documents
                    Object.values(requiredDocs).forEach(doc => {
                      if (Array.isArray(doc)) {
                        totalFilesUploaded += doc.length;  // Count each file in array
                      } else if (doc) {
                        totalFilesUploaded += 1;  // Single file
                      }
                    });
                    
                    // Count all individual files in optional documents
                    Object.values(optionalDocs).forEach(doc => {
                      if (Array.isArray(doc)) {
                        totalFilesUploaded += doc.length;  // Count each file in array
                      } else if (doc) {
                        totalFilesUploaded += 1;  // Single file
                      }
                    });

                    // Total possible document slots (15 types as mentioned)
                    const totalDocumentSlots = 15;
                    const pendingSlots = Math.max(0, totalDocumentSlots - totalFilesUploaded);

                    return (
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          totalFilesUploaded >= totalDocumentSlots 
                            ? 'bg-green-100 text-green-700' 
                            : totalFilesUploaded >= 10
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-orange-100 text-orange-700'
                        }`}>
                          {totalFilesUploaded} docs enviados
                        </span>
                        <span className="text-gray-500 text-xs">
                          {pendingSlots > 0 ? `${pendingSlots} pendentes` : 'Completo'}
                        </span>
                      </div>
                    );
                  })()}</div>
                </div>
                            </div>
                          </div>

                          {/* Center Section - Values (4 cols) */}
                          <div className="col-span-4 flex items-center justify-center space-x-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Valor Solicitado</p>
                              <p className="text-sm font-bold text-blue-600">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(application.requestedAmount))}
                              </p>
                            </div>

                            {hasApprovedCredit && (
                              <div className="text-center">
                                <p className="text-xs text-green-700 mb-1">Aprovado</p>
                                <p className="text-sm font-bold text-green-600">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(finalCreditAmount))}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right Section - Status & Actions (4 cols) */}
                          <div className="col-span-4 flex items-center justify-end space-x-3">
                            <div className="text-center">
                              <Badge variant="outline" className={`${statusInfo.color} mb-1`}>
                                {statusInfo.label}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                {new Date(application.updatedAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>

                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/credit/details/${application.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>

                                {(application.status === 'pending' || application.status === 'under_review') && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => setLocation(`/credit/edit/${application.id}`)}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleCancelApplication(application.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* Admin Actions */}
                                {permissions.canViewAllApplications && application.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleApproveApplication(application.id)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleRejectApplication(application.id)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Rejeitar
                                    </DropdownMenuItem>
                                                                 </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}