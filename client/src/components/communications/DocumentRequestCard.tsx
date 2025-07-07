import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { DocumentRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DocumentRequestCardProps {
  request: DocumentRequest;
  isImporter: boolean;
}

export default function DocumentRequestCard({ request, isImporter }: DocumentRequestCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest(`/api/document-requests/${request.id}/upload`, "POST", formData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/document-requests'] });
      setFile(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar documento",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    await uploadMutation.mutateAsync(formData);
    setUploading(false);
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </Badge>;
      case 'uploaded':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">
          <Upload className="w-3 h-3 mr-1" />
          Enviado
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aprovado
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Rejeitado
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {request.documentName}
            </CardTitle>
            <p className="text-sm text-gray-600">{request.documentType}</p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {request.description && (
          <p className="text-sm text-gray-600 mb-4">{request.description}</p>
        )}
        
        {isImporter && request.status === 'pending' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id={`file-${request.id}`}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
              />
              <label
                htmlFor={`file-${request.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors">
                  {file ? (
                    <p className="text-sm text-gray-600">{file.name}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Clique para selecionar arquivo
                    </p>
                  )}
                </div>
              </label>
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
              size="sm"
            >
              {uploading ? "Enviando..." : "Enviar Documento"}
            </Button>
          </div>
        )}
        
        {request.uploadedFileUrl && (
          <div className="mt-3">
            <a
              href={request.uploadedFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Ver documento enviado
            </a>
          </div>
        )}
        
        {request.reviewNotes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Observações:</strong> {request.reviewNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}