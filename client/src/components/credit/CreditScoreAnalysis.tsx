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
  Scale,
  CreditCard,
  Building,
  RefreshCw,
  TrendingUp,
  Shield,
  Briefcase
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
                  <Badge className={creditScore.status === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
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
                Análise de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Débitos</span>
                  <div className="text-right">
                    {creditScore.hasDebts ? (
                      <Badge className="bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Possui
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Não possui
                      </Badge>
                    )}
                    {creditScore.bouncedChecks && creditScore.bouncedChecks.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        {creditScore.bouncedChecks.length} cheque(s) sem fundo
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Protestos</span>
                  <div className="text-right">
                    {creditScore.hasProtests ? (
                      <Badge className="bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Possui
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Não possui
                      </Badge>
                    )}
                    {creditScore.protestDetails && creditScore.protestDetails.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        {creditScore.protestDetails.length} protesto(s) encontrado(s)
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Falência</span>
                  <div className="text-right">
                    {creditScore.hasBankruptcy ? (
                      <Badge className="bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Possui
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Não possui
                      </Badge>
                    )}
                    {creditScore.bankruptcyRecovery && creditScore.bankruptcyRecovery.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        {creditScore.bankruptcyRecovery.length} processo(s) de recuperação/falência
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Processos Judiciais</span>
                  <div className="text-right">
                    {creditScore.hasLawsuits ? (
                      <Badge className="bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Possui
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Não possui
                      </Badge>
                    )}
                    {creditScore.judicialActions && creditScore.judicialActions.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        {creditScore.judicialActions.length} ação(ões) judicial(is)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QUOD Credit Score Analysis */}
          {(creditScore.quodScore || creditScore.quodBusinessIndicators) && (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 flex-shrink-0 text-blue-600" />
                  <span className="text-blue-800">Análise QUOD Score</span>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">Fonte Autêntica</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {creditScore.quodScore && (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Score QUOD</span>
                        <Badge className={getScoreColor(creditScore.quodScore)}>
                          {creditScore.quodScore}
                        </Badge>
                      </div>
                      {creditScore.quodScoreRange && (
                        <p className="text-sm text-gray-600">Faixa: {creditScore.quodScoreRange}</p>
                      )}
                    </div>
                  )}
                  
                  {creditScore.quodPaymentCapacity && (
                    <div className="p-4 bg-white rounded-lg border">
                      <span className="text-sm font-medium text-gray-700">Capacidade de Pagamento</span>
                      <p className="text-sm text-gray-600 mt-1">{creditScore.quodPaymentCapacity}</p>
                    </div>
                  )}
                  
                  {creditScore.quodProfile && (
                    <div className="p-4 bg-white rounded-lg border">
                      <span className="text-sm font-medium text-gray-700">Perfil de Crédito</span>
                      <p className="text-sm text-gray-600 mt-1">{creditScore.quodProfile}</p>
                    </div>
                  )}
                  
                  {creditScore.quodMotives && (creditScore.quodMotives as string[]).length > 0 && (
                    <div className="p-4 bg-white rounded-lg border">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Motivos do Score</span>
                      <div className="space-y-1">
                        {(creditScore.quodMotives as string[]).map((motivo, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{motivo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {creditScore.quodBusinessIndicators && (creditScore.quodBusinessIndicators as any[]).length > 0 && (
                    <div className="p-4 bg-white rounded-lg border">
                      <span className="text-sm font-medium text-gray-700 mb-3 block">Indicadores de Negócio</span>
                      <div className="space-y-3">
                        {(creditScore.quodBusinessIndicators as any[]).map((indicator, index) => (
                          <div key={index} className="border-l-4 border-gray-200 pl-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800">{indicator.indicador}</span>
                              <Badge className={
                                indicator.risco === 'BAIXO' ? 'bg-green-100 text-green-700' :
                                indicator.risco === 'MÉDIO' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }>
                                {indicator.risco}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">Status: {indicator.status}</p>
                            {indicator.observacao && (
                              <p className="text-xs text-gray-500 mt-1">{indicator.observacao}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {creditScore.quodConsultDate && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-500">
                        Consulta QUOD realizada em: {new Date(creditScore.quodConsultDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Detailed Negative Information */}
          {(creditScore.protestDetails || creditScore.judicialActions || creditScore.bankruptcyRecovery || creditScore.bouncedChecks) && (
            <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <span className="text-red-800">Detalhamento de Pendências</span>
                  <Badge className="bg-red-100 text-red-700 text-xs">Dados Detalhados</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  
                  {/* Protestos Detalhados */}
                  {creditScore.protestDetails && creditScore.protestDetails.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Protestos Encontrados ({creditScore.protestDetails.length})</span>
                      </div>
                      {creditScore.protestDetails.map((protesto: any, index: number) => (
                        <div key={index} className="border-b last:border-0 pb-3 last:pb-0 mb-3 last:mb-0">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-700">Situação:</span>
                              <Badge className="bg-orange-100 text-orange-700 text-xs">
                                {protesto.situacao || 'Pendente'}
                              </Badge>
                            </div>
                            {protesto.valorTotal && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Valor Total:</span>
                                <span className="text-sm font-medium">R$ {protesto.valorTotal.toLocaleString('pt-BR')}</span>
                              </div>
                            )}
                            {protesto.cartorios && protesto.cartorios.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-700">Cartórios:</span>
                                {protesto.cartorios.map((cartorio: any, cIndex: number) => (
                                  <div key={cIndex} className="ml-2 mt-1 p-2 bg-gray-50 rounded text-xs">
                                    <p className="font-medium">{cartorio.nome}</p>
                                    <p>{cartorio.endereco} - {cartorio.cidade}</p>
                                    <p>Tel: {cartorio.telefone}</p>
                                    <p>Protestos: {cartorio.quantidadeProtestos} | Valor: R$ {cartorio.valorProtestado?.toLocaleString('pt-BR')}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Ações Judiciais Detalhadas */}
                  {creditScore.judicialActions && creditScore.judicialActions.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Scale className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Ações Judiciais ({creditScore.judicialActions.length})</span>
                      </div>
                      {creditScore.judicialActions.map((acao: any, index: number) => (
                        <div key={index} className="border-b last:border-0 pb-3 last:pb-0 mb-3 last:mb-0">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-700">Processo:</span>
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {acao.numeroProcessoPrincipal || acao.numeroProcesso}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Comarca:</span>
                                <p className="font-medium">{acao.comarca}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Tipo:</span>
                                <p className="font-medium">{acao.tipoProcesso}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Parte Acusada:</span>
                                <p className="font-medium">{acao.parteAcusada}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Valor:</span>
                                <p className="font-medium">R$ {acao.valor?.toLocaleString('pt-BR') || 'N/I'}</p>
                              </div>
                            </div>
                            {acao.status && (
                              <div className="mt-2">
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                  {acao.status}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Cheques Sem Fundo */}
                  {creditScore.bouncedChecks && creditScore.bouncedChecks.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Cheques Sem Fundo ({creditScore.bouncedChecks.length})</span>
                      </div>
                      {creditScore.bouncedChecks.map((cheque: any, index: number) => (
                        <div key={index} className="border-b last:border-0 pb-3 last:pb-0 mb-3 last:mb-0">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Banco:</span>
                              <p className="font-medium">{cheque.codigoBanco}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Agência:</span>
                              <p className="font-medium">{cheque.nomeAgencia} ({cheque.numeroAgencia})</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Ocorrências:</span>
                              <p className="font-medium">{cheque.quantidadeOcorrencia}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Última Ocorrência:</span>
                              <p className="font-medium">
                                {cheque.dataUltimaOcorrencia ? 
                                  new Date(cheque.dataUltimaOcorrencia).toLocaleDateString('pt-BR') : 
                                  'N/I'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Recuperações e Falências */}
                  {creditScore.bankruptcyRecovery && creditScore.bankruptcyRecovery.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Recuperações/Falências ({creditScore.bankruptcyRecovery.length})</span>
                      </div>
                      {creditScore.bankruptcyRecovery.map((processo: any, index: number) => (
                        <div key={index} className="border-b last:border-0 pb-3 last:pb-0 mb-3 last:mb-0">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-700">Empresa:</span>
                              <span className="text-sm font-medium">{processo.nomeEmpresa}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Documento:</span>
                                <p className="font-medium">{processo.documento}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Valor:</span>
                                <p className="font-medium">R$ {processo.valor?.toLocaleString('pt-BR') || 'N/I'}</p>
                              </div>
                            </div>
                            {processo.motivo && (
                              <div>
                                <span className="text-gray-600 text-sm">Motivo:</span>
                                <p className="text-sm">{processo.motivo}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {creditScore.negativeConsultDate && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-500">
                        Consulta de Pendências realizada em: {new Date(creditScore.negativeConsultDate).toLocaleDateString('pt-BR')}
                      </p>
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