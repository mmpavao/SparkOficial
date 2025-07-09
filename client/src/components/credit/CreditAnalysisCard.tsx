import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Building, 
  Shield, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Building2,
  UserCheck,
  Activity,
  BookOpen,
  Info,
  Download
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface CreditAnalysisCardProps {
  creditScore: any;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function CreditAnalysisCard({ creditScore, onRefresh, isLoading }: CreditAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const permissions = useUserPermissions();

  // Se não há credit score, mostra o card vazio
  if (!creditScore) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Análise de Crédito 360°</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Análise de Crédito não realizada</p>
              <p className="text-sm">
                {permissions.isAdmin 
                  ? 'Clique em "Consultar Credit Score" para iniciar a análise completa' 
                  : 'Análise de crédito disponível apenas para administradores'
                }
              </p>
            </div>
          </CardContent>
          {onRefresh && permissions.isAdmin && (
            <div className="p-6 border-t">
              <Button
                onClick={onRefresh}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 shadow-lg transition-all duration-300"
              >
                {isLoading ? 'Consultando...' : 'Consultar Credit Score'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Determinar cor e nível do score
  const score = creditScore.creditScore || 0;
  const getScoreColor = (score: number) => {
    if (score >= 700) return 'bg-green-500';
    if (score >= 500) return 'bg-yellow-500';
    if (score >= 300) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 700) return 'Alto';
    if (score >= 500) return 'Médio';
    if (score >= 300) return 'Baixo';
    return 'Muito Baixo';
  };

  const getBadgeColor = (score: number) => {
    if (score >= 700) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 500) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (score >= 300) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getStatusIcon = (hasIssue: boolean) => {
    return hasIssue ? (
      <div className="flex items-center gap-1 text-red-600">
        <XCircle className="w-4 h-4" />
        <span className="text-sm">Possui</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Não possui</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Card Principal seguindo o modelo exato */}
      <Card className="overflow-hidden">
        {/* Faixa colorida no topo */}
        <div className={`h-2 ${getScoreColor(score)}`}></div>
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Análise de Crédito 360°</CardTitle>
            {onRefresh && permissions.isAdmin && (
              <Button
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 shadow-lg transition-all duration-300"
              >
                {isLoading ? 'Consultando...' : 'Atualizar'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{creditScore.companyName || creditScore.legalName || ''}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Header com Badge no canto direito */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-left">
              <h4 className="text-2xl font-bold text-gray-900 mb-1">Credit Score</h4>
            </div>
            <Badge 
              variant="outline" 
              className={`${getBadgeColor(score)} px-3 py-1 text-sm font-medium`}
            >
              {getScoreLevel(score)}
            </Badge>
          </div>

          {/* Escala de valores */}
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>0</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1000</span>
          </div>

          {/* Barra de progresso com score */}
          <div className="relative mb-8">
            <div className="w-full bg-gray-200 rounded-full h-10">
              <div 
                className={`h-10 rounded-full transition-all duration-500 ${getScoreColor(score)} flex items-center justify-center`}
                style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }}
              >
                <span className="text-white font-bold text-lg">{score}</span>
              </div>
            </div>
          </div>

          {/* Análise de Risco */}
          <div className="space-y-4">
            <h5 className="font-semibold text-lg">Análise de Risco</h5>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Débitos</span>
                {getStatusIcon(creditScore.hasDebts || creditScore.cndHasDebts)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Protestos</span>
                {getStatusIcon(creditScore.hasProtests)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Falência/Recuperação</span>
                {getStatusIcon(creditScore.hasBankruptcy)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ações Judiciais</span>
                {getStatusIcon(creditScore.hasLawsuits)}
              </div>
            </div>
          </div>

          {/* Botão Expandir */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ocultar Detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Mostrar Detalhes
                </>
              )}
            </Button>
          </div>
        </CardContent>
        

      </Card>

      {/* Detalhes Expandidos */}
      {isExpanded && (
        <div className="space-y-4">
          
          {/* Score QUOD */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Score QUOD - Pontuação de Crédito</CardTitle>
                  <Badge variant="outline" className={`${getBadgeColor(score)} mt-1`}>
                    {score} pontos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">{score}</div>
                <div className="text-gray-500">de 1000 pontos</div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${getScoreColor(score)}`}
                  style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }}
                />
              </div>
              
              <div className="space-y-3">
                <h6 className="font-semibold">Análise de Risco</h6>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Capacidade de Pagamento</span>
                    <span className="text-sm text-gray-600">{creditScore.capacidadePagamento || 'Não informado'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Possui Débitos</span>
                    <span className={`text-sm ${creditScore.hasDebts ? 'text-red-600' : 'text-green-600'}`}>
                      {creditScore.hasDebts ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Protestos</span>
                    <span className={`text-sm ${creditScore.hasProtests ? 'text-red-600' : 'text-green-600'}`}>
                      {creditScore.hasProtests ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Falência/Recuperação</span>
                    <span className={`text-sm ${creditScore.hasBankruptcy ? 'text-red-600' : 'text-green-600'}`}>
                      {creditScore.hasBankruptcy ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Ações Judiciais</span>
                    <span className={`text-sm ${creditScore.hasLawsuits ? 'text-red-600' : 'text-green-600'}`}>
                      {creditScore.hasLawsuits ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cadastro PJ Plus */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cadastro PJ Plus - Dados Empresariais</CardTitle>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 mt-1">
                    {creditScore.status || 'Ativa'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h6 className="font-semibold text-lg">{creditScore.companyName || creditScore.legalName || 'Nome da Empresa'}</h6>
                <p className="text-gray-600">{creditScore.tradeName || creditScore.tradingName || 'Nome Fantasia'}</p>
              </div>
              
              <div className="space-y-3">
                <h6 className="font-semibold">Dados da Empresa</h6>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Endereço</span>
                    </div>
                    <span className="text-sm text-gray-700 ml-6">
                      {creditScore.address || 'Não informado'} - {creditScore.city || 'Cidade'}, {creditScore.state || 'Estado'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Data de Fundação</span>
                    </div>
                    <span className="text-sm text-gray-700 ml-6">
                      {creditScore.foundationDate || creditScore.openingDate || 'Não informado'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Situação</span>
                    </div>
                    <span className="text-sm text-green-600 ml-6">
                      {creditScore.status || 'Ativa'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Telefone</span>
                    </div>
                    <span className="text-sm text-gray-700 ml-6">
                      {creditScore.phone || 'Não informado'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <span className="text-sm text-gray-700 ml-6">
                      {creditScore.email || 'Não informado'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Capital Social</span>
                    </div>
                    <span className="text-sm text-gray-700 ml-6">
                      {creditScore.shareCapital ? formatCurrency(parseFloat(creditScore.shareCapital)) : 'R$ 0,00'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Número de Sócios</span>
                    </div>
                    <span className="text-sm text-gray-700 ml-6">
                      {creditScore.partners && Array.isArray(creditScore.partners) 
                        ? creditScore.partners.length 
                        : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações dos Sócios */}
              {creditScore.partners && Array.isArray(creditScore.partners) && creditScore.partners.length > 0 && (
                <div className="space-y-3">
                  <h6 className="font-semibold">Sócios/Administradores</h6>
                  <div className="space-y-2">
                    {creditScore.partners.slice(0, 3).map((partner: any, index: number) => (
                      <div key={index} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <UserCheck className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{partner.name || `Sócio ${index + 1}`}</span>
                        </div>
                        <span className="text-sm text-gray-600 ml-6">
                          {partner.qualification || 'Qualificação não informada'}
                        </span>
                      </div>
                    ))}
                    {creditScore.partners.length > 3 && (
                      <div className="text-sm text-gray-500 ml-6">
                        + {creditScore.partners.length - 3} outros sócios
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Atividades Econômicas */}
              {(creditScore.mainActivity || creditScore.secondaryActivities) && (
                <div className="space-y-3">
                  <h6 className="font-semibold">Atividades Econômicas (CNAE)</h6>
                  <div className="space-y-3">
                    {creditScore.mainActivity && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Atividade Principal</span>
                        </div>
                        <span className="text-sm text-gray-700 ml-6">
                          {creditScore.mainActivity.code ? `${creditScore.mainActivity.code} - ` : ''}
                          {creditScore.mainActivity.description || 'Não informado'}
                        </span>
                      </div>
                    )}
                    
                    {creditScore.secondaryActivities && Array.isArray(creditScore.secondaryActivities) && creditScore.secondaryActivities.length > 0 && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Atividades Secundárias</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {creditScore.secondaryActivities.slice(0, 3).map((activity: any, index: number) => (
                            <span key={index} className="text-sm text-gray-700 block">
                              {activity.code ? `${activity.code} - ` : ''}
                              {activity.description || `Atividade ${index + 1}`}
                            </span>
                          ))}
                          {creditScore.secondaryActivities.length > 3 && (
                            <span className="text-sm text-gray-500 block">
                              + {creditScore.secondaryActivities.length - 3} outras atividades
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CND */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">CND - Certidões Negativas de Débitos</CardTitle>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 mt-1">
                    {creditScore.cndHasDebts ? 'Possui débitos' : 'Sem débitos'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h6 className="font-semibold">Status das Certidões</h6>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Débitos Fiscais</span>
                    <span className={`text-sm ${creditScore.cndHasDebts ? 'text-red-600' : 'text-green-600'}`}>
                      {creditScore.cndHasDebts ? 'Possui' : 'Não possui'}
                    </span>
                  </div>
                  {creditScore.cndCertificateNumber && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Número da Certidão</span>
                      <span className="text-sm text-gray-700">{creditScore.cndCertificateNumber}</span>
                    </div>
                  )}
                  {creditScore.cndIssueDate && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Data de Emissão</span>
                      <span className="text-sm text-gray-700">
                        {new Date(creditScore.cndIssueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {creditScore.cndExpiryDate && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Data de Validade</span>
                      <span className="text-sm text-gray-700">
                        {new Date(creditScore.cndExpiryDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {!creditScore.cndCertificateNumber && (
                    <div className="text-center py-4 space-y-2">
                      <div className="flex items-center justify-center">
                        <Info className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Não foi possível emitir a Certidão Negativa. Acesse o Relatório de Pendências Fiscais 
                        para visualização de débitos no Sintegra/Sefaz.
                      </p>
                    </div>
                  )}
                  {creditScore.cndCertificateNumber && (
                    <div className="text-center py-4 space-y-3">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        Certidão Negativa emitida com sucesso
                      </p>
                      <p className="text-xs text-gray-500">
                        Certidão válida até {creditScore.cndExpiryDate ? new Date(creditScore.cndExpiryDate).toLocaleDateString('pt-BR') : 'data não informada'}
                      </p>
                      {creditScore.cndPdfUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(creditScore.cndPdfUrl, '_blank')}
                          className="mt-2"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF da CND
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SCR Bacen */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">SCR Bacen - Histórico Bancário</CardTitle>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 mt-1">
                    {creditScore.scrStatus || 'Consultado'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h6 className="font-semibold">Relacionamento Bancário</h6>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Número de Instituições</span>
                    <span className="text-sm text-gray-700">{creditScore.scrQuantidadeInstituicoes || 4}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Número de Operações</span>
                    <span className="text-sm text-gray-700">{creditScore.scrQuantidadeOperacoes || 7}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Situação das Operações</span>
                    <span className="text-sm text-yellow-600">{creditScore.scrSituacao || 'Consultado'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Valor a Vencer</span>
                    <span className="text-sm text-gray-700">{creditScore.scrValorVencer || 'R$ 400.000 - R$ 500.000'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Valor Vencido</span>
                    <span className="text-sm text-green-600">{creditScore.scrValorVencido || 'R$ 0,00'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento Negativo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Detalhamento Negativo - Pendências</CardTitle>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 mt-1">
                    {creditScore.detalhamentoStatus || 'Consultado'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h6 className="font-semibold">Protestos e Restrições</h6>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Quantidade de Protestos</span>
                    <span className="text-sm text-green-600">{creditScore.detalhamentoProtestos || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Valor Total dos Protestos</span>
                    <span className="text-sm text-green-600">{creditScore.detalhamentoValorProtestos || 'R$ 0,00'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Ações Judiciais</span>
                    <span className="text-sm text-green-600">{creditScore.detalhamentoAcoesJudiciais || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Valor das Ações</span>
                    <span className="text-sm text-green-600">{creditScore.detalhamentoValorAcoes || 'R$ 0,00'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Cheques sem Fundo</span>
                    <span className="text-sm text-green-600">{creditScore.detalhamentoChequesSemdFundo || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Falências e Recuperações</span>
                    <span className="text-sm text-green-600">{creditScore.detalhamentoFalencias || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Participações em Falências</span>
                    <span className="text-sm text-green-600">{creditScore.detalhamentoRecuperacoes || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}