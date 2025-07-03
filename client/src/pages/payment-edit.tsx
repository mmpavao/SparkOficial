
import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  ArrowLeft, 
  Save,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  Edit,
  Split,
  Plus,
  Trash2
} from "lucide-react";

const editPaymentSchema = z.object({
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => {
    const num = parseFloat(val.replace(/[^\d.-]/g, ''));
    return !isNaN(num) && num > 0;
  }, "Valor deve ser um número válido maior que zero"),
  notes: z.string().optional(),
});

const installmentSchema = z.object({
  installments: z.array(z.object({
    amount: z.string().min(1, "Valor é obrigatório"),
    dueDate: z.string().min(1, "Data é obrigatória"),
    description: z.string().optional(),
  })).min(2, "Deve ter pelo menos 2 parcelas"),
});

type EditPaymentFormData = z.infer<typeof editPaymentSchema>;
type InstallmentFormData = z.infer<typeof installmentSchema>;

export default function PaymentEditPage() {
  const [, params] = useRoute("/payments/edit/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("edit");
  const [enableInstallments, setEnableInstallments] = useState(false);

  const editForm = useForm<EditPaymentFormData>({
    resolver: zodResolver(editPaymentSchema),
    defaultValues: {
      dueDate: "",
      amount: "",
      notes: "",
    },
  });

  const installmentForm = useForm<InstallmentFormData>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      installments: [
        { amount: "", dueDate: "", description: "" },
        { amount: "", dueDate: "", description: "" },
      ],
    },
  });

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['/api/payments', paymentId],
    queryFn: () => apiRequest(`/api/payments/${paymentId}`, 'GET'),
    enabled: !!paymentId && !!user
  });

  // Preencher o formulário quando os dados do pagamento chegarem
  useEffect(() => {
    if (payment) {
      editForm.reset({
        dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : "",
        amount: payment.amount.toString(),
        notes: payment.notes || "",
      });
      
      // Initialize installment form with equal split
      const halfAmount = (parseFloat(payment.amount) / 2).toFixed(2);
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      
      installmentForm.reset({
        installments: [
          { 
            amount: halfAmount, 
            dueDate: today.toISOString().split('T')[0], 
            description: "1ª Parcela" 
          },
          { 
            amount: halfAmount, 
            dueDate: nextMonth.toISOString().split('T')[0], 
            description: "2ª Parcela" 
          },
        ],
      });
    }
  }, [payment, editForm, installmentForm]);

  const updatePaymentMutation = useMutation({
    mutationFn: (data: EditPaymentFormData) => {
      const payload = {
        dueDate: data.dueDate,
        amount: parseFloat(data.amount.replace(/[^\d.-]/g, '')),
        notes: data.notes,
      };
      return apiRequest(`/api/payments/${paymentId}`, 'PUT', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/schedule'] });
      toast({
        title: "Pagamento atualizado com sucesso",
        description: "As alterações foram salvas.",
      });
      setLocation(`/payments/details/${paymentId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message || "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
    }
  });

  const splitPaymentMutation = useMutation({
    mutationFn: (data: InstallmentFormData) => {
      return apiRequest(`/api/payments/${paymentId}/split`, 'POST', {
        installments: data.installments,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/schedule'] });
      toast({
        title: "Pagamento parcelado com sucesso",
        description: "O pagamento foi dividido em parcelas.",
      });
      setLocation(`/imports/details/${payment.importId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao parcelar pagamento",
        description: error.message || "Não foi possível parcelar o pagamento.",
        variant: "destructive",
      });
    }
  });

  const addInstallment = () => {
    const currentInstallments = installmentForm.getValues('installments');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + currentInstallments.length);
    
    installmentForm.setValue('installments', [
      ...currentInstallments,
      { 
        amount: "", 
        dueDate: nextMonth.toISOString().split('T')[0], 
        description: `${currentInstallments.length + 1}ª Parcela` 
      }
    ]);
  };

  const removeInstallment = (index: number) => {
    const currentInstallments = installmentForm.getValues('installments');
    if (currentInstallments.length > 2) {
      installmentForm.setValue('installments', currentInstallments.filter((_, i) => i !== index));
    }
  };

  const equalSplit = () => {
    const currentInstallments = installmentForm.getValues('installments');
    const equalAmount = (parseFloat(payment.amount) / currentInstallments.length).toFixed(2);
    
    const updatedInstallments = currentInstallments.map((inst, index) => ({
      ...inst,
      amount: equalAmount,
      description: inst.description || `${index + 1}ª Parcela`
    }));
    
    installmentForm.setValue('installments', updatedInstallments);
  };

  const onEditSubmit = (data: EditPaymentFormData) => {
    updatePaymentMutation.mutate(data);
  };

  const onInstallmentSubmit = (data: InstallmentFormData) => {
    splitPaymentMutation.mutate(data);
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
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Apenas pagamentos pendentes podem ser editados</p>
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

  const formatAmountInput = (value: string) => {
    const cleanValue = value.replace(/[^\d.,]/g, '');
    const normalizedValue = cleanValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    if (!isNaN(numValue)) {
      return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return cleanValue;
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
              Editar Pagamento
            </h1>
            <p className="text-gray-600">
              {getPaymentTypeLabel(payment.paymentType)} • ID: {payment.id}
            </p>
          </div>
        </div>
        <Badge className="bg-yellow-100 text-yellow-700 border-0">
          <Clock className="h-4 w-4 mr-1" />
          Pendente
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Edição */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Opções de Edição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Pagamento
                  </TabsTrigger>
                  <TabsTrigger value="split" className="flex items-center gap-2">
                    <Split className="h-4 w-4" />
                    Parcelar Pagamento
                  </TabsTrigger>
                </TabsList>

                {/* Editar Pagamento */}
                <TabsContent value="edit" className="space-y-6">
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                      {/* Data de Vencimento */}
                      <FormField
                        control={editForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Vencimento</FormLabel>
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

                      {/* Valor */}
                      <FormField
                        control={editForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor (USD)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                  US$
                                </span>
                                <Input
                                  {...field}
                                  className="pl-12"
                                  placeholder="0,00"
                                  onChange={(e) => {
                                    const formattedValue = formatAmountInput(e.target.value);
                                    field.onChange(formattedValue);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Observações */}
                      <FormField
                        control={editForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
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
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={updatePaymentMutation.isPending}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updatePaymentMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                {/* Parcelar Pagamento */}
                <TabsContent value="split" className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Split className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Parcelar Pagamento</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Divida este pagamento em parcelas menores com datas diferentes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Form {...installmentForm}>
                    <form onSubmit={installmentForm.handleSubmit(onInstallmentSubmit)} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Parcelas</h4>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={equalSplit}
                          >
                            Dividir Igualmente
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addInstallment}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {installmentForm.watch('installments').map((_, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium">Parcela {index + 1}</h5>
                            {installmentForm.watch('installments').length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInstallment(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={installmentForm.control}
                              name={`installments.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Valor (USD)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
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
                            
                            <FormField
                              control={installmentForm.control}
                              name={`installments.${index}.dueDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vencimento</FormLabel>
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
                            
                            <FormField
                              control={installmentForm.control}
                              name={`installments.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: 1ª Parcela"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}

                      {/* Total das Parcelas */}
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total das Parcelas:</span>
                            <span className="font-bold text-lg">
                              US$ {installmentForm.watch('installments')
                                .reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
                                .toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                            <span>Valor Original:</span>
                            <span>US$ {parseFloat(payment.amount).toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Botões */}
                      <div className="flex gap-4 pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocation(`/payments/details/${paymentId}`)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={splitPaymentMutation.isPending}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Split className="h-4 w-4 mr-2" />
                          {splitPaymentMutation.isPending ? 'Processando...' : 'Parcelar Pagamento'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Informações Atuais */}
        <div className="space-y-6">
          {/* Dados Atuais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Dados Atuais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-gray-500 mb-1">Valor Atual</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(payment.amount).replace('R$', 'US$')}
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium">{getPaymentTypeLabel(payment.paymentType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vencimento Atual:</span>
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

          {/* Informações do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Criado em:</span>
                  <span className="font-medium">{formatDate(payment.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ID do Pagamento:</span>
                  <span className="font-medium">#{payment.id}</span>
                </div>
                {payment.importId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Importação:</span>
                    <span className="font-medium">#{payment.importId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aviso */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Atenção</p>
                  <p className="text-amber-700">
                    Alterações no pagamento podem afetar o cronograma da importação. 
                    Ao parcelar, o pagamento original será substituído pelas novas parcelas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
