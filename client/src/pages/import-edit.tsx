import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Plus, Minus } from "lucide-react";
import type { Import, Supplier } from "@shared/schema";

// Form validation schema
const editImportSchema = z.object({
  importName: z.string().min(3, "Nome/código da importação é obrigatório"),
  cargoType: z.enum(["FCL", "LCL"]).default("FCL"),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  products: z.array(z.object({
    name: z.string().min(1, "Nome do produto é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    hsCode: z.string().optional(),
    quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
    unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
    totalValue: z.string().min(1, "Valor total é obrigatório"),
    supplierId: z.number().min(1, "Fornecedor é obrigatório"),
  })).min(1, "Pelo menos um produto é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  currency: z.string().default("USD"),
  incoterms: z.string().min(1, "Incoterms é obrigatório"),
  shippingMethod: z.string().min(1, "Método de envio é obrigatório"),
  containerType: z.string().optional(),
  weight: z.string().optional(),
  volume: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  notes: z.string().optional(),
});

type EditImportForm = z.infer<typeof editImportSchema>;

export default function ImportEdit() {
  const [, params] = useRoute("/imports/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importId = params?.id ? parseInt(params.id) : null;

  // Fetch import data
  const { data: importData, isLoading: isLoadingImport } = useQuery({
    queryKey: ["/api/imports", importId],
    enabled: !!importId,
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<EditImportForm>({
    resolver: zodResolver(editImportSchema),
    defaultValues: {
      importName: "",
      cargoType: "FCL",
      containerNumber: "",
      sealNumber: "",
      products: [{
        name: "",
        description: "",
        hsCode: "",
        quantity: 1,
        unitPrice: "",
        totalValue: "",
        supplierId: 0,
      }],
      totalValue: "",
      currency: "USD",
      incoterms: "FOB",
      shippingMethod: "Maritime",
      containerType: "",
      weight: "",
      volume: "",
      estimatedDelivery: "",
      notes: "",
    },
  });

  const { watch, setValue, handleSubmit, control } = form;
  const watchedProducts = watch("products");
  const watchedCargoType = watch("cargoType");

  // Update form when import data is loaded
  useEffect(() => {
    if (importData && importData.status === 'planning') {
      const products = Array.isArray(importData.products) && importData.products.length > 0 
        ? importData.products 
        : [{
            name: "",
            description: "",
            hsCode: "",
            quantity: 1,
            unitPrice: "",
            totalValue: "",
            supplierId: 0,
          }];

      form.reset({
        importName: importData.importName || "",
        cargoType: importData.cargoType || "FCL",
        containerNumber: importData.containerNumber || "",
        sealNumber: importData.sealNumber || "",
        products: products,
        totalValue: importData.totalValue || "",
        currency: importData.currency || "USD",
        incoterms: importData.incoterms || "FOB",
        shippingMethod: importData.shippingMethod || "Maritime",
        containerType: importData.containerType || "",
        weight: importData.weight || "",
        volume: importData.volume || "",
        estimatedDelivery: importData.estimatedDelivery 
          ? new Date(importData.estimatedDelivery).toISOString().split('T')[0]
          : "",
        notes: importData.notes || "",
      });
    }
  }, [importData, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: EditImportForm) => apiRequest("/api/imports/" + importId, "PUT", data),
    onSuccess: () => {
      toast({
        title: "Importação atualizada",
        description: "A importação foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setLocation("/imports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar importação",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditImportForm) => {
    updateMutation.mutate(data);
  };

  // Product management functions
  const addProduct = () => {
    const newProduct = {
      name: "",
      description: "",
      hsCode: "",
      quantity: 1,
      unitPrice: "",
      totalValue: "",
      supplierId: 0,
    };
    setValue("products", [...watchedProducts, newProduct]);
  };

  const removeProduct = (index: number) => {
    if (watchedProducts.length > 1) {
      const newProducts = watchedProducts.filter((_, i) => i !== index);
      setValue("products", newProducts);
    }
  };

  const updateProductValue = (index: number, field: string, value: any) => {
    const updatedProducts = [...watchedProducts];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : updatedProducts[index].quantity;
      const unitPrice = field === "unitPrice" ? value : updatedProducts[index].unitPrice;
      if (quantity && unitPrice) {
        updatedProducts[index].totalValue = (quantity * parseFloat(unitPrice)).toFixed(2);
      }
    }
    
    setValue("products", updatedProducts);
  };

  if (isLoadingImport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando importação...</p>
        </div>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Importação não encontrada</p>
          <Button onClick={() => setLocation("/imports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Importações
          </Button>
        </div>
      </div>
    );
  }

  if (importData.status !== 'planning') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-amber-600 mb-4">Apenas importações em planejamento podem ser editadas</p>
          <Button onClick={() => setLocation("/imports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Importações
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/imports")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Editar Importação</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="importName">Nome/Código da Importação *</Label>
                <Input
                  id="importName"
                  {...form.register("importName")}
                  placeholder="Ex: IMP-2024-001"
                />
                {form.formState.errors.importName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.importName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cargoType">Tipo de Carga *</Label>
                <Select
                  value={watchedCargoType}
                  onValueChange={(value) => setValue("cargoType", value as "FCL" | "LCL")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FCL">FCL (Container Completo)</SelectItem>
                    <SelectItem value="LCL">LCL (Carga Consolidada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {watchedCargoType === "FCL" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="containerNumber">Número do Container</Label>
                  <Input
                    id="containerNumber"
                    {...form.register("containerNumber")}
                    placeholder="Ex: ABCD1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="sealNumber">Número do Lacre</Label>
                  <Input
                    id="sealNumber"
                    {...form.register("sealNumber")}
                    placeholder="Ex: 123456"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produtos</CardTitle>
              {watchedCargoType === "LCL" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {watchedProducts.map((product, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Produto {index + 1}</h4>
                  {watchedCargoType === "LCL" && watchedProducts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Produto *</Label>
                    <Input
                      value={product.name}
                      onChange={(e) => updateProductValue(index, "name", e.target.value)}
                      placeholder="Nome do produto"
                    />
                  </div>
                  <div>
                    <Label>Código HS</Label>
                    <Input
                      value={product.hsCode}
                      onChange={(e) => updateProductValue(index, "hsCode", e.target.value)}
                      placeholder="Ex: 8517.12.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descrição *</Label>
                  <Textarea
                    value={product.description}
                    onChange={(e) => updateProductValue(index, "description", e.target.value)}
                    placeholder="Descrição detalhada do produto"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProductValue(index, "quantity", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Preço Unitário (USD) *</Label>
                    <Input
                      value={product.unitPrice}
                      onChange={(e) => updateProductValue(index, "unitPrice", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Valor Total (USD) *</Label>
                    <Input
                      value={product.totalValue}
                      onChange={(e) => updateProductValue(index, "totalValue", e.target.value)}
                      placeholder="0.00"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label>Fornecedor *</Label>
                  <Select
                    value={product.supplierId.toString()}
                    onValueChange={(value) => updateProductValue(index, "supplierId", parseInt(value) || 0)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.companyName} - {supplier.city}, {supplier.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Envio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="incoterms">Incoterms *</Label>
                <Select
                  value={watch("incoterms")}
                  onValueChange={(value) => setValue("incoterms", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="EXW">EXW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shippingMethod">Método de Envio *</Label>
                <Select
                  value={watch("shippingMethod")}
                  onValueChange={(value) => setValue("shippingMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maritime">Marítimo</SelectItem>
                    <SelectItem value="Air">Aéreo</SelectItem>
                    <SelectItem value="Land">Terrestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimatedDelivery">Entrega Estimada</Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  {...form.register("estimatedDelivery")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  {...form.register("weight")}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="volume">Volume (m³)</Label>
                <Input
                  id="volume"
                  {...form.register("volume")}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="containerType">Tipo de Container</Label>
                <Input
                  id="containerType"
                  {...form.register("containerType")}
                  placeholder="Ex: 20ft, 40ft"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Observações adicionais sobre a importação"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/imports")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}