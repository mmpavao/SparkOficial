import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  ArrowLeft, 
  Upload,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  CreditCard,
  Smartphone,
  Globe,
  Shield,
  Calculator,
  ExternalLink,
  TrendingUp
} from "lucide-react";

const externalPaymentSchema = z.object({
  paymentMethod: z.string().min(1, "Selecione o método de pagamento"),
  receiptFile: z.any().optional(),
  notes: z.string().optional(),
});

const paycomexPaymentSchema = z.object({
  exchangeRate: z.number().min(0.1, "Taxa de câmbio inválida"),
  brazilianAmount: z.number().min(1, "Valor em BRL inválido"),
  paymentMethod: z.string().min(1, "Selecione o método de pagamento"),
  notes: z.string().optional(),
});

type ExternalPaymentData = z.infer<typeof externalPaymentSchema>;
type PaycomexPaymentData = z.infer<typeof paycomexPaymentSchema>;

export default function PaymentPayPage() {
  const [, params] = useRoute("/payments/pay/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = params?.id ? parseInt(params.id) : null;
  
  const [activeTab, setActiveTab] = useState("external");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentExchangeRate, setCurrentExchangeRate] = useState(5.45); // Taxa padrão USD -> BRL

  const externalForm = useForm<ExternalPaymentData>({
    resolver: zodResolver(externalPaymentSchema),
    defaultValues: {
      paymentMethod: "",
      notes: "",
    },
  });

  const paycomexForm = useForm<PaycomexPaymentData>({
    resolver: zodResolver(paycomexPaymentSchema),
    defaultValues: {
      exchangeRate: currentExchangeRate,
      brazilianAmount: 0,
      paymentMethod: "",
      notes: "",
    },
  });

  // Buscar dados do pagamento
  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['/api/payment-schedules', paymentId],
    queryFn: () => apiRequest(`/api/payment-schedules/${paymentId}`, 'GET'),
    enabled: !!paymentId && !!user
  });

  // Buscar dados do fornecedor
  const { data: supplierData } = useQuery({
    queryKey: ['/api/payment-schedules', paymentId, 'supplier'],
    queryFn: () => apiRequest(`/api/payment-schedules/${paymentId}/supplier`, 'GET'),
    enabled: !!paymentId && !!payment
  });

  // Mutação para pagamento externo
  const processExternalPaymentMutation = useMutation({
    mutationFn: async (data: ExternalPaymentData) => {
      const formData = new FormData();
      formData.append('paymentType', 'external');
      formData.append('paymentMethod', data.paymentMethod);
      if (data.notes) formData.append('notes', data.notes);
      if (uploadedFile) formData.append('receipt', uploadedFile);

      const response = await fetch(`/api/payment-schedules/${paymentId}/pay`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento externo');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Pagamento externo processado",
        description: "O pagamento foi registrado com sucesso.",
      });
      setLocation(`/payments/details/${paymentId}`);
    },
    onError: (error) => {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para PayComex
  const processPaycomexPaymentMutation = useMutation({
    mutationFn: async (data: PaycomexPaymentData) => {
      const response = await apiRequest(`/api/payment-schedules/${paymentId}/paycomex`, 'POST', {
        exchangeRate: data.exchangeRate,
        brazilianAmount: data.brazilianAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "PayComex iniciado",
        description: "O processamento PayComex foi iniciado com sucesso.",
      });
      setLocation(`/payments/details/${paymentId}`);
    },
    onError: (error) => {
      toast({
        title: "Erro no PayComex",
        description: "Erro ao processar pagamento via PayComex",
        variant: "destructive",
      });
    },
  });

  // Função para upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Função para calcular valor em BRL
  const calculateBrazilianAmount = (usdAmount: string, rate: number) => {
    const usd = parseFloat(usdAmount.replace(/[^\d.]/g, ''));
    return usd * rate;
  };

  // Handlers dos formulários
  const onExternalSubmit = (data: ExternalPaymentData) => {
    processExternalPaymentMutation.mutate(data);
  };

  const onPaycomexSubmit = (data: PaycomexPaymentData) => {
    processPaycomexPaymentMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
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
          <p className="text-gray-600">Pagamento não encontrado</p>
          <Button 
            onClick={() => setLocation('/payments')}
            variant="outline"
            className="mt-4"
          >
            Voltar para Pagamentos
          </Button>
        </div>
      </div>
    );
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment': return 'Entrada (30%)';
      case 'installment': return `${payment.installmentNumber}ª Parcela`;
      default: return type;
    }
  };

  const usdAmount = parseFloat(payment.amount);
  const calculatedBrlAmount = calculateBrazilianAmount(payment.amount, currentExchangeRate);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/payments/details/${paymentId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Efetuar Pagamento
            </h1>
            <p className="text-gray-600">
              {getPaymentTypeLabel(payment.paymentType)} • Importação #{payment.importId}
            </p>
          </div>
        </div>
        
        <Badge className="bg-yellow-100 text-yellow-700 border-0">
          <Clock className="h-4 w-4 mr-1" />
          Pendente
        </Badge>
      </div>

      {/* Informações do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Detalhes do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Valor USD</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(payment.amount).replace('R$', 'US$')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vencimento</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(payment.dueDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                Aguardando Pagamento
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opções de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Pagamento</CardTitle>
          <p className="text-sm text-gray-600">
            Escolha entre pagamento externo com comprovante ou PayComex com câmbio automático
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="external" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Pagamento Externo
              </TabsTrigger>
              <TabsTrigger value="paycomex" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                PayComex
              </TabsTrigger>
            </TabsList>

            {/* Pagamento Externo */}
            <TabsContent value="external" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Pagamento Externo</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Realize o pagamento através do seu banco ou plataforma de preferência e 
                  anexe o comprovante para confirmação.
                </p>
              </div>

              <Form {...externalForm}>
                <form onSubmit={externalForm.handleSubmit(onExternalSubmit)} className="space-y-6">
                  {/* Valor e Dados do Fornecedor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Valor a Pagar</p>
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(payment.amount).replace('R$', 'US$')}
                        </p>
                      </div>
                    </div>

                    {supplierData && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Dados do Fornecedor</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">{supplierData.companyName}</p>
                          <p className="text-sm text-gray-600">{supplierData.email}</p>
                          <p className="text-sm text-gray-600">{supplierData.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Método de Pagamento */}
                  <FormField
                    control={externalForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pagamento Utilizado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione como realizou o pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wire_transfer">Transferência Bancária</SelectItem>
                            <SelectItem value="swift">SWIFT</SelectItem>
                            <SelectItem value="wise">Wise</SelectItem>
                            <SelectItem value="remessa_online">Remessa Online</SelectItem>
                            <SelectItem value="other_platform">Outra Plataforma</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload do Comprovante */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Comprovante de Pagamento
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="receipt-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Anexar Comprovante
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                              PDF, JPG, PNG até 10MB
                            </span>
                          </label>
                          <input
                            id="receipt-upload"
                            name="receipt-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                          />
                        </div>
                      </div>
                      
                      {uploadedFile && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {uploadedFile.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  <FormField
                    control={externalForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais sobre o pagamento..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={processExternalPaymentMutation.isPending}
                  >
                    {processExternalPaymentMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Pagamento Externo
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* PayComex */}
            <TabsContent value="paycomex" className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">PayComex</h3>
                </div>
                <p className="text-sm text-emerald-700">
                  Processamento automático com câmbio em tempo real. Pague em BRL e 
                  convertemos automaticamente para USD com as melhores taxas.
                </p>
              </div>

              <Form {...paycomexForm}>
                <form onSubmit={paycomexForm.handleSubmit(onPaycomexSubmit)} className="space-y-6">
                  {/* Calculadora de Câmbio */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        Calculadora de Câmbio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Valor USD</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(payment.amount).replace('R$', 'US$')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Taxa de Câmbio</p>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={paycomexForm.control}
                              name="exchangeRate"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="5.45"
                                      {...field}
                                      onChange={(e) => {
                                        const rate = parseFloat(e.target.value);
                                        field.onChange(rate);
                                        setCurrentExchangeRate(rate);
                                        paycomexForm.setValue('brazilianAmount', usdAmount * rate);
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-sm text-gray-500">BRL</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total BRL</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {(usdAmount * currentExchangeRate).toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Taxa competitiva • Conversão automática • Processamento seguro
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Método de Pagamento BRL */}
                  <FormField
                    control={paycomexForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pagamento (BRL)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Como deseja pagar em BRL?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="ted">TED</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Observações */}
                  <FormField
                    control={paycomexForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais sobre o pagamento..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={processPaycomexPaymentMutation.isPending}
                  >
                    {processPaycomexPaymentMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando PayComex...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Processar via PayComex
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}