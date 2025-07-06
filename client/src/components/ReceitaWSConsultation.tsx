import React, { useState, useEffect } from 'react';
import { Search, Building, Users, MapPin, Calendar, DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ReceitaWSData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao: string;
  data_abertura: string;
  capital_social: string;
  natureza_juridica: string;
  porte: string;
  atividade_principal: {
    codigo: string;
    descricao: string;
  };
  atividades_secundarias: Array<{
    codigo: string;
    descricao: string;
  }>;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  telefone: string;
  email: string;
  qsa: Array<{
    nome: string;
    cargo: string;
    participacao: string;
    data_entrada: string;
  }>;
  score: number;
  indicadores: {
    protestos: boolean;
    negativacoes: boolean;
    pendencias: boolean;
  };
  historico_consultas: {
    total: number;
    periodo: string;
    ultima_consulta: string;
    consultas_recentes: string[];
  };
  cheques: {
    sem_fundo: number;
    sustados: number;
    status: string;
  };
  participacoes_outras_empresas: Array<{
    cnpj: string;
    razao_social: string;
    participacao: string;
    situacao: string;
  }>;
}

interface ReceitaWSConsultationProps {
  cnpj: string;
  applicationId: number;
}

export default function ReceitaWSConsultation({ cnpj, applicationId }: ReceitaWSConsultationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consultationData, setConsultationData] = useState<ReceitaWSData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'advanced' | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [existingData, setExistingData] = useState<any | null>(null);
  const [hasExistingConsultation, setHasExistingConsultation] = useState(false);
  const { toast } = useToast();

  // Verificar se já existe consulta ao carregar o componente
  useEffect(() => {
    const checkExistingConsultation = async () => {
      try {
        console.log('🔍 RECEITA WS: Verificando consulta existente para aplicação', applicationId);
        const response = await apiRequest(`/api/cnpj-analyses/${applicationId}`, 'GET');
        console.log('🔍 RECEITA WS: Resposta do servidor:', response);
        
        if (response && response.company_data) {
          console.log('✅ RECEITA WS: Consulta existente encontrada, definindo como persistente');
          setHasExistingConsultation(true);
          setExistingData(response);
          
          // Parse do JSON com verificação de segurança
          try {
            const parsedData = JSON.parse(response.company_data);
            setConsultationData(parsedData);
            console.log('✅ RECEITA WS: Dados parseados e estado definido');
          } catch (parseError) {
            console.error('❌ RECEITA WS: Erro ao fazer parse dos dados da empresa:', parseError);
          }
        } else {
          console.log('❌ RECEITA WS: Nenhuma consulta existente encontrada');
          setHasExistingConsultation(false);
        }
      } catch (error) {
        console.log('❌ RECEITA WS: Erro ao verificar consulta existente (normal se não existe):', error);
        setHasExistingConsultation(false);
        setExistingData(null);
        setConsultationData(null);
      }
    };

    if (applicationId) {
      checkExistingConsultation();
    }
  }, [applicationId]);

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'bg-green-500';
    if (score >= 600) return 'bg-yellow-500';
    if (score >= 400) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'EXCELENTE';
    if (score >= 600) return 'BOM';
    if (score >= 400) return 'MÉDIO';
    return 'BAIXO';
  };

  const handleConsultation = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const response = await apiRequest(`/api/receita-ws/consultar`, 'POST', {
        cnpj: cnpj,
        plan: selectedPlan,
        applicationId: applicationId
      });

      setConsultationData(response);
      
      // Salvar os dados no banco de dados
      await apiRequest(`/api/cnpj-analyses`, 'POST', {
        credit_application_id: applicationId,
        cnpj: cnpj,
        company_data: JSON.stringify(response),
        analysis_result: `Consulta ${selectedPlan} realizada com sucesso. Score: ${response.score}`,
        risk_score: response.score
      });

      // Atualizar estado para indicar que já existe consulta
      setHasExistingConsultation(true);
      setExistingData({
        company_data: JSON.stringify(response),
        analysis_result: `Consulta ${selectedPlan} realizada com sucesso. Score: ${response.score}`,
        risk_score: response.score
      });

      toast({
        title: "Consulta realizada com sucesso",
        description: "Dados salvos e análise concluída",
      });

      // Fechar o componente automaticamente após 2 segundos
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);

    } catch (error) {
      console.error('Erro na consulta:', error);
      toast({
        title: "Erro na consulta",
        description: "Não foi possível obter os dados da empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-green-600" />
          Análise Consultamais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CNPJ da Empresa</p>
              <p className="font-medium">{formatCNPJ(cnpj)}</p>
            </div>
            {hasExistingConsultation ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Consulta realizada</span>
              </div>
            ) : (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Consultar CNPJ
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Consulta de Empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>Selecione o tipo de consulta que deseja realizar:</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Esta consulta tem custo e será debitada do seu saldo.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlan === 'basic' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedPlan('basic')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Consulta Básica</h4>
                          <p className="text-sm text-gray-600">Dados essenciais da empresa</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">R$ 35,00</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlan === 'advanced' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedPlan('advanced')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Consulta Avançada</h4>
                          <p className="text-sm text-gray-600">Análise completa + Score de crédito</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">R$ 90,00</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleConsultation}
                      disabled={!selectedPlan || loading}
                      className="flex-1"
                    >
                      {loading ? 'Consultando...' : 'Confirmar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            )}
            {hasExistingConsultation && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Consulta realizada</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {existingData?.consulted_at ? new Date(existingData.consulted_at).toLocaleDateString('pt-BR') : 'Consulta anterior'}
                </Badge>
              </div>
            )}
          </div>

          {consultationData && (
            <div className="space-y-4 mt-6">
              {/* Score de Crédito */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Score de Crédito</h3>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {getScoreLabel(consultationData.score)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{consultationData.score}/1000</span>
                      <Button size="sm" variant="outline" className="bg-yellow-400 hover:bg-yellow-500">
                        ANALISAR
                      </Button>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(consultationData.score)}`}
                        style={{ width: `${(consultationData.score / 1000) * 100}%` }}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Recomendação:</p>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span>Indicadores</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Protestos</span>
                          {consultationData.indicadores.protestos ? 
                            <XCircle className="h-4 w-4 text-red-500" /> : 
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Negativações</span>
                          {consultationData.indicadores.negativacoes ? 
                            <XCircle className="h-4 w-4 text-red-500" /> : 
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Pendências</span>
                          {consultationData.indicadores.pendencias ? 
                            <XCircle className="h-4 w-4 text-red-500" /> : 
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados da Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Dados da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Faturamento:</p>
                        <p className="font-medium">{formatCurrency(consultationData.capital_social)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Funcionários:</p>
                        <p className="font-medium">{consultationData.qsa.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fundação:</p>
                        <p className="font-medium">{formatDate(consultationData.data_abertura)}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">Última consulta: {formatDate(consultationData.historico_consultas.ultima_consulta)}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleSection('empresa')}
                        className="mt-2"
                      >
                        {expandedSections.empresa ? 'Ver menos' : 'Ver mais detalhes'}
                        {expandedSections.empresa ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>

                    {expandedSections.empresa && (
                      <div className="space-y-6 pt-4 border-t">
                        {/* Identificação da Empresa */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Identificação da Empresa
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">CNPJ:</p>
                              <p className="font-medium">{formatCNPJ(consultationData.cnpj)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Situação:</p>
                              <Badge variant={consultationData.situacao === 'ATIVA' ? 'default' : 'secondary'}>
                                {consultationData.situacao}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Razão Social:</p>
                              <p className="font-medium">{consultationData.razao_social}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Nome Fantasia:</p>
                              <p className="font-medium">{consultationData.nome_fantasia}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Natureza Jurídica:</p>
                              <p className="font-medium">{consultationData.natureza_juridica}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Porte:</p>
                              <p className="font-medium">{consultationData.porte}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Capital Social:</p>
                              <p className="font-medium">{formatCurrency(consultationData.capital_social)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Localização */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Localização
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="text-gray-600">Endereço:</span><br />
                              {consultationData.endereco.logradouro}, {consultationData.endereco.numero} 
                              {consultationData.endereco.complemento && ` - ${consultationData.endereco.complemento}`}
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-600">Bairro:</span> {consultationData.endereco.bairro}
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-600">Cidade/UF:</span> {consultationData.endereco.municipio} - {consultationData.endereco.uf}
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-600">CEP:</span> {consultationData.endereco.cep}
                            </p>
                            {consultationData.telefone && (
                              <p className="text-sm">
                                <span className="text-gray-600">Telefone:</span> {consultationData.telefone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Atividades Econômicas */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Atividades Econômicas (CNAEs)
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600">CNAE Principal:</p>
                              <p className="font-medium">{consultationData.atividade_principal.codigo} - {consultationData.atividade_principal.descricao}</p>
                            </div>
                            {consultationData.atividades_secundarias.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600">CNAEs Secundárias:</p>
                                <ul className="space-y-1 mt-1">
                                  {consultationData.atividades_secundarias.map((atividade, index) => (
                                    <li key={index} className="text-sm">
                                      • {atividade.codigo} - {atividade.descricao}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sócios e Participações */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Sócios e Participações
                          </h4>
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">Composição Societária:</p>
                            {consultationData.qsa.map((socio, index) => (
                              <div key={index} className="border-l-2 border-gray-200 pl-3">
                                <p className="font-medium">{socio.nome}</p>
                                <p className="text-sm text-gray-600">
                                  {socio.cargo} • {socio.participacao}% • Entrada: {formatDate(socio.data_entrada)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Participações em Outras Empresas */}
                        {consultationData.participacoes_outras_empresas.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3">Participações em Outras Empresas:</h4>
                            <div className="space-y-2">
                              {consultationData.participacoes_outras_empresas.map((empresa, index) => (
                                <div key={index} className="border-l-2 border-blue-200 pl-3">
                                  <p className="font-medium">{empresa.razao_social}</p>
                                  <p className="text-sm text-gray-600">
                                    CNPJ: {formatCNPJ(empresa.cnpj)} • {empresa.participacao}% • {empresa.situacao}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Histórico de Consultas */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Histórico de Consultas
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Total de Consultas:</p>
                              <p className="font-medium">{consultationData.historico_consultas.total} consultas</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Período:</p>
                              <p className="font-medium">{consultationData.historico_consultas.periodo}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">Consultas Recentes:</p>
                            <ul className="text-sm mt-1">
                              {consultationData.historico_consultas.consultas_recentes.map((consulta, index) => (
                                <li key={index}>• {consulta}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Pendências e Restrições */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Pendências e Restrições
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Nenhuma pendência encontrada</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Nenhum protesto encontrado</span>
                            </div>
                          </div>
                        </div>

                        {/* Histórico de Cheques */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Histórico de Cheques
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Cheques sem Fundo:</p>
                              <p className="font-medium">{consultationData.cheques.sem_fundo} registros</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Cheques Sustados:</p>
                              <p className="font-medium">{consultationData.cheques.sustados} registros</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Status Geral:</p>
                            <Badge variant={consultationData.cheques.status === 'Regular' ? 'default' : 'destructive'}>
                              {consultationData.cheques.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}