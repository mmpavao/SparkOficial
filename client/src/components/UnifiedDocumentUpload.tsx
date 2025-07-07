import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Plus
} from "lucide-react";

interface DocumentInfo {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: number | string;
  data?: string;
  file?: File;
}

interface UnifiedDocumentUploadProps {
  documentKey: string;
  documentLabel: string;
  documentSubtitle?: string;
  documentObservation?: string;
  isRequired: boolean;
  applicationId: number | null;
  uploadedDocuments: Record<string, DocumentInfo | DocumentInfo[]>;
  isUploading?: boolean;
  onUpload: (documentKey: string, file: File) => void;
  onRemove: (documentKey: string, index?: number) => void;
  onDownload?: (documentKey: string, index?: number) => void;
  allowMultiple?: boolean;
  maxFileSize?: number;
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
  const [localUploadState, setLocalUploadState] = useState<{
    isUploading: boolean;
    currentFile: number;
    totalFiles: number;
    currentFileName: string;
  }>({
    isUploading: false,
    currentFile: 0,
    totalFiles: 0,
    currentFileName: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadQueueRef = useRef<File[]>([]);
  const isProcessingRef = useRef(false);

  // Obter documentos atuais
  const currentDocuments = uploadedDocuments[documentKey];
  const documentsArray = currentDocuments 
    ? (Array.isArray(currentDocuments) ? currentDocuments : [currentDocuments])
    : [];

  const hasDocuments = documentsArray.length > 0;

  // Validar arquivo
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return { isValid: false, error: `Arquivo muito grande (máximo ${maxFileSize}MB)` };
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return { isValid: false, error: `Formato não suportado. Use: ${acceptedTypes.join(', ')}` };
    }

    return { isValid: true };
  };

  // Processar fila de uploads
  const processUploadQueue = useCallback(async () => {
    if (isProcessingRef.current || uploadQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const filesToProcess = [...uploadQueueRef.current];
    uploadQueueRef.current = [];

    setLocalUploadState({
      isUploading: true,
      currentFile: 0,
      totalFiles: filesToProcess.length,
      currentFileName: ''
    });

    console.log(`🚀 Iniciando upload de ${filesToProcess.length} arquivo(s)`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];

        setLocalUploadState(prev => ({
          ...prev,
          currentFile: i + 1,
          currentFileName: file.name
        }));

        console.log(`📄 [${i + 1}/${filesToProcess.length}] Enviando: ${file.name}`);

        try {
          // Criar uma Promise que aguarda o upload ser processado
          await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Timeout no upload'));
            }, 30000);

            try {
              // Fazer o upload
              onUpload(documentKey, file);

              // Aguardar um tempo para o upload ser processado
              setTimeout(() => {
                clearTimeout(timeoutId);
                resolve();
              }, 1500);
            } catch (error) {
              clearTimeout(timeoutId);
              reject(error);
            }
          });

