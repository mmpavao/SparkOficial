import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Upload, 
  CreditCard,
  Building2,
  Globe,
  Shield,
  TrendingUp,
  AlertCircle,
  Check
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
  importData?: {
    importName: string;
    supplierId: number;
  };
}

interface PaymentPayPageProps {
  params: { id: string };
}

export default function PaymentPayPage({ params }: PaymentPayPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = parseInt(params.id);

  // Estados para pagamento externo
  const [externalPaymentData, setExternalPaymentData] = useState({
    amount: "",
    paymentDate: "",
    notes: "",
    receipts: [] as File[]
  });

  // Estados para PayComex
  const [paycomexMethod, setPaycomexMethod] = useState<"card" | "pix">("card");
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    holderName: ""
  });

  // Taxa de câmbio simulada (USD para BRL)
  const [exchangeRate] = useState(5.65);
  const [paycomexFee] = useState(0.025); // 2.5% fee

  // Buscar detalhes do pagamento
  const { data: payment, isLoading, error } = useQuery<PaymentSchedule>({
    queryKey: ['/api/payment-schedules', paymentId],
    enabled: !!paymentId,
  });

  // Mutação para pagamento externo
  const externalPaymentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", `/api/payment-schedules/${paymentId}/external-payment`, data);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Registrado",
        description: "Pagamento externo registrado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation(`/payments/${paymentId}`);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutação para pagamento PayComex
  const paycomexPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/payment-schedules/${paymentId}/paycomex-payment`, data);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Processado",
        description: "Pagamento via PayComex processado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation(`/payments/${paymentId}`);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleExternalPayment = () => {
    if (!externalPaymentData.amount || !externalPaymentData.paymentDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha valor e data do pagamento.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', externalPaymentData.amount);
    formData.append('paymentDate', externalPaymentData.paymentDate);
    formData.append('notes', externalPaymentData.notes);
    
    externalPaymentData.receipts.forEach((file, index) => {
      formData.append(`receipt_${index}`, file);
    });

    externalPaymentMutation.mutate(formData);
  };

  const handlePaycomexPayment = () => {
    if (paycomexMethod === "card") {
      if (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.holderName) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os dados do cartão.",
          variant: "destructive",
        });
        return;
      }
    }

    const paymentData = {
      method: paycomexMethod,
      cardData: paycomexMethod === "card" ? cardData : undefined,
      exchangeRate,
      feePercentage: paycomexFee
    };

    paycomexPaymentMutation.mutate(paymentData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setExternalPaymentData(prev => ({
        ...prev,
        receipts: [...prev.receipts, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setExternalPaymentData(prev => ({
      ...prev,
      receipts: prev.receipts.filter((_, i) => i !== index)
    }));
  };

  // Cálculos PayComex
  const usdAmount = payment ? parseFloat(payment.amount) : 0;
  const brlAmount = usdAmount * exchangeRate;
  const feeAmount = brlAmount * paycomexFee;
  const totalBrlAmount = brlAmount + feeAmount;

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
              Processar Pagamento #{paymentId}
            </h1>
            <p className="text-gray-600">
              {payment.importData?.importName || `Importação #${payment.importId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Resumo do Pagamento */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor a Pagar</p>
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
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Pendente
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Vencimento: {formatDate(payment.dueDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opções de Pagamento */}
      <Tabs defaultValue="external" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="external" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Pagamento Externo
          </TabsTrigger>
          <TabsTrigger value="paycomex" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            PayComex
          </TabsTrigger>
        </TabsList>

        {/* Pagamento Externo */}
        <TabsContent value="external">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Registrar Pagamento Externo
              </CardTitle>
              <p className="text-sm text-gray-600">
                Registre um pagamento já realizado externamente
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="external-amount">Valor Pago (USD)*</Label>
                  <Input
                    id="external-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={externalPaymentData.amount}
                    onChange={(e) => setExternalPaymentData(prev => ({
                      ...prev,
                      amount: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="external-date">Data do Pagamento*</Label>
                  <Input
                    id="external-date"
                    type="date"
                    value={externalPaymentData.paymentDate}
                    onChange={(e) => setExternalPaymentData(prev => ({
                      ...prev,
                      paymentDate: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="external-notes">Observações</Label>
                <Textarea
                  id="external-notes"
                  placeholder="Informações adicionais sobre o pagamento..."
                  value={externalPaymentData.notes}
                  onChange={(e) => setExternalPaymentData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                />
              </div>

              <div>
                <Label>Comprovantes de Pagamento</Label>
                <div className="mt-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Selecionar Arquivos
                    </Button>
                  </div>
                  
                  {externalPaymentData.receipts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Arquivos selecionados:</p>
                      {externalPaymentData.receipts.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFile(index)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleExternalPayment}
                disabled={externalPaymentMutation.isPending}
                className="w-full"
              >
                {externalPaymentMutation.isPending ? "Registrando..." : "Registrar Pagamento"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayComex */}
        <TabsContent value="paycomex">
          <div className="space-y-6">
            {/* PayComex Branding */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">PayComex</h3>
                    <p className="text-blue-100">Plataforma global de remessas internacionais</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Seguro e confiável
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Melhor taxa do mercado
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculadora de Câmbio */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Valor USD</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${usdAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Taxa de Câmbio</p>
                    <p className="text-xl font-bold text-blue-600">
                      R$ {exchangeRate.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Taxa PayComex (2.5%)</p>
                    <p className="text-xl font-bold text-orange-600">
                      R$ {feeAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-green-600">Total em BRL</p>
                    <p className="text-xl font-bold text-green-700">
                      R$ {totalBrlAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">
                      Economia de R$ {(totalBrlAmount * 0.15).toFixed(2)} comparado a bancos tradicionais
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métodos de Pagamento PayComex */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={paycomexMethod} onValueChange={(value) => setPaycomexMethod(value as "card" | "pix")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card">Cartão de Crédito</TabsTrigger>
                    <TabsTrigger value="pix">PIX</TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="card-number">Número do Cartão</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardData.number}
                          onChange={(e) => setCardData(prev => ({
                            ...prev,
                            number: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-expiry">Validade</Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={(e) => setCardData(prev => ({
                            ...prev,
                            expiry: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input
                          id="card-cvv"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) => setCardData(prev => ({
                            ...prev,
                            cvv: e.target.value
                          }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="card-holder">Nome do Portador</Label>
                        <Input
                          id="card-holder"
                          placeholder="Nome como impresso no cartão"
                          value={cardData.holderName}
                          onChange={(e) => setCardData(prev => ({
                            ...prev,
                            holderName: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pix" className="space-y-4">
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-gray-600">QR Code PIX</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Escaneie o QR Code ou use a chave PIX:
                      </p>
                      <p className="font-mono text-sm bg-white p-2 rounded border">
                        paycomex.pix.{paymentId}.{Date.now()}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  onClick={handlePaycomexPayment}
                  disabled={paycomexPaymentMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {paycomexPaymentMutation.isPending 
                    ? "Processando..." 
                    : `Pagar R$ ${totalBrlAmount.toFixed(2)} via PayComex`
                  }
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  <p>Ao prosseguir, você concorda com os termos do PayComex.</p>
                  <p>Transação protegida por criptografia SSL de 256 bits.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}