
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  X,
  Loader2
} from "lucide-react";

interface DocumentInfo {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: number | string;
  data?: string; // Base64 data for temporary storage
  file?: File; // Original file object for upload
}

interface UnifiedDocumentUploadProps {
  documentKey: string;
  documentLabel: string;
  documentSubtitle?: string;
  documentObservation?: string;
  isRequired: boolean;
  applicationId: number | null; // null for new applications
  uploadedDocuments: Record<string, DocumentInfo | DocumentInfo[]>;
  isUploading?: boolean;
  onUpload: (documentKey: string, file: File) => void;
  onRemove: (documentKey: string, index?: number) => void;
  onDownload?: (documentKey: string, index?: number) => void;
  allowMultiple?: boolean;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export default function UnifiedDocumentUpload({
  documentKey,
  documentLabel,
  documentSubtitle,
  documentObservation,
  isRequired,
  applicationId,
  uploadedDocuments,
  isUploading = false,
  onUpload,
  onRemove,
  onDownload,
  allowMultiple = false,
  maxFileSize = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
}: UnifiedDocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Get documents for this key
  const currentDocuments = uploadedDocuments[documentKey];
  const documentsArray = currentDocuments 
    ? (Array.isArray(currentDocuments) ? currentDocuments : [currentDocuments])
    : [];

  const hasDocuments = documentsArray.length > 0;
  const isComplete = hasDocuments && isRequired;

  // Handle file validation
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return { isValid: false, error: `Arquivo muito grande (máximo ${maxFileSize}MB)` };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return { isValid: false, error: `Formato não suportado. Use: ${acceptedTypes.join(', ')}` };
    }

