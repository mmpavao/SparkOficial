import { useState, useEffect } from "react";
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
  Globe
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
    amount: "36000",
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

  // Taxa de câmbio
  const exchangeRate = 5.65;
  const paycomexFee = 0.025;

  // Buscar detalhes do pagamento
  const { data: payment, isLoading } = useQuery({
    queryKey: ['/api/payment-schedules', paymentId],
    queryFn: () => apiRequest(`/api/payment-schedules/${paymentId}`, "GET"),
    enabled: !!paymentId,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false
  });

  // Mutação para pagamento externo
  const externalPaymentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest(`/api/payments/external`, "POST", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Registrado",
        description: "Pagamento externo registrado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation(`/import-details/10`);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento. Tente novamente.",
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
      toast({
        title: "Pagamento Processado",
        description: "Pagamento via PayComex processado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      setLocation(`/import-details/10`);
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
    const formData = new FormData();
    formData.append('paymentScheduleId', paymentId.toString());
    formData.append('amount', externalPaymentData.amount);
    formData.append('paymentDate', externalPaymentData.paymentDate);
    formData.append('notes', externalPaymentData.notes);
    formData.append('paymentMethod', 'external');
    
    externalPaymentData.receipts.forEach((file, index) => {
      formData.append('receipts', file);
    });

    externalPaymentMutation.mutate(formData);
  };

  const handlePayComexPayment = () => {
    const paymentData = {
      paymentScheduleId: paymentId,
      method: paycomexMethod,
      amount: externalPaymentData.amount,
      currency: "USD",
      exchangeRate,
      fee: paycomexFee,
      ...(paycomexMethod === 'card' ? { cardData } : {})
    };

    paycomexMutation.mutate(paymentData);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setExternalPaymentData(prev => ({
        ...prev,
        receipts: [...prev.receipts, ...newFiles]
      }));
    }
  };

  if (isLoading || !payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usdAmount = parseFloat(externalPaymentData.amount);
  const brlAmount = usdAmount * exchangeRate;
  const totalWithFee = brlAmount + (brlAmount * paycomexFee);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/import-details/10')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Processar Pagamento #{paymentId}
          </h1>
          <p className="text-gray-600">Importação #undefined</p>
        </div>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Valor a Pagar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">USD {parseFloat(externalPaymentData.amount).toLocaleString()}.00</span>
              <Badge variant="destructive">Pendente</Badge>
            </div>
            <p className="text-gray-600">Pagamento único</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Vencimento: 03/07/2025
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Tabs defaultValue="external" className="w-full">
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

        {/* External Payment Tab */}
        <TabsContent value="external" className="space-y-4">
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor Pago (USD)*</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={externalPaymentData.amount}
                    onChange={(e) => setExternalPaymentData(prev => ({
                      ...prev,
                      amount: e.target.value
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentDate">Data do Pagamento*</Label>
                  <Input
                    id="paymentDate"
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
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={externalPaymentData.notes}
                  onChange={(e) => setExternalPaymentData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Informações adicionais sobre o pagamento..."
                  className="min-h-20"
                />
              </div>

              <div>
                <Label>Comprovantes de Pagamento</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Clique para adicionar comprovantes ou arraste arquivos aqui
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                  >
                    Selecionar Arquivos
                  </Button>
                </div>
                {externalPaymentData.receipts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {externalPaymentData.receipts.map((file, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center justify-between">
                        <span>{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExternalPaymentData(prev => ({
                              ...prev,
                              receipts: prev.receipts.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleExternalPayment}
                disabled={!externalPaymentData.amount || !externalPaymentData.paymentDate || externalPaymentMutation.isPending}
                className="w-full"
              >
                {externalPaymentMutation.isPending ? "Registrando..." : "Registrar Pagamento"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayComex Tab */}
        <TabsContent value="paycomex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                PayComex
              </CardTitle>
              <p className="text-sm text-gray-600">
                Processe o pagamento direto pela plataforma PayComex
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exchange Rate Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Câmbio Atual</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>1 USD = R$ {exchangeRate.toFixed(2)} BRL</div>
                  <div>Valor em Reais: R$ {brlAmount.toFixed(2)}</div>
                  <div>Taxa PayComex (2,5%): R$ {(brlAmount * paycomexFee).toFixed(2)}</div>
                  <div className="font-semibold border-t border-blue-200 pt-1">
                    Total: R$ {totalWithFee.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <Label>Método de Pagamento</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={paycomexMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaycomexMethod('card')}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Cartão
                  </Button>
                  <Button
                    variant={paycomexMethod === 'pix' ? 'default' : 'outline'}
                    onClick={() => setPaycomexMethod('pix')}
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    PIX
                  </Button>
                </div>
              </div>

              {/* Card Form */}
              {paycomexMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input
                      id="cardNumber"
                      value={cardData.number}
                      onChange={(e) => setCardData(prev => ({
                        ...prev,
                        number: e.target.value
                      }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Validade</Label>
                      <Input
                        id="expiry"
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
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
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
                  <div>
                    <Label htmlFor="holderName">Nome no Cartão</Label>
                    <Input
                      id="holderName"
                      value={cardData.holderName}
                      onChange={(e) => setCardData(prev => ({
                        ...prev,
                        holderName: e.target.value
                      }))}
                      placeholder="NOME COMO NO CARTÃO"
                    />
                  </div>
                </div>
              )}

              {/* PIX Info */}
              {paycomexMethod === 'pix' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Pagamento PIX</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Após confirmar, você receberá um QR Code para efetuar o pagamento via PIX.
                  </p>
                </div>
              )}

              <Button
                onClick={handlePayComexPayment}
                disabled={paycomexMutation.isPending}
                className="w-full"
              >
                {paycomexMutation.isPending ? "Processando..." : `Pagar R$ ${totalWithFee.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}