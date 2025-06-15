import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Package, Truck, Plus, Trash2, Building2 } from "lucide-react";

// Simplified import schema that matches backend expectations
const importSchema = z.object({
  importName: z.string().min(3, "Nome da importação é obrigatório"),
  cargoType: z.enum(["FCL", "LCL"]).default("FCL"),
  supplierName: z.string().min(2, "Nome do fornecedor é obrigatório"),
  supplierLocation: z.string().min(2, "Localização do fornecedor é obrigatória"),
  productName: z.string().min(2, "Nome do produto é obrigatório"),
  productDescription: z.string().min(10, "Descrição do produto é obrigatória"),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  currency: z.string().default("USD"),
  incoterms: z.string().default("FOB"),
  shippingMethod: z.string().default("sea"),
  containerType: z.string().default("20ft"),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
});

type ImportFormData = z.infer<typeof importSchema>;

interface Product {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalValue: string;
  supplierId: number;
}

export default function ImportComplete() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      importName: "",
      cargoType: "FCL",
      supplierName: "",
      supplierLocation: "",
      productName: "",
      productDescription: "",
      quantity: 1,
      unitPrice: "",
      totalValue: "",
      currency: "USD",
      incoterms: "FOB",
      shippingMethod: "sea",
      containerType: "20ft",
      containerNumber: "",
      sealNumber: "",
      estimatedDelivery: "",
    },
  });

  const cargoType = form.watch("cargoType");

  // Add initial product for LCL
  useEffect(() => {
    if (cargoType === "LCL" && products.length === 0) {
      addProduct();
    }
  }, [cargoType]);

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: "",
      description: "",
      quantity: 1,
      unitPrice: "",
      totalValue: "",
      supplierId: 0,
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const calculateProductTotal = (quantity: number, unitPrice: string) => {
    const price = parseFloat(unitPrice) || 0;
    return (quantity * price).toString();
  };

  const getTotalValue = () => {
    if (cargoType === "LCL") {
      return products.reduce((sum, product) => {
        return sum + (parseFloat(product.totalValue) || 0);
      }, 0).toString();
    }
    return form.watch("totalValue") || "0";
  };

  const createImportMutation = useMutation({
    mutationFn: async (data: ImportFormData) => {
      console.log("Creating import with data:", data);
      
      // Prepare data for API matching backend schema
      const apiData = {
        importName: data.importName,
        cargoType: data.cargoType,
        supplierName: data.supplierName,
        supplierLocation: data.supplierLocation,
        // Convert to products array for backend
        products: cargoType === "LCL" ? products.map(p => ({
          name: p.name,
          description: p.description,
          hsCode: "",
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          totalValue: p.totalValue
        })) : [{
          name: data.productName,
          description: data.productDescription,
          hsCode: "",
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalValue: data.totalValue
        }],
        totalValue: getTotalValue(),
        currency: data.currency,
        incoterms: data.incoterms,
        shippingMethod: data.shippingMethod,
        containerType: data.containerType,
        containerNumber: data.containerNumber || "",
        sealNumber: data.sealNumber || "",
        estimatedDelivery: data.estimatedDelivery,
        status: "planning",
        currentStage: "estimativa"
      };
      
      console.log("API data:", apiData);
      return apiRequest('POST', '/api/imports', apiData);
    },
    onSuccess: () => {
      toast({
        title: "Importação criada!",
        description: "A nova importação foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setLocation('/imports');
    },
    onError: (error: any) => {
      console.error("Error creating import:", error);
      toast({
        title: "Erro ao criar importação",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ImportFormData) => {
    console.log("Form submitted:", data);
    console.log("Products:", products);
    
    // Validation for LCL
    if (cargoType === "LCL" && products.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um produto para carga LCL.",
        variant: "destructive",
      });
      return;
    }

    createImportMutation.mutate(data);
  };

  const onSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find((s: any) => s.id.toString() === supplierId);
    if (supplier) {
      form.setValue("supplierName", supplier.companyName);
      form.setValue("supplierLocation", `${supplier.city}, ${supplier.country}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/imports')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Importação</h1>
          <p className="text-muted-foreground">Cadastre uma nova operação de importação</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações da Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="importName">Nome/Código da Importação *</Label>
                <Input
                  id="importName"
                  {...form.register("importName")}
                  placeholder="Ex: IMP-2025-001"
                />
                {form.formState.errors.importName && (
                  <p className="text-sm text-red-500">{form.formState.errors.importName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargoType">Tipo de Carga *</Label>
                <Select
                  value={form.watch("cargoType")}
                  onValueChange={(value) => form.setValue("cargoType", value as "FCL" | "LCL")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FCL">FCL - Container Inteiro</SelectItem>
                    <SelectItem value="LCL">LCL - Carga Particionada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Supplier Information */}
            <Separator />
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedor
            </h3>
            
            {suppliers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Selecionar Fornecedor Cadastrado</Label>
                  <Select onValueChange={onSupplierSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.companyName} - {supplier.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Nome do Fornecedor *</Label>
                <Input
                  id="supplierName"
                  {...form.register("supplierName")}
                  placeholder="Nome da empresa fornecedora"
                />
                {form.formState.errors.supplierName && (
                  <p className="text-sm text-red-500">{form.formState.errors.supplierName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierLocation">Localização do Fornecedor *</Label>
                <Input
                  id="supplierLocation"
                  {...form.register("supplierLocation")}
                  placeholder="Ex: Guangzhou, China"
                />
                {form.formState.errors.supplierLocation && (
                  <p className="text-sm text-red-500">{form.formState.errors.supplierLocation.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Section */}
        {cargoType === "FCL" ? (
          <Card>
            <CardHeader>
              <CardTitle>Produto Principal (FCL)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Nome do Produto *</Label>
                  <Input
                    id="productName"
                    {...form.register("productName")}
                    placeholder="Nome do produto"
                  />
                  {form.formState.errors.productName && (
                    <p className="text-sm text-red-500">{form.formState.errors.productName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...form.register("quantity", { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productDescription">Descrição Detalhada *</Label>
                <Textarea
                  id="productDescription"
                  {...form.register("productDescription")}
                  placeholder="Descrição detalhada do produto, especificações técnicas, etc."
                  rows={3}
                />
                {form.formState.errors.productDescription && (
                  <p className="text-sm text-red-500">{form.formState.errors.productDescription.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Produtos (LCL)</span>
                <Button type="button" onClick={addProduct} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Produto
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.map((product, index) => (
                <Card key={product.id} className="border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Produto {index + 1}</h4>
                      {products.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Produto *</Label>
                        <Input
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                          placeholder="Nome do produto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 1;
                            updateProduct(product.id, "quantity", quantity);
                            const newTotal = calculateProductTotal(quantity, product.unitPrice);
                            updateProduct(product.id, "totalValue", newTotal);
                          }}
                          placeholder="1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descrição *</Label>
                      <Textarea
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                        placeholder="Descrição do produto"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Preço Unitário (USD) *</Label>
                        <Input
                          value={product.unitPrice}
                          onChange={(e) => {
                            const unitPrice = e.target.value;
                            updateProduct(product.id, "unitPrice", unitPrice);
                            const newTotal = calculateProductTotal(product.quantity, unitPrice);
                            updateProduct(product.id, "totalValue", newTotal);
                          }}
                          placeholder="67.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Total (USD)</Label>
                        <Input
                          value={product.totalValue}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fornecedor</Label>
                        <Select
                          value={product.supplierId.toString()}
                          onValueChange={(value) => updateProduct(product.id, "supplierId", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {cargoType === "LCL" && products.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo da Carga LCL</h4>
                  <p className="text-sm text-blue-700">
                    Total de Produtos: {products.length} | 
                    Valor Total: ${products.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0).toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Information - Only for FCL */}
        {cargoType === "FCL" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💰</span> Informações de Preço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incoterms">Tipo de Preço *</Label>
                  <Select
                    value={form.watch("incoterms")}
                    onValueChange={(value) => form.setValue("incoterms", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB - Free On Board (sem frete/seguro)</SelectItem>
                      <SelectItem value="CIF">CIF - Cost, Insurance and Freight (com frete/seguro)</SelectItem>
                      <SelectItem value="EXW">EXW - Ex Works (retirada na fábrica)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preço Unitário (USD) *</Label>
                  <Input
                    id="unitPrice"
                    {...form.register("unitPrice")}
                    placeholder="67"
                  />
                  {form.formState.errors.unitPrice && (
                    <p className="text-sm text-red-500">{form.formState.errors.unitPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalValue">Valor Total (USD) *</Label>
                  <Input
                    id="totalValue"
                    {...form.register("totalValue")}
                    placeholder="50000"
                  />
                  {form.formState.errors.totalValue && (
                    <p className="text-sm text-red-500">{form.formState.errors.totalValue.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transport Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Transporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingMethod">Método de Envio</Label>
                <Select
                  value={form.watch("shippingMethod")}
                  onValueChange={(value) => form.setValue("shippingMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sea">🚢 Marítimo</SelectItem>
                    <SelectItem value="air">✈️ Aéreo</SelectItem>
                    <SelectItem value="land">🚛 Terrestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="containerType">Tipo de Container</Label>
                <Select
                  value={form.watch("containerType")}
                  onValueChange={(value) => form.setValue("containerType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20ft">20ft Standard</SelectItem>
                    <SelectItem value="40ft">40ft Standard</SelectItem>
                    <SelectItem value="40ft-hc">40ft High Cube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDelivery">Entrega Estimada</Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  {...form.register("estimatedDelivery")}
                />
              </div>
            </div>

            {cargoType === "FCL" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="containerNumber">Número do Container</Label>
                  <Input
                    id="containerNumber"
                    {...form.register("containerNumber")}
                    placeholder="Ex: ABCD1234567"
                  />
                </div>
                <div className="space-y-2">
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

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setLocation('/imports')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createImportMutation.isPending}
            className="min-w-[120px]"
          >
            {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
          </Button>
        </div>
      </form>
    </div>
  );
}