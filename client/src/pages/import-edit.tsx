import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { formatUSDInput, parseUSDInput } from "@/lib/currency";
import { 
  ArrowLeft, 
  Save, 
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react";

// Form schemas
import { z } from "zod";

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
  const [match, params] = useRoute("/imports/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const importId = params?.id ? parseInt(params.id) : null;

  // Fetch import details - seguindo exatamente o padrão da edição de créditos
  const { data: importData, isLoading } = useQuery({
    queryKey: ["/api/imports", importId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/imports/${importId}`);
      return response.json();
    },
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

  // Populate form when data is loaded - seguindo o padrão da edição de créditos
  useEffect(() => {
    if (importData) {
      const formattedDate = importData.estimatedArrival 
        ? new Date(importData.estimatedArrival).toISOString().split('T')[0] 
        : "";
      
      form.reset({
        description: importData.description || "",
        supplierName: importData.supplierName || "",
        supplierLocation: importData.supplierLocation || "",
        totalValue: importData.totalValue ? formatUSDInput(importData.totalValue.toString()) : "",
        estimatedArrival: formattedDate,
        observations: importData.observations || "",
        status: importData.status || "planejamento",
      });
    }
  }, [importData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditImportForm) => {
      const numericValue = parseUSDInput(data.totalValue);
      
      const response = await apiRequest("PUT", `/api/imports/${importId}`, {
        ...data,
        totalValue: numericValue,
        estimatedArrival: new Date(data.estimatedArrival).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/imports", importId] });
      toast({
        title: "Sucesso!",
        description: "Importação atualizada com sucesso.",
      });
      setTimeout(() => {
        setLocation(`/imports/details/${importId}`);
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar importação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditImportForm) => {
    updateMutation.mutate(data);
  };

  if (!match || !importId) {
    return <div>Importação não encontrada</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!importData) {
    return <div>Importação não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header - exatamente como na edição de créditos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/import/details/${importId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Importação
            </h1>
            <p className="text-gray-600">
              {importData.importNumber || `IMP-${importData.id.toString().padStart(3, '0')}`}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
          {importData.status === 'planejamento' ? 'Planejamento' :
           importData.status === 'em_andamento' ? 'Em Andamento' :
           importData.status === 'concluida' ? 'Concluída' : 'Cancelada'}
        </Badge>
      </div>

      {/* Edit Form - seguindo a estrutura da edição de créditos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Informações da Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Primeira seção - Dados básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Dados da Importação
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição dos Produtos *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva os produtos que serão importados..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Fornecedor *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Shanghai Electronics Co."
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
                          <Input 
                            placeholder="Ex: Shanghai, China"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total (USD) *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 50,000.00"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatUSDInput(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedArrival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Estimada de Chegada *</FormLabel>
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
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status da Importação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                </div>

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações adicionais sobre a importação..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit button - exatamente como na edição de créditos */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation(`/import/details/${importId}`)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}