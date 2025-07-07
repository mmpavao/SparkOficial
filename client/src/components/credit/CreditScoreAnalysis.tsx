import { useState } from "react";
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
import { apiRequest } from "@/lib/queryClient";
import { formatCNPJ } from "@/lib/formatters";
import type { CreditApplication, CreditScore } from "@shared/schema";

interface CreditScoreAnalysisProps {
  application: CreditApplication;
}

export default function CreditScoreAnalysis({ application }: CreditScoreAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const { toast } = useToast();

  const handleConsultar = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/credit/applications/${application.id}/credit-score`, 'POST');
      setCreditScore(response);
      toast({
        title: "Análise concluída",
        description: "Credit Score calculado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao consultar",
        description: "Não foi possível consultar o Credit Score",
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Análise Credit Score
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            CNPJ: {formatCNPJ(application.cnpj)}
          </p>
        </CardHeader>
        <CardContent>
          {!creditScore ? (
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Última consulta: {new Date(creditScore.scoreDate).toLocaleDateString('pt-BR')}
              </span>
              <Button 
                size="sm"
                variant="outline"
                onClick={handleConsultar}
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
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
                <div className="flex items-center justify-between">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Razão Social</p>
                  <p className="font-medium">{creditScore.legalName || application.legalCompanyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nome Fantasia</p>
                  <p className="font-medium">{creditScore.tradingName || application.tradingName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={creditScore.status === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {creditScore.status || 'ATIVA'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capital Social</p>
                  <p className="font-medium">
                    {creditScore.shareCapital ? 
                      `R$ ${Number(creditScore.shareCapital).toLocaleString('pt-BR')}` : 
                      '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Abertura</p>
                  <p className="font-medium">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">{creditScore.address || application.address}</p>
                  <p className="text-sm">
                    {creditScore.city || application.city}, {creditScore.state || application.state}
                  </p>
                  <p className="text-sm">CEP: {creditScore.zipCode || application.zipCode}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{creditScore.phone || application.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{creditScore.email || application.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Economic Activities */}
          {(creditScore.mainActivity || creditScore.secondaryActivities) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Atividades Econômicas (CNAE)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creditScore.mainActivity && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Atividade Principal</p>
                      <p className="text-sm">
                        {(creditScore.mainActivity as any).code} - {(creditScore.mainActivity as any).description}
                      </p>
                    </div>
                  )}
                  {creditScore.secondaryActivities && (creditScore.secondaryActivities as any[]).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Atividades Secundárias</p>
                      <div className="space-y-1">
                        {(creditScore.secondaryActivities as any[]).map((activity, index) => (
                          <p key={index} className="text-sm">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Sócios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(creditScore.partners as any[]).map((partner, index) => (
                    <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-gray-600">{partner.qualification}</p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Análise de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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