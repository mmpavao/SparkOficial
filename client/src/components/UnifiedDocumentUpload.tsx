
import { useState, useRef } from "react";
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
  const [currentlyUploading, setCurrentlyUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Nova função de upload sequencial
  const processFilesSequentially = async (files: File[]) => {
    if (currentlyUploading || isUploading) {
      console.log('❌ Upload já em andamento, ignorando novos arquivos');
      return;
    }

    setCurrentlyUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    console.log(`🚀 Iniciando upload sequencial de ${files.length} arquivo(s) para ${documentKey}`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`📄 [${i + 1}/${files.length}] Processando: ${file.name}`);
        setUploadProgress({ current: i + 1, total: files.length });

        // Validar arquivo
        const validation = validateFile(file);
        if (!validation.isValid) {
          console.error(`❌ Arquivo inválido: ${file.name} - ${validation.error}`);
          errors.push(`${file.name}: ${validation.error}`);
          errorCount++;
          continue;
        }

        // Para upload único, confirmar substituição apenas no primeiro arquivo
        if (!allowMultiple && hasDocuments && i === 0) {
          const shouldReplace = confirm('Já existe um documento. Deseja substituí-lo?');
          if (!shouldReplace) {
            console.log(`⏭️ Upload cancelado pelo usuário`);
            continue;
          }
        }

        try {
          console.log(`⬆️ Enviando arquivo: ${file.name}`);
          
          // Temporariamente suprimir notificações de sucesso automáticas
          const originalToast = window.toast;
          const suppressNotifications = () => {};
          
          // Interceptar possíveis notificações
          if (typeof window !== 'undefined') {
            window.toast = suppressNotifications;
          }

          try {
            // Criar uma Promise para aguardar o upload ser processado
            await new Promise<void>((resolve, reject) => {
              // Timeout de segurança
              const timeout = setTimeout(() => {
                reject(new Error('Timeout no upload'));
              }, 30000);

              try {
                onUpload(documentKey, file);
                
                // Aguardar um tempo para o upload ser processado
                setTimeout(() => {
                  clearTimeout(timeout);
                  resolve();
                }, 1500);
                
              } catch (error) {
                clearTimeout(timeout);
                reject(error);
              }
            });
          } finally {
            // Restaurar função de toast original
            if (originalToast) {
              window.toast = originalToast;
            }
          }

          console.log(`✅ Upload concluído: ${file.name}`);
          successCount++;
          
        } catch (error) {
          console.error(`❌ Erro no upload de ${file.name}:`, error);
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          errorCount++;
        }

        // Intervalo entre uploads para evitar conflitos
        if (i < files.length - 1) {
          console.log(`⏸️ Aguardando antes do próximo upload...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Mostrar notificação única no final
      if (successCount > 0 || errorCount > 0) {
        let message = '';
        
        if (successCount > 0) {
          message += `${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso`;
        }
        
        if (errorCount > 0) {
          if (successCount > 0) {
            message += ` | ${errorCount} erro${errorCount > 1 ? 's' : ''}`;
          } else {
            message += `${errorCount} erro${errorCount > 1 ? 's' : ''} no upload`;
          }
        }

        // Criar notificação customizada única e consolidada
        const notification = document.createElement('div');
        notification.setAttribute('data-upload-notification', 'true');
        notification.innerHTML = `
          <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${successCount > 0 && errorCount === 0 ? '#10b981' : errorCount > 0 ? '#f59e0b' : '#6b7280'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
              ">
                ${successCount > 0 && errorCount === 0 ? '✓' : errorCount > 0 ? '!' : 'i'}
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 2px;">
                  ${successCount > 0 && errorCount === 0 ? 'Upload Concluído' : errorCount > 0 ? 'Upload com Avisos' : 'Upload Finalizado'}
                </div>
                <div style="opacity: 0.9; font-size: 13px;">
                  ${message}
                </div>
              </div>
            </div>
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        // Remover qualquer notificação anterior do mesmo tipo
        const existingNotifications = document.querySelectorAll('[data-upload-notification="true"]');
        existingNotifications.forEach(notif => notif.remove());
        
        document.body.appendChild(notification);
        
        // Remover notificação após 6 segundos
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
              if (notification.parentNode) {
                document.body.removeChild(notification);
              }
            }, 300);
          }
        }, 6000);

        // Mostrar erros detalhados se houver
        if (errors.length > 0) {
          setTimeout(() => {
            alert(`Detalhes dos erros:\n${errors.join('\n')}`);
          }, 1000);
        }
      }

    } catch (error) {
      console.error('❌ Erro no processo de upload:', error);
      alert('Erro durante o processo de upload');
    } finally {
      setCurrentlyUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      console.log(`🏁 Processo de upload finalizado para ${documentKey} - ${successCount} sucessos, ${errorCount} erros`);
    }
  };

  // Lidar com seleção de arquivos
  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    if (currentlyUploading || isUploading) {
      alert('Upload em andamento. Aguarde a conclusão antes de enviar novos arquivos.');
      return;
    }

    const fileArray = Array.from(files);
    console.log(`📁 Selecionados ${fileArray.length} arquivo(s) para upload`);

    // Validar todos os arquivos primeiro
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

    // Processar arquivos válidos
    if (validFiles.length > 0) {
      processFilesSequentially(validFiles);
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
    if (!currentlyUploading && !isUploading) {
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
    
    if (currentlyUploading || isUploading) {
      alert('Upload em andamento. Aguarde a conclusão antes de enviar novos arquivos.');
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
  const handleRemove = (index: number = 0) => {
    if (currentlyUploading || isUploading) {
      alert('Upload em andamento. Aguarde a conclusão antes de remover documentos.');
      return;
    }

    if (documentsArray.length === 1) {
      onRemove(documentKey);
    } else {
      onRemove(documentKey, index);
    }
  };

  // Obter informações de status
  const getStatusInfo = () => {
    const isProcessing = isUploading || currentlyUploading;
    
    if (isProcessing) {
      return {
        icon: Loader2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: currentlyUploading 
          ? `Enviando ${uploadProgress.current}/${uploadProgress.total}...` 
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
  const isProcessing = isUploading || currentlyUploading;

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
              {currentlyUploading 
                ? `Enviando arquivo ${uploadProgress.current} de ${uploadProgress.total}...`
                : 'Enviando documento...'
              }
            </p>
            {currentlyUploading && uploadProgress.total > 0 && (
              <>
                <Progress 
                  value={(uploadProgress.current / uploadProgress.total) * 100} 
                  className="w-full mt-3" 
                />
                <p className="text-xs text-blue-600 mt-2">
                  Progresso: {uploadProgress.current}/{uploadProgress.total} arquivos
                </p>
              </>
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
