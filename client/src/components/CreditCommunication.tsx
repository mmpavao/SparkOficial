import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  FileText, 
  AlertTriangle,
  User,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";

interface CreditCommunicationProps {
  application: any;
}

export default function CreditCommunication({ application }: CreditCommunicationProps) {
  const permissions = useUserPermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'observation' | 'document_request' | 'analysis_note'>('observation');

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, type }: { message: string; type: string }) => {
      if (permissions.canManageApplications) {
        // Admin/Financeira sending message
        return apiRequest(`/api/credit-applications/${application.id}/admin-message`, "PUT", {
          message,
          type
        });
      } else {
        // Importer replying
        return apiRequest(`/api/credit-applications/${application.id}/importer-reply`, "PUT", {
          reply: message
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
      setMessage("");
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/credit/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credit-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financeira/credit-applications'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({ message, type: messageType });
  };

  // Show existing communications
  const hasExistingCommunications = application.requestedDocuments || 
                                    application.adminObservations || 
                                    application.analysisNotes ||
                                    application.financialNotes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comunicações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Existing Communications Display */}
        {hasExistingCommunications && (
          <div className="space-y-3">
            {application.requestedDocuments && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Documentos Solicitados</h4>
                    <p className="text-yellow-700 text-sm whitespace-pre-wrap">{application.requestedDocuments}</p>
                  </div>
                </div>
              </div>
            )}

            {application.adminObservations && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Observações Administrativas</h4>
                    <p className="text-blue-700 text-sm whitespace-pre-wrap">{application.adminObservations}</p>
                  </div>
                </div>
              </div>
            )}

            {application.financialNotes && permissions.canManageApplications && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Observações Financeiras</h4>
                    <p className="text-green-700 text-sm whitespace-pre-wrap">{application.financialNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {application.analysisNotes && permissions.canManageApplications && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Notas da Análise</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{application.analysisNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Input Section */}
        <div className="space-y-3 pt-4 border-t">
          {permissions.canManageApplications && (
            <div className="flex gap-2">
              <Badge 
                variant={messageType === 'observation' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setMessageType('observation')}
              >
                Observação
              </Badge>
              <Badge 
                variant={messageType === 'document_request' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setMessageType('document_request')}
              >
                Solicitar Documento
              </Badge>
              <Badge 
                variant={messageType === 'analysis_note' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setMessageType('analysis_note')}
              >
                Nota de Análise
              </Badge>
            </div>
          )}

          <Textarea
            placeholder={
              permissions.canManageApplications 
                ? "Digite sua mensagem para o importador..." 
                : "Digite sua resposta..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />

          <Button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !message.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendMessageMutation.isPending ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}