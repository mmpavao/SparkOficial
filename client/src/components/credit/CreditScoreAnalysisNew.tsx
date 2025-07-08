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
import type { CreditApplication } from "@shared/schema";

interface CreditScoreAnalysisProps {
  application: CreditApplication;
}

interface QuodScore {
  score: number;
  faixa: string;
  capacidadePagamento: string;
  perfil: string;
  motivosScore: string[];
  indicadoresNegocio: {
    pontualidadePagamento: string;
    gravidadeAtrasos: string;
    usoEmergencial: string;
    endividamentoCredores: string;
    riscoPerfilContratacao: string;
    buscaCreditoMensal: string;
  };
}

interface CompanyData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  dataFundacao: string;
  situacaoCadastral: string;
  porte: string;
  faixaFuncionarios: string;
  quantidadeFuncionarios: number;
  enderecos: Array<{
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  }>;
  telefones: Array<{
    telefoneComDDD: string;
    operadora: string;
    tipoTelefone: string;
  }>;
  emails: Array<{
    enderecoEmail: string;
  }>;
  socios: Array<{
    documento: string;
    nome: string;
    percentualParticipacao: string;
    cargo: string;
  }>;
}

interface PendencyDetails {
  status: string;
  totalPendencia: number;
  protestos: Array<{
    cartorio: string;
    valor: number;
    situacao: string;
    telefone: string;
    endereco: string;
  }>;
  acoesJudiciais: Array<{
    numeroProcessoPrincipal: string;
    comarca: string;
    forum: string;
    vara: string;
    parteAcusada: string;
    dataAjuizamento: string;
    tipoProcesso: string;
    valor: number;
    autorProcesso: string;
    cidade: string;
  }>;
  recuperacoesJudiciaisFalencia: Array<{
    documento: string;
    nomeEmpresa: string;
    motivo: string;
    valor: number;
    endereco: string;
  }>;
  chequesSemFundo: Array<{
    banco: string;
    agencia: string;
    conta: string;
    quantidadeOcorrencias: number;
    valorTotal: number;
  }>;
}

interface CreditAnalysis {
  quodScore?: QuodScore;
  companyData?: CompanyData;
  pendencyDetails?: PendencyDetails;
  consultaData: string;
}

