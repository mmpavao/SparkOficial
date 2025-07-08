import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Shield,
  BarChart3,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CPFData {
  cpf: string;
  fullName: string;
  birthDate: string;
  creditScore: number;
  riskLevel: string;
  hasDebts: boolean;
  hasProtests: boolean;
  hasBankruptcy: boolean;
  hasLawsuits: boolean;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  scoreDate: string;
}

export default function CPFAnalysis() {
  const [cpf, setCpf] = useState('');
  const [cpfData, setCpfData] = useState<CPFData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleConsultar = async () => {
    if (!cpf || cpf.length !== 14) {
      toast({
        title: "CPF inválido",
        description: "Digite um CPF válido com 11 dígitos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Starting CPF Credit Score consultation for:', cpf);
      
      // Simulated API call - replace with real DirectD CPF API
      const mockData: CPFData = {
        cpf: cpf,
        fullName: "João Silva Santos",
        birthDate: "1985-03-15",
        creditScore: 720,
        riskLevel: "LOW",
        hasDebts: false,
        hasProtests: false,
        hasBankruptcy: false,
        hasLawsuits: false,
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        phone: "(11) 99999-8888",
        email: "joao.santos@email.com",
        scoreDate: new Date().toISOString()
      };

      setCpfData(mockData);
      
      toast({
        title: "Consulta realizada",
        description: "Análise de CPF concluída com sucesso",
      });
      
    } catch (error: any) {
      console.error('❌ CPF Credit Score API error:', error);
      toast({
        title: "Erro na consulta",
        description: "Não foi possível consultar o CPF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cpfData) {
      toast({
        title: "Consulta necessária",
        description: "Execute a consulta de CPF antes de baixar o relatório",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingPdf(true);
    try {
      console.log('📄 Generating CPF PDF report for:', cpfData.cpf);
      
      // Here we would call our PDF generation endpoint
      // For now, create a mock PDF download
      const response = await fetch('/api/cpf/pdf-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cpfData)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analise-cpf-${cpfData.cpf.replace(/\D/g, '')}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Relatório PDF baixado",
          description: "Análise de CPF gerada no estilo DirectD",
        });
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('❌ CPF PDF download error:', error);
      toast({
        title: "Erro no download",
        description: "Erro ao gerar relatório de CPF",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-green-600 bg-green-100";
    if (score >= 600) return "text-blue-600 bg-blue-100";
    if (score >= 400) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 800) return "from-green-400 to-blue-600";
    if (score >= 600) return "from-blue-400 to-blue-600";
    if (score >= 400) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-red-600";
  };

  const getRiskLabel = (riskLevel: string) => {
    const labels = {
      'LOW': 'Baixo Risco',
      'MEDIUM': 'Risco Médio',
      'HIGH': 'Alto Risco',
      'CRITICAL': 'Risco Crítico'
    };
    return labels[riskLevel as keyof typeof labels] || 'Análise Pendente';
  };

  const getRiskColor = (riskLevel: string) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return colors[riskLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Análise de CPF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <div className="flex gap-2">
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                className="flex-1"
              />
              <Button 
                onClick={handleConsultar}
                disabled={isLoading || !cpf}
                className="w-auto"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Consultar
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {cpfData && (
          <div className="space-y-6">
            {/* Header with Download Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resultado da Análise</h3>
              <Button 
                size="sm"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isLoadingPdf}
                className="flex items-center gap-2"
              >
                {isLoadingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Baixar PDF
              </Button>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nome Completo</Label>
                <p className="text-sm font-semibold">{cpfData.fullName}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">CPF</Label>
                <p className="text-sm font-semibold">{cpfData.cpf}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Data de Nascimento</Label>
                <p className="text-sm font-semibold">
                  {new Date(cpfData.birthDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Consulta Realizada</Label>
                <p className="text-sm font-semibold">
                  {new Date(cpfData.scoreDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Credit Score */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r ${getScoreGradient(cpfData.creditScore)} text-white mb-4`}>
                <span className="text-3xl font-bold">{cpfData.creditScore}</span>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">Credit Score</p>
              <p className="text-sm text-gray-600 mb-4">Escala de 0 a 1000</p>
              <Badge className={getRiskColor(cpfData.riskLevel)}>
                {getRiskLabel(cpfData.riskLevel)}
              </Badge>
            </div>

            {/* Risk Analysis */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className={`mx-auto mb-2 ${cpfData.hasDebts ? 'text-red-500' : 'text-green-500'}`}>
                  {cpfData.hasDebts ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <p className="text-sm font-medium">Débitos</p>
                <p className="text-xs text-gray-600">{cpfData.hasDebts ? 'Possui' : 'Não possui'}</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className={`mx-auto mb-2 ${cpfData.hasProtests ? 'text-red-500' : 'text-green-500'}`}>
                  {cpfData.hasProtests ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <p className="text-sm font-medium">Protestos</p>
                <p className="text-xs text-gray-600">{cpfData.hasProtests ? 'Possui' : 'Não possui'}</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className={`mx-auto mb-2 ${cpfData.hasBankruptcy ? 'text-red-500' : 'text-green-500'}`}>
                  {cpfData.hasBankruptcy ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <p className="text-sm font-medium">Falência</p>
                <p className="text-xs text-gray-600">{cpfData.hasBankruptcy ? 'Possui' : 'Não possui'}</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className={`mx-auto mb-2 ${cpfData.hasLawsuits ? 'text-red-500' : 'text-green-500'}`}>
                  {cpfData.hasLawsuits ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <p className="text-sm font-medium">Processos</p>
                <p className="text-xs text-gray-600">{cpfData.hasLawsuits ? 'Possui' : 'Não possui'}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h4>
                <div className="text-sm space-y-1">
                  <p>{cpfData.address}</p>
                  <p>{cpfData.city} - {cpfData.state}</p>
                  <p>CEP: {cpfData.zipCode}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contatos
                </h4>
                <div className="text-sm space-y-1">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {cpfData.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    {cpfData.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}