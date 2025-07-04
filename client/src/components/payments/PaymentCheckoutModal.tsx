import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import {
  Upload,
  CreditCard,
  DollarSign,
  CheckCircle,
  Smartphone,
  QrCode,
  X
} from "lucide-react";

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number;
}

interface PaymentSchedule {
  id: number;
  importId: number;
  paymentType: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

export default function PaymentCheckoutModal({ isOpen, onClose, paymentId }: PaymentCheckoutModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States for external payment
  const [externalAmount, setExternalAmount] = useState("");
  const [externalDescription, setExternalDescription] = useState("");
  const [externalDate, setExternalDate] = useState("");
  const [externalReceipt, setExternalReceipt] = useState<File | null>(null);

  // States for Pay Comex
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'card' | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  // Fetch payment data
  const { data: payment, isLoading } = useQuery({
    queryKey: ['/api/payment-schedules', paymentId],
    queryFn: () => apiRequest(`/api/payment-schedules/${paymentId}`, 'GET'),
    enabled: isOpen && !!paymentId
  });

  // External payment mutation
  const externalPaymentMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('amount', externalAmount);
      formData.append('description', externalDescription);
      formData.append('paymentDate', externalDate);
      if (externalReceipt) {
        formData.append('receipt', externalReceipt);
      }

      return apiRequest(`/api/payment-schedules/${paymentId}/pay-external`, 'POST', formData);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento registrado",
        description: "Pagamento externo registrado com sucesso!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento externo",
        variant: "destructive"
      });
    }
  });

  // Pay Comex mutation
  const payComexMutation = useMutation({
    mutationFn: async (method: 'pix' | 'card') => {
      return apiRequest(`/api/payment-schedules/${paymentId}/pay-comex`, 'POST', {
        method,
        details: method === 'card' ? cardData : {}
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Pagamento processado",
        description: `Pagamento Pay Comex processado com sucesso! ID: ${data.transactionId}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento Pay Comex",
        variant: "destructive"
      });
    }
  });

  const handleExternalPayment = () => {
    if (!externalAmount || !externalDescription || !externalDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    externalPaymentMutation.mutate();
  };

  const handlePayComexPayment = (method: 'pix' | 'card') => {
    if (method === 'pix') {
      setShowPixModal(true);
    } else {
      setShowCardModal(true);
    }
  };

  const confirmPayComexPayment = () => {
    if (selectedMethod) {
      payComexMutation.mutate(selectedMethod);
      setShowPixModal(false);
      setShowCardModal(false);
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment':
        return 'Entrada (30%)';
      case 'installment':
        return 'Parcela';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payment) {
    return null;
  }

  const exchangeRate = 5.65;
  const usdAmount = parseFloat(payment.amount);
  const brlAmount = usdAmount * exchangeRate;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Checkout de Pagamento
            </DialogTitle>
            <DialogDescription>
              Selecione o método de pagamento para processar sua transação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {getPaymentTypeLabel(payment.paymentType)}
                    {payment.installmentNumber && ` (${payment.installmentNumber}/${payment.totalInstallments})`}
                  </span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    {payment.status === 'pending' ? 'Pendente' : payment.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(parseFloat(payment.amount), payment.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <span className="ml-2 font-medium">
                      {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Conversão BRL:</span>
                    <span className="ml-2 font-medium text-green-600">
                      R$ {brlAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Tabs defaultValue="external" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="external" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Pagamento Externo
                </TabsTrigger>
                <TabsTrigger value="paycomex" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay Comex
                </TabsTrigger>
              </TabsList>

              <TabsContent value="external" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pagamento Externo</CardTitle>
                    <p className="text-sm text-gray-600">
                      Registre um pagamento realizado fora da plataforma
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Valor Pago (USD) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={externalAmount}
                        onChange={(e) => setExternalAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição/Referência *</Label>
                      <Textarea
                        id="description"
                        value={externalDescription}
                        onChange={(e) => setExternalDescription(e.target.value)}
                        placeholder="Ex: Transferência bancária para Fornecedor XYZ"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="date">Data do Pagamento *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={externalDate}
                        onChange={(e) => setExternalDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="receipt">Comprovante (Opcional)</Label>
                      <Input
                        id="receipt"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setExternalReceipt(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
                      </p>
                    </div>

                    <Button 
                      onClick={handleExternalPayment}
                      disabled={externalPaymentMutation.isPending}
                      className="w-full"
                    >
                      {externalPaymentMutation.isPending ? "Processando..." : "Registrar Pagamento"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="paycomex" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PIX Option */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                        onClick={() => handlePayComexPayment('pix')}>
                    <CardContent className="p-6 text-center">
                      <QrCode className="w-12 h-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">PIX</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Pagamento instantâneo via PIX
                      </p>
                      <div className="space-y-2">
                        <div className="text-lg font-bold">
                          R$ {brlAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600">
                          Taxa: 1.5% (R$ {(brlAmount * 0.015).toFixed(2)})
                        </div>
                        <div className="text-sm font-semibold">
                          Total: R$ {(brlAmount * 1.015).toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card Option */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handlePayComexPayment('card')}>
                    <CardContent className="p-6 text-center">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">Cartão de Crédito</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Pagamento via cartão de crédito
                      </p>
                      <div className="space-y-2">
                        <div className="text-lg font-bold">
                          R$ {brlAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-blue-600">
                          Taxa: 2.5% (R$ {(brlAmount * 0.025).toFixed(2)})
                        </div>
                        <div className="text-sm font-semibold">
                          Total: R$ {(brlAmount * 1.025).toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX Modal */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento PIX</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <QrCode className="w-32 h-32 mx-auto text-green-600" />
            <p className="text-sm text-gray-600">
              Escaneie o código QR com seu aplicativo bancário
            </p>
            <div className="text-lg font-bold">
              Total: R$ {(brlAmount * 1.015).toFixed(2)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPixModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setSelectedMethod('pix');
                  confirmPayComexPayment();
                }}
                disabled={payComexMutation.isPending}
                className="flex-1"
              >
                {payComexMutation.isPending ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Modal */}
      <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número do Cartão</Label>
              <Input
                value={cardData.number}
                onChange={(e) => setCardData({...cardData, number: e.target.value})}
                placeholder="0000 0000 0000 0000"
              />
            </div>
            <div>
              <Label>Nome no Cartão</Label>
              <Input
                value={cardData.name}
                onChange={(e) => setCardData({...cardData, name: e.target.value})}
                placeholder="Nome Completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Validade</Label>
                <Input
                  value={cardData.expiry}
                  onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                  placeholder="MM/AA"
                />
              </div>
              <div>
                <Label>CVV</Label>
                <Input
                  value={cardData.cvv}
                  onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                  placeholder="123"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                Total: R$ {(brlAmount * 1.025).toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCardModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setSelectedMethod('card');
                  confirmPayComexPayment();
                }}
                disabled={payComexMutation.isPending}
                className="flex-1"
              >
                {payComexMutation.isPending ? "Processando..." : "Pagar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}