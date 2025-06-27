import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import AdminAnalysisPanel from "@/components/AdminAnalysisPanel";
import { AdminFinalizationPanel } from "@/components/AdminFinalizationPanel";
import CreditStatusTracker from "@/components/credit/CreditStatusTracker";
import CreditCommunication from "@/components/CreditCommunication";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatCompactNumber } from "@/lib/formatters";
import { RobustDocumentUpload } from "@/components/RobustDocumentUpload";
import { ValidationResult } from "@/lib/documentValidation";
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Download, 
  Calendar, 
  DollarSign,
  Building,
  Mail,
  Phone,
  MapPin,
  User,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Edit,
  Save,
  X
} from "lucide-react";

export default function CreditDetailsPage() {
  const [match, params] = useRoute("/credit/details/:id");
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useUserPermissions();
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [isEditingCredit, setIsEditingCredit] = useState(false);
  const [editCreditData, setEditCreditData] = useState({
    paymentTerms: '',
    downPaymentPercentage: 30,
    adminFee: 0
  });

  const applicationId = params?.id ? parseInt(params.id) : null;

  // Fetch credit application details
  const { data: application, isLoading } = useQuery({
    queryKey: ["/api/credit/applications", applicationId],
    queryFn: async () => {
      console.log("Debug - User permissions:", {
        isFinanceira: permissions.isFinanceira,
        isAdmin: permissions.isAdmin,
        userRole: user?.role
      });

      if (permissions.isFinanceira) {
        console.log("Using Financeira endpoint");
        return await apiRequest(`/api/financeira/credit-applications/${applicationId}`, "GET");
      } else if (permissions.isAdmin) {
        console.log("Using Admin endpoint");
        return await apiRequest(`/api/admin/credit-applications/${applicationId}`, "GET");
      } else {
        console.log("Using regular endpoint");
        return await apiRequest(`/api/credit/applications/${applicationId}`, "GET");
      }
    },
    enabled: !!applicationId,
  }) as { data: any, isLoading: boolean };

  // Fetch credit usage data
  const { data: creditUsage } = useQuery({
    queryKey: ['/api/credit/usage', applicationId],
    queryFn: () => apiRequest(`/api/credit/usage/${applicationId}`, 'GET'),
    enabled: !!applicationId && application?.status === 'approved',
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ documentType, file }: { documentType: string; file: File }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const response = await fetch(`/api/credit/applications/${applicationId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload do documento');
      }

      return response.json();
    },
    onSuccess: () => {
      // Force cache removal and refetch
      queryClient.removeQueries({ queryKey: ["/api/credit/applications", applicationId] });
      queryClient.removeQueries({ queryKey: ["credit-applications"] });
      // Immediately refetch with fresh data
      queryClient.refetchQueries({ queryKey: ["/api/credit/applications", applicationId] });
      toast({
        title: "Sucesso!",
        description: "Documento enviado com sucesso.",
      });
      setUploadingDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
      setUploadingDocument(null);
    },
  });

  // Update credit data mutation
  const updateCreditDataMutation = useMutation({
    mutationFn: async (data: { paymentTerms: string; downPaymentPercentage: number; adminFee: number }) => {
      const endpoint = permissions.canPerformPreAnalysis 
        ? `/api/admin/credit/applications/${applicationId}/finalize`
        : `/api/credit/applications/${applicationId}`;

      return await apiRequest(endpoint, 'PUT', {
        finalApprovedTerms: data.paymentTerms,
        finalDownPayment: data.downPaymentPercentage,
        adminFee: data.adminFee.toString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit/applications', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credit-applications', applicationId] });
      setIsEditingCredit(false);
      toast({
        title: "Dados atualizados",
        description: "Os dados de crédito foram atualizados com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na atualização",
        description: error.message || "Falha ao atualizar os dados.",
        variant: "destructive",
      });
    },
  });

  const handleDocumentUpload = (documentType: string, file: File) => {
    setUploadingDocument(documentType);
    uploadDocumentMutation.mutate({ documentType, file });
  };

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => {
      const response = await fetch(`/api/credit/applications/${applicationId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover documento');
      }

      return response.json();
    },
    onSuccess: () => {
      // Force cache removal and refetch
      queryClient.removeQueries({ queryKey: ["/api/credit/applications", applicationId] });
      queryClient.removeQueries({ queryKey: ["credit-applications"] });
      // Immediately refetch with fresh data
      queryClient.refetchQueries({ queryKey: ["/api/credit/applications", applicationId] });
      toast({
        title: "Documento removido!",
        description: "Documento foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover documento",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleDocumentRemove = (documentId: string) => {
    deleteDocumentMutation.mutate({ documentId });
  };

  const initializeEditMode = () => {
    if (application) {
      setEditCreditData({
        paymentTerms: application.finalApprovedTerms || application.approvedTerms || '30',
        downPaymentPercentage: application.finalDownPayment || 30,
        adminFee: parseFloat(application.adminFee || '0')
      });
      setIsEditingCredit(true);
    }
  };

  const handleSaveCreditData = () => {
    updateCreditDataMutation.mutate(editCreditData);
  };

  const handleCancelEdit = () => {
    setIsEditingCredit(false);
    setEditCreditData({
      paymentTerms: '',
      downPaymentPercentage: 30,
      adminFee: 0
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pre_analysis: { 
        variant: "secondary" as const, 
        icon: Clock, 
        label: "Pré-Análise" 
      },
      pre_approved: { 
        variant: "default" as const, 
        icon: CheckCircle, 
        label: "Pré-Aprovado" 
      },
      final_analysis: { 
        variant: "outline" as const, 
        icon: AlertTriangle, 
        label: "Análise Final" 
      },
      approved: { 
        variant: "default" as const, 
        icon: CheckCircle, 
        label: "Aprovado" 
      },
      rejected: { 
        variant: "destructive" as const, 
        icon: XCircle, 
        label: "Rejeitado" 
      },
      cancelled: { 
        variant: "secondary" as const, 
        icon: XCircle, 
        label: "Cancelado" 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pre_analysis;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const mandatoryDocuments = [
    { key: 'articles_of_incorporation', label: 'Contrato Social', subtitle: 'Articles of Association', required: true },
    { key: 'cnpj_certificate', label: 'Documentos dos Sócios (CPF e RG/CNH)', subtitle: 'Legal Representative ID Copy', required: true },
  ];

  const optionalDocuments = [
    { key: 'business_license', label: 'Licença de Funcionamento', subtitle: 'Business License', required: false },
    { key: 'quality_certificates', label: 'Certificado de Constituição', subtitle: 'Certificate of Incorporation', required: false },
    { key: 'financial_statements', label: 'Demonstrações Financeiras (últimos 3 anos)', subtitle: 'Financial Statements (Last 3 Years)', required: false },
    { key: 'bank_references', label: 'Carta de Referência Bancária', subtitle: 'Bank Reference Letter', required: false },
    { key: 'commercial_references', label: 'Relatório de Crédito da Empresa', subtitle: 'Credit Report', required: false },
    { key: 'tax_clearance', label: 'Certificado de Regularidade Fiscal', subtitle: 'Tax Registration Certificate', required: false },
    { key: 'import_licenses', label: 'Licença ou Registro de Importação', subtitle: 'Export and Import License', required: false },
    { key: 'tax_registration', label: 'Registro Alfandegário', subtitle: 'Customs Registration Certificate', required: false },
    { key: 'product_catalogs', label: 'Lista de Principais Clientes', subtitle: 'Main Customers List', required: false },
    { key: 'board_resolution', label: 'Contratos ou Pedidos de Compra Recentes', subtitle: 'Sales Contracts / Purchase Orders', required: false },
    { key: 'bank_statements', label: 'Modelo de Contrato com Clientes', subtitle: 'Supplier Contract Sample', required: false },
    { key: 'insurance_policies', label: 'Histórico de Sinistros (se houver)', subtitle: 'Insurance Claim Record (if any)', required: false },
  ];

  if (!match) {
    return <div>Página não encontrada</div>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.history.back()}
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
        <div className="flex items-center gap-2">
          {getStatusBadge(application.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Razão Social</Label>
                  <p className="text-gray-900">{application.legalCompanyName}</p>
                </div>
                {application.tradingName && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome Fantasia</Label>
                    <p className="text-gray-900">{application.tradingName}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">CNPJ</Label>
                  <p className="text-gray-900">{application.cnpj}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {application.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {application.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Endereço</Label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {application.address}, {application.city} - {application.state}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informações do Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Valor Solicitado</Label>
                  <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    {formatCurrency(application.requestedAmount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Volume Mensal de Importação</Label>
                  <p className="text-gray-900">{application.monthlyImportVolume}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Setor de Negócio</Label>
                  <p className="text-gray-900">{application.businessSector}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Receita Anual</Label>
                  <p className="text-gray-900">{application.annualRevenue}</p>
                </div>
              </div>

              {application.productsToImport && application.productsToImport.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-2 block">Produtos para Importar</Label>
                  <div className="flex flex-wrap gap-2">
                    {application.productsToImport.map((product: string, index: number) => (
                      <Badge key={index} variant="outline">{product}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {application.justification && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Justificativa</Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{application.justification}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication System */}
          <CreditCommunication application={application} />

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{Object.keys(application.requiredDocuments || {}).length} Enviados</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>{mandatoryDocuments.length - Object.keys(application.requiredDocuments || {}).length} Pendentes</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mandatory Documents */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Documentos Obrigatórios</h4>
                <div className="space-y-3">
                  {mandatoryDocuments.map((doc) => (
                    <DocumentUploadSection
                      key={doc.key}
                      documentInfo={doc}
                      applicationId={applicationId!}
                      isUploading={uploadingDocument === doc.key}
                      onUpload={(file) => handleDocumentUpload(doc.key, file)}
                      onRemove={handleDocumentRemove}
                      uploadedDocuments={application.requiredDocuments || {}}
                      onValidation={(result) => {
                        setValidationResults(prev => ({
                          ...prev,
                          [doc.key]: result
                        }));
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Optional Documents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Documentos Opcionais</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{Object.keys(application.optionalDocuments || {}).length} Enviados</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>{optionalDocuments.length - Object.keys(application.optionalDocuments || {}).length} Pendentes</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {optionalDocuments.map((doc) => (
                    <DocumentUploadSection
                      key={doc.key}
                      documentInfo={doc}
                      applicationId={applicationId!}
                      isUploading={uploadingDocument === doc.key}
                      onUpload={(file) => handleDocumentUpload(doc.key, file)}
                      onRemove={handleDocumentRemove}
                      uploadedDocuments={application.optionalDocuments || {}}
                      onValidation={(result) => {
                        setValidationResults(prev => ({
                          ...prev,
                          [doc.key]: result
                        }));
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline using CreditStatusTracker */}
          <CreditStatusTracker 
            currentStatus={application.status}
            preAnalysisStatus={application.preAnalysisStatus}
            financialStatus={application.financialStatus}
            adminStatus={application.adminStatus}
          />

          {/* Credit Limit Display for Approved Applications */}
          {application.financialStatus === 'approved' && application.creditLimit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Análise Financeira
                  </div>
                  {permissions.canPerformPreAnalysis && !isEditingCredit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={initializeEditMode}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  {isEditingCredit && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveCreditData}
                        disabled={updateCreditDataMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status Atual:</span>
                    <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4">
                  {/* Crédito Aprovado */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Crédito Aprovado</span>
                      <span className="text-xl font-bold text-green-600">
                        {(() => {
                          const finalLimit = application.adminStatus === 'admin_finalized' 
                            ? application.finalCreditLimit 
                            : application.creditLimit;
                          return finalLimit ? `US$ ${formatCompactNumber(Number(finalLimit))}` : 'US$ 0';
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Em Uso */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Em Uso</span>
                      <span className="text-xl font-bold text-blue-600">
                        {creditUsage ? `US$ ${formatCompactNumber(Number(creditUsage.used))}` : 'US$ 0'}
                      </span>
                    </div>
                  </div>

                  {/* Disponível */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">Disponível</span>
                      <span className="text-xl font-bold text-gray-600">
                        {creditUsage 
                          ? `US$ ${formatCompactNumber(Number(creditUsage.available))}`
                          : (() => {
                              const finalLimit = application.adminStatus === 'admin_finalized' 
                                ? application.finalCreditLimit 
                                : application.creditLimit;
                              return finalLimit ? `US$ ${formatCompactNumber(Number(finalLimit))}` : 'US$ 0';
                            })()
                        }
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Configuration Section */}
                  {isEditingCredit ? (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Configurações de Crédito</h4>

                      {/* Prazo de Pagamento */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Prazo de Pagamento (dias)</Label>
                        <Input
                          type="text"
                          value={editCreditData.paymentTerms}
                          onChange={(e) => setEditCreditData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                          placeholder="Ex: 30, 60, 90"
                          className="w-full"
                        />
                      </div>

                      {/* Percentual de Entrada */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Percentual de Entrada (%)</Label>
                        <Input
                          type="number"
                          value={editCreditData.downPaymentPercentage}
                          onChange={(e) => setEditCreditData(prev => ({ ...prev, downPaymentPercentage: parseFloat(e.target.value) || 0 }))}
                          min="0"
                          max="100"
                          className="w-full"
                        />
                      </div>

                      {/* Taxa Administrativa - Ocultar para Financeira */}
                      {!permissions.isFinanceira && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Taxa Administrativa (%)</Label>
                          <Input
                            type="number"
                            value={editCreditData.adminFee}
                            onChange={(e) => setEditCreditData(prev => ({ ...prev, adminFee: parseFloat(e.target.value) || 0 }))}
                            min="0"
                            step="0.1"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Prazo de Pagamento */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Prazo de Pagamento Aprovado</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {(() => {
                            // Para Financeira, mostrar apenas os termos que ela própria configurou
                            if (permissions.isFinanceira) {
                              return application.approvedTerms || '30';
                            }
                            // Para outros usuários, mostrar termos finais do Admin se existirem
                            if (application.finalApprovedTerms) {
                              return application.finalApprovedTerms;
                            }
                            // Senão, mostrar os termos da Financeira
                            return application.approvedTerms || '30';
                          })()} dias
                        </Badge>
                      </div>

                      {/* Percentual de Entrada */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Entrada Requerida</span>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          {(() => {
                            // Para Financeira, mostrar apenas o que ela configurou
                            if (permissions.isFinanceira) {
                              return (application.downPayment || 30);
                            }
                            // Para outros usuários, mostrar configuração final do Admin
                            return (application.finalDownPayment || 30);
                          })()}% do valor do pedido
                        </Badge>
                      </div>

                      {/* Taxa Administrativa - Ocultar para Financeira */}
                      {!permissions.isFinanceira && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Taxa Admin</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {application.adminFee || 0}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gestão Administrativa - Apenas para Admins e Financeira */}
          {(permissions.isAdmin || permissions.isFinanceira) && (
            <>
              <AdminAnalysisPanel application={application} />
              {permissions.isAdmin && application.financialStatus === 'approved' && (
                <AdminFinalizationPanel 
                  application={application} 
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/credit/applications', applicationId] });
                  }}
                />
              )}
            </>
          )}

          {!permissions.canPerformPreAnalysis && !permissions.canManageApplications && (
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Só permite edição se status for pending ou under_review */}
                {(application.status === 'pending' || application.status === 'under_review') && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = `/credit/edit/${application.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Editar Solicitação
                  </Button>
                )}

                {/* Após pré-aprovação, mostra status e instrução sobre documentos */}
                {(application.status === 'pre_approved' || application.status === 'approved') && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Solicitação aprovada em análise final</p>
                        <p className="text-amber-700 mt-1">
                          Você pode enviar documentos pendentes, mas não pode mais editar os dados da solicitação.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensagens da Administração */}
                {(application.requestedDocuments || application.adminObservations || application.financialNotes) && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 text-sm">Comunicações da Administração</h4>
                    
                    {application.requestedDocuments && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-yellow-800 text-sm mb-1">Documentos Solicitados</h5>
                            <p className="text-yellow-700 text-xs whitespace-pre-wrap">{application.requestedDocuments}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {application.adminObservations && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-blue-800 text-sm mb-1">Observações e Esclarecimentos</h5>
                            <p className="text-blue-700 text-xs whitespace-pre-wrap">{application.adminObservations}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {application.financialNotes && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Building className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-green-800 text-sm mb-1">Observações Financeiras</h5>
                            <p className="text-green-700 text-xs whitespace-pre-wrap">{application.financialNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Document Upload Section using Robust Component
function DocumentUploadSection({ 
  documentInfo, 
  applicationId, 
  isUploading, 
  onUpload, 
  onRemove,
  uploadedDocuments
}: {
  documentInfo: { key: string; label: string; subtitle?: string; required: boolean };
  applicationId: number;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: (documentId: string) => void;
  uploadedDocuments: Record<string, any>;
}) {
  return (
    <RobustDocumentUpload
      documentKey={documentInfo.key}
      documentLabel={documentInfo.label}
      documentSubtitle={documentInfo.subtitle}
      isRequired={documentInfo.required}
      uploadedDocuments={uploadedDocuments}
      applicationId={applicationId}
      isUploading={isUploading}
      onUpload={onUpload}
      onRemove={onRemove}
    />
  );
}