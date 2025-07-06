import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Building, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Award,
  Activity,
  Info,
  BarChart3,
  Star,
  Clock,
  Shield,
  Phone,
  Mail,
  Globe,
  Banknote,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    qualificacao: string;
    participacao: string;
  }>;
}

interface ScoreData {
  score: number;
  risk_level: string;
  payment_behavior: string;
  financial_health: string;
}

interface ConsultationProps {
  cnpj: string;
  applicationId: number;
}

// Componente para mini-card de informação
const InfoMiniCard = ({ icon: Icon, title, value, color = "blue" }: {
  icon: any;
  title: string;
  value: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700"
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium opacity-80">{title}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
};

// Componente para score visual
const ScoreDisplay = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 800) return "bg-green-500";
    if (score >= 600) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreText = (score: number) => {
    if (score >= 800) return "Excelente";
    if (score >= 600) return "Bom";
    return "Atenção";
  };

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="rgb(229, 231, 235)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(score / 1000) * 251.2} 251.2`}
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold">{score}</div>
            <div className="text-xs text-gray-500">de 1000</div>
          </div>
        </div>
      </div>
      <Badge variant={score >= 800 ? "default" : score >= 600 ? "secondary" : "destructive"}>
        {getScoreText(score)}
      </Badge>
    </div>
  );
};

