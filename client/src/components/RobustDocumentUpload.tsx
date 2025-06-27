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

  // Get current document for this key
  const currentDoc = uploadedDocuments[documentKey];
  const hasDocument = !!currentDoc && currentDoc.filename;

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

  const handleRemoveDocument = () => {
    onRemove(documentKey);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/documents/download/${documentKey}/${applicationId}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                Enviado
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
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {currentDoc.originalName || currentDoc.filename}
                </p>
                <p className="text-xs text-green-600">
                  {currentDoc.size ? `${(currentDoc.size / 1024 / 1024).toFixed(2)} MB` : ''} • 
                  {currentDoc.uploadedAt ? new Date(currentDoc.uploadedAt).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Download Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
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
                      Tem certeza que deseja remover o documento "{currentDoc.originalName || currentDoc.filename}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveDocument}
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