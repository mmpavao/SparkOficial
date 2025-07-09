import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  TrendingUp, 
  Building, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  CreditCard,
  DollarSign,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CreditScore } from '@/shared/schema';
import { formatCurrency } from '@/lib/formatters';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface CreditAnalysisPanelProps {
  creditScore: CreditScore;
  onRefresh?: () => void;
  isLoading?: boolean;
}

interface APISection {
  title: string;
  icon: React.ReactNode;
  status: 'success' | 'warning' | 'error' | 'neutral';
  statusText: string;
  summary: React.ReactNode;
  details: React.ReactNode;
  color: string;
}

export default function CreditAnalysisPanel({ creditScore, onRefresh, isLoading }: CreditAnalysisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const permissions = useUserPermissions();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Show loading state or empty state if no credit score
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, text: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      neutral: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        {getStatusIcon(status)}
        <span className="ml-1">{text}</span>
      </Badge>
    );
  };

  // Preparar dados das seções
  const apiSections: APISection[] = [
    // 1. Score QUOD
    {
      title: 'Score QUOD - Pontuação de Crédito',
      icon: <TrendingUp className="w-5 h-5" />,
      status: creditScore.creditScore > 600 ? 'success' : creditScore.creditScore > 400 ? 'warning' : 'error',
      statusText: `${creditScore.creditScore} pontos`,
      color: 'blue',
      summary: (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-blue-600">{creditScore.creditScore}</div>
            <div className="text-sm text-gray-600">de 1000 pontos</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((creditScore.creditScore / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>
      ),
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Análise de Risco</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Capacidade de Pagamento:</span>
                  <span className="font-medium">{creditScore.capacidadePagamento || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Possui Débitos:</span>
                  <span className={creditScore.hasDebts ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasDebts ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Protestos:</span>
                  <span className={creditScore.hasProtests ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasProtests ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Histórico Financeiro</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Falência/Recuperação:</span>
                  <span className={creditScore.hasBankruptcy ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasBankruptcy ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ações Judiciais:</span>
                  <span className={creditScore.hasLawsuits ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasLawsuits ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // 2. Cadastro PJ Plus
    {
      title: 'Cadastro PJ Plus - Dados Empresariais',
      icon: <Building className="w-5 h-5" />,
      status: creditScore.status === 'ATIVA' ? 'success' : 'warning',
      statusText: creditScore.status || 'Não informado',
      color: 'purple',
      summary: (
        <div className="space-y-2">
          <div className="text-sm">
            <div className="font-medium">{creditScore.legalName}</div>
            <div className="text-gray-600">{creditScore.tradingName}</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {creditScore.city}, {creditScore.state}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {creditScore.openingDate ? new Date(creditScore.openingDate).toLocaleDateString('pt-BR') : 'Não informado'}
            </span>
          </div>
        </div>
      ),
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Dados da Empresa</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Razão Social:</span>
                  <span className="font-medium">{creditScore.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nome Fantasia:</span>
                  <span className="font-medium">{creditScore.tradingName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Situação:</span>
                  <span className={creditScore.status === 'ATIVA' ? 'text-green-600' : 'text-red-600'}>
                    {creditScore.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Capital Social:</span>
                  <span className="font-medium">{creditScore.shareCapital}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Contato</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{creditScore.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{creditScore.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{creditScore.email}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Atividade Econômica */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Atividade Econômica</h4>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm">Atividade Principal</div>
                <div className="text-sm text-gray-600">
                  {creditScore.mainActivity?.code} - {creditScore.mainActivity?.description}
                </div>
              </div>
              {creditScore.secondaryActivities && creditScore.secondaryActivities.length > 0 && (
                <div className="space-y-1">
                  <div className="font-medium text-sm">Atividades Secundárias</div>
                  {creditScore.secondaryActivities.slice(0, 3).map((activity: any, index: number) => (
                    <div key={index} className="text-sm text-gray-600">
                      {activity.code} - {activity.description}
                    </div>
                  ))}
                  {creditScore.secondaryActivities.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{creditScore.secondaryActivities.length - 3} outras atividades
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sócios */}
          {creditScore.partners && creditScore.partners.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Sócios</h4>
              <div className="space-y-2">
                {creditScore.partners.map((partner: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{partner.name}</div>
                        <div className="text-sm text-gray-600">{partner.qualification}</div>
                      </div>
                      {partner.participationPercentage && (
                        <div className="text-sm font-medium text-purple-600">
                          {partner.participationPercentage}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },

    // 3. CND - Certidões Negativas
    {
      title: 'CND - Certidões Negativas de Débitos',
      icon: <Shield className="w-5 h-5" />,
      status: creditScore.cndStatus === 'Consultado' ? 
        (creditScore.cndHasDebts ? 'error' : 'success') : 'neutral',
      statusText: creditScore.cndStatus || 'Não Consultado',
      color: 'green',
      summary: (
        <div className="space-y-2">
          {creditScore.cndStatus === 'Consultado' ? (
            <div className="space-y-1">
              <div className={`text-sm font-medium ${creditScore.cndHasDebts ? 'text-red-600' : 'text-green-600'}`}>
                {creditScore.cndHasDebts ? 'Possui Débitos' : 'Regular - Sem Débitos'}
              </div>
              {creditScore.cndCertificateNumber && (
                <div className="text-sm text-gray-600">
                  Certidão: {creditScore.cndCertificateNumber}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Consulta não realizada
            </div>
          )}
        </div>
      ),
      details: (
        <div className="space-y-4">
          {creditScore.cndStatus === 'Consultado' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Informações da Certidão</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Número:</span>
                      <span className="font-medium">{creditScore.cndCertificateNumber || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Código Validação:</span>
                      <span className="font-medium">{creditScore.cndValidationCode || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className="font-medium">{creditScore.cndState || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Validade</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Emissão:</span>
                      <span className="font-medium">
                        {creditScore.cndIssueDate ? new Date(creditScore.cndIssueDate).toLocaleDateString('pt-BR') : 'Não informado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validade:</span>
                      <span className="font-medium">
                        {creditScore.cndExpiryDate ? new Date(creditScore.cndExpiryDate).toLocaleDateString('pt-BR') : 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {creditScore.cndHasDebts && creditScore.cndDebtsDetails && (creditScore.cndDebtsDetails as any[]).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 text-red-600">Débitos Encontrados</h4>
                  <div className="space-y-2">
                    {(creditScore.cndDebtsDetails as any[]).map((debt: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-red-900">{debt.tipo || 'Débito'}</div>
                          <div className="text-red-700">{debt.descricao || 'Descrição não disponível'}</div>
                          {debt.valor && (
                            <div className="text-red-800 font-medium">
                              Valor: {formatCurrency(debt.valor)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Consulta CND não realizada</p>
            </div>
          )}
        </div>
      )
    },

    // 4. SCR Bacen
    {
      title: 'SCR Bacen - Histórico Bancário',
      icon: <CreditCard className="w-5 h-5" />,
      status: creditScore.scrStatus === 'Consultado' ? 'success' : 'neutral',
      statusText: creditScore.scrStatus || 'Não Consultado',
      color: 'indigo',
      summary: (
        <div className="space-y-2">
          {creditScore.scrStatus === 'Consultado' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <span className="font-medium">{creditScore.scrQuantidadeInstituicoes || 0}</span> instituições
                </span>
                <span>
                  <span className="font-medium">{creditScore.scrQuantidadeOperacoes || 0}</span> operações
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Perfil: {creditScore.scrPerfil || 'Não informado'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Consulta não realizada
            </div>
          )}
        </div>
      ),
      details: (
        <div className="space-y-4">
          {creditScore.scrStatus === 'Consultado' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Relacionamento Bancário</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Instituições:</span>
                      <span className="font-medium">{creditScore.scrQuantidadeInstituicoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operações:</span>
                      <span className="font-medium">{creditScore.scrQuantidadeOperacoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Perfil:</span>
                      <span className="font-medium">{creditScore.scrPerfil || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Situação:</span>
                      <span className="font-medium">{creditScore.scrSituacao || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Valores</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Volume:</span>
                      <span className="font-medium">{creditScore.scrVolume || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A Vencer:</span>
                      <span className="font-medium">{creditScore.scrValorVencer || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vencido:</span>
                      <span className="font-medium">{creditScore.scrValorVencido || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Índices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{creditScore.scrIndiceTotal || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartão:</span>
                      <span className="font-medium">{creditScore.scrIndiceCartao || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Crédito Pessoal:</span>
                      <span className="font-medium">{creditScore.scrIndiceCreditoPessoal || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cheque Especial:</span>
                      <span className="font-medium">{creditScore.scrIndiceChequeEspecial || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Consulta SCR Bacen não realizada</p>
            </div>
          )}
        </div>
      )
    },

    // 5. Detalhamento Negativo
    {
      title: 'Detalhamento Negativo - Pendências',
      icon: <AlertTriangle className="w-5 h-5" />,
      status: creditScore.detalhamentoStatus === 'Consultado' ? 
        (creditScore.detalhamentoProtestos > 0 || creditScore.detalhamentoAcoesJudiciais > 0 ? 'error' : 'success') : 'neutral',
      statusText: creditScore.detalhamentoStatus || 'Não Consultado',
      color: 'red',
      summary: (
        <div className="space-y-2">
          {creditScore.detalhamentoStatus === 'Consultado' ? (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="font-medium text-red-600">{creditScore.detalhamentoProtestos || 0}</span>
                <span>protestos</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-orange-600">{creditScore.detalhamentoAcoesJudiciais || 0}</span>
                <span>ações</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-yellow-600">{creditScore.detalhamentoChequesSemdFundo || 0}</span>
                <span>cheques</span>
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Consulta não realizada
            </div>
          )}
        </div>
      ),
      details: (
        <div className="space-y-4">
          {creditScore.detalhamentoStatus === 'Consultado' ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Protestos</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Quantidade:</span>
                      <span className="font-bold text-red-600">{creditScore.detalhamentoProtestos || 0}</span>
                    </div>
                    {creditScore.detalhamentoValorProtestos && (
                      <div className="flex justify-between">
                        <span>Valor Total:</span>
                        <span className="font-bold text-red-600">R$ {creditScore.detalhamentoValorProtestos}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">Ações Judiciais</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Quantidade:</span>
                      <span className="font-bold text-orange-600">{creditScore.detalhamentoAcoesJudiciais || 0}</span>
                    </div>
                    {creditScore.detalhamentoValorAcoes && (
                      <div className="flex justify-between">
                        <span>Valor Total:</span>
                        <span className="font-bold text-orange-600">R$ {creditScore.detalhamentoValorAcoes}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Outras Restrições</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Cheques sem Fundo:</span>
                      <span className="font-bold text-yellow-600">{creditScore.detalhamentoChequesSemdFundo || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recuperações:</span>
                      <span className="font-bold text-yellow-600">{creditScore.detalhamentoRecuperacoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Falências:</span>
                      <span className="font-bold text-yellow-600">{creditScore.detalhamentoFalencias || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              {creditScore.detalhamentoProtestosDetalhes && (creditScore.detalhamentoProtestosDetalhes as any[]).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Detalhes dos Protestos</h4>
                  <div className="space-y-2">
                    {(creditScore.detalhamentoProtestosDetalhes as any[]).slice(0, 3).map((protesto, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-red-900">{protesto.situacao || 'Protesto'}</div>
                          <div className="text-red-700">Valor: R$ {protesto.valorTotal || 'Não informado'}</div>
                        </div>
                      </div>
                    ))}
                    {(creditScore.detalhamentoProtestosDetalhes as any[]).length > 3 && (
                      <div className="text-sm text-gray-500 text-center">
                        +{(creditScore.detalhamentoProtestosDetalhes as any[]).length - 3} outros protestos
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Consulta de pendências não realizada</p>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Análise de Crédito 360°</h3>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {apiSections.map((section, index) => (
          <Card key={index} className="overflow-hidden">
            <Collapsible 
              open={expandedSections.includes(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        section.color === 'blue' ? 'bg-blue-100' :
                        section.color === 'purple' ? 'bg-purple-100' :
                        section.color === 'green' ? 'bg-green-100' :
                        section.color === 'indigo' ? 'bg-indigo-100' :
                        section.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {section.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <div className="mt-1">
                          {getStatusBadge(section.status, section.statusText)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {expandedSections.includes(section.title) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {section.summary}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    {section.details}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}