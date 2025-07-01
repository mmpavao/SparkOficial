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
  XCircle
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}