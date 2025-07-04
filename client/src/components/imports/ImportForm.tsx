import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Package, Truck, Ship, Plane } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProductManager } from "./ProductManager";
import { ImportCostCalculator } from "./ImportCostCalculator";
import { z } from "zod";

// Import form schema based on actual fields needed
const importFormSchema = z.object({
  creditApplicationId: z.number().min(1, "Aplicação de crédito é obrigatória"),
  importName: z.string().min(1, "Nome da importação é obrigatório"),
  importCode: z.string().optional(),
  cargoType: z.enum(["FCL", "LCL"]),
  transportMethod: z.enum(["maritimo", "aereo", "terrestre"]),
  origin: z.string().min(1, "Origem é obrigatória"),
  destination: z.string().min(1, "Destino é obrigatório"),
  destinationState: z.string().optional(),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  currency: z.string().default("USD"),
  status: z.string().default("planejamento"),
  supplierId: z.number().optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  estimatedDeparture: z.string().optional(),
  estimatedArrival: z.string().optional(),
  notes: z.string().optional(),
  products: z.array(z.object({
    productName: z.string().min(1, "Nome do produto é obrigatório"),
    quantity: z.number().min(1, "Quantidade deve ser maior que zero"),
    unitPrice: z.number().min(0, "Preço unitário deve ser maior ou igual a zero"),
    totalValue: z.number().min(0),
    supplierId: z.number().optional()
  })).optional()
});

type ImportFormData = z.infer<typeof importFormSchema>;

interface ImportFormProps {
  initialData?: Partial<ImportFormData>;
  isEditing?: boolean;
}

