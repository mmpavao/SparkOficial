import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Edit, DollarSign, Calendar } from 'lucide-react';

interface PaymentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number;
}

export default function PaymentEditModal({ isOpen, onClose, paymentId }: PaymentEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados do formulário
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const { data: payment, isLoading } = useQuery({
    queryKey: ['/api/payment-schedules', paymentId],
    queryFn: () => apiRequest('GET', `/api/payment-schedules/${paymentId}`),
    enabled: isOpen
  });

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (payment) {
      setAmount(payment.amount);
      setDueDate(payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '');
      setNotes(payment.notes || '');
    }
  }, [payment]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/payment-schedules/${paymentId}`, "PUT", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Atualizado",
        description: "As informações do pagamento foram atualizadas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na Atualização",
        description: error.message || "Erro ao atualizar pagamento",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!amount || !dueDate) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o valor e a data de vencimento.",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      amount: parseFloat(amount).toString(),
      dueDate,
      notes: notes.trim()
    };

    updateMutation.mutate(updateData);
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getPaymentTypeLabel = (type: string, installmentNumber?: number) => {
    switch (type) {
      case 'down_payment': return 'Entrada (30%)';
      case 'installment': return `${installmentNumber}ª Parcela`;
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <div className="text-center py-8">
            <p className="text-gray-600">Pagamento não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Não permitir edição de pagamentos já pagos
  if (payment.status === 'paid') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">Pagamentos já realizados não podem ser editados.</p>
            <Button onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Atuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Tipo de Pagamento</Label>
                  <p className="font-medium">
                    {getPaymentTypeLabel(payment.paymentType, payment.installmentNumber)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <p className="font-medium">
                    {payment.status === 'pending' ? 'Pendente' : 
                     payment.status === 'overdue' ? 'Vencido' : 'Programado'}
                  </p>
                </div>
              </div>
              
              {payment.totalInstallments && (
                <div>
                  <Label className="text-sm text-gray-600">Parcela</Label>
                  <p className="font-medium">
                    {payment.installmentNumber} de {payment.totalInstallments} parcelas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulário de Edição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Editáveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                  {amount && (
                    <p className="text-sm text-gray-600 mt-1">
                      Valor formatado: {formatCurrency(amount)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre este pagamento..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Alterações no valor ou data de vencimento podem afetar 
              o cronograma de pagamentos da importação.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            onClick={onClose} 
            variant="outline"
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}