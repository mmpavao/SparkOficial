import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Building2, Package, DollarSign, Ship, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { ImportFinancialPreview } from "@/components/ImportFinancialPreview";
import TermsConfirmation from "@/components/imports/TermsConfirmation";

// Import form schema
const importSchema = z.object({
  importName: z.string().min(3, "Nome da importação deve ter pelo menos 3 caracteres"),
  cargoType: z.enum(["FCL", "LCL"], { required_error: "Selecione o tipo de carga" }),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  shippingMethod: z.enum(["sea", "air"], { required_error: "Selecione o método de envio" }),
  incoterms: z.enum(["FOB", "CIF", "EXW"], { required_error: "Selecione o Incoterm" }),
  portOfLoading: z.string().min(2, "Porto de embarque é obrigatório"),
  portOfDischarge: z.string().min(2, "Porto de desembarque é obrigatório"),
  finalDestination: z.string().min(2, "Destino final é obrigatório"),
  estimatedDelivery: z.string().min(1, "Data estimada de entrega é obrigatória"),
  notes: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(2, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  hsCode: z.string().optional(),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitPrice: z.number().min(0.01, "Preço unitário deve ser maior que 0"),
  supplierId: z.number().min(1, "Selecione um fornecedor"),
});

type ImportFormData = z.infer<typeof importSchema>;
type ProductFormData = z.infer<typeof productSchema>;

interface Supplier {
  id: number;
  companyName: string;
  city: string;
  country: string;
  productCategories: string[];
}

interface Product extends ProductFormData {
  id: string;
  totalValue: number;
  supplierName?: string;
}

export default function ImportNewPage() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showTermsConfirmation, setShowTermsConfirmation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main form
  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      cargoType: "FCL",
      shippingMethod: "sea",
      incoterms: "FOB",
    },
  });

  // Product form
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      quantity: 1,
      unitPrice: 0,
    },
  });

  // Fetch suppliers
  const { data: suppliersData = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    enabled: true
  });

  // Fetch credit applications
  const { data: creditApplications = [] } = useQuery({
    queryKey: ['/api/credit/applications'],
    enabled: true
  });

  // Fetch user's credit info and admin fee
  const { data: creditUsage } = useQuery({
    queryKey: ['/api/user/credit-info'],
    enabled: true
  });

  const { data: adminFee } = useQuery({
    queryKey: ['/api/user/admin-fee'],
    enabled: true
  });

  // Use real suppliers or fallback to mock data for testing
  const suppliers = suppliersData.length > 0 ? suppliersData : [
    {
      id: 1,
      companyName: "Shenzhen TechMax Electronics Co., Ltd.",
      city: "Shenzhen",
      country: "China",
      productCategories: ["Electronics", "Mobile Accessories"]
    },
    {
      id: 2,
      companyName: "Guangzhou Home Décor Manufacturing",
      city: "Guangzhou", 
      country: "China",
      productCategories: ["Home Décor", "Furniture"]
    },
    {
      id: 3,
      companyName: "Ningbo Auto Parts Industry Co.",
      city: "Ningbo",
      country: "China", 
      productCategories: ["Automotive Parts", "Accessories"]
    }
  ];

  const cargoType = form.watch("cargoType");
  const totalValue = products.reduce((sum, product) => sum + product.totalValue, 0);

  // Create import mutation
  const createImportMutation = useMutation({
    mutationFn: async (data: ImportFormData & { products: Product[] }) => {
      return await apiRequest('/api/imports', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      toast({
        title: "Importação criada",
        description: "A importação foi criada com sucesso.",
      });
      setLocation('/imports');
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar importação.",
        variant: "destructive",
      });
    },
  });

  const addProduct = (productData: ProductFormData) => {
    const supplier = suppliers.find(s => s.id === productData.supplierId);
    const totalValue = productData.quantity * productData.unitPrice;
    
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      totalValue,
      supplierName: supplier?.companyName,
    };

    setProducts(prev => [...prev, newProduct]);
    productForm.reset();
    setShowProductForm(false);
  };

  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const onSubmit = (data: ImportFormData) => {
    if (products.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à importação.",
        variant: "destructive",
      });
      return;
    }

    createImportMutation.mutate({ ...data, products });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/imports')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Importação</h1>
          <p className="text-gray-600">Crie uma nova importação e gerencie seus produtos</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="importName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome/Código da Importação</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Smartphones Galaxy S24 - Lote 001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cargoType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Carga</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FCL">FCL - Container Completo</SelectItem>
                              <SelectItem value="LCL">LCL - Carga Consolidada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Envio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o método" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sea">Marítimo</SelectItem>
                              <SelectItem value="air">Aéreo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {cargoType === "FCL" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="containerNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Container</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: TEMU1234567" {...field} />
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
                              <Input placeholder="Ex: CN123456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="w-5 h-5" />
                    Informações de Envio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="incoterms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterms</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o Incoterm" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                            <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                            <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="portOfLoading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porto de Embarque</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Shanghai, China" {...field} />
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
                          <FormLabel>Porto de Desembarque</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Santos, Brasil" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="finalDestination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destino Final</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: São Paulo, SP" {...field} />
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
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre a importação..."
                            rows={3}
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
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={createImportMutation.isPending || products.length === 0}
                >
                  {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar - Products & Summary */}
        <div className="space-y-6">
          {/* Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produtos
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => setShowProductForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhum produto adicionado</p>
                  <Button 
                    size="sm" 
                    onClick={() => setShowProductForm(true)}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Produto
                  </Button>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.description && (
                          <p className="text-sm text-gray-600">{product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{product.supplierName}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeProduct(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Qtd:</span>
                        <span className="ml-1 font-medium">{product.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit:</span>
                        <span className="ml-1 font-medium">{formatCurrency(product.unitPrice, 'USD')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-1 font-medium">{formatCurrency(product.totalValue, 'USD')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {totalValue > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Produtos:</span>
                  <span className="font-medium">{products.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Total FOB:</span>
                  <span className="font-medium">{formatCurrency(totalValue, 'USD')}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total da Importação:</span>
                    <span className="text-emerald-600">{formatCurrency(totalValue, 'USD')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Adicionar Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(addProduct)} className="space-y-4">
                  <FormField
                    control={productForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Samsung Galaxy S24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descrição detalhada do produto..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                <div>
                                  <div className="font-medium">{supplier.companyName}</div>
                                  <div className="text-sm text-gray-600">{supplier.city}, {supplier.country}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={productForm.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Unit. (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowProductForm(false);
                        productForm.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      Adicionar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}