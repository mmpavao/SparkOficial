import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, Minus, ArrowLeft, Calculator, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const productSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  hsCode: z.string().optional(),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitPrice: z.number().min(0.01, "Preço unitário deve ser maior que 0"),
  supplierId: z.number().optional(),
});

const importSchema = z.object({
  importName: z.string().min(1, "Nome da importação é obrigatório"),
  cargoType: z.enum(["FCL", "LCL"]),
  supplierId: z.number().min(1, "Fornecedor é obrigatório"),
  shippingMethod: z.enum(["sea", "air"]),
  incoterms: z.enum(["FOB", "CIF", "EXW"]),
  containerType: z.string().optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  
  // Para FCL - produto único
  productName: z.string().optional(),
  productDescription: z.string().optional(),
  productHsCode: z.string().optional(),
  totalValue: z.number().optional(),
  
  // Para LCL - múltiplos produtos
  products: z.array(productSchema).optional(),
});

type ImportFormData = z.infer<typeof importSchema>;
type Product = z.infer<typeof productSchema>;

interface Supplier {
  id: number;
  companyName: string;
  city: string;
  country: string;
}

export default function NewImportPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [showFinancialPreview, setShowFinancialPreview] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [adminFee, setAdminFee] = useState(10); // 10% padrão

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      cargoType: "FCL",
      shippingMethod: "sea",
      incoterms: "FOB",
      products: [],
    },
  });

  const cargoType = form.watch("cargoType");
  const totalValue = form.watch("totalValue");
  const watchedProducts = form.watch("products") || [];

  // Buscar fornecedores
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: !!user,
  });

  // Buscar taxa administrativa
  const { data: userAdminFee } = useQuery({
    queryKey: ["/api/user/admin-fee"],
    enabled: !!user,
    select: (data: any) => data?.feePercentage ? parseFloat(data.feePercentage) : 10,
  });

  // Buscar crédito disponível
  const { data: creditInfo } = useQuery({
    queryKey: ["/api/credit/applications"],
    enabled: !!user,
  });

  // Mutation para criar importação
  const createImportMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/imports", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Importação criada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setLocation("/imports");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar importação",
        variant: "destructive",
      });
    },
  });

  const addProduct = () => {
    const newProduct: Product = {
      name: "",
      description: "",
      hsCode: "",
      quantity: 1,
      unitPrice: 0,
    };
    setProducts([...products, newProduct]);
    form.setValue("products", [...products, newProduct]);
  };

  const removeProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    form.setValue("products", updatedProducts);
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
    form.setValue("products", updatedProducts);
  };

  // Cálculos financeiros
  const calculateTotals = () => {
    let importValue = 0;
    
    if (cargoType === "FCL") {
      importValue = totalValue || 0;
    } else {
      importValue = products.reduce((sum, product) => {
        return sum + (product.quantity * product.unitPrice);
      }, 0);
    }
    
    const downPayment = importValue * 0.3; // 30%
    const financedAmount = importValue * 0.7; // 70%
    const adminFeeAmount = financedAmount * (adminFee / 100);
    const totalCost = importValue + adminFeeAmount;
    
    return {
      importValue,
      downPayment,
      financedAmount,
      adminFeeAmount,
      totalCost
    };
  };

  const { importValue, downPayment, financedAmount, adminFeeAmount, totalCost } = calculateTotals();

  // Verificar crédito disponível
  const availableCredit = creditInfo?.[0]?.finalCreditLimit ? 
    parseFloat(creditInfo[0].finalCreditLimit) : 0;
  const hasEnoughCredit = financedAmount <= availableCredit;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const onSubmit = (data: ImportFormData) => {
    if (!hasEnoughCredit) {
      toast({
        title: "Crédito Insuficiente",
        description: "O valor financiado excede seu limite de crédito disponível.",
        variant: "destructive",
      });
      return;
    }
    
    setConfirmDialogOpen(true);
  };

  const confirmSubmit = () => {
    const formData = form.getValues();
    
    let submitData: any = {
      importName: formData.importName,
      cargoType: formData.cargoType,
      supplierId: formData.supplierId,
      shippingMethod: formData.shippingMethod,
      incoterms: formData.incoterms,
      containerType: formData.containerType,
      containerNumber: formData.containerNumber,
      sealNumber: formData.sealNumber,
      estimatedDelivery: formData.estimatedDelivery,
      totalValue: importValue.toString(),
      currency: "USD",
    };

    if (cargoType === "FCL") {
      submitData.products = [{
        name: formData.productName,
        description: formData.productDescription,
        hsCode: formData.productHsCode,
        quantity: 1,
        unitPrice: importValue,
        totalValue: importValue,
        supplierId: formData.supplierId
      }];
    } else {
      submitData.products = products.map(p => ({
        ...p,
        totalValue: p.quantity * p.unitPrice,
        supplierId: p.supplierId || formData.supplierId
      }));
    }

    createImportMutation.mutate(submitData);
    setConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/imports")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nova Importação</h2>
          <p className="text-muted-foreground">
            Crie uma nova importação com validação de crédito em tempo real
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="importName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome/Código da Importação</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: IMP-2025-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cargoType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Carga</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o fornecedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.companyName} - {supplier.city}, {supplier.country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Envio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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

                    <FormField
                      control={form.control}
                      name="incoterms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incoterms</FormLabel>
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
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Produtos */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {cargoType === "FCL" ? "Produto (Container Completo)" : "Produtos (Carga Fracionada)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cargoType === "FCL" ? (
                    // FCL - Produto único
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Eletrônicos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="productDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descrição detalhada do produto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="productHsCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código HS (Opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 8517.12.00" {...field} />
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
                              <FormLabel>Valor Total (USD)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    // LCL - Múltiplos produtos
                    <div className="space-y-4">
                      {products.map((product, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Produto {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Nome</label>
                              <Input
                                value={product.name}
                                onChange={(e) => updateProduct(index, "name", e.target.value)}
                                placeholder="Nome do produto"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Código HS</label>
                              <Input
                                value={product.hsCode || ""}
                                onChange={(e) => updateProduct(index, "hsCode", e.target.value)}
                                placeholder="Código HS"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Quantidade</label>
                              <Input
                                type="number"
                                value={product.quantity}
                                onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Preço Unitário (USD)</label>
                              <Input
                                type="number"
                                value={product.unitPrice}
                                onChange={(e) => updateProduct(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium">
                              Valor Total: {formatCurrency(product.quantity * product.unitPrice)}
                            </p>
                          </div>
                        </Card>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addProduct}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Produto
                      </Button>

                      {products.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Resumo dos Produtos</span>
                          </div>
                          <p className="text-sm text-blue-800">
                            Total de Produtos: {products.length} | 
                            Quantidade Total: {products.reduce((sum, p) => sum + p.quantity, 0)} | 
                            Valor Total: {formatCurrency(products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0))}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
                  disabled={createImportMutation.isPending}
                >
                  {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Preview Financeiro */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Preview Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importValue > 0 ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Valor da Importação:</span>
                      <span className="font-medium">{formatCurrency(importValue)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm">Entrada (30%):</span>
                      <span className="font-medium">{formatCurrency(downPayment)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm">Valor a Financiar (70%):</span>
                      <span className="font-medium">{formatCurrency(financedAmount)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm">Taxa Administrativa ({adminFee}%):</span>
                      <span className="font-medium">{formatCurrency(adminFeeAmount)}</span>
                    </div>

                    <hr />

                    <div className="flex justify-between font-semibold">
                      <span>Custo Total:</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium mb-1">Crédito Disponível</p>
                    <p className="text-lg font-bold">{formatCurrency(availableCredit)}</p>
                    <p className="text-xs text-muted-foreground">
                      Valor necessário: {formatCurrency(financedAmount)}
                    </p>
                  </div>

                  {!hasEnoughCredit && financedAmount > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Crédito Insuficiente</p>
                        <p className="text-xs text-red-600">
                          Você precisa de {formatCurrency(financedAmount - availableCredit)} adicionais
                        </p>
                      </div>
                    </div>
                  )}

                  {hasEnoughCredit && financedAmount > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-medium text-green-800">✓ Crédito Suficiente</p>
                      <p className="text-xs text-green-600">
                        Sobrarão {formatCurrency(availableCredit - financedAmount)} disponíveis
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Adicione produtos para ver o preview financeiro
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Criação da Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a criar uma importação no valor de {formatCurrency(totalCost)} 
              (incluindo taxas administrativas). Esta ação reservará {formatCurrency(financedAmount)} 
              do seu crédito disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Confirmar Criação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}