import { useState, useEffect } from "react";
import { useParams, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Package,
  Ship,
  MapPin,
  DollarSign,
  FileText,
  Building2,
  Plus,
  Trash2,
  Edit3
} from "lucide-react";
import { Link } from "wouter";

// Schema de validação simplificado para importação operacional
const operationalImportSchema = z.object({
  importName: z.string().min(1, "Nome da importação é obrigatório"),
  cargoType: z.string().min(1, "Tipo de carga é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  currency: z.string().min(1, "Moeda é obrigatória"),
  incoterms: z.string().min(1, "Incoterms é obrigatório"),
  // Campos opcionais
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  weight: z.string().optional(),
  volume: z.string().optional(),
  transportMethod: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  notes: z.string().optional(),
});

type OperationalImportForm = z.infer<typeof operationalImportSchema>;

export default function ImportEditOperationalPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useRoute();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch import data
  const { data: importData, isLoading: isLoadingImport, error } = useQuery({
    queryKey: [`/api/imports/operational/${id}`],
    enabled: !!id,
  });

  console.log("📋 Import data received:", importData);

  const form = useForm<OperationalImportForm>({
    resolver: zodResolver(operationalImportSchema),
    defaultValues: {
      importName: "",
      cargoType: "FCL",
      totalValue: "",
      currency: "USD",
      incoterms: "FOB",
      containerNumber: "",
      sealNumber: "",
      weight: "",
      volume: "",
      transportMethod: "maritimo",
      origin: "",
      destination: "",
      notes: "",
    },
  });

  // Update form when import data is loaded
  useEffect(() => {
    if (importData && importData.fullData) {
      const data = importData.fullData;
      console.log("🔄 Setting form data:", data);
      
      form.reset({
        importName: data.importName || "",
        cargoType: data.cargoType || "FCL",
        totalValue: data.totalValue?.toString() || "",
        currency: data.currency || "USD",
        incoterms: data.incoterms || "FOB",
        containerNumber: data.containerNumber || "",
        sealNumber: data.sealNumber || "",
        weight: data.weight?.toString() || "",
        volume: data.volume?.toString() || "",
        transportMethod: data.transportMethod || "maritimo",
        origin: data.portOfLoading || "",
        destination: data.portOfDischarge || "",
        notes: data.notes || "",
      });
    }
  }, [importData, form]);

  // Update mutation
  const updateImportMutation = useMutation({
    mutationFn: async (data: OperationalImportForm) => {
      return apiRequest(`/api/imports/operational/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Importação operacional atualizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/imports/operational/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      navigate("/imports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar importação",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OperationalImportForm) => {
    console.log("📤 Submitting operational import data:", data);
    updateImportMutation.mutate(data);
  };

  if (isLoadingImport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados da importação...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Erro ao carregar importação</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados da importação operacional.
          </p>
          <Button asChild>
            <Link href="/imports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Importações
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!importData || !importData.fullData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Importação não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A importação operacional solicitada não foi encontrada.
          </p>
          <Button asChild>
            <Link href="/imports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Importações
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/imports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Importação Operacional</h1>
            <p className="text-muted-foreground">
              Edite os dados da importação com recursos próprios
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Operacional
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="importName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Importação *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Eletrônicos Q1 2024" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cargoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Carga *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FCL">FCL (Container Completo)</SelectItem>
                          <SelectItem value="LCL">LCL (Carga Fracionada)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moeda *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="CNY">CNY</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="incoterms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incoterms *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FOB">FOB</SelectItem>
                          <SelectItem value="CIF">CIF</SelectItem>
                          <SelectItem value="EXW">EXW</SelectItem>
                          <SelectItem value="DDP">DDP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Container */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Detalhes do Container
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="containerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Container</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: MSKU1234567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sealNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Lacre</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 123456" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="transportMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Transporte</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="maritimo">Marítimo</SelectItem>
                          <SelectItem value="aereo">Aéreo</SelectItem>
                          <SelectItem value="rodoviario">Rodoviário</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Origem e Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porto de Origem</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Shanghai, China" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porto de Destino</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Santos, Brasil" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Internas</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Observações sobre a importação..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/imports">Cancelar</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={updateImportMutation.isPending}
              className="flex items-center gap-2"
            >
              {updateImportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {updateImportMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}