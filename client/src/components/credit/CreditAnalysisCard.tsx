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
  Users,
  DollarSign,
  FileText,
  Gavel,
  AlertCircle
} from 'lucide-react';
import { CreditScore } from '@/shared/schema';
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

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getStatusBadge = (hasIssue: boolean, text: string) => {
    return hasIssue ? (
      <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
        <XCircle className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Não possui
      </Badge>
    );
  };

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

      {/* Card Principal com Resumo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Credit Score</h4>
                <p className="text-sm text-gray-600">{creditScore.companyName}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-red-100 text-red-700">
              {getScoreLevel(creditScore.creditScore)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">{creditScore.creditScore}</span>
              <span className="text-sm text-gray-500">de 1000 pontos</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${getScoreColor(creditScore.creditScore)}`}
                style={{ width: `${(creditScore.creditScore / 1000) * 100}%` }}
              />
            </div>
          </div>

          {/* Grid de Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium">Análise de Risco</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Débitos</span>
                  {getStatusBadge(creditScore.hasDebts, 'Possui')}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Protestos</span>
                  {getStatusBadge(creditScore.hasProtests, 'Possui')}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium">Histórico Financeiro</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Falência/Recuperação</span>
                  {getStatusBadge(creditScore.hasBankruptcy, 'Possui')}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ações Judiciais</span>
                  {getStatusBadge(creditScore.hasLawsuits, 'Possui')}
                </div>
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
          
          {/* Score QUOD - Pontuação de Crédito */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Score QUOD - Pontuação de Crédito</CardTitle>
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    {creditScore.creditScore} pontos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-blue-600">{creditScore.creditScore}</span>
                  <span className="text-gray-500">de 1000 pontos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${getScoreColor(creditScore.creditScore)}`}
                    style={{ width: `${(creditScore.creditScore / 1000) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <h6 className="font-medium mb-2">Análise de Risco</h6>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Capacidade de Pagamento:</span>
                        <span className="text-sm font-medium">Não informado</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Possui Débitos:</span>
                        <span className="text-sm font-medium text-green-600">Não</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Protestos:</span>
                        <span className="text-sm font-medium text-green-600">Não</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium mb-2">Histórico Financeiro</h6>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Falência/Recuperação:</span>
                        <span className="text-sm font-medium text-green-600">Não</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Ações Judiciais:</span>
                        <span className="text-sm font-medium text-green-600">Não</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cadastro PJ Plus - Dados Empresariais */}
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
                  <h6 className="font-semibold text-lg">{creditScore.companyName}</h6>
                  <p className="text-gray-600">{creditScore.tradeName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium mb-2">Dados da Empresa</h6>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{creditScore.city}, {creditScore.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{creditScore.foundationDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Razão Social: {creditScore.companyName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="font-medium mb-2">Contato</h6>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{creditScore.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{creditScore.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Situação: Ativa</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="font-medium mb-2">Capital Social</h6>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(creditScore.socialCapital)}
                  </p>
                </div>

                {creditScore.mainActivity && (
                  <div>
                    <h6 className="font-medium mb-2">Atividade Econômica</h6>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">Atividade Principal</p>
                        <p className="text-sm text-gray-600">{creditScore.mainActivity}</p>
                      </div>
                      {creditScore.secondaryActivities && (
                        <div>
                          <p className="font-medium">Atividades Secundárias</p>
                          <div className="space-y-1">
                            {creditScore.secondaryActivities.slice(0, 3).map((activity: string, index: number) => (
                              <p key={index} className="text-sm text-gray-600">{activity}</p>
                            ))}
                            {creditScore.secondaryActivities.length > 3 && (
                              <p className="text-sm text-gray-500">+{creditScore.secondaryActivities.length - 3} outras atividades</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {creditScore.partners && creditScore.partners.length > 0 && (
                  <div>
                    <h6 className="font-medium mb-2">Sócios</h6>
                    <div className="space-y-2">
                      {creditScore.partners.map((partner: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{partner.name}</span>
                          <span className="text-sm font-medium text-purple-600">{partner.participation}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CND - Certidões Negativas de Débitos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>CND - Certidões Negativas de Débitos</CardTitle>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                    Consulta não realizada
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h6 className="font-medium mb-2">Consulta CND não realizada</h6>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Não foi possível emitir a Certidão Negativa. Por favor, acesse a opção 
                  Relatório de Pendências Fiscais para visualização de débitos e/ou 
                  pendências no Sintegra/Sefaz de São Paulo ou compareça a uma 
                  região fiscal mais próxima.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SCR Bacen - Histórico Bancário */}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium mb-2">Relacionamento Bancário</h6>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Instituições:</span>
                        <span className="text-sm font-medium">{creditScore.bankInstitutions || 4}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Operações:</span>
                        <span className="text-sm font-medium">{creditScore.bankOperations || 7}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Situação:</span>
                        <span className="text-sm font-medium text-yellow-600">Atenção</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium mb-2">Valores</h6>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Volume:</span>
                        <span className="text-sm font-medium">Normal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">A Vencer:</span>
                        <span className="text-sm font-medium">R$ 400.000,00 a R$ 500.000,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Vencido:</span>
                        <span className="text-sm font-medium text-green-600">R$ 0,00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="font-medium mb-2">Índices</h6>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total:</span>
                        <span className="text-sm font-medium">R$ 20.000,00 a R$ 30.000,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cartão:</span>
                        <span className="text-sm font-medium">R$ 10.000,00 a R$ 20.000,00</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Crédito Pessoal:</span>
                        <span className="text-sm font-medium">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cheque Especial:</span>
                        <span className="text-sm font-medium">R$ 5.000,00 a R$ 10.000,00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento Negativo - Pendências */}
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
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">protestos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">ações</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">cheques</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h6 className="font-medium mb-2 text-red-600">Protestos</h6>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Quantidade:</span>
                        <span className="text-sm font-medium text-green-600">0</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium mb-2 text-orange-600">Ações Judiciais</h6>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Quantidade:</span>
                        <span className="text-sm font-medium text-green-600">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Valor Total:</span>
                        <span className="text-sm font-medium text-green-600">0</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium mb-2 text-yellow-600">Outras Restrições</h6>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Cheques sem Fundo:</span>
                        <span className="text-sm font-medium text-green-600">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Recuperações:</span>
                        <span className="text-sm font-medium text-green-600">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Falências:</span>
                        <span className="text-sm font-medium text-green-600">0</span>
                      </div>
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