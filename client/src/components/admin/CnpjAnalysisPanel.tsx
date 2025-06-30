import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Search, Building2, Calendar, MapPin, Phone, Mail, Key, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CnpjAnalysisPanelProps {
  creditApplicationId: number;
  cnpj: string;
}

const CnpjAnalysisPanel: React.FC<CnpjAnalysisPanelProps> = ({ creditApplicationId, cnpj }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configuração da API
  const { data: apiConfig } = useQuery({
    queryKey: ['/api/admin/api-configuration/consulta-mais'],
    queryFn: () => apiRequest('/api/admin/api-configuration/consulta-mais', 'GET'),
  });

  // Buscar análises existentes para este CNPJ
  const { data: existingAnalyses, isLoading: loadingAnalyses } = useQuery({
    queryKey: ['/api/admin/cnpj-analysis', cnpj],
    queryFn: () => apiRequest(`/api/admin/cnpj-analysis/${cnpj}`, 'GET'),
  });

  // Mutation para configurar API
  const configureApiMutation = useMutation({
    mutationFn: (data: { apiKey: string }) => 
      apiRequest('/api/admin/api-configuration', 'POST', {
        serviceName: 'consulta-mais',
        apiKey: data.apiKey,
        apiUrl: 'https://www.consultamais.com.br/api',
        isActive: true
      }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Configuração da API salva com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-configuration/consulta-mais'] });
      setShowApiConfig(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração da API",
        variant: "destructive",
      });
    },
  });

  // Mutation para consultar CNPJ
  const consultCnpjMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/admin/cnpj-analysis/consult', 'POST', {
        cnpj,
        creditApplicationId
      }),
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Consulta de CNPJ realizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cnpj-analysis', cnpj] });
      setIsConsulting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na consulta",
        description: error.message || "Erro ao consultar CNPJ",
        variant: "destructive",
      });
      setIsConsulting(false);
    },
  });

  const handleConsultCnpj = () => {
    if (!apiConfig?.isActive) {
      toast({
        title: "Configuração necessária",
        description: "Configure a API key do Consulta Mais primeiro",
        variant: "destructive",
      });
      setShowApiConfig(true);
      return;
    }
    setIsConsulting(true);
    consultCnpjMutation.mutate();
  };

  const handleSaveApiConfig = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite a API key do Consulta Mais",
        variant: "destructive",
      });
      return;
    }
    configureApiMutation.mutate({ apiKey });
  };

  return (
    <div className="space-y-4">
      {/* Configuração da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Configuração API
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiConfig(!showApiConfig)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        {showApiConfig && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key Consulta Mais</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Digite sua API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveApiConfig}
              disabled={configureApiMutation.isPending}
              className="w-full"
            >
              {configureApiMutation.isPending ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Status da API */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status da API:</span>
            <Badge variant={apiConfig?.isActive ? "default" : "secondary"}>
              {apiConfig?.isActive ? "Configurada" : "Não configurada"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Consulta de CNPJ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Search className="h-4 w-4" />
            Consultar CNPJ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>CNPJ da Empresa</Label>
            <Input value={cnpj} disabled />
          </div>
          <Button
            onClick={handleConsultCnpj}
            disabled={isConsulting || consultCnpjMutation.isPending || !apiConfig?.isActive}
            className="w-full"
          >
            {isConsulting || consultCnpjMutation.isPending ? (
              "Consultando..."
            ) : (
              "Consultar CNPJ"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados das Análises */}
      {loadingAnalyses && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Carregando análises...</p>
          </CardContent>
        </Card>
      )}

      {existingAnalyses && existingAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Análises Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingAnalyses.map((analysis: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {new Date(analysis.consultedAt).toLocaleDateString('pt-BR')}
                  </Badge>
                  {analysis.riskScore && (
                    <Badge variant={analysis.riskScore > 70 ? "default" : "destructive"}>
                      Score: {analysis.riskScore}
                    </Badge>
                  )}
                </div>
                {analysis.companyData && (
                  <div className="text-sm space-y-1">
                    <p><strong>Razão Social:</strong> {analysis.companyData.razaoSocial}</p>
                    <p><strong>Situação:</strong> {analysis.companyData.situacao}</p>
                    <p><strong>Porte:</strong> {analysis.companyData.porte}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {existingAnalyses && existingAnalyses.length === 0 && !loadingAnalyses && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma análise realizada ainda</p>
              <p className="text-xs text-gray-400 mt-1">
                Configure a API e faça sua primeira consulta
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CnpjAnalysisPanel;