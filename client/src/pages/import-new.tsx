import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useAuth } from "@/hooks/useAuth";
import { ImportFinancialPreview } from "@/components/ImportFinancialPreview";
import { ImportTermsConfirmation } from "@/components/ImportTermsConfirmation";
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
    totalValue: "",
    supplierId: 0
  }]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentImportValue, setCurrentImportValue] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch suppliers
  const suppliersQuery = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Fetch credit applications for financial preview (only for importers)
  const { data: creditApplications } = useQuery({
    queryKey: ["/api/credit/applications"],
    enabled: user?.role === 'importer',
  });

  const form = useForm<InsertImport>({
    resolver: zodResolver(insertImportSchema),
    defaultValues: {
      importName: "",
      cargoType: "FCL",
      products: [{
        name: "",
        description: "",
        supplierId: 0,
        quantity: 1,
        unitPrice: "",
        totalValue: "",
        hsCode: ""
      }],
      supplierId: 0,
      totalValue: "",
      currency: "USD",
      incoterms: "FOB",
      shippingMethod: "sea",
      containerType: "",
      containerNumber: "",
      sealNumber: "",
      status: "planejamento",
      userId: user?.id || 0
    },
  });

  // Get approved credit application
  const approvedCredit = Array.isArray(creditApplications) 
    ? creditApplications.find((app: any) => app.financialStatus === 'approved')
    : null;

  // Fetch credit usage if we have approved credit
  const { data: creditUsage } = useQuery({
    queryKey: ['/api/credit/usage', approvedCredit?.id],
    queryFn: () => apiRequest(`/api/credit/usage/${approvedCredit.id}`, 'GET'),
    enabled: !!approvedCredit?.id,
  });

  // Calculate import value in real-time
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.cargoType === "LCL") {
        const totalValue = products.reduce((sum, product) => {
          return sum + (parseFloat(product.totalValue) || 0);
        }, 0);
        setCurrentImportValue(totalValue);
      } else {
        const newValue = parseFloat(value.totalValue || "0");
        setCurrentImportValue(newValue);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, products]);

  // Debug logs
  useEffect(() => {
    console.log("Current import value:", currentImportValue);
    console.log("Approved credit:", approvedCredit);
    console.log("Credit usage:", creditUsage);
    console.log("User role:", user?.role);
    console.log("Should show preview:", user?.role === 'importer' && !!approvedCredit);
    console.log("Products:", products);
  }, [currentImportValue, approvedCredit, creditUsage, user, products]);

  const createImportMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Making API request with data:", data);
      return apiRequest("/api/imports", "POST", data);
    },
    onSuccess: (data) => {
      console.log("Import created successfully:", data);
      toast({
        title: "Importação criada com sucesso!",
        description: "Sua nova importação foi registrada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setLocation("/imports");
    },
    onError: (error: any) => {
      console.error("Error creating import:", error);
      toast({
        title: "Erro ao criar importação",
        description: error?.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertImport) => {
    if (!approvedCredit && user?.role === 'importer') {
      toast({
        title: "Crédito não encontrado",
        description: "Você precisa ter um crédito aprovado para criar importações.",
        variant: "destructive",
      });
      return;
    }

    // For importers, check credit limit
    if (user?.role === 'importer') {
      const importValue = currentImportValue;
      const downPaymentPercent = approvedCredit.finalDownPayment || 30;
      const financedAmount = importValue - (importValue * downPaymentPercent / 100);
      const availableCredit = creditUsage?.available || 0;

      if (financedAmount > availableCredit) {
        toast({
          title: "Limite de crédito insuficiente",
          description: "O valor a financiar excede seu crédito disponível.",
          variant: "destructive",
        });
        return;
      }

      // Show terms confirmation modal for importers
      setShowTermsModal(true);
    } else {
      // For admins, create import directly
      handleConfirmImport();
    }
  };

  const handleConfirmImport = () => {
    const data = form.getValues();
    
    try {
      const cargoType = form.watch("cargoType");
      
      // Prepare products array based on cargo type
      let productsArray;
      let finalTotalValue;
      
      if (cargoType === "LCL") {
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
        productsArray = data.products || [];
        finalTotalValue = data.totalValue || "";
      }
      
      // Prepare final submission data with credit information
      const submissionData = {
        importName: data.importName,
        cargoType: data.cargoType,
        creditApplicationId: approvedCredit?.id,
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
      
      createImportMutation.mutate(submissionData);
      setShowTermsModal(false);
    } catch (error) {
      console.error("Error in handleConfirmImport:", error);
      toast({
        title: "Erro de validação",
        description: "Por favor, verifique os campos obrigatórios.",
        variant: "destructive",
      });
    }
  };

  const suppliers = Array.isArray(suppliersQuery.data) ? suppliersQuery.data : [];

  const addProduct = () => {
    setProducts([...products, {
      name: "",
      description: "",
      hsCode: "",
      quantity: 1,
      unitPrice: "",
      totalValue: "",
      supplierId: 0
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updatedProducts = [...products];
    (updatedProducts[index] as any)[field] = value;
    
    // Auto-calculate total value if quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(updatedProducts[index].quantity.toString()) || 0;
      const unitPrice = parseFloat(updatedProducts[index].unitPrice) || 0;
      updatedProducts[index].totalValue = (quantity * unitPrice).toString();
    }
    
    setProducts(updatedProducts);
  };

  // Redirect non-importers for now (can be expanded later)
  if (user && user.role !== 'importer' && user.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Apenas importadores podem criar novas importações.
            </p>
            <Button onClick={() => setLocation('/imports')}>
              Voltar para Importações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Formulário de Nova Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Informações Básicas
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="importName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Importação *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Importação Eletrônicos Q4 2024" {...field} />
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
                                <SelectValue placeholder="Selecione o tipo de carga" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FCL">FCL - Container Completo</SelectItem>
                              <SelectItem value="LCL">LCL - Carga Fracionada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Products Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      Produtos
                    </h3>
                    
                    {form.watch("cargoType") === "LCL" ? (
                      <div className="space-y-4">
                        {products.map((product, index) => (
                          <Card key={index} className="border-dashed">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium">Produto {index + 1}</h4>
                                {products.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeProduct(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Nome do Produto *</Label>
                                  <Input
                                    placeholder="Ex: Smartphone XYZ"
                                    value={product.name}
                                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Fornecedor</Label>
                                  <Select 
                                    value={product.supplierId?.toString()} 
                                    onValueChange={(value) => updateProduct(index, 'supplierId', parseInt(value))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um fornecedor" />
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
                                
                                <div>
                                  <Label>Quantidade *</Label>
                                  <Input
                                    type="number"
                                    placeholder="1000"
                                    value={product.quantity}
                                    onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Preço Unitário (USD) *</Label>
                                  <Input
                                    placeholder="15.50"
                                    value={product.unitPrice}
                                    onChange={(e) => updateProduct(index, 'unitPrice', e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Código HS</Label>
                                  <Input
                                    placeholder="8517.12.00"
                                    value={product.hsCode}
                                    onChange={(e) => updateProduct(index, 'hsCode', e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Valor Total (USD) *</Label>
                                  <Input
                                    placeholder="15500.00"
                                    value={product.totalValue}
                                    onChange={(e) => updateProduct(index, 'totalValue', e.target.value)}
                                    className="bg-gray-50"
                                  />
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <Label>Descrição</Label>
                                <Textarea
                                  placeholder="Descrição detalhada do produto..."
                                  value={product.description}
                                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                                  rows={2}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addProduct}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Produto
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="products.0.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Produto *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Eletrônicos Diversos" {...field} />
                              </FormControl>
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
                        
                        <FormField
                          control={form.control}
                          name="products.0.description"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Descrição do Produto</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Descrição detalhada..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="products.0.quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="1000" {...field} />
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
                                <Input placeholder="50000.00" {...field} />
                              </FormControl>
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
                        name="incoterms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Incoterms</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="FOB">FOB - Free On Board</SelectItem>
                                <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                                <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                                <SelectItem value="DDU">DDU - Delivered Duty Unpaid</SelectItem>
                                <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-6">
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
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financial Preview (only for importers) */}
        {user?.role === 'importer' && approvedCredit && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ImportFinancialPreview
                importValue={currentImportValue}
                creditApplication={approvedCredit}
                creditUsage={creditUsage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Terms Confirmation Modal (only for importers) */}
      {user?.role === 'importer' && (
        <ImportTermsConfirmation
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onConfirm={handleConfirmImport}
          importData={{
            value: currentImportValue,
            cargoType: form.watch("cargoType"),
            products: form.watch("cargoType") === "LCL" ? products : [form.getValues()]
          }}
          financialData={{
            fobValue: currentImportValue,
            downPayment: currentImportValue * ((approvedCredit?.finalDownPayment || 30) / 100),
            downPaymentPercent: approvedCredit?.finalDownPayment || 30,
            financedAmount: currentImportValue - (currentImportValue * ((approvedCredit?.finalDownPayment || 30) / 100)),
            adminFee: (currentImportValue - (currentImportValue * ((approvedCredit?.finalDownPayment || 30) / 100))) * (parseFloat(approvedCredit?.adminFee || '0') / 100),
            adminFeePercent: parseFloat(approvedCredit?.adminFee || '0'),
            totalAmount: currentImportValue + ((currentImportValue - (currentImportValue * ((approvedCredit?.finalDownPayment || 30) / 100))) * (parseFloat(approvedCredit?.adminFee || '0') / 100)),
            installmentAmount: (currentImportValue - (currentImportValue * ((approvedCredit?.finalDownPayment || 30) / 100))) / ((approvedCredit?.finalApprovedTerms || '30').split(',').length),
            paymentTerms: (approvedCredit?.finalApprovedTerms || '30').split(',').map((term: string) => parseInt(term.trim())),
            availableCredit: creditUsage?.available || 0,
            exceedsLimit: (currentImportValue - (currentImportValue * ((approvedCredit?.finalDownPayment || 30) / 100))) > (creditUsage?.available || 0)
          }}
          isLoading={createImportMutation.isPending}
        />
      )}
    </div>
  );
}