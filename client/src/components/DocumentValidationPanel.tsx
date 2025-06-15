import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  Target,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

interface ValidationMetrics {
  totalDocuments: number;
  validDocuments: number;
  invalidDocuments: number;
  averageScore: number;
  averageProcessingTime: number;
  securityIssues: number;
  recentValidations: ValidationSummary[];
}

interface ValidationSummary {
  id: string;
  fileName: string;
  documentType: string;
  score: number;
  isValid: boolean;
  timestamp: number;
  processingTime: number;
}

interface DocumentValidationPanelProps {
  validationResults: ValidationSummary[];
  onClearMetrics?: () => void;
}

export function DocumentValidationPanel({ validationResults, onClearMetrics }: DocumentValidationPanelProps) {
  const [metrics, setMetrics] = useState<ValidationMetrics>({
    totalDocuments: 0,
    validDocuments: 0,
    invalidDocuments: 0,
    averageScore: 0,
    averageProcessingTime: 0,
    securityIssues: 0,
    recentValidations: []
  });

  useEffect(() => {
    if (validationResults.length === 0) {
      setMetrics({
        totalDocuments: 0,
        validDocuments: 0,
        invalidDocuments: 0,
        averageScore: 0,
        averageProcessingTime: 0,
        securityIssues: 0,
        recentValidations: []
      });
      return;
    }

    const totalDocuments = validationResults.length;
    const validDocuments = validationResults.filter(r => r.isValid).length;
    const invalidDocuments = totalDocuments - validDocuments;
    const averageScore = validationResults.reduce((sum, r) => sum + r.score, 0) / totalDocuments;
    const averageProcessingTime = validationResults.reduce((sum, r) => sum + r.processingTime, 0) / totalDocuments;
    const securityIssues = validationResults.filter(r => r.score < 50).length;

    setMetrics({
      totalDocuments,
      validDocuments,
      invalidDocuments,
      averageScore,
      averageProcessingTime,
      securityIssues,
      recentValidations: validationResults.slice(-5).reverse()
    });
  }, [validationResults]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'cnpj_certificate': 'Comprovante CNPJ',
      'financial_statement': 'Demonstrativo Financeiro',
      'business_license': 'Licença Comercial',
      'bank_reference': 'Referência Bancária',
      'tax_document': 'Documento Fiscal',
      'legal_document': 'Documento Legal'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Documentos</p>
                <p className="text-2xl font-bold">{metrics.totalDocuments}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documentos Válidos</p>
                <p className="text-2xl font-bold text-green-600">{metrics.validDocuments}</p>
                <p className="text-xs text-gray-500">
                  {metrics.totalDocuments > 0 ? Math.round((metrics.validDocuments / metrics.totalDocuments) * 100) : 0}% do total
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score Médio</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.averageScore)}`}>
                  {metrics.averageScore.toFixed(1)}
                </p>
                <Progress value={metrics.averageScore} className="w-full mt-2" />
              </div>
              <Target className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">{Math.round(metrics.averageProcessingTime)}ms</p>
                <div className="flex items-center mt-1">
                  <Zap className="w-3 h-3 text-yellow-500 mr-1" />
                  <p className="text-xs text-gray-500">
                    {metrics.averageProcessingTime < 1000 ? 'Rápido' : 
                     metrics.averageProcessingTime < 3000 ? 'Normal' : 'Lento'}
                  </p>
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análise de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Documentos Válidos</span>
                <span className="text-sm text-green-600">
                  {metrics.validDocuments}/{metrics.totalDocuments}
                </span>
              </div>
              <Progress 
                value={metrics.totalDocuments > 0 ? (metrics.validDocuments / metrics.totalDocuments) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Qualidade</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.averageScore)}`}>
                  {metrics.averageScore.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.averageScore} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Questões de Segurança</span>
                <span className="text-sm text-red-600">
                  {metrics.securityIssues}
                </span>
              </div>
              <Progress 
                value={metrics.totalDocuments > 0 ? (metrics.securityIssues / metrics.totalDocuments) * 100 : 0} 
                className="h-2"
              />
            </div>
          </div>

          {metrics.securityIssues > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {metrics.securityIssues} documento(s) com possíveis problemas de segurança
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Validations */}
      {metrics.recentValidations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Validações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentValidations.map((validation) => (
                <div 
                  key={validation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate max-w-48">
                        {validation.fileName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getDocumentTypeLabel(validation.documentType)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(validation.timestamp)} • {validation.processingTime}ms
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getScoreBadgeVariant(validation.score)}>
                      {validation.score}
                    </Badge>
                    <div className="w-2 h-2 rounded-full">
                      <div className={`w-full h-full rounded-full ${
                        validation.isValid ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Insights de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Velocidade de Processamento</h4>
              <p className="text-sm text-blue-700">
                {metrics.averageProcessingTime < 1000 
                  ? "Excelente: Documentos sendo processados rapidamente"
                  : metrics.averageProcessingTime < 3000
                  ? "Bom: Tempo de processamento dentro do esperado"
                  : "Atenção: Considere otimizar o tamanho dos arquivos"
                }
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Taxa de Sucesso</h4>
              <p className="text-sm text-green-700">
                {metrics.totalDocuments > 0 && (metrics.validDocuments / metrics.totalDocuments) > 0.8
                  ? "Excelente: Alta taxa de documentos válidos"
                  : metrics.totalDocuments > 0 && (metrics.validDocuments / metrics.totalDocuments) > 0.6
                  ? "Bom: Maioria dos documentos está sendo validada"
                  : "Atenção: Verifique a qualidade dos documentos enviados"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}