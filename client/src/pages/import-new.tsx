import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertImportSchema, type InsertImport } from "@shared/schema";
import { 
  Package, 
  Building,
  Box,
  DollarSign,
  Ship,
  Plane,
  Plus,
  Trash2,
  Truck,
  ArrowLeft
} from "lucide-react";

export default function NewImportPage() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState([{
    name: "",
    description: "",
    hsCode: "",
    quantity: 1,
    unitPrice: "",
    totalValue: ""
  }]);
  const { toast } = useToast();

  const form = useForm<InsertImport>({
    resolver: zodResolver(insertImportSchema),
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
      status: "planning",
      currentStage: "estimativa"
    },
  });

  const createImportMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting data:", data);
      return apiRequest('POST', '/api/imports', data);
    },
    onSuccess: () => {
      toast({
        title: "Importação criada!",
        description: "A nova importação foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/imports"] });
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

  const onSubmit = (data: InsertImport) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Form values:", form.getValues());
    
    try {
      const cargoType = form.watch("cargoType");
      
      // Prepare products array based on cargo type
      let productsArray;
      let finalTotalValue;
      
      if (cargoType === "LCL") {
        // For LCL, use the products array from state
        if (products.length === 0) {
          toast({
            title: "Erro de validação",
            description: "Adicione pelo menos um produto para carga LCL.",
            variant: "destructive",
          });
          return;
        }
        productsArray = products;
        finalTotalValue = products.reduce((sum, product) => {
          return sum + (parseFloat(product.totalValue) || 0);
        }, 0).toString();
      } else {
        // For FCL, create single product from form data
        productsArray = [{
          name: data.productName || "",
          description: data.productDescription || "",
          hsCode: "",
          quantity: data.quantity || 1,
          unitPrice: data.unitPrice || "",
          totalValue: data.totalValue || ""
        }];
        finalTotalValue = data.totalValue || "";
      }
      
      // Prepare final submission data
      const submissionData = {
        importName: data.importName,
        cargoType: data.cargoType,
        supplierName: data.supplierName,
        supplierLocation: data.supplierLocation,
        products: productsArray,
        totalValue: finalTotalValue,
        currency: data.currency || "USD",
        incoterms: data.incoterms || "FOB",
        shippingMethod: data.shippingMethod || "sea",
        containerType: data.containerType,
        containerNumber: data.containerNumber || "",
        sealNumber: data.sealNumber || "",
        estimatedDelivery: data.estimatedDelivery,
        status: "planning",
        currentStage: "estimativa"
      };
      
      console.log("Prepared submission data:", submissionData);
      createImportMutation.mutate(submissionData);
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast({
        title: "Erro de validação",
        description: "Por favor, verifique os campos obrigatórios.",
        variant: "destructive",
      });
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
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Importação</h1>
          <p className="text-gray-600 mt-1">Cadastre uma nova importação da China</p>
        </div>
      </div>

      {/* New Import Form */}
      <Card>
        <CardHeader>
          <CardTitle>Formulário de Nova Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="importName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome/Código da Importação *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: IMP-2025-001 ou Eletrônicos Janeiro" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value || "FCL"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de carga" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FCL">FCL - Contêiner Inteiro</SelectItem>
                            <SelectItem value="LCL">LCL - Carga Fracionada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Container Info - Only for FCL */}
                {form.watch("cargoType") === "FCL" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <FormField
                      control={form.control}
                      name="containerNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Contêiner</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: TCLU1234567" {...field} />
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
                            <Input placeholder="Ex: 123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Informações do Fornecedor */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informações do Fornecedor
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Fornecedor *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Shanghai Manufacturing Co." {...field} />
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
                        <FormLabel>Localização do Fornecedor *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Shanghai, China" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  {form.watch("cargoType") === "LCL" ? "Produtos da Carga" : "Produto Principal"}
                </h3>
                
                {form.watch("cargoType") === "LCL" ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-yellow-800">
                          <strong>Carga Fracionada (LCL):</strong> Adicione múltiplos produtos que compartilharão o mesmo contêiner.
                        </p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setProducts([...products, { name: "", description: "", hsCode: "", quantity: 1, unitPrice: "", totalValue: "" }])}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Produto
                        </Button>
                      </div>
                    </div>
                    
                    {products.map((product, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Produto {index + 1}</h4>
                          {products.length > 1 && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => setProducts(products.filter((_, i) => i !== index))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nome do Produto *</Label>
                            <Input 
                              placeholder="Ex: Smartphone Galaxy A54" 
                              value={product.name}
                              onChange={(e) => {
                                const newProducts = [...products];
                                newProducts[index].name = e.target.value;
                                setProducts(newProducts);
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>Código HS</Label>
                            <Input 
                              placeholder="Ex: 8517.12.00" 
                              value={product.hsCode}
                              onChange={(e) => {
                                const newProducts = [...products];
                                newProducts[index].hsCode = e.target.value;
                                setProducts(newProducts);
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>Quantidade *</Label>
                            <Input 
                              type="number" 
                              placeholder="1000" 
                              value={product.quantity}
                              onChange={(e) => {
                                const newProducts = [...products];
                                newProducts[index].quantity = parseInt(e.target.value) || 1;
                                setProducts(newProducts);
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>Preço Unitário (USD) *</Label>
                            <Input 
                              placeholder="50.00" 
                              value={product.unitPrice}
                              onChange={(e) => {
                                const newProducts = [...products];
                                newProducts[index].unitPrice = e.target.value;
                                // Auto-calculate total value
                                const total = (parseFloat(e.target.value) || 0) * product.quantity;
                                newProducts[index].totalValue = total.toFixed(2);
                                setProducts(newProducts);
                              }}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Descrição Detalhada *</Label>
                          <Textarea 
                            placeholder="Descrição completa do produto, especificações técnicas, modelo, etc."
                            className="min-h-[60px]"
                            value={product.description}
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[index].description = e.target.value;
                              setProducts(newProducts);
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            <strong>Valor Total: USD ${product.totalValue || "0.00"}</strong>
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.quantity} × ${product.unitPrice || "0.00"}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {products.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-blue-900">Resumo da Carga LCL</h4>
                              <p className="text-sm text-blue-700">
                                {products.length} produto{products.length > 1 ? 's' : ''} • Total: {products.reduce((sum, p) => sum + p.quantity, 0)} unidades
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-900">
                                USD ${products.reduce((sum, product) => sum + (parseFloat(product.totalValue) || 0), 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-blue-600">Valor Total da Importação</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Produto *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Smartphone Galaxy A54" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1000" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Product Description for FCL */}
                {form.watch("cargoType") !== "LCL" && (
                  <FormField
                    control={form.control}
                    name="productDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Detalhada *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição completa do produto, especificações técnicas, modelo, etc."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Pricing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Informações de Preço
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incoterms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Preço *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "FOB"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de preço" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FOB">FOB - Free On Board (sem frete/seguro)</SelectItem>
                            <SelectItem value="CIF">CIF - Cost, Insurance and Freight (com frete/seguro)</SelectItem>
                            <SelectItem value="EXW">EXW - Ex Works (retirada na fábrica)</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="50000.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("cargoType") !== "LCL" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Unitário (USD) *</FormLabel>
                          <FormControl>
                            <Input placeholder="50.00" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value || "USD"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a moeda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                              <SelectItem value="CNY">CNY - Yuan Chinês</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Shipping Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Ship className="w-5 h-5" />
                  Transporte
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="shippingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Envio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sea">
                              <div className="flex items-center gap-2">
                                <Ship className="w-4 h-4" />
                                Marítimo
                              </div>
                            </SelectItem>
                            <SelectItem value="air">
                              <div className="flex items-center gap-2">
                                <Plane className="w-4 h-4" />
                                Aéreo
                              </div>
                            </SelectItem>
                            <SelectItem value="land">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Terrestre
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="20ft">20ft Standard</SelectItem>
                            <SelectItem value="40ft">40ft Standard</SelectItem>
                            <SelectItem value="40ft-hc">40ft High Cube</SelectItem>
                            <SelectItem value="lcl">LCL - Carga Fracionada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedDelivery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entrega Estimada</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4">
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
                  onClick={(e) => {
                    console.log("Button clicked!");
                    console.log("Form state:", form.formState);
                    console.log("Form errors:", form.formState.errors);
                    // Let the form handle submission naturally
                  }}
                >
                  {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}