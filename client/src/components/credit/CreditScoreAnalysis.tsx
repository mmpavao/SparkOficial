import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Shield,
  Briefcase,
  Calculator
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCNPJ } from "@/lib/formatters";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import type { CreditApplication, CreditScore } from "@shared/schema";

interface CreditScoreAnalysisProps {
  application: CreditApplication;
}

export default function CreditScoreAnalysis({ application }: CreditScoreAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const { toast } = useToast();
  const permissions = useUserPermissions();

  // Fetch existing credit score on component mount (for all users)
  useEffect(() => {
    const fetchExistingScore = async () => {
      try {
        const response = await apiRequest(`/api/credit/applications/${application.id}/credit-score`, 'GET');
        if (response) {
          setCreditScore(response);
        }
      } catch (error) {
        // No existing score, that's ok
        console.log('No existing credit score found');
      }
    };
    
    // All users can see existing scores, but only admins can create new ones
    fetchExistingScore();
  }, [application.id]);

  const handleConsultar = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/credit/applications/${application.id}/credit-score`, 'POST');
      setCreditScore(response);
      toast({
        title: "Análise concluída",
        description: "Credit Score calculado com sucesso",
      });
      
      // Invalidate credit applications cache to refresh the list and details
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credit-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credit/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financeira/credit-applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${application.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/credit-applications/${application.id}`] });
      
      // Force refetch all credit applications to show score immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/admin/credit-applications'] });
        queryClient.refetchQueries({ queryKey: ['/api/credit/applications'] });
      }, 500);
    } catch (error: any) {
      console.error('Credit Score API error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Não foi possível consultar o Credit Score";
      const errorDetails = error.response?.data?.details || "";
      
      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-green-600 bg-green-100";
    if (score >= 600) return "text-blue-600 bg-blue-100";
    if (score >= 400) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 800) return "from-green-400 to-blue-600";
    if (score >= 600) return "from-blue-400 to-blue-600";
    if (score >= 400) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-orange-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 800) return "Excelente";
    if (score >= 600) return "Bom";
    if (score >= 400) return "Regular";
    return "Baixo";
  };

  return (
    <div className="space-y-4">
      {/* Initial Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Análise Credit Score</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1 break-all">
            CNPJ: {formatCNPJ(application.cnpj)}
          </p>
        </CardHeader>
        <CardContent>
          {!creditScore ? (
            permissions.isAdmin ? (
              <Button 
                onClick={handleConsultar}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Consultar Credit Score
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  Análise de crédito disponível apenas para administradores
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm text-gray-600">
                Última consulta: {new Date(creditScore.scoreDate).toLocaleDateString('pt-BR')}
              </span>
              {permissions.isAdmin && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleConsultar}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Atualizar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Loading State */}
      {isLoading && !creditScore && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      )}
      {/* Credit Score Results */}
      {creditScore && (
        <>
          {/* Score Card */}
          <Card className="overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${getScoreGradient(creditScore.creditScore)}`} />
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg font-semibold">Credit Score</h3>
                  <Badge className={`${getScoreColor(creditScore.creditScore)}`}>
                    {getScoreLabel(creditScore.creditScore)}
                  </Badge>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>0</span>
                    <span>250</span>
                    <span>500</span>
                    <span>750</span>
                    <span>1000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getScoreGradient(creditScore.creditScore)} flex items-center justify-end pr-2 transition-all duration-1000`}
                      style={{ width: `${(creditScore.creditScore / 1000) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">{creditScore.creditScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 flex-shrink-0" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Razão Social</p>
                  <p className="font-medium text-sm break-words">{creditScore.legalName || application.legalCompanyName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Nome Fantasia</p>
                  <p className="font-medium text-sm break-words">{creditScore.tradingName || application.tradingName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 text-[#3ba76b] bg-[#effbf7]">
                    {creditScore.status || 'ATIVA'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Capital Social</p>
                  <p className="font-medium text-sm">
                    {creditScore.shareCapital || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Data de Abertura</p>
                  <p className="font-medium text-sm">
                    {creditScore.openingDate ? 
                      new Date(creditScore.openingDate).toLocaleDateString('pt-BR') : 
                      '-'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact and Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                <p className="text-sm break-words">{creditScore.address || application.address}</p>
                <p className="text-sm">
                  {creditScore.city || application.city}, {creditScore.state || application.state}
                </p>
                <p className="text-sm">CEP: {creditScore.zipCode || application.zipCode}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="w-4 h-4 flex-shrink-0" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm break-all">{creditScore.phone || application.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm break-all">{creditScore.email || application.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Economic Activities */}
          {(creditScore.mainActivity || creditScore.secondaryActivities) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 flex-shrink-0" />
                  Atividades Econômicas (CNAE)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {creditScore.mainActivity && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Atividade Principal</p>
                      <p className="text-sm break-words">
                        {(creditScore.mainActivity as any).code} - {(creditScore.mainActivity as any).description}
                      </p>
                    </div>
                  )}
                  {creditScore.secondaryActivities && (creditScore.secondaryActivities as any[]).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Atividades Secundárias</p>
                      <div className="space-y-2">
                        {(creditScore.secondaryActivities as any[]).map((activity, index) => (
                          <p key={index} className="text-sm break-words">
                            {activity.code} - {activity.description}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Partners */}
          {creditScore.partners && (creditScore.partners as any[]).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 flex-shrink-0" />
                  Sócios
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {(creditScore.partners as any[]).map((partner, index) => (
                    <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                      <p className="font-medium text-sm break-words">{partner.name}</p>
                      <p className="text-sm text-gray-600 break-words">{partner.qualification}</p>
                      {partner.joinDate && (
                        <p className="text-xs text-gray-500">
                          Entrada: {new Date(partner.joinDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 flex-shrink-0" />
                Análise de Risco Creditício
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Dados obtidos via Score QUOD + Cadastro PJ Plus - Órgãos oficiais brasileiros
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                {/* Score Summary */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900">Resumo da Análise</span>
                    <Badge className={`${getScoreColor(creditScore.creditScore)}`}>
                      Score: {creditScore.creditScore}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-700">
                    {creditScore.creditScore >= 600 
                      ? "Empresa apresenta baixo risco creditício com perfil adequado para operações comerciais."
                      : "Empresa apresenta risco moderado. Análise detalhada recomendada antes da aprovação."
                    }
                  </p>
                </div>
                
                {/* Restrições Creditícias */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Restrições Creditícias
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Débitos</span>
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        creditScore.hasDebts 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {creditScore.hasDebts ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Possui
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Não possui
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Protestos</span>
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        creditScore.hasProtests 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {creditScore.hasProtests ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Possui
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Não possui
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Falência</span>
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        creditScore.hasBankruptcy 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {creditScore.hasBankruptcy ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Possui
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Não possui
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Processos Judiciais</span>
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        creditScore.hasLawsuits 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {creditScore.hasLawsuits ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Possui
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Não possui
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>






              </div>
            </CardContent>
          </Card>

          {/* Detailed Credit Information (DirectD) */}
          {(creditScore.protestosDetalhes?.length > 0 || 
            creditScore.acoesJudiciaisDetalhes?.length > 0 || 
            creditScore.chequesSemdFundo?.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  Detalhes de Restrições
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {/* Protests Details */}
                  {creditScore.protestosDetalhes?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2">Protestos</h4>
                      <div className="space-y-2">
                        {creditScore.protestosDetalhes.map((protesto, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm">
                              <p><strong>Cartório:</strong> {protesto.cartorio}</p>
                              <p><strong>Valor:</strong> R$ {protesto.valorTotal?.toLocaleString('pt-BR')}</p>
                              <p><strong>Cidade:</strong> {protesto.cidade}</p>
                              {protesto.quantidade && <p><strong>Quantidade:</strong> {protesto.quantidade}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lawsuits Details */}
                  {creditScore.acoesJudiciaisDetalhes?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2">Ações Judiciais</h4>
                      <div className="space-y-2">
                        {creditScore.acoesJudiciaisDetalhes.map((acao, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm">
                              <p><strong>Processo:</strong> {acao.numeroProcesso}</p>
                              <p><strong>Valor:</strong> R$ {acao.valor?.toLocaleString('pt-BR')}</p>
                              <p><strong>Autor:</strong> {acao.autor}</p>
                              <p><strong>Status:</strong> {acao.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bounced Checks */}
                  {creditScore.chequesSemdFundo?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2">Cheques sem Fundo</h4>
                      <div className="space-y-2">
                        {creditScore.chequesSemdFundo.map((cheque, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm">
                              <p><strong>Banco:</strong> {cheque.banco}</p>
                              <p><strong>Agência:</strong> {cheque.agencia}</p>
                              <p><strong>Quantidade:</strong> {cheque.quantidade}</p>
                              {cheque.valor && <p><strong>Valor Total:</strong> R$ {cheque.valor.toLocaleString('pt-BR')}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous Queries Information */}
          {creditScore.consultasAnteriores && Object.keys(creditScore.consultasAnteriores).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  Consultas Anteriores
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {creditScore.consultasAnteriores.ultimos30Dias !== undefined && (
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Últimos 30 dias</span>
                      <span className="text-sm font-bold">{creditScore.consultasAnteriores.ultimos30Dias}</span>
                    </div>
                  )}
                  {creditScore.consultasAnteriores.ultimos60Dias !== undefined && (
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Últimos 60 dias</span>
                      <span className="text-sm font-bold">{creditScore.consultasAnteriores.ultimos60Dias}</span>
                    </div>
                  )}
                  {creditScore.consultasAnteriores.ultimos90Dias !== undefined && (
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Últimos 90 dias</span>
                      <span className="text-sm font-bold">{creditScore.consultasAnteriores.ultimos90Dias}</span>
                    </div>
                  )}
                  {creditScore.consultasAnteriores.segmento && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-900">Segmento de Interesse: </span>
                      <span className="text-sm text-blue-700">{creditScore.consultasAnteriores.segmento}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}