export function ImportForm({ initialData, isEditing = false }: ImportFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cargoType, setCargoType] = useState<'FCL' | 'LCL'>(initialData?.cargoType || 'FCL');

  // Get suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    enabled: true
  });

  // Get credit applications for dropdown - only approved ones
  const { data: allCreditApplications = [] } = useQuery({
    queryKey: ['/api/credit/applications'],
    enabled: true
  });

  // Filter only approved credit applications
  const creditApplications = allCreditApplications.filter((app: any) => 
    app.financialStatus === 'approved' && 
    (app.adminStatus === 'admin_finalized' || app.adminStatus === 'finalized')
  );

  // Get selected credit application for cost calculation
  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      importName: initialData?.importName || "",
      importCode: initialData?.importCode || "",
      cargoType: initialData?.cargoType || "FCL",
      transportMethod: initialData?.transportMethod || "maritimo",
      origin: initialData?.origin || "",
      destination: initialData?.destination || "Brasil",
      totalValue: initialData?.totalValue || "0",
      currency: initialData?.currency || "USD",
      status: initialData?.status || "planejamento",
      creditApplicationId: initialData?.creditApplicationId || undefined,
      supplierId: initialData?.supplierId || undefined,
      containerNumber: initialData?.containerNumber || "",
      sealNumber: initialData?.sealNumber || "",
      estimatedDeparture: initialData?.estimatedDeparture || "",
      estimatedArrival: initialData?.estimatedArrival || "",
      notes: initialData?.notes || "",
      products: initialData?.products || []
    }
  });

  // Get selected credit application for cost calculation
  const selectedCreditAppId = form.watch("creditApplicationId");
  const selectedCreditApp = Array.isArray(creditApplications) 
    ? creditApplications.find(app => app.id === selectedCreditAppId)
    : null;

  // Get admin fee for selected credit application
  const { data: adminFeeData } = useQuery({
    queryKey: ['/api/user/admin-fee'],
    enabled: !!selectedCreditAppId
  });

  // Watch totalValue for real-time cost calculation
  const totalValue = parseFloat(form.watch("totalValue") || "0");

  const createImportMutation = useMutation({
    mutationFn: async (data: ImportFormData) => {
      const url = isEditing ? `/api/imports/${initialData?.id}` : '/api/imports';
      const method = isEditing ? 'PUT' : 'POST';
      return apiRequest(url, method, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      toast({
        title: "Sucesso",
        description: isEditing ? "Importação atualizada com sucesso" : "Importação criada com sucesso"
      });
      setLocation('/imports');
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar importação",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ImportFormData) => {
    // Calculate total value for LCL based on products
    if (cargoType === 'LCL' && data.products && data.products.length > 0) {
      const calculatedTotal = data.products.reduce((sum, product) => 
        sum + (product.quantity * product.unitPrice), 0
      );
      data.totalValue = calculatedTotal.toString();
    }

    createImportMutation.mutate(data);
  };

  const handleCargoTypeChange = (newCargoType: 'FCL' | 'LCL') => {
    setCargoType(newCargoType);
    form.setValue('cargoType', newCargoType);
    
    // Clear container fields for LCL
    if (newCargoType === 'LCL') {
      form.setValue('containerNumber', '');
      form.setValue('sealNumber', '');
    }
  };

  const transportOptions = [
    { value: "maritimo", label: "Marítimo", icon: Ship },
    { value: "aereo", label: "Aéreo", icon: Plane },
    { value: "terrestre", label: "Terrestre", icon: Truck }
  ];

  const statusOptions = [
    { value: "planejamento", label: "Planejamento" },
    { value: "producao", label: "Produção" },
    { value: "entregue_agente", label: "Entregue ao Agente" },
    { value: "transporte_maritimo", label: "Transporte Marítimo" },
    { value: "transporte_aereo", label: "Transporte Aéreo" },
    { value: "desembaraco", label: "Desembaraço" },
    { value: "transporte_nacional", label: "Transporte Nacional" },
    { value: "concluido", label: "Concluído" }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Importação' : 'Nova Importação'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Atualize os dados da importação' : 'Preencha os dados para criar uma nova importação'}
          </p>
        </div>
        
        <Button variant="outline" onClick={() => setLocation('/imports')}>
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="importName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Importação *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Importação Equipamentos Q1 2024" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="importCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código da Importação</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: IMP-2024-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditApplicationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicação de Crédito *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma aplicação de crédito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creditApplications.map((app: any) => (
                          <SelectItem key={app.id} value={app.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                US$ {parseInt(app.finalCreditLimit || app.requestedAmount).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">
                                Termos: {app.finalApprovedTerms || 'N/A'} dias
                              </span>
                            </div>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Cargo Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Carga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    cargoType === 'FCL' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCargoTypeChange('FCL')}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">FCL (Full Container Load)</h3>
                      <p className="text-sm text-gray-600">Container completo</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    cargoType === 'LCL' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCargoTypeChange('LCL')}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold">LCL (Less than Container Load)</h3>
                      <p className="text-sm text-gray-600">Carga consolidada</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transport and Location */}
          <Card>
            <CardHeader>
              <CardTitle>Transporte e Localização</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transportMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Transporte *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transportOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          );
                        })}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="CNY">CNY - Yuan Chinês</SelectItem>
                        <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
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
                    <FormLabel>Origem *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Xangai, China" />
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
                    <FormLabel>Destino *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Santos, Brasil" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedDeparture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Estimada de Partida</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedArrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Estimada de Chegada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Container Information (FCL only) */}
          {cargoType === 'FCL' && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Container</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field} 
                          placeholder="0.00" 
                        />
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
              </CardContent>
            </Card>
          )}

          {/* Products (LCL only) */}
          {cargoType === 'LCL' && (
            <Card>
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductManager
                  products={form.watch('products') || []}
                  suppliers={suppliers}
                  onProductsChange={(products) => form.setValue('products', products)}
                />
              </CardContent>
            </Card>
          )}

          {/* Notes */}
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
                    <FormLabel>Notas Adicionais</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Informações adicionais sobre a importação..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createImportMutation.isPending 
                ? (isEditing ? 'Atualizando...' : 'Criando...') 
                : (isEditing ? 'Atualizar Importação' : 'Criar Importação')
              }
            </Button>
          </div>
            </form>
          </Form>
        </div>

        {/* Prévia Financeira */}
        <div className="lg:col-span-1">
          {selectedCreditApp && totalValue > 0 && (
            <ImportCostCalculator
              totalValue={totalValue}
              creditApplication={{
                adminFee: adminFeeData?.feePercentage || 10,
                finalCreditLimit: selectedCreditApp.finalCreditLimit || selectedCreditApp.requestedAmount,
                finalApprovedTerms: selectedCreditApp.finalApprovedTerms ? selectedCreditApp.finalApprovedTerms.split(',') : ['60', '90', '120'],
                finalDownPayment: 30
              }}
            />
          )}
          {!selectedCreditApp && (
            <Card className="bg-gray-50 border-gray-200 sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Prévia Financeira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Selecione uma aplicação de crédito para ver a prévia financeira
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}