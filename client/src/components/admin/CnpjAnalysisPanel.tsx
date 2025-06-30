import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, Building2, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CnpjData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacao: string;
  dataSituacao: string;
  porte: string;
  naturezaJuridica: string;
  capital: number;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  telefone?: string;
  email?: string;
  dataAbertura: string;
  atividadePrincipal: {
    codigo: string;
    descricao: string;
  };
  socios: Array<{
    nome: string;
    qualificacao: string;
  }>;
}

interface CnpjAnalysis {
  id: number;
  cnpj: string;
  creditApplicationId?: number;
  companyData: CnpjData;
  apiResponse: any;
  consultedAt: string;
  consultedBy: number;
}

interface CnpjAnalysisPanelProps {
  creditApplicationId?: number;
  cnpj?: string;
}

export default function CnpjAnalysisPanel({ creditApplicationId, cnpj }: CnpjAnalysisPanelProps) {
  const [searchCnpj, setSearchCnpj] = useState(cnpj || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing analysis for this CNPJ
  const { data: existingAnalysis } = useQuery({
    queryKey: ['/api/admin/cnpj-analysis', searchCnpj],
    queryFn: () => searchCnpj ? apiRequest(`/api/admin/cnpj-analysis/${searchCnpj}`) : null,
    enabled: !!searchCnpj && searchCnpj.length >= 14
  });

  // Fetch analyses for credit application
  const { data: applicationAnalyses } = useQuery({
    queryKey: ['/api/admin/cnpj-analysis/application', creditApplicationId],
    queryFn: () => creditApplicationId ? apiRequest(`/api/admin/cnpj-analysis/application/${creditApplicationId}`) : [],
    enabled: !!creditApplicationId
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { cnpj: string; creditApplicationId?: number }) => {
      setIsAnalyzing(true);
      try {
        return await apiRequest('/api/admin/cnpj-analysis', 'POST', data);
      } finally {
        setIsAnalyzing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cnpj-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cnpj-analysis/application'] });
    }
  });

  const handleAnalyze = () => {
    if (!searchCnpj) return;
    
    const cleanCnpj = searchCnpj.replace(/[^\d]/g, '');
    if (cleanCnpj.length !== 14) {
      alert('CNPJ deve conter 14 dígitos');
      return;
    }

    analyzeMutation.mutate({ 
      cnpj: cleanCnpj, 
      creditApplicationId: creditApplicationId 
    });
  };

  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSituationBadge = (situacao: string) => {
    const situation = situacao?.toLowerCase();
    if (situation?.includes('ativa')) {
      return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
    } else if (situation?.includes('suspensa')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Suspensa</Badge>;
    } else if (situation?.includes('baixada')) {
      return <Badge className="bg-red-100 text-red-800">Baixada</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{situacao}</Badge>;
  };

  const renderAnalysisCard = (analysis: CnpjAnalysis) => {
    const data = analysis.companyData;
    
    return (
      <Card key={analysis.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {data.razaoSocial}
            </CardTitle>
            {getSituationBadge(data.situacao)}
          </div>
          <div className="text-sm text-gray-600">
            CNPJ: {formatCnpj(analysis.cnpj)} | Consultado em: {new Date(analysis.consultedAt).toLocaleString('pt-BR')}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Informações Básicas</h4>
                <div className="space-y-1 text-sm">
                  {data.nomeFantasia && (
                    <div><span className="font-medium">Nome Fantasia:</span> {data.nomeFantasia}</div>
                  )}
                  <div><span className="font-medium">Porte:</span> {data.porte}</div>
                  <div><span className="font-medium">Natureza Jurídica:</span> {data.naturezaJuridica}</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Abertura:</span> {new Date(data.dataAbertura).toLocaleDateString('pt-BR')}
                  </div>
                  <div><span className="font-medium">Capital:</span> {formatCurrency(data.capital)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Atividade Principal</h4>
                <div className="text-sm">
                  <div><span className="font-medium">Código:</span> {data.atividadePrincipal.codigo}</div>
                  <div><span className="font-medium">Descrição:</span> {data.atividadePrincipal.descricao}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h4>
                <div className="text-sm">
                  <div>{data.endereco.logradouro}, {data.endereco.numero}</div>
                  {data.endereco.complemento && <div>{data.endereco.complemento}</div>}
                  <div>{data.endereco.bairro}</div>
                  <div>{data.endereco.municipio}/{data.endereco.uf}</div>
                  <div>CEP: {data.endereco.cep}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Contato</h4>
                <div className="text-sm space-y-1">
                  {data.telefone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {data.telefone}
                    </div>
                  )}
                  {data.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {data.email}
                    </div>
                  )}
                </div>
              </div>

              {data.socios && data.socios.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Sócios</h4>
                  <div className="text-sm space-y-1">
                    {data.socios.slice(0, 3).map((socio, index) => (
                      <div key={index}>
                        <span className="font-medium">{socio.nome}</span>
                        <div className="text-gray-600">{socio.qualificacao}</div>
                      </div>
                    ))}
                    {data.socios.length > 3 && (
                      <div className="text-gray-600">+ {data.socios.length - 3} outros sócios</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Análise de CNPJ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite o CNPJ (apenas números ou formatado)"
              value={searchCnpj}
              onChange={(e) => setSearchCnpj(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !searchCnpj}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
          
          {analyzeMutation.error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {analyzeMutation.error.message || 'Erro ao analisar CNPJ'}
            </div>
          )}
          
          {analyzeMutation.data && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              Análise realizada com sucesso!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show existing analysis for searched CNPJ */}
      {existingAnalysis && renderAnalysisCard(existingAnalysis)}

      {/* Show analyses for current credit application */}
      {applicationAnalyses && applicationAnalyses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Análises desta Solicitação</h3>
          {applicationAnalyses.map((analysis: CnpjAnalysis) => renderAnalysisCard(analysis))}
        </div>
      )}
    </div>
  );
}