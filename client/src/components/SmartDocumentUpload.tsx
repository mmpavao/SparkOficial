import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  FileText,
  Trash2,
  Download
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

interface SmartDocumentUploadProps {
  documentKey: string;
  documentLabel: string;
  isRequired: boolean;
  isUploaded: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onValidation?: (result: ValidationResult) => void;
  applicationId?: number;
}

export function SmartDocumentUpload({ 
  documentKey,
  documentLabel,
  isRequired,
  isUploaded,
  isUploading,
  onUpload,
  onValidation,
  applicationId
}: SmartDocumentUploadProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsValidating(true);
    
    try {
      // Perform smart validation
      const result = await validateDocument(file, documentKey);
      setValidationResult(result);
      
      if (onValidation) {
        onValidation(result);
      }

      // Show validation feedback
      if (result.isValid) {
        toast({
          title: "Documento validado!",
          description: `${documentLabel} - Score: ${result.score}/100`,
        });
        
        // Upload the file if validation passes
        onUpload(file);
      } else {
        toast({
          title: "Problemas encontrados",
          description: `${result.errors.length} erro(s) no documento`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o documento",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const validateDocument = async (file: File, docType: string): Promise<ValidationResult> => {
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;
    let confidence = 85;

    // File size validation
    if (file.size > 10 * 1024 * 1024) { // 10MB
      errors.push("Arquivo muito grande (máximo 10MB)");
      score -= 30;
    }

    // File type validation
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      errors.push(`Formato não suportado. Use: ${validExtensions.join(', ')}`);
      score -= 40;
    }

    // Document-specific validation
    switch (docType) {
      case 'comprovante_cnpj':
        if (!file.name.toLowerCase().includes('cnpj')) {
          warnings.push('Nome do arquivo não indica ser comprovante de CNPJ');
          score -= 5;
        }
        suggestions.push('Certifique-se de que o documento tem menos de 90 dias');
        break;
      
      case 'demonstrativo_financeiro':
        if (file.size < 100 * 1024) {
          warnings.push('Arquivo pequeno para demonstrativo completo');
          score -= 10;
        }
        suggestions.push('Inclua balanço patrimonial e DRE');
        break;
      
      case 'referencias_bancarias':
        suggestions.push('Use referência oficial do banco com carimbo/assinatura');
        break;
    }

    // Quality bonus for PDF files
    if (file.type === 'application/pdf') {
      score += 5;
      confidence = 95;
    }

    // Security check simulation
    if (file.name.toLowerCase().includes('temp') || file.name.toLowerCase().includes('test')) {
      warnings.push('Nome de arquivo suspeito detectado');
      score -= 10;
    }

    const processingTime = Date.now() - startTime;
    const isValid = errors.length === 0 && score >= 70;

    return {
      isValid,
      score: Math.max(0, Math.min(100, score)),
      errors,
      warnings,
      suggestions,
      documentType: docType,
      confidence,
      processingTime,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  };

  const getStatusIcon = () => {
    if (isValidating) return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    if (validationResult?.isValid) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (validationResult && !validationResult.isValid) return <XCircle className="w-4 h-4 text-red-600" />;
    if (isUploaded) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    return <Upload className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (isValidating) return "border-blue-300 bg-blue-50";
    if (validationResult?.isValid || isUploaded) return "border-green-300 bg-green-50";
    if (validationResult && !validationResult.isValid) return "border-red-300 bg-red-50";
    return "border-gray-300 hover:border-gray-400";
  };

  const clearValidation = () => {
    setValidationResult(null);
  };

  return (
    <div className="space-y-3">
      {/* Cabeçalho com Download visível */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">{documentLabel}</label>
          {isRequired && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
          {!isUploaded && !validationResult && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
              Pendente
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Download Button - Mais visível */}
          {isUploaded && applicationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = `/api/documents/download/${documentKey}/${applicationId}`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="h-7 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          )}
          
          {/* Score Badge */}
          {validationResult && (
            <Badge 
              className={
                validationResult.score >= 90 ? "bg-green-100 text-green-800" :
                validationResult.score >= 70 ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }
            >
              Score: {validationResult.score}
            </Badge>
          )}
        </div>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
          ${getStatusColor()}
        `}
        onClick={() => !isValidating && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        <div className="flex items-center justify-center gap-3">
          {getStatusIcon()}
          <div className="text-left">
            {isValidating ? (
              <div>
                <p className="text-sm font-medium">Validando documento...</p>
                <Progress value={66} className="w-32 mt-1" />
              </div>
            ) : validationResult ? (
              <div>
                <p className="text-sm font-medium">{validationResult.fileInfo.name}</p>
                <p className="text-xs text-gray-500">
                  {(validationResult.fileInfo.size / 1024 / 1024).toFixed(2)} MB • 
                  {validationResult.isValid ? ' Válido' : ' Requer atenção'}
                </p>
              </div>
            ) : isUploaded ? (
              <div className="w-full">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700">✓ Documento enviado</p>
                    <p className="text-xs text-gray-500">Clique aqui para substituir</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Clique para enviar</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC (máx. 10MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Feedback */}
      {validationResult && (
        <div className="space-y-2">
          {validationResult.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Erros encontrados:</p>
                  <ul className="text-xs text-red-700 mt-1 space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Avisos:</p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validationResult.suggestions.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Sugestões:</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearValidation}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar validação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}