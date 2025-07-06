import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { formatCurrency } from "@/lib/formatters";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

export default function CreditDetailsPage() {
  const [match, params] = useRoute("/credit/details/:id");
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const permissions = useUserPermissions();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const applicationId = params?.id ? parseInt(params.id) : null;

  // Get the appropriate endpoint based on user role
  const getEndpoint = () => {
    if (permissions.canViewAllApplications) {
      return `/api/admin/credit-applications/${applicationId}`;
    } else {
      return `/api/credit/applications/${applicationId}`;
    }
  };

  const { data: application, isLoading } = useQuery({
    queryKey: [getEndpoint()],
    enabled: !!applicationId && !!user && mounted,
  });

  // Safe navigation handler
  const handleBackClick = () => {
    if (mounted) {
      setLocation('/credit');
    }
  };

  // Prevent rendering before mount to avoid hydration issues
  if (!mounted || !match || !applicationId) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Solicitação não encontrada</h3>
        <p className="text-gray-500">A solicitação de crédito não foi encontrada ou você não tem permissão para visualizá-la.</p>
      </div>
    );
  }

  // Safe status determination
  const getStatusInfo = () => {
    if (application.financialStatus === 'approved') {
      return { 
        label: 'Aprovado', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        iconColor: 'text-green-600'
      };
    } else if (application.financialStatus === 'rejected') {
      return { 
        label: 'Rejeitado', 
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        iconColor: 'text-red-600'
      };
    } else {
      return { 
        label: 'Em Análise', 
        color: 'bg-blue-100 text-blue-800',
        icon: Clock,
        iconColor: 'text-blue-600'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackClick}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitação de Crédito #{application.id}
          </h1>
          <p className="text-gray-600">Detalhes da solicitação de crédito</p>
        </div>
        <Badge className={statusInfo.color}>
          <StatusIcon className={`w-4 h-4 mr-1 ${statusInfo.iconColor}`} />
          {statusInfo.label}
        </Badge>
      </div>

      {/* Application Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Valor Solicitado
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(parseFloat(application.requestedAmount || '0'))}
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Data da Solicitação
                </div>
                <div className="text-lg font-medium">
                  {new Date(application.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {application.purpose && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Finalidade do Crédito</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {application.purpose}
              </p>
            </div>
          )}

          {application.notes && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {application.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      {application.legalCompanyName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Razão Social</label>
                <p className="text-gray-900">{application.legalCompanyName}</p>
              </div>
              {application.cnpj && (
                <div>
                  <label className="text-sm font-medium text-gray-700">CNPJ</label>
                  <p className="text-gray-900">{application.cnpj}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Information - For Approved Applications */}
      {application.financialStatus === 'approved' && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800">Crédito Aprovado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Limite Aprovado</label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(parseFloat(application.finalCreditLimit || application.creditLimit || '0'))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Em Uso</label>
                <p className="text-xl font-semibold text-blue-600">
                  US$ 120,000
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Disponível</label>
                <p className="text-xl font-semibold text-orange-600">
                  {formatCurrency(parseFloat(application.finalCreditLimit || application.creditLimit || '0') - 120000)}
                </p>
              </div>
            </div>

            {application.finalApprovedTerms && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Condições de Pagamento</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {application.finalApprovedTerms.split(',').map((term: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-green-50">
                      {term.trim()} dias
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}