const ReceitaWSConsultation: React.FC<ConsultationProps> = ({ cnpj, applicationId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [consultationData, setConsultationData] = useState<ReceitaWSData | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados salvos existentes
  const { data: existingConsultation } = useQuery({
    queryKey: ['/api/receita-ws/consultation', applicationId],
    queryFn: () => apiRequest(`/api/receita-ws/consultation/${applicationId}`),
    retry: false
  });

  useEffect(() => {
    if (existingConsultation) {
      setConsultationData(existingConsultation.data);
      setScoreData(existingConsultation.score);
    }
  }, [existingConsultation]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleConsultation = async (plan: 'basic' | 'advanced') => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/receita-ws/consult', 'POST', {
        cnpj,
        plan,
        applicationId
      });

      setConsultationData(response.data);
      setScoreData(response.score);
      
      // Salvar dados no banco de dados
      await apiRequest('/api/receita-ws/save-consultation', 'POST', {
        applicationId,
        data: response.data,
        score: response.score,
        plan
      });
      
      // Invalidar cache para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/receita-ws/consultation', applicationId] });

      toast({
        title: "Consulta realizada com sucesso",
        description: `Dados da empresa ${response.data.razao_social} obtidos e salvos.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na consulta",
        description: error.message || "Erro ao consultar dados da empresa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Se não há dados de consulta, mostrar interface inicial
  if (!consultationData) {
    return (
      <Card className="w-full border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-blue-900">
                Análise Credit Score
              </CardTitle>
              <p className="text-sm text-blue-600 mt-1">
                Consulta completa dos dados empresariais
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Card className="bg-white/70 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">CNPJ da Empresa</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-lg font-mono font-bold text-blue-800">
                  {cnpj}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Fontes de Dados
                </p>
                <p className="text-xs text-amber-700">
                  Esta consulta abrange dados da <strong>Receita Federal</strong> e do <strong>BACEN</strong> 
                  para análise completa de risco de crédito.
                </p>
              </div>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-6"
                disabled={isLoading}
              >
                <Search className="w-5 h-5 mr-2" />
                {isLoading ? "Consultando..." : "Iniciar Consulta"}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Selecionar Plano de Consulta
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => handleConsultation('basic')}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-blue-900">Básico</h3>
                        <p className="text-sm text-blue-600">Dados essenciais</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        R$ 35,00
                      </Badge>
                    </div>
                    <ul className="text-xs space-y-1 text-gray-600">
                      <li>• Dados básicos da empresa</li>
                      <li>• Situação cadastral</li>
                      <li>• Endereço e contatos</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-indigo-200 hover:border-indigo-300 transition-colors cursor-pointer"
                      onClick={() => handleConsultation('advanced')}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-indigo-900">Avançado</h3>
                        <p className="text-sm text-indigo-600">Análise completa</p>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700">
                        R$ 90,00
                      </Badge>
                    </div>
                    <ul className="text-xs space-y-1 text-gray-600">
                      <li>• Tudo do plano básico</li>
                      <li>• Score de crédito</li>
                      <li>• Análise de risco</li>
                      <li>• Histórico financeiro</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Exibir dados da consulta
  return (
    <div className="space-y-6">
      {/* Header com Score */}
      <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-900">Consulta Realizada</CardTitle>
                <p className="text-sm text-green-600">{consultationData?.razao_social || "Empresa"}</p>
              </div>
            </div>
            {scoreData && <ScoreDisplay score={scoreData.score} />}
          </div>
        </CardHeader>
      </Card>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Informações da Empresa</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('company')}
            >
              {expandedSections.has('company') ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        
        {expandedSections.has('company') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoMiniCard
                icon={Building}
                title="Razão Social"
                value={consultationData.razao_social}
                color="blue"
              />
              <InfoMiniCard
                icon={FileText}
                title="Nome Fantasia"
                value={consultationData.nome_fantasia || "Não informado"}
                color="purple"
              />
              <InfoMiniCard
                icon={Activity}
                title="Situação"
                value={consultationData?.situacao || "Não informado"}
                color={consultationData?.situacao === "ATIVA" ? "green" : "red"}
              />
              <InfoMiniCard
                icon={Calendar}
                title="Data de Abertura"
                value={consultationData?.data_abertura ? new Date(consultationData.data_abertura).toLocaleDateString('pt-BR') : "Não informado"}
                color="blue"
              />
              <InfoMiniCard
                icon={DollarSign}
                title="Capital Social"
                value={consultationData?.capital_social ? `R$ ${parseFloat(consultationData.capital_social).toLocaleString('pt-BR')}` : "Não informado"}
                color="green"
              />
              <InfoMiniCard
                icon={Users}
                title="Porte"
                value={consultationData?.porte || "Não informado"}
                color="purple"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Endereço e Contatos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Endereço e Contatos</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('contact')}
            >
              {expandedSections.has('contact') ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        
        {expandedSections.has('contact') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoMiniCard
                icon={MapPin}
                title="Endereço Completo"
                value={consultationData.endereco ? 
                  `${consultationData.endereco.logradouro || ''}, ${consultationData.endereco.numero || ''} - ${consultationData.endereco.bairro || ''}, ${consultationData.endereco.municipio || ''}/${consultationData.endereco.uf || ''}` : 
                  "Não informado"}
                color="yellow"
              />
              <InfoMiniCard
                icon={Phone}
                title="Telefone"
                value={consultationData?.telefone || "Não informado"}
                color="blue"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Análise de Crédito (apenas se houver scoreData) */}
      {scoreData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Análise de Crédito</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('credit')}
              >
                {expandedSections.has('credit') ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </CardHeader>
          
          {expandedSections.has('credit') && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoMiniCard
                  icon={Star}
                  title="Nível de Risco"
                  value={scoreData?.risk_level || "Não avaliado"}
                  color={scoreData?.risk_level === "BAIXO" ? "green" : scoreData?.risk_level === "MÉDIO" ? "yellow" : "red"}
                />
                <InfoMiniCard
                  icon={CreditCard}
                  title="Comportamento de Pagamento"
                  value={scoreData?.payment_behavior || "Não avaliado"}
                  color="blue"
                />
                <InfoMiniCard
                  icon={Shield}
                  title="Saúde Financeira"
                  value={scoreData?.financial_health || "Não avaliado"}
                  color="purple"
                />
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Botão para nova consulta */}
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Search className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Selecionar Plano de Consulta
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => handleConsultation('basic')}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-blue-900">Básico</h3>
                      <p className="text-sm text-blue-600">Dados essenciais</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      R$ 35,00
                    </Badge>
                  </div>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>• Dados básicos da empresa</li>
                    <li>• Situação cadastral</li>
                    <li>• Endereço e contatos</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-indigo-200 hover:border-indigo-300 transition-colors cursor-pointer"
                    onClick={() => handleConsultation('advanced')}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-indigo-900">Avançado</h3>
                      <p className="text-sm text-indigo-600">Análise completa</p>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-700">
                      R$ 90,00
                    </Badge>
                  </div>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>• Tudo do plano básico</li>
                    <li>• Score de crédito</li>
                    <li>• Análise de risco</li>
                    <li>• Histórico financeiro</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ReceitaWSConsultation;