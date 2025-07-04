import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Building2, FileUp, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentSchedule {
  id: number;
  amount: string;
  currency: string;
  dueDate: string;
  status: string;
  paymentType: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentSchedule: PaymentSchedule;
  onSuccess?: () => void;
}

export default function PaymentModal({ isOpen, onClose, paymentSchedule, onSuccess }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState('external');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para pagamento externo
  const [externalData, setExternalData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    receipt: null as File | null
  });

  // Estados para PayComex
  const [paycomexMethod, setPaycomexMethod] = useState('pix');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const exchangeRate = 5.65;
  const paycomexFee = 0.025;
  const amountUSD = parseFloat(paymentSchedule.amount);
  const amountBRL = amountUSD * exchangeRate;
  const feeAmount = amountBRL * paycomexFee;

  // Mutação para pagamento externo
  const externalPaymentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest(`/api/payment-schedules/${paymentSchedule.id}/external-payment`, "POST", data);
      return response;
    },
    onSuccess: () => {
      setPaymentSuccess(true);
      toast({
        title: "Pagamento Registrado",
        description: "Seu pagamento foi registrado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setPaymentSuccess(false);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Pagamento",
        description: error.message || "Erro ao registrar pagamento",
        variant: "destructive",
      });
    }
  });

  // Mutação para PayComex
  const paycomexMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/payments/paycomex`, "POST", data);
      return response;
    },
    onSuccess: () => {
      setPaymentSuccess(true);
      toast({
        title: "Pagamento Processado",
        description: "Pagamento via PayComex realizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setPaymentSuccess(false);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Pagamento",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
    }
  });

  const handleExternalPayment = () => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('amount', paymentSchedule.amount);
    formData.append('paymentDate', externalData.paymentDate);
    formData.append('notes', externalData.notes);
    formData.append('paymentMethod', 'external');
    
    if (externalData.receipt) {
      formData.append('receipt', externalData.receipt);
    }

    externalPaymentMutation.mutate(formData);
  };

  const handlePayComexPayment = () => {
    setIsProcessing(true);
    const paymentData = {
      paymentScheduleId: paymentSchedule.id,
      method: paycomexMethod,
      amount: paymentSchedule.amount,
      currency: "USD",
      exchangeRate,
      fee: paycomexFee,
      ...(paycomexMethod === 'card' ? { cardData } : {})
    };

    paycomexMutation.mutate(paymentData);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'BRL',
    }).format(amount);
  };

  if (paymentSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Pagamento Realizado!</h3>
            <p className="text-gray-600">Seu pagamento foi processado com sucesso.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Realizar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Pagamento */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Tipo</Label>
                  <p className="font-medium">
                    {paymentSchedule.paymentType === 'down_payment' 
                      ? 'Entrada (30%)' 
                      : `${paymentSchedule.installmentNumber}ª Parcela`}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Valor</Label>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(amountUSD, 'USD')}
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Vencimento</Label>
                  <p className="font-medium">
                    {new Date(paymentSchedule.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <Badge variant={paymentSchedule.status === 'pending' ? 'destructive' : 'default'}>
                    {paymentSchedule.status === 'pending' ? 'Pendente' : paymentSchedule.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Pagamento */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="external" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Pagamento Externo
                </TabsTrigger>
                <TabsTrigger value="paycomex" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  PayComex
                </TabsTrigger>
              </TabsList>

              {/* Pagamento Externo */}
              <TabsContent value="external" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Registrar Pagamento Externo</CardTitle>
                    <p className="text-sm text-gray-600">
                      Registre um pagamento já realizado externamente
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Valor Pago (USD)</Label>
                        <Input 
                          id="amount"
                          value={paymentSchedule.amount}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentDate">Data do Pagamento</Label>
                        <Input 
                          id="paymentDate"
                          type="date"
                          value={externalData.paymentDate}
                          onChange={(e) => setExternalData(prev => ({
                            ...prev,
                            paymentDate: e.target.value
                          }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea 
                        id="notes"
                        placeholder="Informações adicionais sobre o pagamento..."
                        value={externalData.notes}
                        onChange={(e) => setExternalData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="receipt">Comprovante de Pagamento</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <Label htmlFor="receipt" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-700">
                              Clique para selecionar arquivo
                            </span>
                            <Input 
                              id="receipt"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => setExternalData(prev => ({
                                ...prev,
                                receipt: e.target.files?.[0] || null
                              }))}
                            />
                          </Label>
                          {externalData.receipt && (
                            <p className="text-sm text-gray-600 mt-2">
                              {externalData.receipt.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleExternalPayment}
                      disabled={isProcessing || externalPaymentMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? 'Registrando...' : 'Registrar Pagamento'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PayComex */}
              <TabsContent value="paycomex" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>PayComex - Pagamento Instantâneo</CardTitle>
                    <p className="text-sm text-gray-600">
                      Pague agora com PIX ou cartão de crédito
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Resumo de Valores */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Resumo do Pagamento</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Valor USD:</span>
                          <span>{formatCurrency(amountUSD, 'USD')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa de câmbio:</span>
                          <span>R$ {exchangeRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor BRL:</span>
                          <span>{formatCurrency(amountBRL, 'BRL')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa PayComex (2.5%):</span>
                          <span>{formatCurrency(feeAmount, 'BRL')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total a pagar:</span>
                          <span>{formatCurrency(amountBRL + feeAmount, 'BRL')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Método de Pagamento */}
                    <div>
                      <Label>Método de Pagamento</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <Button
                          variant={paycomexMethod === 'pix' ? 'default' : 'outline'}
                          onClick={() => setPaycomexMethod('pix')}
                          className="h-16"
                        >
                          <div className="text-center">
                            <div className="font-medium">PIX</div>
                            <div className="text-xs">Instantâneo</div>
                          </div>
                        </Button>
                        <Button
                          variant={paycomexMethod === 'card' ? 'default' : 'outline'}
                          onClick={() => setPaycomexMethod('card')}
                          className="h-16"
                        >
                          <div className="text-center">
                            <div className="font-medium">Cartão</div>
                            <div className="text-xs">Crédito/Débito</div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Dados do Cartão (se necessário) */}
                    {paycomexMethod === 'card' && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="cardName">Nome no Cartão</Label>
                          <Input 
                            id="cardName"
                            value={cardData.name}
                            onChange={(e) => setCardData(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            placeholder="Nome como está no cartão"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardNumber">Número do Cartão</Label>
                          <Input 
                            id="cardNumber"
                            value={cardData.number}
                            onChange={(e) => setCardData(prev => ({
                              ...prev,
                              number: e.target.value
                            }))}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="cardExpiry">Validade</Label>
                            <Input 
                              id="cardExpiry"
                              value={cardData.expiry}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                expiry: e.target.value
                              }))}
                              placeholder="MM/AA"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cardCvv">CVV</Label>
                            <Input 
                              id="cardCvv"
                              value={cardData.cvv}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                cvv: e.target.value
                              }))}
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handlePayComexPayment}
                      disabled={isProcessing || paycomexMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? 'Processando...' : `Pagar ${formatCurrency(amountBRL + feeAmount, 'BRL')}`}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}