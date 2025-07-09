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
  Gavel
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Análise de Crédito 360°</h3>
          {onRefresh && permissions.isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? 'Consultando...' : 'Consultar Credit Score'}
            </Button>
          )}
        </div>
        <Card>
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
        </Card>
      </div>
    );
  }

  // Função para determinar cor do score
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
    if (score >= 700) return 'bg-green-100 text-green-700';
    if (score >= 500) return 'bg-yellow-100 text-yellow-700';
    if (score >= 300) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusBadge = (hasIssue: boolean) => {
    return hasIssue ? (
      <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
        <XCircle className="w-3 h-3 mr-1" />
        Possui
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Não possui
      </Badge>
    );
  };

  const score = creditScore.creditScore || 0;
  const companyName = creditScore.companyName || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Análise de Crédito 360°</h3>
        {onRefresh && permissions.isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Consultando...' : 'Atualizar'}
          </Button>
        )}
      </div>

      {/* Card Principal com Credit Score */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${getScoreColor(score)}`}></div>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Credit Score</h4>
              <p className="text-sm text-gray-600">{companyName}</p>
            </div>
          </div>
          <Badge variant="outline" className={getBadgeColor(score)}>
            {getScoreLevel(score)}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Score Number */}
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{score}</div>
            <div className="text-sm text-gray-500 mb-4">de 1000 pontos</div>
          </div>

          {/* Barra de Score */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${getScoreColor(score)}`}
              style={{ width: `${(score / 1000) * 100}%` }}
            />
          </div>

          {/* Status Analysis */}
          <div className="space-y-3">
            <h5 className="font-medium">Análise de Risco</h5>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Débitos</span>
                {getStatusBadge(creditScore.hasDebts)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Protestos</span>
                {getStatusBadge(creditScore.hasProtests)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Falência/Recuperação</span>
                {getStatusBadge(creditScore.hasBankruptcy)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Ações Judiciais</span>
                {getStatusBadge(creditScore.hasLawsuits)}
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

      {/* Cards Expandidos */}
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
                  <CardTitle>Score QUOD - Pontuação de Crédito</CardTitle>
                  <Badge variant="outline" className={getBadgeColor(score)}>
                    {score} pontos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{score}</div>
                  <div className="text-sm text-gray-500 mb-4">de 1000 pontos</div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${getScoreColor(score)}`}
                    style={{ width: `${(score / 1000) * 100}%` }}
                  />
                </div>
                
                <div className="space-y-3">
                  <h6 className="font-medium">Análise de Risco</h6>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm">Capacidade de Pagamento</span>
                      <div className="text-sm font-medium text-gray-600">Não informado</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Possui Débitos</span>
                      <div className="text-sm font-medium text-green-600">Não</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Protestos</span>
                      <div className="text-sm font-medium text-green-600">Não</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Falência/Recuperação</span>
                      <div className="text-sm font-medium text-green-600">Não</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Ações Judiciais</span>
                      <div className="text-sm font-medium text-green-600">Não</div>
                    </div>
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
                  <CardTitle>Cadastro PJ Plus - Dados Empresariais</CardTitle>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                    Ativa
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h6 className="font-semibold text-lg mb-2">{creditScore.companyName || 'Nome da Empresa'}</h6>
                  <p className="text-gray-600 mb-4">{creditScore.tradeName || 'Nome Fantasia'}</p>
                </div>
                
                <div className="space-y-3">
                  <h6 className="font-medium">Dados da Empresa</h6>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Endereço</span>
                      </div>
                      <div className="text-sm font-medium ml-6">{creditScore.city || 'Cidade'}, {creditScore.state || 'Estado'}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Data de Fundação</span>
                      </div>
                      <div className="text-sm font-medium ml-6">{creditScore.foundationDate || 'Data de Fundação'}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Situação</span>
                      </div>
                      <div className="text-sm font-medium ml-6 text-green-600">Ativa</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Telefone</span>
                      </div>
                      <div className="text-sm font-medium ml-6">{creditScore.phone || 'Telefone'}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Email</span>
                      </div>
                      <div className="text-sm font-medium ml-6">{creditScore.email || 'Email'}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Capital Social</span>
                      </div>
                      <div className="text-sm font-medium ml-6">{formatCurrency(creditScore.socialCapital || 0)}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Número de Sócios</span>
                      </div>
                      <div className="text-sm font-medium ml-6">{creditScore.partnersCount || 'Não informado'}</div>
                    </div>
                  </div>
                </div>
              </div>
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
                  <CardTitle>CND - Certidões Negativas de Débitos</CardTitle>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                    {creditScore.cndStatus || 'Não Consultado'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h6 className="font-medium">Status das Certidões</h6>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm">Situação do Contribuinte</span>
                      <div className="text-sm font-medium">{creditScore.cndStatus || 'Não Consultado'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Débitos Fiscais</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.cndHasDebts ? 'Possui' : 'Não possui'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Número da Certidão</span>
                      <div className="text-sm font-medium">{creditScore.cndNumber || 'Não informado'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Data de Emissão</span>
                      <div className="text-sm font-medium">{creditScore.cndIssueDate || 'Não informado'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Data de Validade</span>
                      <div className="text-sm font-medium">{creditScore.cndExpiryDate || 'Não informado'}</div>
                    </div>
                  </div>
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
                  <CardTitle>SCR Bacen - Histórico Bancário</CardTitle>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    Consultado
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h6 className="font-medium">Relacionamento Bancário</h6>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm">Número de Instituições</span>
                      <div className="text-sm font-medium">{creditScore.scrInstitutions || '4'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Número de Operações</span>
                      <div className="text-sm font-medium">{creditScore.scrOperations || '7'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Situação das Operações</span>
                      <div className="text-sm font-medium text-yellow-600">{creditScore.scrStatus || 'Atenção'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Valor a Vencer</span>
                      <div className="text-sm font-medium">{creditScore.scrDueAmount || 'R$ 400.000 - R$ 500.000'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Valor Vencido</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.scrOverdueAmount || 'R$ 0,00'}</div>
                    </div>
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
                  <CardTitle>Detalhamento Negativo - Pendências</CardTitle>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    Consultado
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h6 className="font-medium">Protestos e Restrições</h6>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm">Quantidade de Protestos</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.protestsCount || '0'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Valor Total dos Protestos</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.protestsValue || 'R$ 0,00'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Ações Judiciais</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.lawsuitsCount || '0'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Valor das Ações</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.lawsuitsValue || 'R$ 0,00'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Cheques sem Fundo</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.bouncedChecksCount || '0'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Falências e Recuperações</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.bankruptciesCount || '0'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm">Participações em Falências</span>
                      <div className="text-sm font-medium text-green-600">{creditScore.bankruptcyParticipations || '0'}</div>
                    </div>
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