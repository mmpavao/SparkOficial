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

// Schema de validação para importação operacional
const operationalImportSchema = z.object({
  importName: z.string().min(1, "Nome da importação é obrigatório"),
  cargoType: z.string().min(1, "Tipo de carga é obrigatório"),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  currency: z.string().min(1, "Moeda é obrigatória"),
  weight: z.string().optional(),
  volume: z.string().optional(),
  dimensions: z.string().optional(),
  transportMethod: z.string().optional(),
  containerType: z.string().optional(),
  incoterms: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  notes: z.string().optional(),
  products: z.array(z.object({
    productName: z.string().min(1, "Nome do produto é obrigatório"),
    quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
    unitPrice: z.number().min(0, "Preço unitário deve ser maior ou igual a 0"),
    totalValue: z.number().min(0, "Valor total deve ser maior ou igual a 0"),
    supplierId: z.number().optional(),
  })).min(1, "Pelo menos um produto é obrigatório"),
});

type OperationalImportForm = z.infer<typeof operationalImportSchema>;

export default function ImportEditOperationalPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useRoute();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch import data
  const { data: importData, isLoading: isLoadingImport } = useQuery({
    queryKey: [`/api/imports/operational/${id}`],
    enabled: !!id,
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  const form = useForm<OperationalImportForm>({
    resolver: zodResolver(operationalImportSchema),
    defaultValues: {
      importName: "",
      cargoType: "",
      containerNumber: "",
      sealNumber: "",
      totalValue: "",
      currency: "USD",
      weight: "",
      volume: "",
      dimensions: "",
      transportMethod: "",
      containerType: "",
      incoterms: "FOB",
      origin: "",
      destination: "",
      portOfLoading: "",
      portOfDischarge: "",
      estimatedDelivery: "",
      notes: "",
      products: [],
    },
  });

  // Update form when import data is loaded
  useEffect(() => {
    if (importData) {
      const formData = {
        importName: importData.importName || "",
        cargoType: importData.cargoType || "",
        containerNumber: importData.containerNumber || "",
        sealNumber: importData.sealNumber || "",
        totalValue: importData.totalValue?.toString() || "",
        currency: importData.currency || "USD",
        weight: importData.weight?.toString() || "",
        volume: importData.volume?.toString() || "",
        dimensions: importData.dimensions || "",
        transportMethod: importData.transportMethod || "",
        containerType: importData.containerType || "",
        incoterms: importData.incoterms || "FOB",
        origin: importData.origin || "",
        destination: importData.destination || "",
        portOfLoading: importData.portOfLoading || "",
        portOfDischarge: importData.portOfDischarge || "",
        estimatedDelivery: importData.estimatedDelivery 
          ? new Date(importData.estimatedDelivery).toISOString().split('T')[0] 
          : "",
        notes: importData.notes || "",
        products: importData.products?.map((p: any) => ({
          productName: p.productName || "",
          quantity: p.quantity || 0,
          unitPrice: p.unitPrice || 0,
          totalValue: p.totalValue || 0,
          supplierId: p.supplierId || undefined,
        })) || [],
      };
      form.reset(formData);
    }
  }, [importData, form]);

  // Update mutation
  const updateImportMutation = useMutation({
    mutationFn: async (data: OperationalImportForm) => {
      return apiRequest(`/api/imports/operational/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Importação atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/imports/operational', id] });
      navigate(`/imports/operational/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OperationalImportForm) => {
    updateImportMutation.mutate(data);
  };

  // Product management functions
  const addProduct = () => {
    const currentProducts = form.getValues("products");
    form.setValue("products", [
      ...currentProducts,
      {
        productName: "",
        quantity: 1,
        unitPrice: 0,
        totalValue: 0,
        supplierId: undefined,
      },
    ]);
  };

  const removeProduct = (index: number) => {
    const currentProducts = form.getValues("products");
    form.setValue("products", currentProducts.filter((_, i) => i !== index));
  };

  const updateProductTotal = (index: number) => {
    const products = form.getValues("products");
    const product = products[index];
    if (product) {
      const total = product.quantity * product.unitPrice;
      form.setValue(`products.${index}.totalValue`, total);
      
      // Update overall total
      const allProducts = form.getValues("products");
      const overallTotal = allProducts.reduce((sum, p) => sum + (p.totalValue || 0), 0);
      form.setValue("totalValue", overallTotal.toString());
    }
  };

  if (isLoadingImport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando dados da importação...</span>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Importação não encontrada</h2>
        <p className="text-gray-600 mb-4">A importação solicitada não existe ou você não tem permissão para editá-la.</p>
        <Link href="/imports">
          <Button>Voltar para Importações</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/imports/operational/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Editar Importação Operacional</h1>
            <p className="text-gray-600">
              Atualize as informações da importação #{importData.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {importData.status === 'planning' ? 'Planejamento' : 
             importData.status === 'producao' ? 'Produção' : importData.status}
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Logística
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financeiro
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="importName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Importação</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Equipamentos Eletrônicos Q1 2024" />
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
                        <FormLabel>Tipo de Carga</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de carga" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FCL">FCL - Full Container Load</SelectItem>
                            <SelectItem value="LCL">LCL - Less Container Load</SelectItem>
                            <SelectItem value="Break Bulk">Break Bulk</SelectItem>
                            <SelectItem value="Air Cargo">Air Cargo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="containerNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Container</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: ABCD1234567" />
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
                          <Input {...field} placeholder="Ex: SL123456" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Informações adicionais sobre a importação..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Produtos da Importação</CardTitle>
                    <Button type="button" onClick={addProduct} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {form.watch("products")?.map((product, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Produto #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <FormField
                          control={form.control}
                          name={`products.${index}.productName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Produto</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ex: Smartphone Galaxy" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`products.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseInt(e.target.value) || 0);
                                    updateProductTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`products.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço Unitário</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    updateProductTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`products.${index}.totalValue`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor Total</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  readOnly
                                  className="bg-gray-50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {suppliers.length > 0 && (
                        <FormField
                          control={form.control}
                          name={`products.${index}.supplierId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fornecedor (Opcional)</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um fornecedor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {suppliers.map((supplier: any) => (
                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                      {supplier.companyName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  ))}

                  {(!form.watch("products") || form.watch("products").length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Nenhum produto adicionado</p>
                      <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Transporte</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="transportMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Transporte</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="maritimo">Marítimo</SelectItem>
                            <SelectItem value="aereo">Aéreo</SelectItem>
                            <SelectItem value="terrestre">Terrestre</SelectItem>
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
                        <FormLabel>Incoterms</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione os incoterms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                            <SelectItem value="CIF">CIF - Cost, Insurance and Freight</SelectItem>
                            <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
                            <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                            <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Shenzhen, China" />
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
                        <FormLabel>Destino</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Santos, SP, Brasil" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="portOfLoading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porto de Embarque</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Port of Shenzhen" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="portOfDischarge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porto de Descarga</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Porto de Santos" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedDelivery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Estimada de Entrega</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="containerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Container</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de container" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="20GP">20" GP - General Purpose</SelectItem>
                            <SelectItem value="40GP">40" GP - General Purpose</SelectItem>
                            <SelectItem value="40HC">40" HC - High Cube</SelectItem>
                            <SelectItem value="20RF">20" RF - Refrigerado</SelectItem>
                            <SelectItem value="40RF">40" RF - Refrigerado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dimensões e Peso</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} placeholder="Ex: 15000" />
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
                          <Input type="number" step="0.01" {...field} placeholder="Ex: 67.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensões</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 12m x 2.4m x 2.6m" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Financeiras</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="totalValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            placeholder="Ex: 50000.00"
                            readOnly
                            className="bg-gray-50"
                          />
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
                        <FormLabel>Moeda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a moeda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                            <SelectItem value="CNY">CNY - Yuan Chinês</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Link href={`/imports/operational/${id}`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            
            <Button 
              type="submit" 
              disabled={updateImportMutation.isPending}
              className="min-w-[120px]"
            >
              {updateImportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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