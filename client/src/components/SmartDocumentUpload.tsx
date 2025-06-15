import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Loader2,
  Eye,
  RefreshCw
} from "lucide-react";
import { DocumentValidator, ValidationResult, getValidationStatusColor, getValidationStatusIcon, getValidationMessage } from "@/lib/documentValidation";

interface SmartDocumentUploadProps {
  documentKey: string;
  documentLabel: string;
  isRequired: boolean;
  isUploaded: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onValidation?: (result: ValidationResult) => void;
}

export function SmartDocumentUpload({ 
  documentKey, 
  documentLabel, 
  isRequired, 
  isUploaded, 
  isUploading, 
  onUpload,
  onValidation 
}: SmartDocumentUploadProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const validator = new DocumentValidator();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validator.validateDocument(file, documentKey);
      setValidationResult(result);
      
      if (onValidation) {
        onValidation(result);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        score: 0,
        errors: ['Erro durante a validação do documento'],
        warnings: [],
        suggestions: ['Tente novamente ou use um arquivo diferente'],
        confidence: 0,
        processingTime: 0
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = () => {
    if (selectedFile && validationResult?.isValid) {
      onUpload(selectedFile);
      setSelectedFile(null);
      setValidationResult(null);
    }
  };

  const handleRetry = () => {
    setSelectedFile(null);
    setValidationResult(null);
    fileInputRef.current?.click();
  };

  const getStatusIndicator = () => {
    if (isUploaded) {
      return <div className="w-3 h-3 rounded-full bg-green-500" />;
    }
    if (isUploading) {
      return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
    }
    if (validationResult) {
      const color = validationResult.isValid ? 'bg-green-500' : validationResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
      return <div className={`w-3 h-3 rounded-full ${color}`} />;
    }
    return <div className={`w-3 h-3 rounded-full ${isRequired ? 'bg-red-500' : 'bg-gray-300'}`} />;
  };

  return (
    <div className="space-y-3">
      {/* Document Header */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          {getStatusIndicator()}
          <div>
            <p className="text-sm font-medium">{documentLabel}</p>
            <p className="text-xs text-gray-500">
              {isRequired ? 'Obrigatório' : 'Opcional'}
              {validationResult && (
                <span className={`ml-2 ${getValidationStatusColor(validationResult.score)}`}>
                  {getValidationStatusIcon(validationResult.score)} {validationResult.score}%
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isUploaded ? (
            <Badge variant="default" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Enviado
            </Badge>
          ) : (
            <div className="flex gap-2">
              {selectedFile && validationResult && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setValidationResult(null)}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Detalhes
                </Button>
              )}
              
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isValidating}
              >
                {isValidating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {isValidating ? ' Validando...' : ' Selecionar'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Drag and Drop Area */}
      {!isUploaded && !selectedFile && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Arraste e solte o arquivo aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500">
            PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (máx. 20MB)
          </p>
        </div>
      )}

      {/* Validation Progress */}
      {isValidating && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Validando documento...</span>
          </div>
          <Progress value={65} className="h-2" />
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Verificando tipo e tamanho do arquivo</p>
            <p>• Analisando qualidade e resolução</p>
            <p>• Validando conteúdo e integridade</p>
          </div>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !isValidating && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Trocar
            </Button>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {getValidationMessage(validationResult)}
                </span>
                <Badge 
                  variant={validationResult.isValid ? "default" : "destructive"}
                  className="text-xs"
                >
                  {validationResult.score}% Confiança
                </Badge>
              </div>

              {/* Validation Progress Bar */}
              <div className="space-y-1">
                <Progress 
                  value={validationResult.score} 
                  className={`h-2 ${
                    validationResult.score >= 80 ? 'bg-green-100' : 
                    validationResult.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}
                />
                <p className="text-xs text-gray-500">
                  Processado em {validationResult.processingTime}ms
                </p>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <p key={index} className="text-xs">• {error}</p>
                      ))}
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
                      {validationResult.warnings.map((warning, index) => (
                        <p key={index} className="text-xs">• {warning}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Suggestions */}
              {validationResult.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-blue-900 mb-2">Sugestões:</h4>
                  <div className="space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <p key={index} className="text-xs text-blue-800">• {suggestion}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                >
                  Tentar Outro Arquivo
                </Button>
                
                {validationResult.isValid ? (
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {isUploading ? 'Enviando...' : 'Enviar Documento'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRetry}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Corrigir Problemas
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}