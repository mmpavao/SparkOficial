import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Download,
  AlertCircle
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
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const { toast } = useToast();
  const permissions = useUserPermissions();

  // Fetch existing credit score on component mount
  useEffect(() => {
    const fetchExistingScore = async () => {
      try {
        console.log('🔍 Fetching existing credit score for application:', application.id);
        const response = await fetch(`/api/credit/applications/${application.id}/credit-score`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Existing credit score found:', data);
          setCreditScore(data);
        }
      } catch (error) {
        console.log('ℹ️ No existing credit score found');
      }
    };

    fetchExistingScore();
  }, [application.id]);

  const fetchCreditScore = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Starting DirectD Credit Score consultation for application:', application.id);
      
      const response = await apiRequest(`/api/credit/applications/${application.id}/credit-score`, 'POST');
      console.log('✅ DirectD Credit Score response received:', response);
      setCreditScore(response);
      console.log('🔄 Credit Score state updated with DirectD data');

      // Force refresh the credit details page
      queryClient.invalidateQueries({ queryKey: [`/api/admin/credit-applications/${application.id}`] });
      
      toast({
        title: "Análise Concluída",
        description: "Dados de crédito obtidos com sucesso das APIs DirectD",
      });
    } catch (error) {
      console.error('❌ Credit Score Error:', error);
      toast({
        title: "Erro na Consulta",
        description: "Não foi possível obter os dados de crédito. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdf = async () => {
    try {
      setIsLoadingPdf(true);
      toast({
        title: "Gerando Relatório",
        description: "PDF com análise completa e foto da localização será gerado em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro na Geração",
        description: "Não foi possível gerar o relatório PDF.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'bg-green-100 text-green-800';
    if (score >= 500) return 'bg-yellow-100 text-yellow-800';
    if (score >= 250) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 750) return 'Excelente';
    if (score >= 500) return 'Bom';
    if (score >= 250) return 'Regular';
    return 'Crítico';
  };

  return (
    <div className="w-full max-w-sm">
      {/* Botão de Consulta */}
      {permissions.isAdmin ? (
        <Button 
          onClick={fetchCreditScore} 
          disabled={isLoading}
          className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Consultando DirectD...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Consultar Análise de Crédito
            </>
          )}
        </Button>
      ) : (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-amber-600" />
          <p className="text-sm text-amber-700">
            Análise de crédito disponível apenas para administradores
          </p>
        </div>
      )}

      {/* Resultado da Análise */}
      {creditScore ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 flex-shrink-0" />
              Análise de Crédito DirectD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Principal */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="text-4xl font-bold text-gray-900 mb-2">{creditScore.creditScore}</div>
              <div className="text-sm text-gray-600 mb-3">Score de Crédito (0-1000)</div>
              <Badge className={`${getScoreColor(creditScore.creditScore)}`}>
                {getScoreLabel(creditScore.creditScore)}
              </Badge>
            </div>

            {/* Dados da Empresa */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Dados da Empresa</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <span className="text-xs text-gray-500">Razão Social</span>
                  <p className="text-sm font-medium">{creditScore.companyData?.retorno?.razaoSocial || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">CNPJ</span>
                  <p className="text-sm font-medium">{formatCNPJ(creditScore.cnpj)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Status</span>
                  <Badge className={creditScore.companyData?.retorno?.situacao === 'ATIVA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {creditScore.companyData?.retorno?.situacao || 'Não informado'}
                  </Badge>
                </div>
                {creditScore.companyData?.retorno?.dataInicioAtividade && (
                  <div>
                    <span className="text-xs text-gray-500">Data de Abertura</span>
                    <p className="text-sm font-medium">
                      {new Date(creditScore.companyData.retorno.dataInicioAtividade).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Análise de Risco */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Análise de Risco</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className={`flex items-center justify-between p-3 rounded-md text-sm ${
                  !creditScore.hasDebts ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <span>Débitos</span>
                  <span className={!creditScore.hasDebts ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                    {!creditScore.hasDebts ? '✅ Limpo' : '❌ Possui'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-md text-sm ${
                  !creditScore.hasProtests ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <span>Protestos</span>
                  <span className={!creditScore.hasProtests ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                    {!creditScore.hasProtests ? '✅ Limpo' : '❌ Possui'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-md text-sm ${
                  !creditScore.hasLawsuits ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <span>Processos Judiciais</span>
                  <span className={!creditScore.hasLawsuits ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                    {!creditScore.hasLawsuits ? '✅ Limpo' : '❌ Possui'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-md text-sm ${
                  !creditScore.hasBankruptcy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <span>Falência</span>
                  <span className={!creditScore.hasBankruptcy ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                    {!creditScore.hasBankruptcy ? '✅ Limpo' : '❌ Possui'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3 pt-4 border-t">
              <Button 
                onClick={generatePdf}
                disabled={isLoadingPdf}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                variant="default"
              >
                {isLoadingPdf ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Relatório PDF
                  </>
                )}
              </Button>
            </div>

            {/* Fonte dos Dados */}
            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">Fonte dos Dados:</p>
                <p>• DirectD Score API (QUOD)</p>
                <p>• DirectD Cadastro Plus API</p>
                <p className="pt-2">Última consulta: {new Date(creditScore.scoreDate).toLocaleDateString('pt-BR')} às {new Date(creditScore.scoreDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}