import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Supplier } from "@shared/schema";
import ProductManager from "@/components/imports/ProductManager";
import ImportFinancialPreview from "@/components/imports/ImportFinancialPreview";
import TermsConfirmation from "@/components/imports/TermsConfirmation";
import { Package, Ship, Plane, AlertTriangle, CheckCircle } from "lucide-react";

const importFormSchema = z.object({
  importName: z.string().min(1, "Nome da importação é obrigatório"),
  cargoType: z.enum(["FCL", "LCL"], { required_error: "Tipo de carga é obrigatório" }),
  totalValue: z.number().min(1, "Valor deve ser maior que zero"),
  currency: z.enum(["USD", "EUR", "CNY"], { required_error: "Moeda é obrigatória" }),
  incoterms: z.enum(["FOB", "CIF", "EXW"], { required_error: "Incoterms é obrigatório" }),
  shippingMethod: z.enum(["sea", "air"], { required_error: "Método de envio é obrigatório" }),
  containerType: z.string().optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  supplierId: z.number().optional(),
  estimatedDelivery: z.string().optional(),
  notes: z.string().optional(),
});

type ImportFormData = z.infer<typeof importFormSchema>;

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  supplierId?: number;
  description?: string;
}

export default function ImportForm() {
  const [, setLocation] = useLocation();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const queryClient = useQueryClient();

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      currency: "USD",
      incoterms: "FOB",
      shippingMethod: "sea",
      cargoType: "FCL",
    },
  });

  const cargoType = form.watch("cargoType");
  const totalValue = form.watch("totalValue") || 0;
  const currency = form.watch("currency");
  const incoterms = form.watch("incoterms");

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Fetch user credit information
  const { data: creditData } = useQuery({
    queryKey: ["/api/user/available-credit"],
  });

  // Fetch admin fee for calculations
  const { data: adminFeeData } = useQuery({
    queryKey: ["/api/user/admin-fee"],
  });

  // Create import mutation
  const createImportMutation = useMutation({
    mutationFn: async (data: ImportFormData & { products?: Product[] }) => {
      return apiRequest("/api/imports", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setLocation("/imports");
    },
  });

  // Calculate total value for LCL from products
  const calculateTotalValue = () => {
    if (cargoType === "LCL") {
      return products.reduce((total, product) => total + (product.quantity * product.unitPrice), 0);
    }
    return totalValue;
  };

  // Financial calculations
  const currentTotalValue = calculateTotalValue();
  const adminFeeRate = (adminFeeData as any)?.feePercentage ? parseFloat((adminFeeData as any).feePercentage) : 2.5;
  const adminFeeAmount = (currentTotalValue * adminFeeRate) / 100;
  const totalWithFees = currentTotalValue + adminFeeAmount;
  const downPaymentAmount = (totalWithFees * 30) / 100; // 30% down payment
  const financedAmount = totalWithFees - downPaymentAmount;
  
  // Payment terms (from credit data)
  const paymentTerms = (creditData as any)?.paymentTerms || "30,60,90,120";
  const termDays = paymentTerms.split(",").map((t: string) => parseInt(t.trim()));
  const installmentAmount = termDays.length > 0 ? financedAmount / termDays.length : 0;

  const onSubmit = (data: ImportFormData) => {
    const finalValue = cargoType === "LCL" ? calculateTotalValue() : data.totalValue;
    
    const importData = {
      ...data,
      totalValue: finalValue,
      products: cargoType === "LCL" ? products : undefined,
      status: "planejamento",
    };

    setShowTermsModal(true);
    
    // Store form data for terms confirmation
    (window as any).pendingImportData = importData;
  };

  const handleTermsConfirm = () => {
    const importData = (window as any).pendingImportData;
    createImportMutation.mutate(importData);
    setShowTermsModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Importação</h1>
        <p className="text-muted-foreground">
          Crie uma nova importação e gerencie todos os detalhes do processo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="importName">Nome da Importação</Label>
                    <Input
                      id="importName"
                      {...form.register("importName")}
                      placeholder="Ex: Eletrônicos Q1 2025"
                    />
                    {form.formState.errors.importName && (
                      <p className="text-sm text-red-600">{form.formState.errors.importName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Carga</Label>
                    <Select onValueChange={(value) => form.setValue("cargoType", value as "FCL" | "LCL")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FCL">FCL - Container Completo</SelectItem>
                        <SelectItem value="LCL">LCL - Carga Consolidada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <Select onValueChange={(value) => form.setValue("currency", value as "USD" | "EUR" | "CNY")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="CNY">CNY - Yuan Chinês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Incoterms</Label>
                    <Select onValueChange={(value) => form.setValue("incoterms", value as "FOB" | "CIF" | "EXW")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                        <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                        <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Método de Envio</Label>
                    <Select onValueChange={(value) => form.setValue("shippingMethod", value as "sea" | "air")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Fornecedor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Fornecedor Principal</Label>
                  <Select onValueChange={(value) => form.setValue("supplierId", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.companyName} - {supplier.city}, {supplier.state || supplier.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary Card */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Crédito Disponível:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        US$ {(creditData as any)?.available?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Valor da Importação:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        US$ {currentTotalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Taxa Admin ({adminFeeRate}%):</span>
                      <span className="text-sm font-medium text-gray-700">
                        US$ {adminFeeAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Entrada (30%):</span>
                      <span className="text-lg font-semibold text-blue-600">
                        US$ {downPaymentAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Saldo Financiado:</span>
                      <span className="text-sm font-medium text-gray-700">
                        US$ {financedAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total da Importação:</span>
                      <span className="text-xl font-bold text-gray-900">
                        US$ {totalWithFees.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {termDays.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Parcelas ({termDays.length}x):
                      </span>
                      <span className="text-lg font-semibold text-purple-600">
                        US$ {installmentAmount.toLocaleString()} cada
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {termDays.map((days: number, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {days} dias
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentTotalValue > ((creditData as any)?.available || 0) && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Valor excede o crédito disponível. Crédito insuficiente para esta importação.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Products Section */}
            {cargoType === "LCL" ? (
              <ProductManager
                products={products}
                onProductsChange={setProducts}
                suppliers={suppliers}
                currency={currency}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Valor da Carga</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="totalValue">Valor Total ({currency})</Label>
                    <Input
                      id="totalValue"
                      type="number"
                      step="0.01"
                      {...form.register("totalValue", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    {form.formState.errors.totalValue && (
                      <p className="text-sm text-red-600">{form.formState.errors.totalValue.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Container Information (FCL only) */}
            {cargoType === "FCL" && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Container</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="containerType">Tipo de Container</Label>
                      <Select onValueChange={(value) => form.setValue("containerType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20ft">20ft Standard</SelectItem>
                          <SelectItem value="40ft">40ft Standard</SelectItem>
                          <SelectItem value="40ft-hc">40ft High Cube</SelectItem>
                          <SelectItem value="45ft">45ft High Cube</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="containerNumber">Número do Container</Label>
                      <Input
                        id="containerNumber"
                        {...form.register("containerNumber")}
                        placeholder="Ex: TCLU1234567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sealNumber">Número do Lacre</Label>
                      <Input
                        id="sealNumber"
                        {...form.register("sealNumber")}
                        placeholder="Ex: SL123456"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedDelivery">Data Estimada de Entrega</Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    {...form.register("estimatedDelivery")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Observações adicionais sobre a importação..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/imports")}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createImportMutation.isPending || (cargoType === "LCL" && products.length === 0)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
              </Button>
            </div>
          </form>
        </div>

        {/* Financial Preview Sidebar */}
        <div className="space-y-6">
          <ImportFinancialPreview
            fobValue={currentTotalValue}
            currency={currency}
            incoterms={incoterms}
            showCreditCheck={true}
          />

          {/* Quick Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tipo:</span>
                <Badge variant="outline">{cargoType}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envio:</span>
                <span className="font-medium">
                  {form.watch("shippingMethod") === "sea" ? "Marítimo" : "Aéreo"}
                </span>
              </div>
              {cargoType === "LCL" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produtos:</span>
                  <span className="font-medium">{products.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terms Confirmation Modal */}
      <TermsConfirmation
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onConfirm={handleTermsConfirm}
        importValue={currentTotalValue}
        currency={currency}
      />
    </div>
  );
}