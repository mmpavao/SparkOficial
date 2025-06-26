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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CreditCard
} from "lucide-react";

const paymentSchema = z.object({
  paymentMethod: z.string().min(1, "Selecione o método de pagamento"),
  receiptFile: z.any().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function PaymentPayPage() {
  const [, params] = useRoute("/payments/pay/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = params?.id ? parseInt(params.id) : null;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "",
      notes: "",
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

  const processPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const formData = new FormData();
      formData.append('paymentMethod', data.paymentMethod);
      if (data.notes) formData.append('notes', data.notes);
      if (uploadedFile) formData.append('receipt', uploadedFile);

      const response = await fetch(`/api/payments/${paymentId}/pay`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/schedule'] });
      toast({
        title: "Pagamento processado com sucesso",
        description: "O pagamento foi registrado e está sendo processado.",
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = (data: PaymentFormData) => {
    if (!uploadedFile) {
      toast({
        title: "Comprovante obrigatório",
        description: "Por favor, anexe o comprovante de pagamento.",
        variant: "destructive",
      });
      return;
    }
    processPaymentMutation.mutate(data);
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
      case 'down_payment': return `Down Payment (30%)`;
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
                Dados do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Método de Pagamento */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o método de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wire_transfer">Transferência Bancária</SelectItem>
                            <SelectItem value="letter_of_credit">Carta de Crédito</SelectItem>
                            <SelectItem value="documentary_collection">Cobrança Documentária</SelectItem>
                            <SelectItem value="cash_in_advance">Pagamento Antecipado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload do Comprovante */}
                  <div className="space-y-2">
                    <FormLabel>Comprovante de Pagamento *</FormLabel>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id="receipt"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="receipt" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Clique para anexar o comprovante
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, JPG, PNG, DOC até 10MB
                        </p>
                      </label>
                    </div>
                    
                    {uploadedFile && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
                            <p className="text-xs text-green-600">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  <FormField
                    control={form.control}
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
                      disabled={processPaymentMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processPaymentMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Resumo e Dados do Fornecedor */}
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
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {supplierData.city}, {supplierData.province}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="space-y-2">
                <p>• Efetue o pagamento conforme as condições acordadas</p>
                <p>• Anexe o comprovante de pagamento válido</p>
                <p>• O pagamento será validado em até 2 dias úteis</p>
                <p>• Em caso de dúvidas, entre em contato conosco</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}