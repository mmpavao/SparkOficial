import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { CreditApplication } from "@shared/schema";

export default function AdminCreditAnalysisPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preAnalysisStatus, setPreAnalysisStatus] = useState<string>("");
  const [riskAssessment, setRiskAssessment] = useState<string>("");
  const [adminRecommendation, setAdminRecommendation] = useState<string>("");

  // Check if user is admin
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";

  // Fetch credit application details
  const { data: application, isLoading } = useQuery({
    queryKey: [`/api/credit/applications/${id}`],
    enabled: !!id && isAdmin,
  }) as { data: CreditApplication | undefined; isLoading: boolean };

  // Update pre-analysis mutation
  const updatePreAnalysisMutation = useMutation({
    mutationFn: async (data: { preAnalysisStatus: string; riskAssessment: string; adminRecommendation: string }) => {
      return await apiRequest(`/api/admin/credit-applications/${id}/pre-analysis`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      toast({
        title: "Sucesso",
        description: "Pré-análise atualizada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pré-análise",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Solicitação não encontrada</h2>
            <p className="text-gray-600">A solicitação de crédito não foi encontrada.</p>
            <Button
              variant="outline"
              onClick={() => setLocation("/admin")}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse documents and review data
  let requiredDocs = {};
  let optionalDocs = {};
  let reviewData = {};

  try {
    if (application.requiredDocuments) {
      if (typeof application.requiredDocuments === 'string') {
        requiredDocs = JSON.parse(application.requiredDocuments);
      } else {
        requiredDocs = application.requiredDocuments;
      }
    }
  } catch (e) {
    // Handle invalid JSON
  }

  try {
    if (application.optionalDocuments) {
      if (typeof application.optionalDocuments === 'string') {
        optionalDocs = JSON.parse(application.optionalDocuments);
      } else {
        optionalDocs = application.optionalDocuments;
      }
    }
  } catch (e) {
    // Handle invalid JSON
  }

  try {
    if (application.reviewNotes) {
      if (typeof application.reviewNotes === 'string') {
        reviewData = JSON.parse(application.reviewNotes);
      } else {
        reviewData = application.reviewNotes;
      }
    }
  } catch (e) {
    // Handle invalid JSON
  }

  const totalDocs = Object.keys(requiredDocs).length + Object.keys(optionalDocs).length;
  const completionScore = Math.round((totalDocs / 18) * 100);

  const handleSubmitPreAnalysis = () => {
    if (!preAnalysisStatus || !riskAssessment || !adminRecommendation.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de submeter a análise",
        variant: "destructive",
      });
      return;
    }

    updatePreAnalysisMutation.mutate({
      preAnalysisStatus,
      riskAssessment,
      adminRecommendation,
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Admin
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Análise de Crédito - {application.legalCompanyName}</h1>
          <p className="text-gray-600">Pré-análise administrativa completa</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="analysis">Pré-Análise</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Valor Solicitado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(Number(application.requestedAmount), application.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Completude de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {completionScore}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${completionScore}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Status Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  application.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {application.status === 'pending' && 'Pendente'}
                  {application.status === 'under_review' && 'Em Análise'}
                  {application.status === 'approved' && 'Aprovado'}
                  {application.status === 'rejected' && 'Rejeitado'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Company Data Tab */}
        <TabsContent value="company" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Razão Social</Label>
                  <p className="mt-1">{application.legalCompanyName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nome Fantasia</Label>
                  <p className="mt-1">{application.tradingName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">CNPJ</Label>
                  <p className="mt-1">{application.cnpj}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Setor de Atuação</Label>
                  <p className="mt-1">{application.businessSector}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Comerciais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Faturamento Anual</Label>
                  <p className="mt-1">{application.annualRevenue}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Volume de Importação Mensal</Label>
                  <p className="mt-1">{application.monthlyImportVolume}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Principais Produtos Importados</Label>
                  <p className="mt-1">{application.mainImportedProducts}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Principais Mercados de Origem</Label>
                  <p className="mt-1">{application.mainOriginMarkets}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Documentos Obrigatórios ({Object.keys(requiredDocs).length}/10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(requiredDocs).map(([key, doc]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        <p className="text-sm text-gray-600">{doc.filename}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Enviado</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documentos Opcionais ({Object.keys(optionalDocs).length}/8)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(optionalDocs).map(([key, doc]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        <p className="text-sm text-gray-600">{doc.filename}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pre-Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Pré-Análise Administrativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="preAnalysisStatus" className="text-sm font-medium">
                    Status da Pré-Análise
                  </Label>
                  <Select value={preAnalysisStatus} onValueChange={setPreAnalysisStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_approved">Pré-Aprovado</SelectItem>
                      <SelectItem value="needs_documents">Precisa de Documentos</SelectItem>
                      <SelectItem value="needs_clarification">Precisa de Esclarecimentos</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="riskAssessment" className="text-sm font-medium">
                    Avaliação de Risco
                  </Label>
                  <Select value={riskAssessment} onValueChange={setRiskAssessment}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione o nível de risco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="adminRecommendation" className="text-sm font-medium">
                  Recomendação Administrativa
                </Label>
                <Textarea
                  id="adminRecommendation"
                  value={adminRecommendation}
                  onChange={(e) => setAdminRecommendation(e.target.value)}
                  placeholder="Digite sua análise e recomendação detalhada..."
                  className="mt-2 min-h-[120px]"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSubmitPreAnalysis}
                  disabled={updatePreAnalysisMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updatePreAnalysisMutation.isPending ? "Salvando..." : "Salvar Pré-Análise"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setLocation("/admin")}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Analysis Display */}
          {(reviewData as any)?.preAnalysisStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Análise Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className="mt-1">
                      {(reviewData as any).preAnalysisStatus}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Risco</Label>
                    <Badge className="mt-1">
                      {(reviewData as any).riskAssessment}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Analisado em</Label>
                    <p className="text-sm mt-1">
                      {formatDate((reviewData as any).analyzedAt)}
                    </p>
                  </div>
                </div>
                
                {(reviewData as any).adminRecommendation && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Recomendação</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {(reviewData as any).adminRecommendation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}