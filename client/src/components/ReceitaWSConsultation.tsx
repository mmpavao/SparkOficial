import React, { useState, useEffect } from 'react';
import { Building2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [consultationData, setConsultationData] = useState<ReceitaWSData | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Query for existing consultation data
  const { data: existingData } = useQuery({
    queryKey: [`/api/receita-ws/analysis/${applicationId}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasExistingConsultation = Boolean(existingData);

  const getScoreLabel = (score: number): string => {
    if (score >= 701) return 'Alto';
    if (score >= 301) return 'Médio';
    return 'Baixo';
  };

  const handleConsultation = async () => {
    if (hasExistingConsultation) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/receita-ws/consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj,
          applicationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na consulta');
      }

      const data = await response.json();
      setConsultationData(data);
      setShowResults(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao consultar Receita WS');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>Consulta Receita WS</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* CNPJ Display */}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">
                CNPJ da Empresa:
              </div>
              <div className="text-2xl font-bold text-green-700 bg-white p-3 rounded-lg border border-green-300">
                {cnpj}
              </div>
            </div>

            {/* Consultation Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleConsultation}
                disabled={isLoading || hasExistingConsultation}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando...
                  </div>
                ) : hasExistingConsultation ? (
                  'Consulta já realizada'
                ) : (
                  'Consultar na Receita WS'
                )}
              </Button>
            </div>

            {/* API Key Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Erro na consulta:</span>
                </div>
                <p className="text-red-600 mt-2">{error}</p>
              </div>
            )}

            {hasExistingConsultation && (
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Consulta realizada</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {existingData?.consulted_at ? new Date(existingData.consulted_at).toLocaleDateString('pt-BR') : 'Consulta anterior'}
                </Badge>
              </div>
            )}

            {/* Consultation Results Dialog */}
            {showResults && consultationData && (
              <Dialog open={showResults} onOpenChange={setShowResults}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Dados da Receita WS - {consultationData.razao_social}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-700">CNPJ:</div>
                        <div className="text-gray-900">{consultationData.cnpj}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-gray-700">Situação:</div>
                        <div className="text-gray-900">{consultationData.situacao}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-gray-700">Telefone:</div>
                        <div className="text-gray-900">{consultationData.telefone}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-gray-700">Email:</div>
                        <div className="text-gray-900">{consultationData.email}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-700">Nome Fantasia:</div>
                      <div className="text-gray-900">{consultationData.nome_fantasia}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-700">Endereço:</div>
                      <div className="text-gray-900">
                        {consultationData.endereco.logradouro}, {consultationData.endereco.numero} - {consultationData.endereco.bairro}<br />
                        {consultationData.endereco.municipio}/{consultationData.endereco.uf} - CEP: {consultationData.endereco.cep}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-700">Atividade Principal:</div>
                      <div className="text-gray-900">
                        {consultationData.atividade_principal.codigo} - {consultationData.atividade_principal.descricao}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-700">Score de Crédito:</div>
                      <div className="text-2xl font-bold text-green-600">{consultationData.score}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-700">Indicadores:</div>
                      <div className="flex gap-2">
                        <Badge variant={consultationData.indicadores.protestos ? "destructive" : "secondary"}>
                          Protestos: {consultationData.indicadores.protestos ? "Sim" : "Não"}
                        </Badge>
                        <Badge variant={consultationData.indicadores.negativacoes ? "destructive" : "secondary"}>
                          Negativações: {consultationData.indicadores.negativacoes ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}