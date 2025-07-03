import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Save,
  Plus,
  Minus,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentSchedule {
  id: number;
  importId: number;
  paymentType: string;
  dueDate: string;
  amount: string;
  currency: string;
  status: string;
  installmentNumber?: number;
  totalInstallments?: number;
  paymentNotes?: string;
  importData?: {
    importName: string;
    supplierId: number;
  };
}

interface PaymentEditPageProps {
  params: { id: string };
}

export default function PaymentEditPage({ params }: PaymentEditPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = parseInt(params.id);

  const [editData, setEditData] = useState({
    amount: "",
    dueDate: "",
    notes: "",
    splitInstallments: 1
  });

  // Buscar detalhes do pagamento
  const { data: payment, isLoading, error } = useQuery<PaymentSchedule>({
    queryKey: ['/api/payment-schedules', paymentId],
    enabled: !!paymentId,
  });

  // Preencher dados quando carregados
  useEffect(() => {
    if (payment) {
      setEditData({
        amount: payment.amount,
        dueDate: payment.dueDate.split('T')[0], // Formato YYYY-MM-DD
        notes: payment.paymentNotes || "",
        splitInstallments: 1
      });
    }
  }, [payment]);

  // Mutação para atualizar pagamento
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/payment-schedules/${paymentId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Atualizado",
        description: "As informações do pagamento foram atualizadas com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation(`/payments/${paymentId}`);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutação para dividir em parcelas
  const splitPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/payment-schedules/${paymentId}/split`, data);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Dividido",
        description: "O pagamento foi dividido em parcelas com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation('/payments');
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao dividir pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleSaveChanges = () => {
    if (!editData.amount || !editData.dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha valor e data de vencimento.",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      amount: editData.amount,
      dueDate: editData.dueDate,
      notes: editData.notes
    };

    updatePaymentMutation.mutate(updateData);
  };

  const handleSplitPayment = () => {
    if (editData.splitInstallments < 2 || editData.splitInstallments > 12) {
      toast({
        title: "Número inválido",
        description: "Número de parcelas deve ser entre 2 e 12.",
        variant: "destructive",
      });
      return;
    }

    const splitData = {
      installments: editData.splitInstallments,
      startDate: editData.dueDate
    };

    splitPaymentMutation.mutate(splitData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      paid: { label: "Pago", className: "bg-green-100 text-green-800 border-green-300" },
      overdue: { label: "Vencido", className: "bg-red-100 text-red-800 border-red-300" },
      processing: { label: "Processando", className: "bg-blue-100 text-blue-800 border-blue-300" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <DollarSign className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Erro ao carregar pagamento</p>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/payments')}
            className="mt-4"
          >
            Voltar aos Pagamentos
          </Button>
        </div>
      </div>
    );
  }

  // Não permitir edição de pagamentos já processados
  if (payment.status === 'paid' || payment.status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Este pagamento não pode ser editado</p>
          <p className="text-sm text-gray-500 mt-2">
            Pagamentos com status "{payment.status === 'paid' ? 'Pago' : 'Processando'}" não podem ser modificados
          </p>
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/payments/${paymentId}`)}
            className="mt-4"
          >
            Ver Detalhes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/payments/${paymentId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Pagamento #{paymentId}
            </h1>
            <p className="text-gray-600">
              {payment.importData?.importName || `Importação #${payment.importId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Status e Valor Atual */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Atual</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(payment.amount).replace('R$', `${payment.currency}$`)}
                </p>
                <p className="text-sm text-gray-600">
                  {payment.paymentType === 'installment' && payment.installmentNumber && payment.totalInstallments
                    ? `Parcela ${payment.installmentNumber} de ${payment.totalInstallments}`
                    : payment.paymentType === 'down_payment' 
                      ? 'Pagamento à vista'
                      : 'Pagamento único'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(payment.status)}
              <p className="text-sm text-gray-600 mt-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Vencimento: {formatDate(payment.dueDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edição de Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Editar Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="edit-amount">Valor (USD)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  amount: e.target.value
                }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-date">Data de Vencimento</Label>
              <Input
                id="edit-date"
                type="date"
                value={editData.dueDate}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  dueDate: e.target.value
                }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                placeholder="Observações sobre o pagamento..."
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </div>

            <Button 
              onClick={handleSaveChanges}
              disabled={updatePaymentMutation.isPending}
              className="w-full"
            >
              {updatePaymentMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Dividir em Parcelas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Dividir em Parcelas
            </CardTitle>
            <p className="text-sm text-gray-600">
              Transforme este pagamento único em múltiplas parcelas mensais
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="split-installments">Número de Parcelas</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditData(prev => ({
                    ...prev,
                    splitInstallments: Math.max(2, prev.splitInstallments - 1)
                  }))}
                  disabled={editData.splitInstallments <= 2}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  id="split-installments"
                  type="number"
                  min="2"
                  max="12"
                  value={editData.splitInstallments}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    splitInstallments: Math.min(12, Math.max(2, parseInt(e.target.value) || 2))
                  }))}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditData(prev => ({
                    ...prev,
                    splitInstallments: Math.min(12, prev.splitInstallments + 1)
                  }))}
                  disabled={editData.splitInstallments >= 12}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Prévia das Parcelas:</p>
              <div className="space-y-1 text-sm text-gray-600">
                {Array.from({ length: editData.splitInstallments }, (_, index) => {
                  const installmentAmount = parseFloat(editData.amount) / editData.splitInstallments;
                  const dueDate = new Date(editData.dueDate);
                  dueDate.setMonth(dueDate.getMonth() + index);
                  
                  return (
                    <div key={index} className="flex justify-between">
                      <span>Parcela {index + 1}:</span>
                      <span>
                        {formatCurrency(installmentAmount.toFixed(2)).replace('R$', `${payment.currency}$`)} - {formatDate(dueDate.toISOString())}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
              onClick={handleSplitPayment}
              disabled={splitPaymentMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {splitPaymentMutation.isPending ? "Dividindo..." : `Dividir em ${editData.splitInstallments} Parcelas`}
            </Button>

            <div className="text-xs text-gray-500">
              <p>⚠️ Esta ação criará {editData.splitInstallments} novos pagamentos mensais e removerá o pagamento atual.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}