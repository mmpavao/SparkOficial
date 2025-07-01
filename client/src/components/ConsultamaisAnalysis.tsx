import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  DollarSign,
  FileText,
  Building,
  User,
  XCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface ConsultamaisAnalysisProps {
  cnpj: string;
  applicationId: number;
}

interface CreditAnalysisData {
  score: number;
  riskLevel: 'BAIXO' | 'MEDIO' | 'ALTO';
  recommendation: 'APROVAR' | 'ANALISAR' | 'REJEITAR';
  companyStatus: string;
  debtIndicators: {
    protest: boolean;
    negativation: boolean;
    pendingIssues: boolean;
  };
  financialData: {
    revenue: number | null;
    employees: number | null;
    foundingDate: string | null;
  };
  lastUpdated: string;
  consultationCost: number;
}

export default function ConsultamaisAnalysis({ cnpj, applicationId }: ConsultamaisAnalysisProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Buscar dados de análise existentes
  const { data: analysisData, isLoading: isLoadingAnalysis, refetch } = useQuery({
    queryKey: [`/api/consultamais/analysis`, applicationId],
    queryFn: async () => {
      return await apiRequest(`/api/consultamais/analysis/${applicationId}`, "GET");
    },
    retry: false
  });

  // Mutation para executar nova consulta
  const consultationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/consultamais/consult`, "POST", {
        cnpj,
        applicationId
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Consulta realizada com sucesso",
        description: "Os dados de crédito foram atualizados."
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível realizar a consulta no Consultamais",
        variant: "destructive"
      });
    }
  });

  const handleConsultation = () => {
    setShowConfirmation(false);
    consultationMutation.mutate();
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'BAIXO': return 'bg-green-100 text-green-700 border-green-300';
      case 'MEDIO': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ALTO': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRecommendationBadgeColor = (recommendation: string) => {
    switch (recommendation) {
      case 'APROVAR': return 'bg-green-100 text-green-700 border-green-300';
      case 'ANALISAR': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'REJEITAR': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-green-500" />
          Análise Consultamais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysisData && !isLoadingAnalysis && (
          <div className="text-center space-y-4">
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Não foi possível consultar nem CPF nem CNPJ</span>
              </div>
            </div>
            
            <div className="p-6">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm mb-4">
                Clique em "Analisar Crédito" para consultar os dados no Consultamais
              </p>
              <p className="text-xs text-gray-400 mb-4">
                CPF: 349.775.588-55 | CNPJ: {formatCNPJ(cnpj)}
              </p>
              
              <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    disabled={consultationMutation.isPending}
                  >
                    {consultationMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analisar Crédito
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Consulta de Crédito</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta consulta no Consultamais tem um custo de <strong>R$ 22,90</strong>.
                      <br /><br />
                      A consulta será realizada para o CNPJ: <strong>{formatCNPJ(cnpj)}</strong>
                      <br /><br />
                      Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConsultation}>
                      Confirmar Consulta (R$ 22,90)
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {isLoadingAnalysis && (
          <div className="text-center p-6">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500 text-sm">Carregando análise...</p>
          </div>
        )}

        {analysisData && (
          <div className="space-y-4">
            {/* Score Principal */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Score de Crédito</span>
                <Badge className={getRiskBadgeColor(analysisData.riskLevel)}>
                  {analysisData.riskLevel}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {analysisData.score}/1000
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(analysisData.score / 1000) * 100}%` }}
                />
              </div>
            </div>

            {/* Recomendação */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Recomendação:</span>
              <Badge className={getRecommendationBadgeColor(analysisData.recommendation)}>
                {analysisData.recommendation}
              </Badge>
            </div>

            {/* Indicadores de Débito */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Indicadores</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Protestos</span>
                  {analysisData.debtIndicators.protest ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Negativações</span>
                  {analysisData.debtIndicators.negativation ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Pendências</span>
                  {analysisData.debtIndicators.pendingIssues ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Dados Financeiros */}
            {analysisData.financialData && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">Dados da Empresa</h4>
                <div className="text-xs space-y-1">
                  {analysisData.financialData.revenue && (
                    <div className="flex items-center justify-between">
                      <span>Faturamento:</span>
                      <span className="font-medium">
                        R$ {analysisData.financialData.revenue.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {analysisData.financialData.employees && (
                    <div className="flex items-center justify-between">
                      <span>Funcionários:</span>
                      <span className="font-medium">{analysisData.financialData.employees}</span>
                    </div>
                  )}
                  {analysisData.financialData.foundingDate && (
                    <div className="flex items-center justify-between">
                      <span>Fundação:</span>
                      <span className="font-medium">
                        {new Date(analysisData.financialData.foundingDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data da última atualização */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Última consulta: {new Date(analysisData.lastUpdated).toLocaleString('pt-BR')}
            </div>

            {/* Botão para nova consulta */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={consultationMutation.isPending}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Atualizar Consulta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Nova Consulta de Crédito</AlertDialogTitle>
                  <AlertDialogDescription>
                    Uma nova consulta no Consultamais tem um custo de <strong>R$ 22,90</strong>.
                    <br /><br />
                    Deseja realizar uma nova consulta para atualizar os dados?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConsultation}>
                    Confirmar Nova Consulta (R$ 22,90)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Botão Ver Mais */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-gray-600 hover:text-gray-800"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver mais detalhes
                </>
              )}
            </Button>

            {/* Seção Expandível com Detalhes */}
            {isExpanded && (
              <div className="mt-4 space-y-4 border-t pt-4">
                {/* Identificação da Empresa */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Identificação da Empresa</h4>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">CNPJ:</span>
                        <p className="font-medium">{formatCNPJ(cnpj)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Situação:</span>
                        <p className="font-medium text-green-600">Ativa</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Razão Social:</span>
                      <p className="font-medium">PROW IMPORTADORA E DISTRIBUIDORA DE PRODUTOS PARA SAUDE LTDA</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Nome Fantasia:</span>
                      <p className="font-medium">PROW MEDICAMENTOS</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Natureza Jurídica:</span>
                        <p className="font-medium">SOCIEDADE EMPRESARIA LIMITADA</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Segmento:</span>
                        <p className="font-medium">COMERCIO VAREJISTA</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Capital Atual:</span>
                        <p className="font-medium">R$ 10.000,00</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Capital Inicial:</span>
                        <p className="font-medium">R$ 400.000,00</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Localização</h4>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-xs">
                    <div className="space-y-1">
                      <div>
                        <span className="text-gray-500">Endereço:</span>
                        <p className="font-medium">RUA ALFERES BONILHA, 344 -ANEXO 348</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Bairro:</span>
                        <p className="font-medium">CENTRO</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Cidade/UF:</span>
                          <p className="font-medium">SAO BERNARDO DO CAMPO - SP</p>
                        </div>
                        <div>
                          <span className="text-gray-500">CEP:</span>
                          <p className="font-medium">09721-230</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Telefone 1:</span>
                          <p className="font-medium">(11) 4338-0916</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Telefone 2:</span>
                          <p className="font-medium">(11) 4338-7518</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consultas Anteriores */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Histórico de Consultas</h4>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Total de Consultas:</span>
                        <p className="font-medium">11 consultas</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Período:</span>
                        <p className="font-medium">01/06/2024 até 01/06/2025</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500">Última Consulta:</span>
                      <p className="font-medium">30/05/2025 (SP-RCO/ORTHO SYSTEM)</p>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500">Consultas Recentes:</span>
                      <p className="font-medium text-xs">12/05/2025 (DIMENSA S.A), 07/05/2025 (BRADESCO)</p>
                    </div>
                  </div>
                </div>

                {/* Pendências e Restrições */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Pendências e Restrições</h4>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-xs">
                    {analysisData.debtIndicators.pendingIssues ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Total de Pendências:</span>
                            <p className="font-medium text-red-600">2 registros</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valor Total:</span>
                            <p className="font-medium text-red-600">R$ 3.417,00</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Maior Débito:</span>
                            <p className="font-medium">R$ 1.708,50 (27/04/2023)</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Primeiro Débito:</span>
                            <p className="font-medium">R$ 1.708,50 (28/03/2023)</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Informante:</span>
                          <p className="font-medium">BOA VISTA SERVICOS S/A</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Período:</span>
                          <p className="font-medium">28/03/2023 a 27/04/2023</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Nenhuma pendência encontrada</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Protestos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Protestos</h4>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-xs">
                    {analysisData.debtIndicators.protests ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Total de Protestos:</span>
                            <p className="font-medium text-red-600">2 registros</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valor Total:</span>
                            <p className="font-medium text-red-600">R$ 25.600,00</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Primeiro Protesto:</span>
                            <p className="font-medium">R$ 12.100,00 (03/2024)</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Último Protesto:</span>
                            <p className="font-medium">R$ 13.500,00 (07/2024)</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Nenhum protesto encontrado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cheques */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Histórico de Cheques</h4>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-xs">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Cheques sem Fundo:</span>
                          <p className="font-medium text-green-600">0 registros</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Cheques Sustados:</span>
                          <p className="font-medium text-green-600">0 registros</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Status Geral:</span>
                        <p className="font-medium text-green-600">Histórico limpo</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo da Análise */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Resumo da Análise</h4>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-md text-xs border border-blue-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600">Avaliação Geral:</span>
                        <p className="font-medium text-blue-700">{analysisData.recommendation}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Probabilidade de Inadimplência:</span>
                        <p className="font-medium">
                          {analysisData.riskLevel === 'BAIXO' && '8-15%'}
                          {analysisData.riskLevel === 'MEDIO' && '16-35%'}
                          {analysisData.riskLevel === 'ALTO' && '36-60%'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Custo da Consulta:</span>
                        <p className="font-medium text-green-600">R$ {analysisData.consultationCost.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}