import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertImportSchema } from "@shared/schema";
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
import { formatUSDInput, parseUSDInput } from "@/lib/currency";
// Loading spinner inline component
import { 
  ArrowLeft,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Save
} from "lucide-react";

// Schema para edição (sem userId)
const editImportSchema = insertImportSchema.omit({ userId: true });

type ImportFormData = {
  description: string;
  supplierName: string;
  supplierLocation: string;
  totalValue: string;
  estimatedArrival: string;
  observations?: string;
  status: string;
};

export default function ImportEditPage() {
  const [match, params] = useRoute("/import/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const importId = params?.id ? parseInt(params.id) : null;

  // Buscar dados da importação
  const { data: importData, isLoading, error } = useQuery({
    queryKey: ["/api/imports", importId],
    enabled: !!importId,
  });

  const form = useForm<ImportFormData>({
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

  // Preencher formulário quando dados carregarem
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
    mutationFn: async (data: ImportFormData) => {
      const numericValue = parseUSDInput(data.totalValue);
      
      return apiRequest(`/api/imports/${importId}`, "PUT", {
        ...data,
        totalValue: numericValue,
        estimatedArrival: new Date(data.estimatedArrival).toISOString(),
      });
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
        description: error.message || "Erro ao atualizar importação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ImportFormData) => {
    updateMutation.mutate(data);
  };

  if (!match || !importId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Importação não encontrada</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !importData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Erro ao carregar importação</p>
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
      </div>

      {/* Formulário de Edição - Réplica do cadastro */}
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
              {/* Primeira linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Descrição dos Produtos *
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Nome do Fornecedor *
                      </FormLabel>
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
              </div>

              {/* Segunda linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="supplierLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Local do Fornecedor *
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Valor Total (USD) *
                      </FormLabel>
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
              </div>

              {/* Terceira linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="estimatedArrival"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
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

              {/* Observações */}
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

              {/* Botões de ação */}
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