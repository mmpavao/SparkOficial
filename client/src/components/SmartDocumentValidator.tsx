import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye,
  Download,
  Loader2,
  Shield,
  Clock
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

interface SmartDocumentValidatorProps {
  documentType: string;
  documentLabel: string;
  isRequired: boolean;
  onValidationComplete?: (result: ValidationResult) => void;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
}

export function SmartDocumentValidator({
  documentType,
  documentLabel,
  isRequired,
  onValidationComplete,
  maxSizeInMB = 10,
  acceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
}: SmartDocumentValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateDocument = useCallback(async (file: File): Promise<ValidationResult> => {
    const startTime = Date.now();
    
    // Basic file validation
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;
    let confidence = 0;

    // File size validation
    if (file.size > maxSizeInMB * 1024 * 1024) {
      errors.push(`Arquivo muito grande. Máximo permitido: ${maxSizeInMB}MB`);
      score -= 30;
    }

    // File type validation
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      errors.push(`Formato não suportado. Formatos aceitos: ${acceptedFormats.join(', ')}`);
      score -= 40;
    }

    // Document type specific validation
    await validateByDocumentType(file, documentType, errors, warnings, suggestions);

    // Security checks
    await performSecurityChecks(file, errors, warnings);

    // Content analysis (simulated)
    const contentAnalysis = await analyzeDocumentContent(file, documentType);
    score += contentAnalysis.qualityBonus;
    confidence = contentAnalysis.confidence;
    warnings.push(...contentAnalysis.warnings);
    suggestions.push(...contentAnalysis.suggestions);

    // Calculate final score
    score = Math.max(0, Math.min(100, score));
    const isValid = errors.length === 0 && score >= 70;

    const processingTime = Date.now() - startTime;

    return {
      isValid,
      score,
      errors,
      warnings,
      suggestions,
      documentType,
      confidence,
      processingTime,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  }, [documentType, maxSizeInMB, acceptedFormats]);

  const validateByDocumentType = async (
    file: File, 
    docType: string, 
    errors: string[], 
    warnings: string[], 
    suggestions: string[]
  ) => {
    switch (docType) {
      case 'cnpj_certificate':
        if (!file.name.toLowerCase().includes('cnpj') && !file.name.toLowerCase().includes('receita')) {
          warnings.push('Nome do arquivo não indica ser um comprovante de CNPJ');
        }
        suggestions.push('Certifique-se de que o documento é atualizado (menos de 90 dias)');
        break;
      
      case 'financial_statement':
        if (file.size < 100 * 1024) { // Less than 100KB
          warnings.push('Arquivo muito pequeno para ser um demonstrativo financeiro completo');
        }
        suggestions.push('Demonstrativos financiais devem incluir balanço patrimonial e DRE');
        break;
      
      case 'business_license':
        suggestions.push('Verifique se a licença está dentro do prazo de validade');
        break;
      
      case 'bank_reference':
        if (!file.name.toLowerCase().includes('banco') && !file.name.toLowerCase().includes('bank')) {
          warnings.push('Nome do arquivo não indica ser uma referência bancária');
        }
        break;
      
      default:
        suggestions.push('Certifique-se de que o documento está legível e completo');
    }
  };

  const performSecurityChecks = async (file: File, errors: string[], warnings: string[]) => {
    // Simulate security scanning
    const suspiciousPatterns = ['script', 'malware', 'virus'];
    const fileName = file.name.toLowerCase();
    
    if (suspiciousPatterns.some(pattern => fileName.includes(pattern))) {
      errors.push('Arquivo pode conter conteúdo suspeito');
    }

    // Check for executable files
    const executableExtensions = ['.exe', '.bat', '.com', '.scr', '.vbs'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (executableExtensions.includes(fileExtension)) {
      errors.push('Arquivos executáveis não são permitidos');
    }
  };

  const analyzeDocumentContent = async (file: File, docType: string) => {
    // Simulate OCR and content analysis
    let qualityBonus = 0;
    let confidence = 0;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Simulate processing time based on file size
    const processingTime = Math.max(500, Math.min(3000, file.size / 1000));
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Base confidence on file type and size
    if (file.type === 'application/pdf') {
      confidence = 90;
      qualityBonus = 10;
    } else if (file.type.startsWith('image/')) {
      confidence = 75;
      qualityBonus = 5;
      suggestions.push('PDFs geralmente têm melhor qualidade para documentos oficiais');
    } else {
      confidence = 60;
      warnings.push('Formato do arquivo pode afetar a qualidade da análise');
    }

    // Quality checks based on file size
    if (file.size < 50 * 1024) { // Less than 50KB
      warnings.push('Arquivo muito pequeno - pode estar com baixa resolução');
      qualityBonus -= 5;
    } else if (file.size > 5 * 1024 * 1024) { // More than 5MB
      suggestions.push('Considere comprimir o arquivo para upload mais rápido');
    }

    return { qualityBonus, confidence, warnings, suggestions };
  };

  const handleFileSelect = async (file: File) => {
    setIsValidating(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await validateDocument(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setValidationResult(result);
        setIsValidating(false);
        setUploadProgress(0);
        
        if (onValidationComplete) {
          onValidationComplete(result);
        }

        // Show toast notification
        if (result.isValid) {
          toast({
            title: "Documento validado com sucesso!",
            description: `Score: ${result.score}/100 - Processado em ${result.processingTime}ms`,
          });
        } else {
          toast({
            title: "Problemas encontrados no documento",
            description: `${result.errors.length} erro(s) encontrado(s)`,
            variant: "destructive",
          });
        }
      }, 500);

    } catch (error) {
      setIsValidating(false);
      setUploadProgress(0);
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {documentLabel}
          {isRequired && <Badge variant="destructive">Obrigatório</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragActive 
              ? "border-blue-500 bg-blue-50" 
              : validationResult?.isValid 
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedFormats.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          
          {isValidating ? (
            <div className="space-y-4">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Validando documento...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : validationResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div className="text-left">
                  <p className="font-medium">{validationResult.fileInfo.name}</p>
                  <p className="text-xs text-gray-500">
                    {(validationResult.fileInfo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Badge className={getScoreBadgeVariant(validationResult.score)}>
                  Score: {validationResult.score}/100
                </Badge>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {validationResult.processingTime}ms
                </Badge>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setValidationResult(null)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Enviar outro arquivo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <div>
                <p className="font-medium">Clique ou arraste um arquivo</p>
                <p className="text-sm text-gray-500">
                  Formatos aceitos: {acceptedFormats.join(', ')}
                </p>
                <p className="text-xs text-gray-400">
                  Tamanho máximo: {maxSizeInMB}MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-3">
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Erros encontrados:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Avisos:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Suggestions */}
            {validationResult.suggestions.length > 0 && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Sugestões:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationResult.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Quality Metrics */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Confiança</p>
                <p className={`text-lg font-bold ${getScoreColor(validationResult.confidence)}`}>
                  {validationResult.confidence}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validationResult.isValid ? 'Válido' : 'Inválido'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}