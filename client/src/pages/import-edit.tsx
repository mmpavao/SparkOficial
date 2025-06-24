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
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Save, 
  Package,
  Plus,
  Trash2,
  Building2,
  Calendar,
  FileText,
  AlertTriangle
} from "lucide-react";
import { z } from "zod";

// Form schema
const editImportSchema = z.object({
  importName: z.string().min(1, "Nome/Código da importação é obrigatório"),
  cargoType: z.enum(["FCL", "LCL"], { required_error: "Tipo de carga é obrigatório" }),
  products: z.array(z.object({
    name: z.string().min(1, "Nome do produto é obrigatório"),
    quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
    unitPrice: z.number().min(0, "Preço unitário deve ser maior ou igual a 0"),
    supplierId: z.number().min(1, "Fornecedor é obrigatório"),
  })).min(1, "Pelo menos um produto é obrigatório"),
  priceType: z.enum(["FOB", "CIF", "EXW"], { required_error: "Tipo de preço é obrigatório" }),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
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
  const queryClient = useQueryClient();

  const importId = params?.id ? parseInt(params.id) : null;

  // Fetch import details
  const { data: importData, isLoading } = useQuery({
    queryKey: ["/api/imports", importId],
    queryFn: async () => {
      return await apiRequest(`/api/imports/${importId}`, "GET");
    },
    enabled: !!importId,
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      return await apiRequest("/api/suppliers", "GET");
    },
  });

  const form = useForm({
    resolver: zodResolver(editImportSchema),
    defaultValues: {
      importName: "",
      cargoType: "FCL" as const,
      products: [{ name: "", quantity: 1, unitPrice: 0, supplierId: 0 }],
      priceType: "FOB" as const,
      containerNumber: "",
      sealNumber: "",
      estimatedArrival: "",
      observations: "",
      status: "planejamento" as const,
    },
  });

  // Load import data into form when available
  useEffect(() => {
    if (importData) {
      // Parse products from database - handle current format
      let products = [];
      try {
        if (Array.isArray(importData.products)) {
          // Convert current database format to form format
          products = importData.products.map((product: any) => ({
            name: product.name || "",
            quantity: parseInt(product.quantity) || 1,
            unitPrice: parseFloat(product.unitPrice) || 0,
            supplierId: suppliers.find((s: any) => s.companyName === product.supplierName)?.id || 
                       (suppliers.length > 0 ? suppliers[0].id : 1)
          }));
        } else if (typeof importData.products === 'string') {
          const parsed = JSON.parse(importData.products);
          products = Array.isArray(parsed) ? parsed.map((product: any) => ({
            name: product.name || "",
            quantity: parseInt(product.quantity) || 1,
            unitPrice: parseFloat(product.unitPrice) || 0,
            supplierId: suppliers.find((s: any) => s.companyName === product.supplierName)?.id || 
                       (suppliers.length > 0 ? suppliers[0].id : 1)
          })) : [{ name: "", quantity: 1, unitPrice: 0, supplierId: suppliers.length > 0 ? suppliers[0].id : 1 }];
        } else {
          // Fallback for completely different format
          products = [{ 
            name: "Produto", 
            quantity: 1, 
            unitPrice: parseFloat(importData.totalValue) || 0, 
            supplierId: suppliers.length > 0 ? suppliers[0].id : 1 
          }];
        }
      } catch (error) {
        console.error("Error parsing products:", error);
        products = [{ 
          name: "Produto", 
          quantity: 1, 
          unitPrice: parseFloat(importData.totalValue) || 0, 
          supplierId: suppliers.length > 0 ? suppliers[0].id : 1 
        }];
      }

      form.reset({
        importName: importData.importName || `IMP-${importData.id}`,
        cargoType: importData.cargoType || "FCL",
        products: products,
        priceType: importData.priceType || "FOB",
        containerNumber: importData.containerNumber || "",
        sealNumber: importData.sealNumber || "",
        estimatedArrival: importData.estimatedArrival ? importData.estimatedArrival.split('T')[0] : "",
        observations: importData.observations || "",
        status: importData.status || "planejamento",
      });
    }
  }, [importData, suppliers, form]);

  // Update import mutation
  const updateImportMutation = useMutation({
    mutationFn: async (data: EditImportForm) => {
      // Calculate total value from products
      const totalValue = data.products.reduce((sum, product) => 
        sum + (product.quantity * product.unitPrice), 0
      ).toString();

      const updateData = {
        ...data,
        totalValue,
        products: JSON.stringify(data.products),
      };

      return await apiRequest(`/api/imports/${importId}`, "PUT", updateData);
    },
    onSuccess: () => {
      toast({
        title: "Importação atualizada",
        description: "Os dados da importação foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/imports", importId] });
      setLocation("/imports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditImportForm) => {
    updateImportMutation.mutate(data);
  };

  // Product management functions
  const addProduct = () => {
    const currentProducts = form.getValues("products");
    form.setValue("products", [
      ...currentProducts,
      { name: "", quantity: 1, unitPrice: 0, supplierId: 0 }
    ]);
  };

  const removeProduct = (index: number) => {
    const currentProducts = form.getValues("products");
    if (currentProducts.length > 1) {
      form.setValue("products", currentProducts.filter((_, i) => i !== index));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "planejamento":
        return <Badge variant="secondary">Planejamento</Badge>;
      case "em_andamento":
        return <Badge variant="default">Em Andamento</Badge>;
      case "concluida":
        return <Badge variant="outline" className="border-green-500 text-green-700">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

  // Check if import can be edited (accepting both Portuguese and English status)
  const canEdit = ["planejamento", "planning", "em_andamento", "in_progress"].includes(importData.status);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/imports")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Importação</h1>
            <p className="text-muted-foreground">IMP-{importData.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(importData.status)}
        </div>
      </div>

      {/* Warning for cancelled imports */}
      {!canEdit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Esta importação não pode ser editada
              </span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Apenas importações em "Planejamento" ou "Em Andamento" podem ser editadas. Status atual: {importData.status}
            </p>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
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
                      <FormLabel>Nome/Código da Importação *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={!canEdit}
                          placeholder="Ex: IMP-2024-001" 
                        />
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!canEdit}
                      >
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

                <FormField
                  control={form.control}
                  name="priceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Preço *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!canEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FOB">FOB</SelectItem>
                          <SelectItem value="CIF">CIF</SelectItem>
                          <SelectItem value="EXW">EXW</SelectItem>
                        </SelectContent>
                      </Select>
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
                          {...field} 
                          type="date" 
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Container Information (FCL only) */}
              {form.watch("cargoType") === "FCL" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="containerNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Container</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!canEdit}
                            placeholder="Ex: MSKU1234567" 
                          />
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
                          <Input 
                            {...field} 
                            disabled={!canEdit}
                            placeholder="Ex: 123456" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos
                </CardTitle>
                {canEdit && (
                  <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("products").map((_, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Produto {index + 1}</h4>
                    {canEdit && form.watch("products").length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`products.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Produto *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!canEdit}
                              placeholder="Ex: Smartphone" 
                            />
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
                          <FormLabel>Quantidade *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="1"
                              disabled={!canEdit}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                          <FormLabel>Preço Unitário (USD) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!canEdit}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`products.${index}.supplierId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString() || ""}
                            disabled={!canEdit}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                  </div>

                  {/* Product total */}
                  <div className="text-right text-sm text-muted-foreground">
                    Total: ${((form.watch(`products.${index}.quantity`) || 0) * 
                             (form.watch(`products.${index}.unitPrice`) || 0)).toFixed(2)}
                  </div>
                </div>
              ))}

              {/* Total Value */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Total da Importação:</span>
                  <span className="text-xl font-bold">
                    ${form.watch("products").reduce((sum, product) => 
                      sum + ((product.quantity || 0) * (product.unitPrice || 0)), 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        disabled={!canEdit}
                        placeholder="Observações adicionais sobre a importação..."
                        rows={4}
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/imports")}
            >
              Cancelar
            </Button>
            {canEdit && (
              <Button 
                type="submit" 
                disabled={updateImportMutation.isPending}
              >
                {updateImportMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}