import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import type { CreditApplication } from '@shared/schema';

// Format CNPJ function
function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return cnpj;
  return cleanCnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

interface CreditScoreAnalysisProps {
  application: CreditApplication;
}

export default function CreditScoreAnalysis({ application }: CreditScoreAnalysisProps) {
  const [directdData, setDirectdData] = useState<any>(null);
  const [isLoadingDirectd, setIsLoadingDirectd] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const { toast } = useToast();
  const permissions = useUserPermissions();

  // Fetch existing Directd data on component mount
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        console.log('🔍 Fetching Directd company data for application:', application.id);
        const directdResponse = await apiRequest(`/api/credit/applications/${application.id}/directd-company-data`, 'GET');
        if (directdResponse && directdResponse.success) {
          console.log('✅ Existing Directd data found:', directdResponse.data);
          setDirectdData(directdResponse.data);
        }
      } catch (error) {
        console.log('ℹ️ No existing Directd data found for application:', application.id);
      }
    };
    
    fetchExistingData();
  }, [application.id]);

  const handleConsultar = async () => {
    if (!permissions.isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Análise de crédito disponível apenas para administradores",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingDirectd(true);
    try {
      console.log('🔍 Fetching comprehensive company data for application:', application.id);
      const response = await apiRequest(`/api/credit/applications/${application.id}/directd-company-data`, 'GET');
      
      if (response.success) {
        setDirectdData(response.data);
        toast({
          title: "Consulta realizada com sucesso!",
          description: response.source === 'api' ? 'Dados obtidos da Directd.com.br' : 'Dados de demonstração carregados',
          variant: "default"
        });
      } else {
        throw new Error(response.error || 'Falha na consulta');
      }
    } catch (error) {
      console.error('❌ Error fetching Directd data:', error);
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Falha ao consultar dados da empresa",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDirectd(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsLoadingPdf(true);
    try {
      console.log('📄 Requesting consultation PDF for application:', application.id);
      const response = await fetch(`/api/credit/applications/${application.id}/consultation-pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `consulta-spark-comex-${application.cnpj.replace(/\D/g, '')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "PDF gerado com sucesso!",
          description: "Comprovante de consulta baixado",
          variant: "default"
        });
      } else {
        throw new Error('Falha ao gerar PDF');
      }
    } catch (error) {
      console.error('❌ PDF download error:', error);
      toast({
        title: "Erro no download",
        description: "Erro ao gerar comprovante de consulta",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Initial Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Análise Completa da Empresa</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1 break-all">
            CNPJ: {formatCNPJ(application.cnpj)}
          </p>
        </CardHeader>
        <CardContent>
          {permissions.isAdmin && (
            <Button 
              onClick={handleConsultar} 
              disabled={isLoadingDirectd}
              className="w-full mb-4"
            >
              {isLoadingDirectd ? "Consultando..." : directdData ? "Atualizar Dados da Empresa" : "Consultar Dados da Empresa"}
            </Button>
          )}
          
          {!permissions.isAdmin && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Análise de crédito disponível apenas para administradores
                  </p>
                </div>
              </div>
            </div>
          )}

          {directdData && (
            <div className="space-y-4">
              {/* Basic Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informações Básicas</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Razão Social:</span> {directdData.razaoSocial}</div>
                    <div><span className="text-gray-600">Nome Fantasia:</span> {directdData.nomeFantasia || 'N/A'}</div>
                    <div><span className="text-gray-600">Situação:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${directdData.situacaoCadastral === 'ATIVA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {directdData.situacaoCadastral}
                      </span>
                    </div>
                    <div><span className="text-gray-600">Data Fundação:</span> {directdData.dataFundacao}</div>
                    <div><span className="text-gray-600">Porte:</span> {directdData.porte}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dados Fiscais</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Natureza Jurídica:</span> {directdData.naturezaJuridicaDescricao}</div>
                    <div><span className="text-gray-600">Tributação:</span> {directdData.tributacao}</div>
                    <div><span className="text-gray-600">Simples Nacional:</span> {directdData.opcaoSimples}</div>
                    <div><span className="text-gray-600">MEI:</span> {directdData.opcaoMEI}</div>
                    <div><span className="text-gray-600">Faixa Faturamento:</span> {directdData.faixaFaturamento}</div>
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Atividade Econômica</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-600">CNAE Principal:</span> {directdData.cnaeCodigo} - {directdData.cnaeDescricao}</div>
                  {directdData.cnaesSecundarios && directdData.cnaesSecundarios.length > 0 && (
                    <div>
                      <span className="text-gray-600">CNAEs Secundários:</span>
                      <ul className="mt-1 ml-4 space-y-1">
                        {directdData.cnaesSecundarios.slice(0, 3).map((cnae: any, index: number) => (
                          <li key={index} className="text-xs">
                            {cnae.cnaeCodigoSecundario} - {cnae.cnaeDescricaoSecundario}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Operational Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Operacional</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Funcionários:</span> {directdData.quantidadeFuncionarios || 'N/A'}</div>
                    <div><span className="text-gray-600">Faixa:</span> {directdData.faixaFuncionarios || 'N/A'}</div>
                    <div><span className="text-gray-600">Filiais:</span> {directdData.quantidadeFiliais || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tipo</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Tipo:</span> {directdData.tipoEmpresa}</div>
                    <div><span className="text-gray-600">Matriz:</span> {directdData.matriz ? 'Sim' : 'Não'}</div>
                    <div><span className="text-gray-600">Órgão Público:</span> {directdData.orgaoPublico}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Financeiro</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Faturamento Médio CNAE:</span> {directdData.faturamentoMedioCNAE || 'N/A'}</div>
                    <div><span className="text-gray-600">Faturamento Presumido:</span> {directdData.faturamentoPresumido || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Partners */}
              {directdData.socios && directdData.socios.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Sócios/Administradores</h4>
                  <div className="space-y-2">
                    {directdData.socios.slice(0, 5).map((socio: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                        <div>
                          <div className="font-medium">{socio.nome}</div>
                          <div className="text-gray-600 text-xs">{socio.cargo}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{socio.percentualParticipacao}%</div>
                          <div className="text-gray-600 text-xs">Desde: {socio.dataEntrada}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {directdData.telefones && directdData.telefones.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Telefones</h4>
                    <div className="space-y-1 text-sm">
                      {directdData.telefones.slice(0, 3).map((telefone: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{telefone.telefoneComDDD}</span>
                          <span className="text-gray-600 text-xs">{telefone.tipoTelefone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {directdData.emails && directdData.emails.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">E-mails</h4>
                    <div className="space-y-1 text-sm">
                      {directdData.emails.slice(0, 3).map((email: any, index: number) => (
                        <div key={index}>{email.enderecoEmail}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Last Update */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-gray-600">
                  Última consulta: {new Date(directdData.createdAt).toLocaleDateString('pt-BR')}
                </span>
                {permissions.isAdmin && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={isLoadingPdf}
                  >
                    {isLoadingPdf ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 mr-1" />
                    )}
                    Relatório
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}