import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { SmartDocumentUpload } from "@/components/SmartDocumentUpload";
import { ValidationResult } from "@/lib/documentValidation";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar, 
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Edit,
  Save,
  Eye,
  TrendingUp,
  Users,
  Briefcase
} from "lucide-react";

interface AdminCreditAnalysisData {
  id: number;
  userId: number;
  legalCompanyName?: string;
  companyAddress?: string;
  requestedAmount?: number;
  purpose?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  companyInfo?: any;
  commercialInfo?: any;
  creditInfo?: any;
  documents?: any;
  adminNotes?: string;
  documentsValidation?: Record<string, ValidationResult>;
  preAnalysisStatus?: 'pending' | 'pre_approved' | 'needs_documents' | 'needs_clarification' | 'rejected';
  adminRecommendation?: string;
  riskAssessment?: 'low' | 'medium' | 'high';
}

export default function AdminCreditAnalysisPage() {
  const [match, params] = useRoute('/admin/credit-analysis/:id');
  const applicationId = params?.id ? parseInt(params.id) : null;
  const [editMode, setEditMode] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [preAnalysisStatus, setPreAnalysisStatus] = useState<string>("");
  const [adminRecommendation, setAdminRecommendation] = useState("");
  const [riskAssessment, setRiskAssessment] = useState<string>("");
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Check if user is admin
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";

  // Fetch credit application details with admin data
  const { data: application, isLoading } = useQuery({
    queryKey: ["/api/admin/credit-applications", applicationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/credit-applications/${applicationId}`);
      return response.json();
    },
    enabled: !!applicationId && isAdmin,
  }) as { data: AdminCreditAnalysisData, isLoading: boolean };

  // Initialize admin fields when data loads
  useEffect(() => {
    if (application) {
      setAdminNotes(application.adminNotes || "");
      setPreAnalysisStatus(application.preAnalysisStatus || "pending");
      setAdminRecommendation(application.adminRecommendation || "");
      setRiskAssessment(application.riskAssessment || "medium");
    }
  }, [application]);

  // Save admin analysis
  const saveAnalysisMutation = useMutation({
    mutationFn: async (analysisData: {
      adminNotes: string;
      preAnalysisStatus: string;
      adminRecommendation: string;
      riskAssessment: string;
    }) => {
      return await apiRequest("PUT", `/api/admin/credit-applications/${applicationId}/analysis`, analysisData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications", applicationId] });
      setEditMode(false);
      toast({
        title: "Análise Salva",
        description: "Pré-análise administrativa salva com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar análise",
        variant: "destructive",
      });
    },
  });

  // Submit to financial institution
  const submitToFinancialMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/credit-applications/${applicationId}/submit-financial`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications", applicationId] });
      toast({
        title: "Enviado à Financeira",
        description: "Solicitação enviada para análise final da financeira",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao enviar para financeira",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Solicitação não encontrada</h2>
            <Link href="/admin">
              <Button variant="outline">Voltar para Admin</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      pre_approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      needs_documents: { color: "bg-blue-100 text-blue-800", icon: FileText },
      needs_clarification: { color: "bg-orange-100 text-orange-800", icon: MessageSquare },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'pending' && 'Pendente'}
        {status === 'pre_approved' && 'Pré-Aprovado'}
        {status === 'needs_documents' && 'Precisa Documentos'}
        {status === 'needs_clarification' && 'Precisa Esclarecimentos'}
        {status === 'rejected' && 'Rejeitado'}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const riskConfig = {
      low: { color: "bg-green-100 text-green-800", label: "Baixo Risco" },
      medium: { color: "bg-yellow-100 text-yellow-800", label: "Médio Risco" },
      high: { color: "bg-red-100 text-red-800", label: "Alto Risco" },
    };
    
    const config = riskConfig[risk as keyof typeof riskConfig] || riskConfig.medium;
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleSaveAnalysis = () => {
    saveAnalysisMutation.mutate({
      adminNotes,
      preAnalysisStatus,
      adminRecommendation,
      riskAssessment,
    });
  };

  // Calculate completion percentage
  const calculateCompletionScore = () => {
    const documents = application.documents || {};
    const totalDocuments = 18; // Total expected documents
    const uploadedDocuments = Object.keys(documents).length;
    const documentScore = (uploadedDocuments / totalDocuments) * 40;
    
    const dataCompleteness = [
      application.legalCompanyName,
      application.companyAddress,
      application.requestedAmount,
      application.purpose,
      application.companyInfo?.businessSector,
      application.commercialInfo?.yearsInBusiness,
    ].filter(Boolean).length / 6 * 30;
    
    const validationScore = Object.values(validationResults).length > 0 
      ? Object.values(validationResults).reduce((acc, r) => acc + r.score, 0) / Object.values(validationResults).length / 100 * 30
      : 0;
    
    return Math.round(documentScore + dataCompleteness + validationScore);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pré-Análise: {application.legalCompanyName}
            </h1>
            <p className="text-gray-600">
              Análise administrativa completa da solicitação de crédito
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(preAnalysisStatus)}
          {getRiskBadge(riskAssessment)}
        </div>
      </div>

      {/* Analysis Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TrendingUp className="w-5 h-5" />
            Resumo da Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {calculateCompletionScore()}%
              </div>
              <div className="text-sm text-gray-600">Completude</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(application.documents || {}).length}
              </div>
              <div className="text-sm text-gray-600">Documentos</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(application.requestedAmount || 0).replace('R$', 'US$')}
              </div>
              <div className="text-sm text-gray-600">Valor Solicitado</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {application.commercialInfo?.yearsInBusiness || 0}
              </div>
              <div className="text-sm text-gray-600">Anos de Atividade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="application" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="application">Dados da Aplicação</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="analysis">Pré-Análise</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        {/* Application Data Tab */}
        <TabsContent value="application" className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Razão Social</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {application.legalCompanyName}
                  </div>
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {application.companyInfo?.cnpj}
                  </div>
                </div>
                <div>
                  <Label>Setor Empresarial</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {application.companyInfo?.businessSector}
                  </div>
                </div>
                <div>
                  <Label>Anos de Atividade</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {application.commercialInfo?.yearsInBusiness} anos
                  </div>
                </div>
              </div>
              <div>
                <Label>Endereço Completo</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {application.companyAddress}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Valor Solicitado</Label>
                  <div className="p-2 bg-gray-50 rounded border text-lg font-semibold">
                    {formatCurrency(application.requestedAmount || 0).replace('R$', 'US$')}
                  </div>
                </div>
                <div>
                  <Label>Prazo Desejado</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {application.creditInfo?.desiredTerm} meses
                  </div>
                </div>
              </div>
              <div>
                <Label>Finalidade do Crédito</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {application.purpose}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(application.documents || {}).map(([key, value]) => (
                  <div key={key} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{key.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Enviado</p>
                      </div>
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        OK
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Pré-Análise Administrativa
                </div>
                <Button
                  variant={editMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {editMode ? 'Salvar' : 'Editar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Status da Pré-Análise</Label>
                  {editMode ? (
                    <Select value={preAnalysisStatus} onValueChange={setPreAnalysisStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="pre_approved">Pré-Aprovado</SelectItem>
                        <SelectItem value="needs_documents">Precisa Documentos</SelectItem>
                        <SelectItem value="needs_clarification">Precisa Esclarecimentos</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2">
                      {getStatusBadge(preAnalysisStatus)}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Avaliação de Risco</Label>
                  {editMode ? (
                    <Select value={riskAssessment} onValueChange={setRiskAssessment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo Risco</SelectItem>
                        <SelectItem value="medium">Médio Risco</SelectItem>
                        <SelectItem value="high">Alto Risco</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2">
                      {getRiskBadge(riskAssessment)}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label>Recomendação do Analista</Label>
                {editMode ? (
                  <Textarea
                    value={adminRecommendation}
                    onChange={(e) => setAdminRecommendation(e.target.value)}
                    placeholder="Digite sua recomendação para a financeira..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border min-h-[100px]">
                    {adminRecommendation || "Nenhuma recomendação fornecida"}
                  </div>
                )}
              </div>

              <div>
                <Label>Observações Administrativas</Label>
                {editMode ? (
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Digite observações internas sobre a análise..."
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border min-h-[120px]">
                    {adminNotes || "Nenhuma observação registrada"}
                  </div>
                )}
              </div>

              {editMode && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveAnalysis} disabled={saveAnalysisMutation.isPending}>
                    {saveAnalysisMutation.isPending ? "Salvando..." : "Salvar Análise"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Ações Administrativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => submitToFinancialMutation.mutate()}
                  disabled={preAnalysisStatus !== 'pre_approved' || submitToFinancialMutation.isPending}
                  className="h-16 flex-col gap-2"
                >
                  <CheckCircle className="w-6 h-6" />
                  {submitToFinancialMutation.isPending ? "Enviando..." : "Enviar à Financeira"}
                </Button>
                
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Solicitar Esclarecimentos
                </Button>
                
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  Solicitar Documentos
                </Button>
                
                <Button variant="destructive" className="h-16 flex-col gap-2">
                  <XCircle className="w-6 h-6" />
                  Rejeitar Aplicação
                </Button>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Próximos Passos</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Complete a pré-análise preenchendo todos os campos</li>
                  <li>• Revise todos os documentos enviados</li>
                  <li>• Defina o status apropriado (pré-aprovado, pendente, etc.)</li>
                  <li>• Envie para a financeira se pré-aprovado</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}