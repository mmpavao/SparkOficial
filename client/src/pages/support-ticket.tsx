import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SupportTicketPage() {
  const [match, params] = useRoute("/support/ticket/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const permissions = useUserPermissions();
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const ticketId = params?.id;

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: [`/api/support/tickets/${ticketId}`],
    queryFn: () => apiRequest(`/api/support/tickets/${ticketId}`, 'GET'),
    enabled: !!ticketId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/support/tickets/${ticketId}/messages`],
    queryFn: () => apiRequest(`/api/support/tickets/${ticketId}/messages`, 'GET'),
    enabled: !!ticketId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; isInternal: boolean }) => {
      return await apiRequest(`/api/support/tickets/${ticketId}/messages`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso",
      });
      setMessage("");
      setIsInternal(false);
      queryClient.invalidateQueries({ queryKey: [`/api/support/tickets/${ticketId}/messages`] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ message, isInternal });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">
          <Clock className="w-3 h-3 mr-1" />
          Aberto
        </Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Em Andamento
        </Badge>;
      case 'waiting_response':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">
          <MessageSquare className="w-3 h-3 mr-1" />
          Aguardando Resposta
        </Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolvido
        </Badge>;
      case 'closed':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Fechado
        </Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-gray-100 text-gray-700">Baixa</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-700">Média</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">Alta</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700">Urgente</Badge>;
      default:
        return null;
    }
  };

  if (!match) {
    return null;
  }

  if (ticketLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Ticket não encontrado</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setLocation('/support')}
        >
          Voltar para Suporte
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <p className="text-gray-600 mt-1">#{ticket.ticketNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Categoria</p>
              <p className="font-medium">
                {ticket.category === 'document_issue' && 'Problema com Documentos'}
                {ticket.category === 'payment_question' && 'Dúvidas sobre Pagamento'}
                {ticket.category === 'technical_support' && 'Suporte Técnico'}
                {ticket.category === 'general_inquiry' && 'Consulta Geral'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Criado por</p>
              <p className="font-medium flex items-center gap-1">
                <User className="w-4 h-4" />
                {ticket.createdByName || 'Importador'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Data de Criação</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma mensagem ainda
              </p>
            ) : (
              messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.isInternal 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : msg.senderId === ticket.createdBy
                      ? 'bg-gray-50'
                      : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm">
                        {msg.senderName || (msg.senderId === ticket.createdBy ? 'Importador' : 'Suporte')}
                      </span>
                      {msg.isInternal && (
                        <Badge variant="outline" className="text-xs">
                          Interno
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          <Separator className="mb-6" />

          {/* Reply Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reply">Nova Mensagem</Label>
              <Textarea
                id="reply"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
                className="mt-1"
              />
            </div>

            {(permissions.isAdmin || permissions.isFinanceira) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                />
                <Label htmlFor="internal" className="text-sm font-normal">
                  Mensagem interna (visível apenas para administradores)
                </Label>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMessageMutation.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}