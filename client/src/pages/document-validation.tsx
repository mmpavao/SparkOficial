import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartDocumentValidator } from "@/components/SmartDocumentValidator";
import { DocumentValidationPanel } from "@/components/DocumentValidationPanel";
import { useTranslation } from "@/contexts/I18nContext";
import { 
  FileCheck,
  Brain,
  Zap,
  Shield,
  Target,
  RefreshCw,
  Info
} from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  documentType?: string;
  confidence: number;
  processingTime: number;
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
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

export default function DocumentValidationPage() {
  const { t } = useTranslation();
  const [validationHistory, setValidationHistory] = useState<ValidationSummary[]>([]);

  const documentTypes = [
    {
      id: 'cnpj_certificate',
      label: 'Comprovante de CNPJ',
      description: 'Documento da Receita Federal comprovando inscrição no CNPJ',
      isRequired: true
    },
    {
      id: 'financial_statement',
      label: 'Demonstrativo Financeiro',
      description: 'Balanço patrimonial e demonstração de resultados',
      isRequired: true
    },
    {
      id: 'business_license',
      label: 'Licença Comercial',
      description: 'Alvará de funcionamento ou licença municipal',
      isRequired: true
    },
    {
      id: 'bank_reference',
      label: 'Referência Bancária',
      description: 'Carta de referência ou extrato bancário',
      isRequired: false
    },
    {
      id: 'tax_document',
      label: 'Documento Fiscal',
      description: 'Certidões fiscais e de regularidade tributária',
      isRequired: false
    },
    {
      id: 'legal_document',
      label: 'Documento Legal',
      description: 'Contratos, procurações e outros documentos legais',
      isRequired: false
    }
  ];

  const handleValidationComplete = (result: ValidationResult, documentType: string) => {
    const validationSummary: ValidationSummary = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: result.fileInfo.name,
      documentType: documentType,
      score: result.score,
      isValid: result.isValid,
      timestamp: Date.now(),
      processingTime: result.processingTime
    };

    setValidationHistory(prev => [...prev, validationSummary]);
  };

  const clearValidationHistory = () => {
    setValidationHistory([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Validação Inteligente de Documentos
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Sistema avançado de validação que analisa documentos em tempo real, 
          verificando autenticidade, qualidade e conformidade com padrões brasileiros.
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="p-4 bg-green-50 rounded-lg">
            <Zap className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-green-800">Análise Rápida</h3>
            <p className="text-sm text-green-700">Processamento em menos de 3 segundos</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-blue-800">Segurança Avançada</h3>
            <p className="text-sm text-blue-700">Verificação de malware e integridade</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium text-purple-800">Alta Precisão</h3>
            <p className="text-sm text-purple-700">Score de qualidade de 0 a 100</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <FileCheck className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <h3 className="font-medium text-yellow-800">Múltiplos Formatos</h3>
            <p className="text-sm text-yellow-700">PDF, JPG, PNG, DOC, DOCX</p>
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Como funciona a validação inteligente</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Análise de formato:</strong> Verifica se o arquivo está no formato correto</li>
                <li>• <strong>Verificação de segurança:</strong> Detecta possíveis ameaças e malware</li>
                <li>• <strong>Análise de conteúdo:</strong> OCR e verificação de padrões documentais</li>
                <li>• <strong>Validação específica:</strong> Regras específicas para cada tipo de documento brasileiro</li>
                <li>• <strong>Score de qualidade:</strong> Pontuação de 0-100 baseada em múltiplos fatores</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Validators */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Teste os Validadores</h2>
          {validationHistory.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearValidationHistory}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpar Histórico
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {documentTypes.map((docType) => (
            <SmartDocumentValidator
              key={docType.id}
              documentType={docType.id}
              documentLabel={docType.label}
              isRequired={docType.isRequired}
              onValidationComplete={(result) => handleValidationComplete(result, docType.id)}
              maxSizeInMB={15}
              acceptedFormats={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
            />
          ))}
        </div>
      </div>

      {/* Document Types Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Guia de Tipos de Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((docType) => (
              <div key={docType.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{docType.label}</h3>
                  {docType.isRequired && (
                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{docType.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Metrics Dashboard */}
      {validationHistory.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Validação</h2>
          <DocumentValidationPanel 
            validationResults={validationHistory}
            onClearMetrics={clearValidationHistory}
          />
        </div>
      )}

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Especificações Técnicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Formatos Suportados</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PDF (Adobe Acrobat)</li>
                <li>• JPG/JPEG (Imagem)</li>
                <li>• PNG (Imagem)</li>
                <li>• DOC/DOCX (Microsoft Word)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3">Limites e Restrições</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tamanho máximo: 15MB por arquivo</li>
                <li>• Resolução mínima: 150 DPI para imagens</li>
                <li>• Texto deve estar legível e não corrompido</li>
                <li>• Arquivos executáveis não são permitidos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}