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

          {/* QUOD Enhanced Data (only show if available) */}
          {creditScore.apiSource === 'quod_directdata' && (
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-blue-800">
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  Análise Avançada QUOD
                  <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-700 border-blue-300">
                    Dados Premiums
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid gap-4 md:grid-cols-2">
                  {creditScore.employeeCount && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Funcionários</p>
                      <p className="font-medium text-sm flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        {creditScore.employeeCount.toLocaleString()} funcionários
                      </p>
                      {creditScore.employeeRange && (
                        <p className="text-xs text-gray-400">Faixa: {creditScore.employeeRange}</p>
                      )}
                    </div>
                  )}
                  
                  {creditScore.revenueRange && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Faturamento</p>
                      <p className="font-medium text-sm flex items-center gap-2">
                        <DollarSign className="w-3 h-3" />
                        {creditScore.revenueRange}
                      </p>
                      {creditScore.presumedRevenue && (
                        <p className="text-xs text-gray-400">Presumido: {creditScore.presumedRevenue}</p>
                      )}
                    </div>
                  )}
                  
                  {creditScore.companySize && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Porte</p>
                      <p className="font-medium text-sm flex items-center gap-2">
                        <Briefcase className="w-3 h-3" />
                        {creditScore.companySize}
                      </p>
                    </div>
                  )}
                  
                  {(creditScore.isMatrix !== undefined || creditScore.branchCount) && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Estrutura</p>
                      <div className="space-y-1">
                        {creditScore.isMatrix !== undefined && (
                          <p className="font-medium text-sm flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            {creditScore.isMatrix ? 'Matriz' : 'Filial'}
                          </p>
                        )}
                        {creditScore.branchCount && parseInt(creditScore.branchCount) > 0 && (
                          <p className="text-xs text-gray-400">
                            {creditScore.branchCount} filiais
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {creditScore.taxation && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Tributação</p>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        {creditScore.taxation}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Protestos</span>
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
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Falência</span>
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
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Processos Judiciais</span>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}