export function CreditScoreAnalysisNew({ application }: CreditScoreAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CreditAnalysis | null>(null);
  const { toast } = useToast();
  const permissions = useUserPermissions();

  // Fetch existing analysis on component mount
  useEffect(() => {
    const fetchExistingAnalysis = async () => {
      try {
        const response = await apiRequest(`/api/credit/applications/${application.id}/credit-analysis`, 'GET');
        if (response) {
          setAnalysis(response);
        }
      } catch (error) {
        console.log('No existing credit analysis found');
      }
    };
    
    fetchExistingAnalysis();
  }, [application.id]);

  const handleConsultar = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(`/api/credit/applications/${application.id}/credit-analysis`, 'POST');
      setAnalysis(response);
      toast({
        title: "Análise Completa Realizada",
        description: "Dados DirectD e QUOD consultados com sucesso",
      });
      
      // Invalidate cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credit-applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/credit-applications/${application.id}`] });
    } catch (error: any) {
      console.error('Credit Analysis API error:', error);
      const errorMessage = error.response?.data?.message || "Erro ao realizar análise de crédito";
      setError(errorMessage);
      toast({
        title: "Erro na Consulta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-green-600";
    if (score >= 600) return "text-yellow-600";
    if (score >= 400) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 800) return "bg-green-500";
    if (score >= 600) return "bg-yellow-500";
    if (score >= 400) return "bg-orange-500";
    return "bg-red-500";
  };

  if (!permissions.isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Análise de Crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Análise de crédito disponível apenas para administradores
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Análise de Crédito DirectD + QUOD
            </div>
            <Button 
              onClick={handleConsultar} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {isLoading ? "Consultando..." : "Consultar APIs"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {!analysis && !isLoading && (
            <p className="text-sm text-gray-600">
              Clique em "Consultar APIs" para realizar análise completa com dados DirectD e QUOD
            </p>
          )}
        </CardContent>
      </Card>

      {/* QUOD Score Section */}
      {analysis?.quodScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Análise QUOD Score
              <Badge variant="outline" className="bg-blue-50">Fonte Autêntica</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score principal */}
            <div className="text-center">
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">{analysis.quodScore.score}</span>
                <span className="text-lg text-gray-500 ml-2">/ 1000</span>
              </div>
              <Progress 
                value={(analysis.quodScore.score / 1000) * 100} 
                className="h-3 mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>250</span>
                <span>500</span>
                <span>750</span>
                <span>1000</span>
              </div>
              <Badge 
                variant="outline" 
                className={`mt-3 ${getScoreColor(analysis.quodScore.score)}`}
              >
                {analysis.quodScore.faixa}
              </Badge>
            </div>

            {/* Motivos do Score */}
            {analysis.quodScore.motivosScore && analysis.quodScore.motivosScore.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Motivos do Score
                </h4>
                <div className="space-y-2">
                  {analysis.quodScore.motivosScore.map((motivo, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{motivo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indicadores de Negócio */}
            {analysis.quodScore.indicadoresNegocio && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Indicadores de Negócio
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysis.quodScore.indicadoresNegocio).map(([key, value]) => {
                    const labels = {
                      pontualidadePagamento: "Pontualidade de Pagamento",
                      gravidadeAtrasos: "Gravidade (tempo) em Atrasos",
                      usoEmergencial: "Uso Emergencial",
                      endividamentoCredores: "Endividamento Contrato e Credores",
                      riscoPerfilContratacao: "Risco do Perfil de Contratação",
                      buscaCreditoMensal: "Busca por Crédito Mensal"
                    };
                    
                    return (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">
                          {labels[key as keyof typeof labels]}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: <span className="font-medium">{value || 'Não informado'}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Company Data Section */}
      {analysis?.companyData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Dados da Empresa (DirectD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Razão Social</p>
                <p className="text-sm text-gray-700">{analysis.companyData.razaoSocial || 'Não informado'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900">Nome Fantasia</p>
                <p className="text-sm text-gray-700">{analysis.companyData.nomeFantasia || 'Não informado'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <Badge variant={analysis.companyData.situacaoCadastral === 'ATIVA' ? 'default' : 'destructive'}>
                  {analysis.companyData.situacaoCadastral || 'Não informado'}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">Porte da Empresa</p>
                <p className="text-sm text-gray-700">{analysis.companyData.porte || 'Não informado'}</p>
              </div>

              {analysis.companyData.quantidadeFuncionarios > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Quantidade de Funcionários</p>
                  <p className="text-sm text-gray-700">{analysis.companyData.quantidadeFuncionarios}</p>
                </div>
              )}

              {analysis.companyData.dataFundacao && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Data de Fundação</p>
                  <p className="text-sm text-gray-700">{analysis.companyData.dataFundacao}</p>
                </div>
              )}
            </div>

            {/* Endereço */}
            {analysis.companyData.enderecos && analysis.companyData.enderecos.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Endereço
                </h4>
                {analysis.companyData.enderecos.map((endereco, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {endereco.logradouro}, {endereco.numero}
                      {endereco.complemento && `, ${endereco.complemento}`}
                    </p>
                    <p className="text-sm text-gray-700">
                      {endereco.bairro}, {endereco.cidade} - {endereco.uf}
                    </p>
                    <p className="text-sm text-gray-700">CEP: {endereco.cep}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Contato */}
            {((analysis.companyData.telefones && analysis.companyData.telefones.length > 0) ||
              (analysis.companyData.emails && analysis.companyData.emails.length > 0)) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Contato
                </h4>
                
                {analysis.companyData.telefones && analysis.companyData.telefones.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {analysis.companyData.telefones.map((telefone, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span>{telefone.telefoneComDDD}</span>
                        {telefone.tipoTelefone && (
                          <Badge variant="outline" className="text-xs">
                            {telefone.tipoTelefone}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {analysis.companyData.emails && analysis.companyData.emails.length > 0 && (
                  <div className="space-y-2">
                    {analysis.companyData.emails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span>{email.enderecoEmail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sócios */}
            {analysis.companyData.socios && analysis.companyData.socios.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Sócios ({analysis.companyData.socios.length})
                </h4>
                <div className="space-y-3">
                  {analysis.companyData.socios.map((socio, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{socio.nome}</p>
                          <p className="text-xs text-gray-600">{socio.cargo}</p>
                        </div>
                        <Badge variant="outline">
                          {socio.percentualParticipacao}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pendency Details Section */}
      {analysis?.pendencyDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-red-600" />
              Detalhamento de Pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status geral */}
            <div className="text-center">
              <Badge 
                variant={analysis.pendencyDetails.status === "Não Consta Pendência" ? "default" : "destructive"}
                className="text-lg px-4 py-2"
              >
                {analysis.pendencyDetails.status}
              </Badge>
              
              {analysis.pendencyDetails.totalPendencia > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Valor total das pendências</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {analysis.pendencyDetails.totalPendencia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>

            {/* Ações Judiciais */}
            {analysis.pendencyDetails.acoesJudiciais && analysis.pendencyDetails.acoesJudiciais.length > 0 ? (
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Ações Judiciais ({analysis.pendencyDetails.acoesJudiciais.length})
                </h4>
                <div className="space-y-3">
                  {analysis.pendencyDetails.acoesJudiciais.map((acao, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-red-900">Processo</p>
                          <p className="text-sm text-red-700">{acao.numeroProcessoPrincipal}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Valor</p>
                          <p className="text-sm font-bold text-red-700">
                            R$ {acao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Comarca</p>
                          <p className="text-sm text-red-700">{acao.comarca}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Tipo</p>
                          <p className="text-sm text-red-700">{acao.tipoProcesso}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Parte Acusada</p>
                          <p className="text-sm text-red-700">{acao.parteAcusada}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Data Ajuizamento</p>
                          <p className="text-sm text-red-700">{acao.dataAjuizamento}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ações Judiciais: Não Consta</span>
              </div>
            )}

            {/* Protestos */}
            {analysis.pendencyDetails.protestos && analysis.pendencyDetails.protestos.length > 0 ? (
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Protestos ({analysis.pendencyDetails.protestos.length})
                </h4>
                <div className="space-y-3">
                  {analysis.pendencyDetails.protestos.map((protesto, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-red-900">Cartório</p>
                          <p className="text-sm text-red-700">{protesto.cartorio}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Valor</p>
                          <p className="text-sm font-bold text-red-700">
                            R$ {protesto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Situação</p>
                          <p className="text-sm text-red-700">{protesto.situacao}</p>
                        </div>
                        {protesto.telefone && (
                          <div>
                            <p className="text-sm font-medium text-red-900">Telefone</p>
                            <p className="text-sm text-red-700">{protesto.telefone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Protestos: Não Consta</span>
              </div>
            )}

            {/* Cheques sem Fundo */}
            {analysis.pendencyDetails.chequesSemFundo && analysis.pendencyDetails.chequesSemFundo.length > 0 ? (
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Cheques sem Fundo ({analysis.pendencyDetails.chequesSemFundo.length})
                </h4>
                <div className="space-y-3">
                  {analysis.pendencyDetails.chequesSemFundo.map((cheque, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-red-900">Banco</p>
                          <p className="text-sm text-red-700">{cheque.banco}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Agência</p>
                          <p className="text-sm text-red-700">{cheque.agencia}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Ocorrências</p>
                          <p className="text-sm text-red-700">{cheque.quantidadeOcorrencias}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Valor Total</p>
                          <p className="text-sm font-bold text-red-700">
                            R$ {cheque.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Cheques sem Fundo: Não Consta</span>
              </div>
            )}

            {/* Recuperações Judiciais */}
            {analysis.pendencyDetails.recuperacoesJudiciaisFalencia && analysis.pendencyDetails.recuperacoesJudiciaisFalencia.length > 0 ? (
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Recuperações Judiciais/Falência ({analysis.pendencyDetails.recuperacoesJudiciaisFalencia.length})
                </h4>
                <div className="space-y-3">
                  {analysis.pendencyDetails.recuperacoesJudiciaisFalencia.map((recuperacao, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-red-900">Empresa</p>
                          <p className="text-sm text-red-700">{recuperacao.nomeEmpresa}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Motivo</p>
                          <p className="text-sm text-red-700">{recuperacao.motivo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Valor</p>
                          <p className="text-sm font-bold text-red-700">
                            R$ {recuperacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Documento</p>
                          <p className="text-sm text-red-700">{recuperacao.documento}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Recuperações Judiciais/Falência: Não Consta</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data da consulta */}
      {analysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 inline mr-2" />
              Consulta realizada em: {analysis.consultaData}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}