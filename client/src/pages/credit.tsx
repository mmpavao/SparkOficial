import { useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import AdminFilters from "@/components/AdminFilters";
import { apiRequest } from "@/lib/queryClient";
import { UniversalCard } from "@/components/shared/UniversalCard";
import { CreditScoreBar } from "@/components/credit/CreditScoreBar";
import { formatUSDInput, parseUSDInput, validateUSDRange, getUSDRangeDescription } from "@/lib/currency";
import { formatCompactCurrency } from "@/lib/numberFormat";
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
  const { t } = useTranslation();
  
  if (!Array.isArray(applications)) {
    return null;
  }

  // Calcular métricas reais baseadas nas aplicações
  const metrics = applications.reduce((acc, app) => {
    if (!app) return acc;
    
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
  });

  const approvedApplications = applications.filter(app => app && app.financialStatus === 'approved');
  const pendingApplications = applications.filter(app => app && app.status === 'pending');
  const underReviewApplications = applications.filter(app => app && app.status === 'under_review');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {permissions.canViewAllApplications ? t("status.approved") : t("dashboard.creditApproved")}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCompactCurrency(metrics.totalApproved)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {approvedApplications.length} {t('dashboard.applications')}
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
                {t("status.underAnalysis")}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCompactCurrency(metrics.totalUnderReview)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {underReviewApplications.length} {t('dashboard.applications')}
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
                {permissions.canViewAllApplications ? t("status.pending") : t("credit.pendingApplications")}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCompactCurrency(metrics.totalPending)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pendingApplications.length} {t('dashboard.applications')}
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
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const permissions = useUserPermissions();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Navigation handler for card clicks
  const handleCreditCardClick = (creditId: number) => {
    if (mounted) {
      setLocation(`/credit/details/${creditId}`);
    }
  };

  // Cancel application handler
  const handleCancelApplication = async (applicationId: number) => {
    if (confirm('Tem certeza que deseja cancelar esta solicitação de crédito?')) {
      try {
        await apiRequest(`/api/credit/applications/${applicationId}`, 'DELETE');
        queryClient.invalidateQueries({ queryKey: [getEndpoint()] });
        toast({
          title: t("common.success"),
          description: "Solicitação de crédito cancelada com sucesso.",
        });
      } catch (error) {
        toast({
          title: t("common.error"),
          description: "Erro ao cancelar solicitação de crédito.",
          variant: "destructive",
        });
      }
    }
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
    enabled: !!user && mounted,
  });
  
  // Debug log para verificar credit scores
  console.log("📊 All applications data:", applications);
  if (applications && Array.isArray(applications)) {
    const app69 = applications.find((app: any) => app.id === 69);
    if (app69) {
      console.log("🔍 Application 69 found:", app69);
      console.log("🔍 Credit Score field:", app69.creditScore);
    }
  }

  // Prevent SSR/hydration issues in production
  if (!mounted || !user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permissions.isFinanceira 
              ? "Análise Financeira - Aprovação de Crédito" 
              : permissions.canViewAllApplications 
                ? t("credit.adminManagement") 
                : t("credit.title")}
          </h1>
          <p className="text-gray-600">
            {permissions.isFinanceira
              ? t("credit.financialDesc")
              : permissions.canViewAllApplications 
                ? t("credit.adminDesc")
                : t("credit.subtitle")}
          </p>
        </div>
        {!permissions.isFinanceira && !permissions.canViewAllApplications && (
          <Button 
            onClick={() => setLocation('/credit/new')}
            className="bg-spark-600 hover:bg-spark-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('credit.newCreditApplication')}
          </Button>
        )}
      </div>

      {/* Filtros Administrativos - apenas para admins */}
      {permissions.canViewAdminFilters && (
        <AdminFilters onFiltersChange={setFilters} />
      )}

      {/* Credit Summary Cards - Dados Reais */}
      <CreditSummaryCards applications={applications as CreditApplication[]} permissions={permissions} />

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {permissions.canViewAllApplications 
              ? t("credit.allApplications") 
              : t("credit.myApplications")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : !Array.isArray(applications) || applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">{t('credit.noApplicationsFound')}</p>
              <p className="text-sm text-gray-400">
                {t('credit.applicationsWillAppearHere')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.filter(app => app && app.id).map((application: any) => {
                const getStatusInfo = () => {
                  // FINANCEIRA VIEW: When Financeira approves, it's FINAL for them
                  if (permissions.isFinanceira && application.financialStatus === 'approved') {
                    return { 
                      label: 'Aprovado', 
                      color: 'bg-green-100 text-green-800 border-green-200',
                      bgColor: 'bg-green-50',
                      borderColor: 'border-l-green-500'
                    };
                  }
                  // FINANCEIRA VIEW: Rejected applications
                  else if (permissions.isFinanceira && application.financialStatus === 'rejected') {
                    return { 
                      label: 'Rejeitado', 
                      color: 'bg-red-100 text-red-800 border-red-200',
                      bgColor: 'bg-red-50',
                      borderColor: 'border-l-red-500'
                    };
                  }
                  // FINANCEIRA VIEW: In analysis
                  else if (permissions.isFinanceira) {
                    return { 
                      label: 'Em Análise', 
                      color: 'bg-blue-100 text-blue-800 border-blue-200',
                      bgColor: 'bg-blue-50',
                      borderColor: 'border-l-blue-500'
                    };
                  }
                  
                  // NON-FINANCEIRA USERS: Show "Aprovado" only when admin has finalized
                  if (application.adminStatus === 'admin_finalized' || application.adminStatus === 'finalized') {
                    return { 
                      label: 'Aprovado', 
                      color: 'bg-green-100 text-green-800 border-green-200',
                      bgColor: 'bg-green-50',
                      borderColor: 'border-l-green-500'
                    };
                  } 
                  else if (application.financialStatus === 'rejected') {
                    return { 
                      label: 'Rejeitado', 
                      color: 'bg-red-100 text-red-800 border-red-200',
                      bgColor: 'bg-red-50',
                      borderColor: 'border-l-red-500'
                    };
                  }
                  else if (application.status === 'submitted_to_financial' || application.financialStatus === 'approved') {
                    return { 
                      label: 'Análise Final', 
                      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      bgColor: 'bg-yellow-50',
                      borderColor: 'border-l-yellow-500'
                    };
                  } 
                  else if (application.preAnalysisStatus === 'pre_approved') {
                    return { 
                      label: 'Pré-Aprovado', 
                      color: 'bg-green-100 text-green-800 border-green-200',
                      bgColor: 'bg-green-50',
                      borderColor: 'border-l-green-500'
                    };
                  }
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

                return (
                  <UniversalCard
                    key={application.id}
                    icon={<FileText className="w-6 h-6 text-spark-600" />}
                    title={application.legalCompanyName || `Empresa #${application.id}`}
                    subtitle={`ID da solicitação: #${application.id}`}
                    companyBadge={permissions.canViewAllApplications ? application.legalCompanyName : undefined}
                    status={statusInfo}
                    creditScore={application.creditScore}
                    miniCards={[
                      {
                        icon: <DollarSign className="w-4 h-4 text-blue-600" />,
                        label: t("credit.requested"),
                        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(application.requestedAmount || '0')),
                        color: "bg-blue-50 border-blue-200"
                      },
                      {
                        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                        label: t("credit.approval"), 
                        value: application.finalCreditLimit 
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(application.finalCreditLimit))
                          : application.financialApprovedAt 
                            ? new Date(application.financialApprovedAt).toLocaleDateString('pt-BR')
                            : t("status.pending"),
                        color: application.finalCreditLimit ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                      },
                      {
                        icon: <Calendar className="w-4 h-4 text-purple-600" />,
                        label: t("credit.createdAt"),
                        value: application.createdAt ? new Date(application.createdAt).toLocaleDateString('pt-BR') : 'N/A',
                        color: "bg-purple-50 border-purple-200"
                      },
                      {
                        icon: <Clock className="w-4 h-4 text-orange-600" />,
                        label: t("credit.updatedAt"),
                        value: application.updatedAt ? new Date(application.updatedAt).toLocaleDateString('pt-BR') : 'N/A',
                        color: "bg-orange-50 border-orange-200"
                      }
                    ]}
                    actions={[
                      {
                        icon: <Eye className="w-4 h-4" />,
                        label: t("common.details"),
                        onClick: () => setLocation(`/credit/details/${application.id}`)
                      },
                      {
                        icon: <Edit className="w-4 h-4" />,
                        label: t("common.edit"), 
                        onClick: () => setLocation(`/credit/edit/${application.id}`),
                        show: (application.status === 'pending' || application.status === 'draft') && !permissions.isFinanceira
                      },
                      {
                        icon: <X className="w-4 h-4" />,
                        label: t("common.cancel"),
                        onClick: () => handleCancelApplication(application.id),
                        variant: 'destructive',
                        show: (application.status === 'pending' || application.status === 'draft') && !permissions.isFinanceira
                      }
                    ]}
                    onClick={() => handleCreditCardClick(application.id)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}