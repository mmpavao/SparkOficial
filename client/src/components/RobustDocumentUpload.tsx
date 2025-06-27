import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  CheckCircle2, 
  FileText,
  X,
  Download,
  Plus
} from "lucide-react";

interface DocumentFile {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: number;
  data?: string;
  id?: string;
}

interface RobustDocumentUploadProps {
  documentKey: string;
  documentLabel: string;
  documentSubtitle?: string;
  isRequired: boolean;
  uploadedDocuments: Record<string, any>;
  applicationId: number;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: (documentKey: string) => void;
}

export function RobustDocumentUpload({
  documentKey,
  documentLabel,
  documentSubtitle,
  isRequired,
  uploadedDocuments,
  applicationId,
  isUploading,
  onUpload,
  onRemove
}: RobustDocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get current documents for this key (can be single document or array)
  const currentDocs = uploadedDocuments[documentKey];
  const documentList = Array.isArray(currentDocs) ? currentDocs : (currentDocs ? [currentDocs] : []);
  const hasDocument = documentList.length > 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas PDF, JPG, PNG, DOC e DOCX são aceitos",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    onUpload(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (docIndex?: any) => {
    if (documentList.length === 1) {
      // Remove single document
      onRemove(documentKey);
    } else if (typeof docIndex === 'number' && docIndex >= 0 && docIndex < documentList.length) {
      // Remove specific document by index for multiple documents
      onRemove(`${documentKey}_${docIndex}`);
    } else {
      // Fallback: remove all documents for this key
      onRemove(documentKey);
    }
  };

  const handleDownload = (doc: DocumentFile, index: number = 0) => {
    // For new applications (applicationId = 0), handle local download
    if (applicationId === 0) {
      if (!doc.data) {
        toast({
          title: "Erro no download",
          description: "Dados do documento não disponíveis",
          variant: "destructive",
        });
        return;
      }

      try {
        // Convert base64 to blob for local download
        const byteCharacters = atob(doc.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: doc.type });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.originalName || doc.filename || `documento_${documentKey}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Local download error:", error);
        toast({
          title: "Erro no download",
          description: "Não foi possível fazer o download do documento",
          variant: "destructive",
        });
      }
      return;
    }

    // For saved applications, use server endpoint
    if (!doc || !doc.data) {
      toast({
        title: "Erro no download",
        description: "Documento não encontrado ou dados corrompidos",
        variant: "destructive",
      });
      return;
    }

    try {
      const link = document.createElement('a');
      const downloadKey = documentList.length > 1 ? `${documentKey}_${index}` : documentKey;
      link.href = `/api/documents/download/${downloadKey}/${applicationId}`;
      link.target = '_blank';
      link.download = doc.originalName || doc.filename || `documento_${documentKey}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível fazer o download do documento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{documentLabel}</label>
            {isRequired && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            {hasDocument && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {documentList.length === 1 ? "Enviado" : `${documentList.length} Enviados`}
              </Badge>
            )}
            {!hasDocument && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                Pendente
              </Badge>
            )}
          </div>
          {documentSubtitle && (
            <span className="text-xs text-gray-500 italic">{documentSubtitle}</span>
          )}
        </div>
      </div>

      {/* Document Display */}
      {hasDocument && (
        <div className="space-y-2">
          {documentList.map((doc, index) => (
            <div key={`${documentKey}_${index}`} className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {doc.originalName || doc.filename}
                      {documentList.length > 1 && (
                        <span className="ml-2 text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded">
                          {index + 1} de {documentList.length}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-green-600">
                      {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : ''} • 
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc, index)}
                    className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                  >
                    <Download className="w-3 h-3" />
                  </Button>

                  {/* Remove Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover documento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover o documento "{doc.originalName || doc.filename}"? Esta ação não pode ser desfeita.
                          {documentList.length > 1 && " Os outros documentos desta categoria serão mantidos."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveDocument(index)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
          ${hasDocument ? 
            "border-green-300 bg-green-50 hover:bg-green-100" : 
            "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
          }
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
        />

        <div className="flex flex-col items-center gap-2">
          {hasDocument ? (
            <>
              <Plus className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">
                {isUploading ? "Enviando..." : "+ Adicionar outro documento"}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {isUploading ? "Enviando..." : "Clique para enviar"}
              </span>
            </>
          )}
          <span className="text-xs text-gray-500">
            PDF, JPG, PNG, DOC (máx. 10MB)
          </span>
        </div>
      </div>
    </div>
  );
}