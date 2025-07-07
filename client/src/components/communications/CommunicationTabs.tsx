import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, FileText, AlertCircle, Send, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import DocumentRequestCard from "./DocumentRequestCard";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface CommunicationTabsProps {
  creditApplicationId: number;
  applicationUserId: number;
}

export default function CommunicationTabs({ creditApplicationId, applicationUserId }: CommunicationTabsProps) {
  const [activeTab, setActiveTab] = useState("messages");
  const [message, setMessage] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const { toast } = useToast();
  const permissions = useUserPermissions();
  
  // Fetch document requests
  const { data: documentRequests = [] } = useQuery({
    queryKey: [`/api/credit/applications/${creditApplicationId}/document-requests`],
    queryFn: () => apiRequest(`/api/credit/applications/${creditApplicationId}/document-requests`, "GET"),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return await apiRequest(`/api/credit/applications/${creditApplicationId}/messages`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso",
      });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/credit/applications/${creditApplicationId}`] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  // Request document mutation
  const requestDocumentMutation = useMutation({
    mutationFn: async (data: {
      documentName: string;
      documentType: string;
      description?: string;
    }) => {
      return await apiRequest("/api/document-requests", "POST", {
        creditApplicationId,
        requestedFrom: applicationUserId,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Documento solicitado com sucesso",
      });
      setDocumentName("");
      setDocumentType("");
      setDocumentDescription("");
      queryClient.invalidateQueries({ 
        queryKey: [`/api/credit/applications/${creditApplicationId}/document-requests`] 
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao solicitar documento",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ message });
  };

  const handleRequestDocument = () => {
    if (!documentName || !documentType) {
      toast({
        title: "Erro",
        description: "Preencha o nome e tipo do documento",
        variant: "destructive",
      });
      return;
    }
    requestDocumentMutation.mutate({
      documentName,
      documentType,
      description: documentDescription,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comunicações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full mb-6 h-auto sm:h-10">
            <TabsTrigger value="messages" className="w-full justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">Observações</TabsTrigger>
            <TabsTrigger value="documents" className="w-full justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">Documentos</TabsTrigger>
            <TabsTrigger value="tickets" className="w-full justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">Tickets</TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4 mt-4">
            {permissions.isImporter ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Use o sistema de tickets para se comunicar com o administrador</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Enviar Observação ao Importador</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Observação
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            {/* Document Requests List */}
            {documentRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Documentos Solicitados</h3>
                <div className="grid gap-3">
                  {documentRequests.map((request: any) => (
                    <DocumentRequestCard
                      key={request.id}
                      request={request}
                      isImporter={permissions.isImporter}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Request Document Form (Admin/Financeira only) */}
            {(permissions.isAdmin || permissions.isFinanceira) && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-medium">Solicitar Novo Documento</h3>
                
                <div>
                  <Label htmlFor="documentName">Nome do Documento</Label>
                  <Input
                    id="documentName"
                    placeholder="Ex: Contrato Social Atualizado"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger id="documentType" className="mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contrato">Contrato</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="documentDescription">Descrição (opcional)</Label>
                  <Textarea
                    id="documentDescription"
                    placeholder="Descreva o documento solicitado..."
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleRequestDocument}
                  disabled={!documentName || !documentType || requestDocumentMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Solicitar Documento
                </Button>
              </div>
            )}

            {permissions.isImporter && documentRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum documento foi solicitado</p>
              </div>
            )}
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4 mt-4">
            {permissions.isImporter ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Abra um ticket para se comunicar com o administrador
                </p>
                <Button
                  onClick={() => {
                    // Navigate to support ticket creation
                    window.location.href = `/support/new?applicationId=${creditApplicationId}`;
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Abrir Novo Ticket
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Acesse a página de suporte para gerenciar tickets</p>
                <Button
                  onClick={() => {
                    window.location.href = "/admin/support";
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Ir para Suporte
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}