          successCount++;
          console.log(`✅ Upload concluído: ${file.name}`);

        } catch (error) {
          errorCount++;
          console.error(`❌ Erro no upload: ${file.name}`, error);
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }

        // Pequena pausa entre uploads
        if (i < filesToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Mostrar resultado final apenas se houver uploads bem-sucedidos
      if (successCount > 0) {
        console.log(`🎉 Upload finalizado: ${successCount} arquivo(s) enviado(s) com sucesso`);
        // Não mostrar notificação customizada - usar apenas logs
      }

      // Mostrar erros se houver
      if (errorCount > 0) {
        console.error(`❌ Erros no upload: ${errorCount} arquivo(s)`);
        alert(`Erro em ${errorCount} arquivo(s):\n${errors.join('\n')}`);
      }

    } catch (error) {
      console.error('❌ Erro no processo de upload:', error);
      alert('Erro durante o processo de upload');
    } finally {
      setLocalUploadState({
        isUploading: false,
        currentFile: 0,
        totalFiles: 0,
        currentFileName: ''
      });
      isProcessingRef.current = false;
    }
  }, [documentKey, onUpload]);

  // Lidar com seleção de arquivos
  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    if (localUploadState.isUploading || isUploading) {
      alert('Upload em andamento. Aguarde a conclusão.');
      return;
    }

    const fileArray = Array.from(files);
    console.log(`📁 Selecionados ${fileArray.length} arquivo(s)`);

    // Validar arquivos
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });

    // Mostrar erros de validação
    if (invalidFiles.length > 0) {
      alert(`Arquivos inválidos:\n${invalidFiles.join('\n')}`);
    }

    // Adicionar arquivos válidos à fila
    if (validFiles.length > 0) {
      // Para upload único, confirmar substituição
      if (!allowMultiple && hasDocuments) {
        const shouldReplace = confirm('Já existe um documento. Deseja substituí-lo?');
        if (!shouldReplace) {
          return;
        }
      }

      uploadQueueRef.current = validFiles;
      processUploadQueue();
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Eventos de drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localUploadState.isUploading && !isUploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (localUploadState.isUploading || isUploading) {
      alert('Upload em andamento. Aguarde a conclusão.');
      return;
    }

    const files = e.dataTransfer.files;
    handleFileSelection(files);
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Download de documento
  const handleDownload = (index: number = 0) => {
    if (applicationId && onDownload) {
      onDownload(documentKey, index);
    } else if (documentsArray[index]?.data) {
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

  // Remover documento
  const handleRemoveDocument = async (index?: number) => {
    try {
      await onRemove(documentKey, index);
      // Removido o toast de sucesso que estava aparecendo incorretamente
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      // Não mostrar toast de erro, usar apenas logs
    }
  };

  const handleRemove = (index: number = 0) => {
    if (localUploadState.isUploading || isUploading) {
      alert('Upload em andamento. Aguarde a conclusão.');
      return;
    }

    const docToRemove = documentsArray[index];
    if (!docToRemove) {
      console.error('Documento não encontrado no índice:', index);
      return;
    }

    // Para múltiplos documentos, criar ID específico para o arquivo
    if (documentsArray.length > 1) {
      // Usar filename como identificador único para remoção individual
      const filename = docToRemove.filename || docToRemove.originalName || `doc_${index}`;
      const compoundId = `${documentKey}_${filename}`;
      console.log(`Removendo documento específico: ${compoundId} (índice: ${index})`);
      handleRemoveDocument(index);
    } else {
      // Para documento único, usar chave simples
      console.log(`Removendo documento único: ${documentKey}`);
      handleRemoveDocument(0);
    }
  };

  // Obter informações de status
  const getStatusInfo = () => {
    const isProcessing = isUploading || localUploadState.isUploading;

    if (isProcessing) {
      return {
        icon: Loader2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: localUploadState.isUploading 
          ? `Enviando ${localUploadState.currentFile}/${localUploadState.totalFiles}...` 
          : 'Enviando...'
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
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Obrigatório'
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
  const isProcessing = isUploading || localUploadState.isUploading;

  return (
    <Card className={`transition-all duration-200 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${isProcessing ? 'animate-spin' : ''}`} />
              {documentLabel}
              {isRequired && <span className="text-red-500 font-bold">*</span>}
            </CardTitle>
            {documentSubtitle && (
              <p className="text-xs text-gray-500 mt-1">{documentSubtitle}</p>
            )}
          </div>
          <Badge 
            variant={hasDocuments ? "default" : isRequired ? "destructive" : "secondary"}
            className="ml-2"
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
        {/* Área de Upload */}
        {!isProcessing && (allowMultiple || !hasDocuments) && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-700 mb-2 font-medium">
              {allowMultiple ? 'Selecione ou arraste múltiplos arquivos' : 'Selecione ou arraste um arquivo'}
            </p>
            <p className="text-xs text-gray-500">
              Máximo {maxFileSize}MB • Formatos: {acceptedTypes.join(', ')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedTypes.join(',')}
              multiple={allowMultiple}
              onChange={(e) => handleFileSelection(e.target.files)}
            />
          </div>
        )}

        {/* Estado de carregamento */}
        {isProcessing && (
          <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-6 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-blue-700 font-medium mb-2">
              {localUploadState.isUploading 
                ? `Enviando arquivo ${localUploadState.currentFile} de ${localUploadState.totalFiles}`
                : 'Enviando documento...'
              }
            </p>
            {localUploadState.currentFileName && (
              <p className="text-xs text-blue-600 mb-3">
                {localUploadState.currentFileName}
              </p>
            )}
            {localUploadState.isUploading && localUploadState.totalFiles > 0 && (
              <Progress 
                value={(localUploadState.currentFile / localUploadState.totalFiles) * 100} 
                className="w-full" 
              />
            )}
          </div>
        )}

        {/* Lista de Documentos */}
        {hasDocuments && (
          <div className="space-y-2 mt-4">
            {documentsArray.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(index)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Baixar documento"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remover documento"
                        disabled={isProcessing}
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

        {/* Botão para adicionar mais documentos */}
        {allowMultiple && hasDocuments && !isProcessing && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar mais documentos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}