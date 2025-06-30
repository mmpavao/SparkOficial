import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DocumentManagerProps {
  importId: number;
  documents?: string[];
}

const DOCUMENT_CATEGORIES = [
  { id: 'invoice', name: 'Fatura Comercial', required: true },
  { id: 'packing_list', name: 'Lista de Embalagem', required: true },
  { id: 'bill_of_lading', name: 'Conhecimento de Embarque', required: true },
  { id: 'certificate_origin', name: 'Certificado de Origem', required: false },
  { id: 'insurance_policy', name: 'Apólice de Seguro', required: false },
  { id: 'quality_certificate', name: 'Certificado de Qualidade', required: false },
  { id: 'customs_declaration', name: 'Declaração Aduaneira', required: false },
  { id: 'additional_docs', name: 'Documentos Adicionais', required: false },
];

export default function DocumentManager({ importId, documents = [] }: DocumentManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: { category: string; file: File }) => {
      const formData = new FormData();
      formData.append('document', data.file);
      formData.append('category', data.category);
      
      return await fetch(`/api/imports/${importId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      }).then(res => res.json());
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Documento enviado",
        description: `${DOCUMENT_CATEGORIES.find(c => c.id === variables.category)?.name} enviado com sucesso`,
      });
      
      // Limpar arquivo selecionado
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[variables.category];
        return updated;
      });
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: [`/api/imports/${importId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/imports/${importId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error?.message || "Ocorreu um erro ao enviar o documento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (category: string) => {
      return await apiRequest(`/api/imports/${importId}/documents/${category}`, 'DELETE');
    },
    onSuccess: (data, category) => {
      toast({
        title: "Documento removido",
        description: `${DOCUMENT_CATEGORIES.find(c => c.id === category)?.name} removido com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/imports/${importId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/imports/${importId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error?.message || "Ocorreu um erro ao remover o documento",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (category: string, file: File | null) => {
    if (!file) return;
    
    // Validar tipo de arquivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas PDF, JPG e PNG são aceitos",
        variant: "destructive",
      });
      return;
    }
    
    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFiles(prev => ({ ...prev, [category]: file }));
  };

  const handleUpload = (category: string) => {
    const file = selectedFiles[category];
    if (!file) return;
    
    uploadMutation.mutate({ category, file });
  };

  const isDocumentUploaded = (category: string) => {
    // documents can be either array of strings or object with document data
    if (Array.isArray(documents)) {
      return documents.includes(category);
    }
    
    // If documents is a string (JSON), parse it
    if (typeof documents === 'string') {
      try {
        const parsedDocs = JSON.parse(documents);
        return parsedDocs && parsedDocs[category];
      } catch {
        return false;
      }
    }
    
    // If documents is an object
    if (typeof documents === 'object' && documents !== null) {
      return documents[category];
    }
    
    return false;
  };

  const requiredDocs = DOCUMENT_CATEGORIES.filter(doc => doc.required);
  const optionalDocs = DOCUMENT_CATEGORIES.filter(doc => !doc.required);
  const uploadedCount = DOCUMENT_CATEGORIES.filter(doc => isDocumentUploaded(doc.id)).length;

  return (
    <div className="space-y-6">
      {/* Status geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Status dos Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {uploadedCount} de {DOCUMENT_CATEGORIES.length} documentos enviados
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadedCount / DOCUMENT_CATEGORIES.length) * 100}%` }}
                />
              </div>
            </div>
            <Badge 
              variant={uploadedCount >= requiredDocs.length ? "default" : "secondary"}
              className={uploadedCount >= requiredDocs.length ? "" : "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"}
            >
              {uploadedCount >= requiredDocs.length ? "Completo" : "Pendente"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Documentos obrigatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Documentos Obrigatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredDocs.map((doc) => {
            const uploaded = isDocumentUploaded(doc.id);
            const selectedFile = selectedFiles[doc.id];
            const isUploading = uploadMutation.isPending;

            return (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {uploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.name}</p>
                      {!uploaded && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {uploaded ? 'Documento enviado' : 'Documento obrigatório'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!uploaded && (
                    <>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(doc.id, e.target.files?.[0] || null)}
                        className="w-48"
                      />
                      {selectedFile && (
                        <Button
                          onClick={() => handleUpload(doc.id)}
                          disabled={isUploading}
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          {isUploading ? 'Enviando...' : 'Enviar'}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {uploaded && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Documentos opcionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Documentos Opcionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {optionalDocs.map((doc) => {
            const uploaded = isDocumentUploaded(doc.id);
            const selectedFile = selectedFiles[doc.id];
            const isUploading = uploadMutation.isPending;

            return (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {uploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-orange-400" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.name}</p>
                      {!uploaded && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {uploaded ? 'Documento enviado' : 'Documento opcional'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!uploaded && (
                    <>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(doc.id, e.target.files?.[0] || null)}
                        className="w-48"
                      />
                      {selectedFile && (
                        <Button
                          onClick={() => handleUpload(doc.id)}
                          disabled={isUploading}
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          {isUploading ? 'Enviando...' : 'Enviar'}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {uploaded && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}