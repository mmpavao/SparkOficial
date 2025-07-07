import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

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

interface UseDocumentUploadOptions {
  applicationId: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDocumentUpload({ applicationId, onSuccess, onError }: UseDocumentUploadOptions) {
  const { toast } = useToast();
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  // Validate file before upload
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'Arquivo muito grande (máximo 10MB)' };
    }

    // File type validation
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      return { isValid: false, error: `Formato não suportado. Use: ${validExtensions.join(', ')}` };
    }

    return { isValid: true };
  };

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ documentType, file, isMandatory = true }: { 
      documentType: string; 
      file: File; 
      isMandatory?: boolean 
    }) => {
      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('isMandatory', isMandatory.toString());

      const response = await fetch(`/api/credit/applications/${applicationId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha no upload do documento');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financeira/credit-applications", applicationId] });
      
      setUploadingDocument(null);
      
      toast({
        title: "Documento enviado",
        description: "Documento enviado com sucesso.",
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
      
      setUploadingDocument(null);
      onError?.(error);
    },
  });

  // Remove document mutation
  const removeMutation = useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => {
      const response = await fetch(`/api/credit/applications/${applicationId}/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao remover documento');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financeira/credit-applications", applicationId] });
      
      toast({
        title: "Documento removido",
        description: "Documento removido com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Remove error:", error);
      
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover o documento.",
        variant: "destructive",
      });
    },
  });

  // Helper function to handle document upload
  const handleUpload = (documentType: string, file: File, isMandatory = true) => {
    setUploadingDocument(documentType);
    uploadMutation.mutate({ documentType, file, isMandatory });
  };

  // Helper function to handle document removal
  const handleRemove = (documentId: string) => {
    removeMutation.mutate({ documentId });
  };

  // Helper to process document for display
  const processDocumentForDisplay = (doc: any): DocumentInfo | DocumentInfo[] => {
    if (!doc) return [];
    
    // Handle array of documents
    if (Array.isArray(doc)) {
      return doc.map(d => ({
        filename: d.filename || d.originalName || 'Documento',
        originalName: d.originalName || d.filename || 'Documento',
        size: d.size || 0,
        type: d.type || 'application/octet-stream',
        uploadedAt: d.uploadedAt || new Date().toISOString(),
        uploadedBy: d.uploadedBy || 'Sistema',
      }));
    }
    
    // Handle single document
    return {
      filename: doc.filename || doc.originalName || 'Documento',
      originalName: doc.originalName || doc.filename || 'Documento',
      size: doc.size || 0,
      type: doc.type || 'application/octet-stream',
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      uploadedBy: doc.uploadedBy || 'Sistema',
    };
  };

  return {
    uploadingDocument,
    isUploading: uploadMutation.isPending,
    isRemoving: removeMutation.isPending,
    handleUpload,
    handleRemove,
    processDocumentForDisplay,
    validateFile,
  };
}