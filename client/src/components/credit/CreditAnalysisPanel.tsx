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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
          <h3 className="text-lg font-semibold">{t('credit.analysis.title')}</h3>
          {onRefresh && permissions.isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? t('credit.analysis.consulting') : t('credit.analysis.consultCreditScore')}
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">{t('credit.analysis.notPerformed')}</p>
              <p className="text-sm">
                {permissions.isAdmin 
                  ? t('credit.analysis.clickToStartAnalysis')
                  : t('credit.analysis.onlyForAdmins')
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
      title: t('credit.analysis.scoreQuodTitle'),
      icon: <TrendingUp className="w-5 h-5" />,
      status: creditScore.creditScore > 600 ? 'success' : creditScore.creditScore > 400 ? 'warning' : 'error',
      statusText: t('credit.analysis.points', { score: creditScore.creditScore.toString() }),
      color: 'blue',
      summary: (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-blue-600">{creditScore.creditScore}</div>
            <div className="text-sm text-gray-600">{t('credit.analysis.outOf1000Points')}</div>
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
              <h4 className="font-semibold text-gray-900">{t('credit.analysis.riskAnalysis')}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t('credit.analysis.paymentCapacity')}:</span>
                  <span className="font-medium">{creditScore.capacidadePagamento || t('common.notInformed')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('credit.analysis.hasDebts')}:</span>
                  <span className={creditScore.hasDebts ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasDebts ? t('common.yes') : t('common.no')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('credit.analysis.protests')}:</span>
                  <span className={creditScore.hasProtests ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasProtests ? t('common.yes') : t('common.no')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">{t('credit.analysis.financialHistory')}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t('credit.analysis.bankruptcyRecovery')}:</span>
                  <span className={creditScore.hasBankruptcy ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasBankruptcy ? t('common.yes') : t('common.no')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('credit.analysis.lawsuits')}:</span>
                  <span className={creditScore.hasLawsuits ? 'text-red-600' : 'text-green-600'}>
                    {creditScore.hasLawsuits ? t('common.yes') : t('common.no')}
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
      title: t('credit.analysis.companyRegistrationTitle'),
      icon: <Building className="w-5 h-5" />,
      status: creditScore.status === 'ATIVA' ? 'success' : 'warning',
      statusText: creditScore.status || t('common.notInformed'),
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
              {creditScore.openingDate ? new Date(creditScore.openingDate).toLocaleDateString('pt-BR') : t('common.notInformed')}
            </span>
          </div>
        </div>
      ),
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">{t('credit.analysis.companyData')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('credit.analysis.legalName')}:</span>
                  <span className="font-medium">{creditScore.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('credit.analysis.tradingName')}:</span>
                  <span className="font-medium">{creditScore.tradingName}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('credit.analysis.status')}:</span>
                  <span className={creditScore.status === 'ATIVA' ? 'text-green-600' : 'text-red-600'}>
                    {creditScore.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('credit.analysis.shareCapital')}:</span>
                  <span className="font-medium">{creditScore.shareCapital}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">{t('credit.analysis.contact')}</h4>
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
            <h4 className="font-semibold text-gray-900">{t('credit.analysis.economicActivity')}</h4>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm">{t('credit.analysis.mainActivity')}</div>
                <div className="text-sm text-gray-600">
                  {creditScore.mainActivity?.code} - {creditScore.mainActivity?.description}
                </div>
              </div>
              {creditScore.secondaryActivities && creditScore.secondaryActivities.length > 0 && (
                <div className="space-y-1">
                  <div className="font-medium text-sm">{t('credit.analysis.secondaryActivities')}</div>
                  {creditScore.secondaryActivities.slice(0, 3).map((activity: any, index: number) => (
                    <div key={index} className="text-sm text-gray-600">
                      {activity.code} - {activity.description}
                    </div>
                  ))}
                  {creditScore.secondaryActivities.length > 3 && (
                    <div className="text-sm text-gray-500">
                      {t('credit.analysis.otherActivities', { count: (creditScore.secondaryActivities.length - 3).toString() })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sócios */}
          {creditScore.partners && creditScore.partners.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">{t('credit.analysis.partners')}</h4>
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
      title: t('credit.analysis.cndTitle'),
      icon: <Shield className="w-5 h-5" />,
      status: creditScore.cndStatus === 'Consultado' ? 
        (creditScore.cndHasDebts ? 'error' : 'success') : 'neutral',
      statusText: creditScore.cndStatus || t('credit.analysis.notConsulted'),
      color: 'green',
      summary: (
        <div className="space-y-2">
          {creditScore.cndStatus === 'Consultado' ? (
            <div className="space-y-1">
              <div className={`text-sm font-medium ${creditScore.cndHasDebts ? 'text-red-600' : 'text-green-600'}`}>
                {creditScore.cndHasDebts ? t('credit.analysis.hasDebts') : t('credit.analysis.regularNoDebts')}
              </div>
              {creditScore.cndCertificateNumber && (
                <div className="text-sm text-gray-600">
                  {t('credit.analysis.certificate')}: {creditScore.cndCertificateNumber}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {t('credit.analysis.consultationNotPerformed')}
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
                  <h4 className="font-semibold text-gray-900">{t('credit.analysis.certificateInfo')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.number')}:</span>
                      <span className="font-medium">{creditScore.cndCertificateNumber || t('common.notInformed')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.validationCode')}:</span>
                      <span className="font-medium">{creditScore.cndValidationCode || t('common.notInformed')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.state')}:</span>
                      <span className="font-medium">{creditScore.cndState || t('common.notInformed')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{t('credit.analysis.validity')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.issueDate')}:</span>
                      <span className="font-medium">
                        {creditScore.cndIssueDate ? new Date(creditScore.cndIssueDate).toLocaleDateString('pt-BR') : t('common.notInformed')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.expiryDate')}:</span>
                      <span className="font-medium">
                        {creditScore.cndExpiryDate ? new Date(creditScore.cndExpiryDate).toLocaleDateString('pt-BR') : t('common.notInformed')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {creditScore.cndHasDebts && creditScore.cndDebtsDetails && (creditScore.cndDebtsDetails as any[]).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 text-red-600">{t('credit.analysis.debtsFound')}</h4>
                  <div className="space-y-2">
                    {(creditScore.cndDebtsDetails as any[]).map((debt: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-red-900">{debt.tipo || t('credit.analysis.debt')}</div>
                          <div className="text-red-700">{debt.descricao || t('credit.analysis.descriptionNotAvailable')}</div>
                          {debt.valor && (
                            <div className="text-red-800 font-medium">
                              {t('credit.analysis.value')}: {formatCurrency(debt.valor)}
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
              <p>{t('credit.analysis.cndConsultationNotPerformed')}</p>
            </div>
          )}
        </div>
      )
    },

    // 4. SCR Bacen
    {
      title: t('credit.analysis.scrBacenTitle'),
      icon: <CreditCard className="w-5 h-5" />,
      status: creditScore.scrStatus === 'Consultado' ? 'success' : 'neutral',
      statusText: creditScore.scrStatus || t('credit.analysis.notConsulted'),
      color: 'indigo',
      summary: (
        <div className="space-y-2">
          {creditScore.scrStatus === 'Consultado' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <span className="font-medium">{creditScore.scrQuantidadeInstituicoes || 0}</span> {t('credit.analysis.institutions')}
                </span>
                <span>
                  <span className="font-medium">{creditScore.scrQuantidadeOperacoes || 0}</span> {t('credit.analysis.operations')}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {t('credit.analysis.profile')}: {creditScore.scrPerfil || t('common.notInformed')}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {t('credit.analysis.consultationNotPerformed')}
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
                  <h4 className="font-semibold text-gray-900">{t('credit.analysis.bankingRelationship')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.institutions')}:</span>
                      <span className="font-medium">{creditScore.scrQuantidadeInstituicoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.operations')}:</span>
                      <span className="font-medium">{creditScore.scrQuantidadeOperacoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.profile')}:</span>
                      <span className="font-medium">{creditScore.scrPerfil || t('common.notInformed')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.situation')}:</span>
                      <span className="font-medium">{creditScore.scrSituacao || t('common.notInformed')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{t('credit.analysis.values')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.volume')}:</span>
                      <span className="font-medium">{creditScore.scrVolume || t('common.notInformed')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.toDue')}:</span>
                      <span className="font-medium">{creditScore.scrValorVencer || t('common.notInformed')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.overdue')}:</span>
                      <span className="font-medium">{creditScore.scrValorVencido || t('common.notInformed')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">{t('credit.analysis.indices')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.total')}:</span>
                      <span className="font-medium">{creditScore.scrIndiceTotal || t('common.notInformed')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.card')}:</span>
                      <span className="font-medium">{creditScore.scrIndiceCartao || t('common.notInformed')}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.personalCredit')}:</span>
                      <span className="font-medium">{creditScore.scrIndiceCreditoPessoal || t('common.notInformed')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.overdraft')}:</span>
                      <span className="font-medium">{creditScore.scrIndiceChequeEspecial || t('common.notInformed')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>{t('credit.analysis.scrBacenConsultationNotPerformed')}</p>
            </div>
          )}
        </div>
      )
    },

    // 5. Detalhamento Negativo
    {
      title: t('credit.analysis.negativeDetailTitle'),
      icon: <AlertTriangle className="w-5 h-5" />,
      status: creditScore.detalhamentoStatus === 'Consultado' ? 
        (creditScore.detalhamentoProtestos > 0 || creditScore.detalhamentoAcoesJudiciais > 0 ? 'error' : 'success') : 'neutral',
      statusText: creditScore.detalhamentoStatus || t('credit.analysis.notConsulted'),
      color: 'red',
      summary: (
        <div className="space-y-2">
          {creditScore.detalhamentoStatus === 'Consultado' ? (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="font-medium text-red-600">{creditScore.detalhamentoProtestos || 0}</span>
                <span>{t('credit.analysis.protestsLower')}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-orange-600">{creditScore.detalhamentoAcoesJudiciais || 0}</span>
                <span>{t('credit.analysis.actionsLower')}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-yellow-600">{creditScore.detalhamentoChequesSemdFundo || 0}</span>
                <span>{t('credit.analysis.checksLower')}</span>
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {t('credit.analysis.consultationNotPerformed')}
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
                  <h4 className="font-medium text-red-900 mb-2">{t('credit.analysis.protests')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.quantity')}:</span>
                      <span className="font-bold text-red-600">{creditScore.detalhamentoProtestos || 0}</span>
                    </div>
                    {creditScore.detalhamentoValorProtestos && (
                      <div className="flex justify-between">
                        <span>{t('credit.analysis.totalValue')}:</span>
                        <span className="font-bold text-red-600">R$ {creditScore.detalhamentoValorProtestos}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">{t('credit.analysis.lawsuits')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.quantity')}:</span>
                      <span className="font-bold text-orange-600">{creditScore.detalhamentoAcoesJudiciais || 0}</span>
                    </div>
                    {creditScore.detalhamentoValorAcoes && (
                      <div className="flex justify-between">
                        <span>{t('credit.analysis.totalValue')}:</span>
                        <span className="font-bold text-orange-600">R$ {creditScore.detalhamentoValorAcoes}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">{t('credit.analysis.otherRestrictions')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.bouncedChecks')}:</span>
                      <span className="font-bold text-yellow-600">{creditScore.detalhamentoChequesSemdFundo || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.recoveries')}:</span>
                      <span className="font-bold text-yellow-600">{creditScore.detalhamentoRecuperacoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('credit.analysis.bankruptcies')}:</span>
                      <span className="font-bold text-yellow-600">{creditScore.detalhamentoFalencias || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              {creditScore.detalhamentoProtestosDetalhes && (creditScore.detalhamentoProtestosDetalhes as any[]).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{t('credit.analysis.protestDetails')}</h4>
                  <div className="space-y-2">
                    {(creditScore.detalhamentoProtestosDetalhes as any[]).slice(0, 3).map((protesto, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-red-900">{protesto.situacao || t('credit.analysis.protest')}</div>
                          <div className="text-red-700">{t('credit.analysis.value')}: R$ {protesto.valorTotal || t('common.notInformed')}</div>
                        </div>
                      </div>
                    ))}
                    {(creditScore.detalhamentoProtestosDetalhes as any[]).length > 3 && (
                      <div className="text-sm text-gray-500 text-center">
                        {t('credit.analysis.otherProtests', { count: ((creditScore.detalhamentoProtestosDetalhes as any[]).length - 3).toString() })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>{t('credit.analysis.pendenciesConsultationNotPerformed')}</p>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('credit.analysis.title')}</h3>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? t('credit.analysis.updating') : t('credit.analysis.update')}
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