import React, { useState, useEffect } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [cnpjInput, setCnpjInput] = useState(cnpj);
  const { toast } = useToast();

  // Carregar dados salvos no banco ao montar o componente
  useEffect(() => {
    loadSavedConsultation();
  }, [applicationId]);

  const loadSavedConsultation = async () => {
    try {
      const response = await apiRequest(`/api/receita-ws/consultas/${applicationId}`, 'GET');
      if (response.data) {
        setConsultationData(response);
      }
    } catch (error) {
      // Sem dados salvos - não é erro
    }
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleConsult = async () => {
    if (!selectedPlan || !cnpjInput) return;

    setLoading(true);
    try {
      const response = await apiRequest('/api/receita-ws/consultar', 'POST', {
        cnpj: cnpjInput.replace(/\D/g, ''),
        plan: selectedPlan,
        applicationId: applicationId
      });

      if (response.success) {
        setConsultationData(response.data);
        toast({
          title: "Consulta realizada com sucesso",
          description: "Os dados foram salvos e estão disponíveis para análise.",
        });
        setIsOpen(false);
        setSelectedPlan(null);
      } else {
        throw new Error(response.message || 'Erro na consulta');
      }
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Consulta Receita WS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Layout vertical: Campo CNPJ acima do botão */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="cnpj-input" className="text-sm font-medium text-slate-700">
                CNPJ da Empresa
              </Label>
              <Input
                id="cnpj-input"
                type="text"
                value={formatCNPJ(cnpjInput)}
                onChange={(e) => setCnpjInput(e.target.value.replace(/\D/g, ''))}
                placeholder="00.000.000/0000-00"
                className="mt-1"
                maxLength={18}
              />
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Consultar Receita WS
              </Button>
            </div>
          </div>

          {/* Resultado da consulta salva */}
          {consultationData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Consulta Realizada
                </span>
              </div>
              <p className="text-sm text-green-700">
                Empresa: {consultationData.razao_social}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Dados salvos e disponíveis para análise
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para seleção de plano */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Consultar Receita WS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Selecione o plano de consulta:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedPlan('basic')}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedPlan === 'basic' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Básico</p>
                      <p className="text-sm text-gray-600">Dados cadastrais básicos</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">R$ 35,00</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setSelectedPlan('advanced')}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedPlan === 'advanced' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Avançado</p>
                      <p className="text-sm text-gray-600">Inclui score e análise de risco</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">R$ 90,00</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConsult}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!selectedPlan || loading}
              >
                {loading ? 'Consultando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}