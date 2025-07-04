import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import {
  ArrowLeft,
  Upload,
  CreditCard,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Smartphone,
  QrCode
} from "lucide-react";

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

export default function PaymentCheckoutPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = parseInt(id || "0");

  const [activeTab, setActiveTab] = useState("external");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // Estados para pagamento externo
  const [externalData, setExternalData] = useState({
    amount: "",
    description: "",
    paymentDate: new Date().toISOString().split('T')[0],
    receipt: null as File | null
  });

  // Estados para Pay Comex
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    holderName: ""
  });

  const [pixData, setPixData] = useState({
    pixCode: "00020126580014BR.GOV.BCB.PIX01364c66b9f0-8e5e-4e91-8e5e-4e91c66b9f05204000053039865802BR5925SPARK COMEX PAGAMENTOS6009SAO PAULO61088040100626260522PAYMENT",
    expiryMinutes: 30
  });

  // Buscar detalhes do pagamento
  const { data: payment, isLoading } = useQuery<PaymentSchedule>({
    queryKey: ['/api/payment-schedules', paymentId],
    queryFn: () => apiRequest(`/api/payment-schedules/${paymentId}`, 'GET'),
    enabled: !!paymentId && paymentId > 0,
  });

  // Pré-popular valor quando payment for carregado
  useEffect(() => {
    if (payment?.amount) {
      setExternalData(prev => ({
        ...prev,
        amount: payment.amount
      }));
    }
  }, [payment]);

  // Mutação para pagamento externo
  const externalPaymentMutation = useMutation({
    mutationFn: async (data: typeof externalData) => {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('description', data.description);
      formData.append('paymentDate', data.paymentDate);
      if (data.receipt) {
        formData.append('receipt', data.receipt);
      }

      const response = await fetch(`/api/payment-schedules/${paymentId}/pay-external`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento registrado",
        description: "Pagamento externo registrado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation('/payments');
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento",
        variant: "destructive",
      });
    }
  });

  // Mutação para Pay Comex
  const payComexMutation = useMutation({
    mutationFn: async (data: { method: 'pix' | 'card'; details: any }) => {
      return apiRequest(`/api/payment-schedules/${paymentId}/pay-comex`, 'POST', {
        method: data.method,
        details: data.details,
        amount: payment?.amount,
        currency: payment?.currency
      });
    },
    onSuccess: () => {
      toast({
        title: "Pagamento aprovado",
        description: "Pagamento Pay Comex processado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation('/payments');
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento Pay Comex",
        variant: "destructive",
      });
    }
  });

  const handleExternalPayment = () => {
    if (!externalData.amount || !externalData.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    externalPaymentMutation.mutate(externalData);
  };

  const handlePixPayment = () => {
    setShowPixModal(true);
    
    // Simular processamento PIX após 3 segundos
    setTimeout(() => {
      setShowPixModal(false);
      payComexMutation.mutate({
        method: 'pix',
        details: { pixCode: pixData.pixCode }
      });
    }, 3000);
  };

  const handleCardPayment = () => {
    if (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.holderName) {
      toast({
        title: "Erro",
        description: "Preencha todos os dados do cartão",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simular processamento do cartão
    setTimeout(() => {
      setIsProcessing(false);
      payComexMutation.mutate({
        method: 'card',
        details: cardData
      });
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
      setExternalData(prev => ({ ...prev, receipt: file }));
    } else {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 10MB.",
        variant: "destructive",
      });
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment':
        return 'Entrada (30%)';
      case 'installment':
        return `${payment?.installmentNumber}ª Parcela`;
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Pagamento não encontrado</p>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation(`/payments/${paymentId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout de Pagamento</h1>
            <p className="text-gray-600">Pagamento #{paymentId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Resumo do Pagamento */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Resumo do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  {getPaymentTypeLabel(payment.paymentType)}
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(parseFloat(payment.amount), payment.currency as 'USD')}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Importação:</span>
                  <span className="font-medium">#{payment.importId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vencimento:</span>
                  <span className="font-medium">
                    {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Pendente
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área Principal - Checkout */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="external" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Pagamento Externo
              </TabsTrigger>
              <TabsTrigger value="paycomex" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pay Comex
              </TabsTrigger>
            </TabsList>

            {/* Pagamento Externo */}
            <TabsContent value="external">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Pagamento Externo
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Registre um pagamento feito fora da plataforma
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="amount">Valor Pago *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={externalData.amount}
                        onChange={(e) => setExternalData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição do Pagamento *</Label>
                      <Textarea
                        id="description"
                        value={externalData.description}
                        onChange={(e) => setExternalData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ex: Transferência bancária para fornecedor, TED, PIX..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="paymentDate">Data do Pagamento</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={externalData.paymentDate}
                        onChange={(e) => setExternalData(prev => ({ ...prev, paymentDate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="receipt">Comprovante de Pagamento</Label>
                      <div className="mt-2">
                        <input
                          id="receipt"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('receipt')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {externalData.receipt ? externalData.receipt.name : 'Anexar Comprovante'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        PDF, JPG, PNG, DOC até 10MB
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleExternalPayment}
                    disabled={externalPaymentMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {externalPaymentMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Registrar Pagamento
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pay Comex */}
            <TabsContent value="paycomex">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pay Comex
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Pague diretamente pela plataforma
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PIX */}
                    <Card className="border-2 border-dashed border-gray-200 hover:border-green-400 cursor-pointer transition-colors">
                      <CardContent className="p-6 text-center">
                        <QrCode className="w-12 h-12 mx-auto mb-4 text-green-600" />
                        <h3 className="font-semibold mb-2">PIX Instantâneo</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Pagamento instantâneo via PIX
                        </p>
                        <Button
                          onClick={handlePixPayment}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={payComexMutation.isPending}
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          Pagar com PIX
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Cartão */}
                    <Card className="border-2 border-dashed border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                          <h3 className="font-semibold mb-2">Cartão de Crédito</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Pague com cartão de crédito
                          </p>
                        </div>

                        <div className="space-y-3">
                          <Input
                            placeholder="Número do cartão"
                            value={cardData.number}
                            onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
                            maxLength={16}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="MM/AA"
                              value={cardData.expiry}
                              onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
                              maxLength={5}
                            />
                            <Input
                              placeholder="CVV"
                              value={cardData.cvv}
                              onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                              maxLength={3}
                            />
                          </div>
                          <Input
                            placeholder="Nome no cartão"
                            value={cardData.holderName}
                            onChange={(e) => setCardData(prev => ({ ...prev, holderName: e.target.value }))}
                          />
                          <Button
                            onClick={handleCardPayment}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={isProcessing || payComexMutation.isPending}
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Pagar com Cartão
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal PIX */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-green-600" />
              Pagamento PIX
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código PIX
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 text-center">
            <div className="w-48 h-48 mx-auto mb-4 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Código PIX (toque para copiar):
            </p>
            <div className="p-3 bg-gray-50 rounded-lg text-xs font-mono break-all">
              {pixData.pixCode}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full" />
              <span className="text-sm text-gray-600">Aguardando pagamento...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}