
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ExternalLink,
  Shield,
  Globe,
  Calculator
} from "lucide-react";

const externalPaymentSchema = z.object({
  paymentMethod: z.string().min(1, "Selecione o método de pagamento"),
  amountPaid: z.string().min(1, "Valor pago é obrigatório"),
  paymentDate: z.string().min(1, "Data do pagamento é obrigatória"),
  receiptFiles: z.array(z.any()).min(1, "Anexe pelo menos um comprovante"),
  notes: z.string().optional(),
});

const paycomexPaymentSchema = z.object({
  paymentMethod: z.enum(["credit_card", "pix"]),
  acceptTerms: z.boolean().refine(val => val === true, "Aceite os termos para continuar"),
});

type ExternalPaymentFormData = z.infer<typeof externalPaymentSchema>;
type PayComexPaymentFormData = z.infer<typeof paycomexPaymentSchema>;

export default function PaymentPayPage() {
  const [, params] = useRoute("/payments/pay/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = params?.id ? parseInt(params.id) : null;
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState("external");

  // Exchange rate simulation
  const USD_TO_BRL = 5.25; // Simulated exchange rate
  const PAYCOMEX_FEE = 2.5; // 2.5% fee
  const IOF_TAX = 1.1; // 1.1% IOF

  const externalForm = useForm<ExternalPaymentFormData>({
    resolver: zodResolver(externalPaymentSchema),
    defaultValues: {
      paymentMethod: "",
      amountPaid: "",
      paymentDate: "",
      receiptFiles: [],
      notes: "",
    },
  });

  const paycomexForm = useForm<PayComexPaymentFormData>({
    resolver: zodResolver(paycomexPaymentSchema),
    defaultValues: {
      paymentMethod: "credit_card",
      acceptTerms: false,
    },
  });

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['/api/payments', paymentId],
    queryFn: () => apiRequest(`/api/payments/${paymentId}`, 'GET'),
    enabled: !!paymentId && !!user
  });

  const { data: supplierData } = useQuery({
    queryKey: ['/api/payments/supplier', paymentId],
    queryFn: () => apiRequest(`/api/payments/${paymentId}/supplier`, 'GET'),
    enabled: !!paymentId && !!payment
  });

  const processExternalPaymentMutation = useMutation({
    mutationFn: async (data: ExternalPaymentFormData) => {
      const formData = new FormData();
      formData.append('paymentType', 'external');
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('amountPaid', data.amountPaid);
      formData.append('paymentDate', data.paymentDate);
      formData.append('notes', data.notes || '');
      
      uploadedFiles.forEach((file, index) => {
        formData.append(`receipt_${index}`, file);
      });

      const response = await fetch(`/api/payments/${paymentId}/pay`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao processar pagamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments', paymentId] });
      toast({
        title: "Pagamento processado com sucesso",
        description: "O pagamento externo foi registrado e está sendo validado.",
      });
      setLocation(`/payments/details/${paymentId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Não foi possível processar o pagamento.",
        variant: "destructive",
      });
    }
  });

  const processPayComexPaymentMutation = useMutation({
    mutationFn: async (data: PayComexPaymentFormData) => {
      const response = await fetch(`/api/payments/${paymentId}/paycomex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: data.paymentMethod,
          amountUSD: parseFloat(payment.amount),
          exchangeRate: USD_TO_BRL,
          totalBRL: calculateTotalBRL(),
        }),
      });

      if (!response.ok) throw new Error('Erro ao processar pagamento PayComex');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments', paymentId] });
      toast({
        title: "Pagamento PayComex iniciado",
        description: "Redirecionando para o checkout seguro da PayComex...",
      });
      // Simulate redirect to PayComex checkout
      window.open(data.checkoutUrl, '_blank');
      setLocation(`/payments/details/${paymentId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no PayComex",
        description: error.message || "Não foi possível iniciar o pagamento PayComex.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalBRL = () => {
    if (!payment) return 0;
    const amountUSD = parseFloat(payment.amount);
    const convertedAmount = amountUSD * USD_TO_BRL;
    const feeAmount = convertedAmount * (PAYCOMEX_FEE / 100);
    const iofAmount = convertedAmount * (IOF_TAX / 100);
    return convertedAmount + feeAmount + iofAmount;
  };

  const onExternalSubmit = (data: ExternalPaymentFormData) => {
    const updatedData = { ...data, receiptFiles: uploadedFiles };
    processExternalPaymentMutation.mutate(updatedData);
  };

  const onPayComexSubmit = (data: PayComexPaymentFormData) => {
    processPayComexPaymentMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Pagamento não encontrado</p>
        <Button onClick={() => setLocation('/imports')} className="mt-4">
          Voltar para Importações
        </Button>
      </div>
    );
  }

  if (payment.status !== 'pending') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="text-gray-600">Este pagamento já foi processado</p>
        <Button onClick={() => setLocation(`/payments/details/${paymentId}`)} className="mt-4">
          Ver Detalhes
        </Button>
      </div>
    );
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment': return `Entrada (30%)`;
      case 'installment': return `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`;
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
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
              {getPaymentTypeLabel(payment.paymentType)} • {formatCurrency(payment.amount).replace('R$', 'US$')}
            </p>
          </div>
        </div>
        <Badge className="bg-yellow-100 text-yellow-700 border-0">
          <Clock className="h-4 w-4 mr-1" />
          Pendente
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Pagamento */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Escolha a forma de pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="external" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Pagamento Externo
                  </TabsTrigger>
                  <TabsTrigger value="paycomex" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    PayComex
                  </TabsTrigger>
                </TabsList>

                {/* Pagamento Externo */}
                <TabsContent value="external" className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Pagamento Externo</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Realize o pagamento através do seu banco e anexe os comprovantes para validação.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Form {...externalForm}>
                    <form onSubmit={externalForm.handleSubmit(onExternalSubmit)} className="space-y-6">
                      {/* Método de Pagamento */}
                      <FormField
                        control={externalForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Pagamento Utilizado</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full p-2 border rounded-md">
                                <option value="">Selecione o método</option>
                                <option value="wire_transfer">Transferência Bancária</option>
                                <option value="swift_transfer">Transferência SWIFT</option>
                                <option value="letter_of_credit">Carta de Crédito</option>
                                <option value="remittance">Remessa Online</option>
                                <option value="other">Outro</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Valor Pago */}
                      <FormField
                        control={externalForm.control}
                        name="amountPaid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Pago (USD)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                  US$
                                </span>
                                <Input
                                  {...field}
                                  className="pl-12"
                                  placeholder="0.00"
                                  type="number"
                                  step="0.01"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Data do Pagamento */}
                      <FormField
                        control={externalForm.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data do Pagamento</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Upload de Comprovantes */}
                      <div className="space-y-2">
                        <FormLabel>Comprovantes de Pagamento *</FormLabel>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            id="receipts"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label htmlFor="receipts" className="cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                              Clique para anexar comprovantes
                            </p>
                            <p className="text-sm text-gray-500">
                              PDF, JPG, PNG, DOC até 10MB cada
                            </p>
                          </label>
                        </div>
                        
                        {uploadedFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium text-green-700">{file.name}</p>
                                    <p className="text-xs text-green-600">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remover
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
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
                                placeholder="Adicione observações sobre o pagamento..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Botões */}
                      <div className="flex gap-4 pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocation(`/payments/details/${paymentId}`)}
                          className="flex-1"
                        >
                          Voltar
                        </Button>
                        <Button
                          type="submit"
                          disabled={processExternalPaymentMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {processExternalPaymentMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                {/* PayComex */}
                <TabsContent value="paycomex" className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 rounded-full p-2">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">PayComex</h4>
                        <p className="text-sm text-gray-700 mt-1">
                          Plataforma global de remessas internacionais com as melhores taxas de câmbio
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Certificado e Seguro</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calculadora de Câmbio */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calculator className="h-5 w-5" />
                        Cálculo do Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Valor em USD:</span>
                          <p className="font-semibold text-lg">US$ {parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Taxa de câmbio:</span>
                          <p className="font-semibold text-lg">R$ {USD_TO_BRL.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Valor convertido:</span>
                          <p className="font-medium">R$ {(parseFloat(payment.amount) * USD_TO_BRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Taxa PayComex ({PAYCOMEX_FEE}%):</span>
                          <p className="font-medium">R$ {((parseFloat(payment.amount) * USD_TO_BRL) * (PAYCOMEX_FEE / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">IOF ({IOF_TAX}%):</span>
                          <p className="font-medium">R$ {((parseFloat(payment.amount) * USD_TO_BRL) * (IOF_TAX / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="border-t pt-2">
                          <span className="text-gray-600">Total a pagar:</span>
                          <p className="font-bold text-xl text-green-600">R$ {calculateTotalBRL().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Form {...paycomexForm}>
                    <form onSubmit={paycomexForm.handleSubmit(onPayComexSubmit)} className="space-y-6">
                      {/* Método de Pagamento PayComex */}
                      <FormField
                        control={paycomexForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Pagamento</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                              <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                field.value === 'credit_card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}>
                                <input
                                  type="radio"
                                  value="credit_card"
                                  checked={field.value === 'credit_card'}
                                  onChange={() => field.onChange('credit_card')}
                                  className="sr-only"
                                />
                                <div className="flex items-center gap-3">
                                  <CreditCard className="w-6 h-6 text-blue-600" />
                                  <div>
                                    <p className="font-medium">Cartão de Crédito</p>
                                    <p className="text-sm text-gray-600">Até 12x sem juros</p>
                                  </div>
                                </div>
                              </label>
                              
                              <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                field.value === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}>
                                <input
                                  type="radio"
                                  value="pix"
                                  checked={field.value === 'pix'}
                                  onChange={() => field.onChange('pix')}
                                  className="sr-only"
                                />
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">PIX</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">PIX</p>
                                    <p className="text-sm text-gray-600">Instantâneo</p>
                                  </div>
                                </div>
                              </label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Termos de Aceite */}
                      <FormField
                        control={paycomexForm.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                Aceito os <a href="#" className="text-blue-600 underline">termos de uso</a> e 
                                <a href="#" className="text-blue-600 underline ml-1">política de privacidade</a> da PayComex
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Botões */}
                      <div className="flex gap-4 pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocation(`/payments/details/${paymentId}`)}
                          className="flex-1"
                        >
                          Voltar
                        </Button>
                        <Button
                          type="submit"
                          disabled={processPayComexPaymentMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {processPayComexPaymentMutation.isPending ? 'Processando...' : 'Pagar com PayComex'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Resumo */}
        <div className="space-y-6">
          {/* Resumo do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-gray-500 mb-1">Valor a Pagar</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(payment.amount).replace('R$', 'US$')}
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium">{getPaymentTypeLabel(payment.paymentType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vencimento:</span>
                  <span className="font-medium">{formatDate(payment.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-700 border-0 px-2 py-1">
                    Pendente
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Fornecedor */}
          {supplierData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{supplierData.companyName}</p>
                  <p className="text-gray-600">{supplierData.contactName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Email: <span className="text-blue-600">{supplierData.email}</span></p>
                  <p className="text-gray-500">Telefone: {supplierData.phone}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