    return { isValid: true };
  };

  // Handle single file upload with proper validation
  const handleSingleFileUpload = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      alert(`${file.name}: ${validation.error}`);
      return;
    }

    // Check if multiple files are allowed
    if (!allowMultiple && hasDocuments) {
      if (confirm('Já existe um documento. Deseja substituí-lo?')) {
        onRemove(documentKey);
      } else {
        return;
      }
    }

    // Upload file
    onUpload(documentKey, file);
  };

  // Handle multiple files with robust sequential queue
  const handleMultipleFiles = async (files: File[]) => {
    console.log(`🚀 Iniciando upload sequencial de ${files.length} arquivos para ${documentKey}`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📤 [${i + 1}/${files.length}] Processando: ${file.name}`);
      
      // Validate file before upload
      const validation = validateFile(file);
      if (!validation.isValid) {
        console.error(`❌ Arquivo inválido: ${file.name} - ${validation.error}`);
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      // Check if replacement needed for non-multiple mode
      if (!allowMultiple && hasDocuments && i === 0) {
        if (!confirm('Já existe um documento. Deseja substituí-lo?')) {
          console.log(`⏭️ Upload cancelado pelo usuário`);
          continue;
        }
        onRemove(documentKey);
        // Wait a bit after removal
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      try {
        // Create a promise that waits for the upload to complete
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Upload timeout para ${file.name}`));
          }, 30000); // 30 second timeout

          // Store original state
          const currentDocCount = documentsArray.length;
          
          // Start upload
          console.log(`⬆️ Iniciando upload: ${file.name}`);
          onUpload(documentKey, file);
          
          // Poll for completion
          const checkCompletion = setInterval(() => {
            const newDocCount = uploadedDocuments[documentKey] ? 
              (Array.isArray(uploadedDocuments[documentKey]) ? 
                uploadedDocuments[documentKey].length : 1) : 0;
            
            if (newDocCount > currentDocCount) {
              console.log(`✅ Upload concluído: ${file.name}`);
              clearTimeout(timeoutId);
              clearInterval(checkCompletion);
              resolve();
            }
          }, 500); // Check every 500ms
        });

        // Wait a bit between uploads to prevent race conditions
        if (i < files.length - 1) {
          console.log(`⏳ Aguardando antes do próximo upload...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Erro no upload de ${file.name}:`, error);
        alert(`Erro ao enviar ${file.name}: ${error.message}`);
      }
    }
    
    console.log(`🎉 Upload sequencial concluído para ${documentKey}`);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isUploading) return; // Prevent uploads while already uploading

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (files.length === 1) {
        handleSingleFileUpload(files[0]);
      } else {
        await handleMultipleFiles(files);
      }
    }
  };

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return; // Prevent uploads while already uploading
    
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      if (fileArray.length === 1) {
        handleSingleFileUpload(fileArray[0]);
      } else {
        await handleMultipleFiles(fileArray);
      }
    }
    // Reset input value
    e.target.value = '';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle document download
  const handleDownload = (index: number = 0) => {
    if (applicationId && onDownload) {
      onDownload(documentKey, index);
    } else if (documentsArray[index]?.data) {
      // For new applications, download from local data
      const doc = documentsArray[index];
      const blob = new Blob([Uint8Array.from(atob(doc.data!), c => c.charCodeAt(0))], {
        type: doc.type
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Handle document removal
  const handleRemove = (index: number = 0) => {
    if (documentsArray.length === 1) {
      onRemove(documentKey);
    } else {
      onRemove(documentKey, index);
    }
  };

  // Get status info
  const getStatusInfo = () => {
    if (isUploading) {
      return {
        icon: Loader2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Enviando...'
      };
    }

    if (hasDocuments) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: `${documentsArray.length} arquivo${documentsArray.length > 1 ? 's' : ''} enviado${documentsArray.length > 1 ? 's' : ''}`
      };
    }

    if (isRequired) {
      return {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Pendente'
      };
    }

    return {
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      label: 'Pendente'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={`transition-all duration-200 ${statusInfo.borderColor} ${statusInfo.bgColor} ${isRequired && !hasDocuments ? 'border-red-300' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${isUploading ? 'animate-spin' : ''}`} />
              {isRequired && !hasDocuments && <span className="text-red-500 font-bold">⚠️</span>}
              {documentLabel}
              {isRequired && <span className="text-red-500 font-bold text-base">*</span>}
            </CardTitle>
            {documentSubtitle && (
              <p className="text-xs text-gray-500 mt-1">{documentSubtitle}</p>
            )}
          </div>
          <Badge 
            variant={hasDocuments ? "default" : isRequired ? "destructive" : "secondary"}
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2 ${
              hasDocuments 
                ? "bg-green-600 hover:bg-green-700 border-transparent text-white" 
                : isRequired 
                  ? "bg-red-600 hover:bg-red-700 border-transparent text-white" 
                  : "bg-orange-600 hover:bg-orange-700 border-transparent text-white"
            }`}
          >
            {statusInfo.label}
          </Badge>
        </div>
        
        {documentObservation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-blue-700">{documentObservation}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {/* Upload Area */}
        {!isUploading && (allowMultiple || !hasDocuments) && (
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : hasDocuments 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste e solte {allowMultiple ? 'arquivos' : 'arquivo'} ou{' '}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                clique para enviar {allowMultiple ? 'múltiplos arquivos' : ''}
                <input
                  type="file"
                  className="hidden"
                  accept={acceptedTypes.join(',')}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  multiple={allowMultiple}
                />
              </label>
            </p>
            <p className="text-xs text-gray-400">
              Máximo {maxFileSize}MB • {acceptedTypes.join(', ')}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isUploading && (
          <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 text-center">
            <Loader2 className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-blue-600">Enviando documento...</p>
            <Progress value={undefined} className="w-full mt-2" />
          </div>
        )}

        {/* Documents List */}
        {hasDocuments && (
          <div className="space-y-2 mt-3">
            {documentsArray.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.originalName || doc.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Download Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(index)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Baixar documento"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {/* Remove Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remover documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover este documento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(index)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add More Button for Multiple Documents */}
        {allowMultiple && hasDocuments && !isUploading && (
          <div className="mt-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Adicionar {allowMultiple ? 'mais documentos' : 'outro documento'}
              <input
                type="file"
                className="hidden"
                accept={acceptedTypes.join(',')}
                onChange={handleFileChange}
                multiple={allowMultiple}
              />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
