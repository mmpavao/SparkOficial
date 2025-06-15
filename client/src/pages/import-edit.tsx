import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { formatUSDInput, parseUSDInput, validateUSDRange } from "@/lib/currency";
import { 
  ArrowLeft,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Save,
  CheckCircle,
  XCircle
} from "lucide-react";

const editImportSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  supplierName: z.string().min(1, "Nome do fornecedor é obrigatório"),
  supplierLocation: z.string().min(1, "Local do fornecedor é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  estimatedArrival: z.string().min(1, "Data estimada é obrigatória"),
  observations: z.string().optional(),
  status: z.enum(["planejamento", "em_andamento", "concluida", "cancelada"]),
});

type EditImportForm = z.infer<typeof editImportSchema>;

export default function ImportEditPage() {
  const [match, params] = useRoute("/import/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const importId = params?.id ? parseInt(params.id) : null;

  // Fetch import details
  const { data: importData, isLoading } = useQuery({
    queryKey: ["/api/imports", importId],
    enabled: !!importId,
  }) as { data: any, isLoading: boolean };

  const form = useForm<EditImportForm>({
    resolver: zodResolver(editImportSchema),
    defaultValues: {
      description: "",
      supplierName: "",
      supplierLocation: "",
      totalValue: "",
      estimatedArrival: "",
      observations: "",
      status: "planejamento",
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (importData) {
      form.reset({
        description: importData.description || "",
        supplierName: importData.supplierName || "",
        supplierLocation: importData.supplierLocation || "",
        totalValue: importData.totalValue?.toString() || "",
        estimatedArrival: importData.estimatedArrival ? 
          new Date(importData.estimatedArrival).toISOString().split('T')[0] : "",
        observations: importData.observations || "",
        status: importData.status || "planejamento",
      });
    }
  }, [importData, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EditImportForm) => {
      const payload = {
        ...data,
        totalValue: parseUSDInput(data.totalValue),
        estimatedArrival: new Date(data.estimatedArrival).toISOString(),
      };
      
      return apiRequest("PUT", `/api/imports/${importId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/imports", importId] });
      toast({
        title: "Sucesso!",
        description: "Importação atualizada com sucesso.",
      });
      setTimeout(() => {
        setLocation(`/import/details/${importId}`);
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a importação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditImportForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-spark-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Importação não encontrada</h2>
        <p className="text-gray-600 mb-4">A importação solicitada não existe ou você não tem permissão para editá-la.</p>
        <Button onClick={() => window.location.href = '/imports'}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Importações
        </Button>
      </div>
    );
  }

  // Check if user can edit this import
  const canEdit = importData.status === 'planejamento' && 
                 (user?.email === "pavaosmart@gmail.com" || importData.userId === user?.id);

  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Edição não permitida</h2>
        <p className="text-gray-600 mb-4">
          Esta importação não pode ser editada. Apenas importações em planejamento podem ser modificadas.
        </p>
        <Button onClick={() => window.location.href = `/import/details/${importId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Detalhes
        </Button>
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
            onClick={() => window.location.href = `/import/details/${importId}`}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Importação</h1>
            <p className="text-gray-600">
              {importData.importNumber || `IMP-${importData.id.toString().padStart(3, '0')}`}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Importação *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Componentes eletrônicos para linha de produção"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Fornecedor *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Shenzhen Electronics Co."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local do Fornecedor *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Ex: Shenzhen, China"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações Financeiras e Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => {
                    const currentValue = parseUSDInput(field.value || '0');
                    const validation = validateUSDRange(currentValue);
                    const isValid = validation.isValid && currentValue > 0;
                    
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          Valor Total (USD) *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="$50,000"
                              value={field.value ? formatUSDInput(field.value) : ''}
                              onChange={(e) => {
                                const numValue = parseUSDInput(e.target.value);
                                field.onChange(numValue.toString());
                              }}
                              className={`pl-8 pr-10 text-lg font-medium ${
                                field.value && currentValue > 0
                                  ? isValid 
                                    ? 'border-green-300 focus:border-green-500' 
                                    : 'border-red-300 focus:border-red-500'
                                  : ''
                              }`}
                            />
                            <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            {field.value && currentValue > 0 && (
                              <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                                {isValid ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="estimatedArrival"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Data Estimada de Chegada *
                      </FormLabel>
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
              </div>
            </CardContent>
          </Card>

          {/* Status and Observations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Status e Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status da Importação *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre a importação..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = `/import/details/${importId}`}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-spark-600 hover:bg-spark-700"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}