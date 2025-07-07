import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send } from "lucide-react";

export default function SupportNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");

  // Get creditApplicationId from URL params if provided
  const urlParams = new URLSearchParams(window.location.search);
  const creditApplicationId = urlParams.get('applicationId');

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/support/tickets', 'POST', data);
    },
    onSuccess: (ticket) => {
      toast({
        title: "Sucesso",
        description: "Ticket criado com sucesso",
      });
      setLocation(`/support/ticket/${ticket.id}`);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar ticket",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !category || !message) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate({
      subject,
      category,
      priority,
      message,
      creditApplicationId: creditApplicationId ? parseInt(creditApplicationId) : undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Abrir Ticket de Suporte</h1>
        <p className="text-gray-600 mt-2">Descreva sua dúvida ou problema e nossa equipe entrará em contato</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="subject">Assunto *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Descreva brevemente o assunto"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document_issue">Problema com Documentos</SelectItem>
                    <SelectItem value="payment_question">Dúvidas sobre Pagamento</SelectItem>
                    <SelectItem value="technical_support">Suporte Técnico</SelectItem>
                    <SelectItem value="general_inquiry">Consulta Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva detalhadamente sua dúvida ou problema..."
                rows={6}
                className="mt-1"
              />
            </div>

            {creditApplicationId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Este ticket está relacionado à solicitação de crédito #{creditApplicationId}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTicketMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {createTicketMutation.isPending ? "Enviando..." : "Enviar Ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}