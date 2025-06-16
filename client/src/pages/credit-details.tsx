import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import AdminAnalysisPanel from "@/components/AdminAnalysisPanel";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { SmartDocumentUpload } from "@/components/SmartDocumentUpload";
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
  AlertTriangle
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
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications", applicationId] });
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

  const handleDocumentUpload = (documentType: string, file: File) => {
    setUploadingDocument(documentType);
    uploadDocumentMutation.mutate({ documentType, file });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        variant: "secondary" as const, 
        icon: Clock, 
        label: "Pendente" 
      },
      pre_approved: { 
        variant: "default" as const, 
        icon: CheckCircle, 
        label: "Pré-análise" 
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
      under_review: { 
        variant: "outline" as const, 
        icon: AlertTriangle, 
        label: "Em Análise" 
      },
      cancelled: { 
        variant: "secondary" as const, 
        icon: XCircle, 
        label: "Cancelado" 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const mandatoryDocuments = [
    { key: 'business_license', label: 'Licença Comercial', required: true },
    { key: 'cnpj_certificate', label: 'Certificado CNPJ', required: true },
    { key: 'financial_statements', label: 'Demonstrações Financeiras', required: true },
    { key: 'bank_statements', label: 'Extratos Bancários (6 meses)', required: true },
    { key: 'articles_of_incorporation', label: 'Contrato Social', required: true },
    { key: 'board_resolution', label: 'Ata de Assembleia', required: true },
    { key: 'tax_registration', label: 'Inscrição Municipal/Estadual', required: true },
    { key: 'social_security_clearance', label: 'Certidão INSS', required: true },
    { key: 'labor_clearance', label: 'Certidão FGTS', required: true },
    { key: 'income_tax_return', label: 'Declaração Imposto de Renda', required: true },
  ];

  const optionalDocuments = [
    { key: 'tax_clearance', label: 'Certidão Tributária', required: false },
    { key: 'commercial_references', label: 'Referências Comerciais', required: false },
    { key: 'import_licenses', label: 'Licenças de Importação', required: false },
    { key: 'product_catalogs', label: 'Catálogos de Produtos', required: false },
    { key: 'quality_certificates', label: 'Certificados de Qualidade', required: false },
    { key: 'insurance_policies', label: 'Apólices de Seguro', required: false },
    { key: 'bank_references', label: 'Referências Bancárias', required: false },
    { key: 'additional_documents', label: 'Documentos Adicionais', required: false },
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

          {/* Administrative Communications */}
          {(application.requestedDocuments || application.adminObservations || application.analysisNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Comunicações da Administração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.requestedDocuments && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-2">Documentos Solicitados</h4>
                        <p className="text-yellow-700 text-sm whitespace-pre-wrap">{application.requestedDocuments}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {application.adminObservations && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">Observações e Esclarecimentos</h4>
                        <p className="text-blue-700 text-sm whitespace-pre-wrap">{application.adminObservations}</p>
                      </div>
                    </div>
                  </div>
                )}

                {application.analysisNotes && permissions.canManageApplications && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Notas da Análise (Admin)</h4>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{application.analysisNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos
              </CardTitle>
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
                      uploadedDocuments={application.documents || {}}
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
                <h4 className="font-medium text-gray-900 mb-3">Documentos Opcionais</h4>
                <div className="space-y-3">
                  {optionalDocuments.map((doc) => (
                    <DocumentUploadSection
                      key={doc.key}
                      documentInfo={doc}
                      applicationId={applicationId!}
                      isUploading={uploadingDocument === doc.key}
                      onUpload={(file) => handleDocumentUpload(doc.key, file)}
                      uploadedDocuments={application.documents || {}}
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
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Solicitação Criada</p>
                  <p className="text-xs text-gray-500">
                    {new Date(application.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {application.status === 'under_review' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Em Análise</p>
                    <p className="text-xs text-gray-500">Aguardando revisão</p>
                  </div>
                </div>
              )}
              
              {application.status === 'pre_approved' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Pré-análise Completa</p>
                    <p className="text-xs text-gray-500">Aprovado para análise financeira</p>
                  </div>
                </div>
              )}

              {application.status === 'approved' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Aprovado</p>
                    <p className="text-xs text-gray-500">Crédito liberado</p>
                  </div>
                </div>
              )}
              
              {application.status === 'rejected' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Rejeitado</p>
                    <p className="text-xs text-gray-500">Solicitação negada</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Adaptáveis baseadas no tipo de usuário */}
          {(permissions.canManageApplications || permissions.isFinanceira) ? (
            <AdminAnalysisPanel application={application} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/credit/edit/${application.id}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Editar Solicitação
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Imprimir Detalhes
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Smart Document Upload Component Integration
function DocumentUploadSection({ 
  documentInfo, 
  applicationId, 
  isUploading, 
  onUpload, 
  uploadedDocuments,
  onValidation
}: {
  documentInfo: { key: string; label: string; required: boolean };
  applicationId: number;
  isUploading: boolean;
  onUpload: (file: File) => void;
  uploadedDocuments: Record<string, any>;
  onValidation?: (result: ValidationResult) => void;
}) {
  const isUploaded = uploadedDocuments[documentInfo.key];

  return (
    <SmartDocumentUpload
      documentKey={documentInfo.key}
      documentLabel={documentInfo.label}
      isRequired={documentInfo.required}
      isUploaded={isUploaded}
      isUploading={isUploading}
      onUpload={onUpload}
      onValidation={onValidation}
    />
  );
}