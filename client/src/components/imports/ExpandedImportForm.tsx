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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Package, Truck, Ship, Plane, Calculator, FileText, DollarSign, User, Building2, Calendar, Anchor } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProductManager } from "./ProductManager";
import { ImportCostCalculator } from "./ImportCostCalculator";
import { z } from "zod";

// Expanded import form schema including customs broker fields
const expandedImportFormSchema = z.object({
  // Basic fields (existing)
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
  incoterms: z.enum(["FOB", "CIF", "EXW"]),
  
  // Container info (existing) 
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  
  // Enhanced shipping info (new)
  shippingLine: z.string().optional(),
  vesselName: z.string().optional(),
  voyageNumber: z.string().optional(),
  masterBillOfLading: z.string().optional(),
  houseBillOfLading: z.string().optional(),
  
  // Port details (enhanced)
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  finalDestination: z.string().optional(),
  terminalLocation: z.string().optional(),
  
  // Customs broker (new)
  customsBrokerId: z.number().optional(),
  customsBrokerStatus: z.enum(["pending", "assigned", "processing", "completed"]).default("pending"),
  customsProcessingNotes: z.string().optional(),
  
  // Customs documentation (new)
  importDeclarationNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  exchangeRate: z.string().optional(),
  
  // Insurance (new)
  insuranceValue: z.string().optional(),
  insuranceCompany: z.string().optional(),
  riskCategory: z.enum(["low", "normal", "high"]).default("normal"),
  
  // Enhanced dates
  estimatedDeparture: z.string().optional(),
  estimatedArrival: z.string().optional(),
  
  // Products
  products: z.array(z.object({
    productName: z.string().min(1, "Nome do produto é obrigatório"),
    quantity: z.number().min(1, "Quantidade deve ser maior que zero"),
    unitPrice: z.number().min(0, "Preço unitário deve ser maior ou igual a zero"),
    totalValue: z.number().min(0),
    supplierId: z.number().optional()
  })).optional(),
  
  notes: z.string().optional()
});

type ExpandedImportFormData = z.infer<typeof expandedImportFormSchema>;

interface ExpandedImportFormProps {
  initialData?: Partial<ExpandedImportFormData>;
  isEditing?: boolean;
}

export function ExpandedImportForm({ initialData, isEditing = false }: ExpandedImportFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  
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

  // Get customs brokers for dropdown
  const { data: customsBrokers = [] } = useQuery({
    queryKey: ['/api/customs-brokers'],
    enabled: true
  });

  // Filter only approved credit applications with type safety
  const creditApplications = Array.isArray(allCreditApplications) 
    ? allCreditApplications.filter((app: any) => 
        app.financialStatus === 'approved' && 
        (app.adminStatus === 'admin_finalized' || app.adminStatus === 'finalized')
      )
    : [];

  const form = useForm<ExpandedImportFormData>({
    resolver: zodResolver(expandedImportFormSchema),
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
      incoterms: initialData?.incoterms || "FOB",
      creditApplicationId: initialData?.creditApplicationId || undefined,
      supplierId: initialData?.supplierId || undefined,
      customsBrokerId: initialData?.customsBrokerId || undefined,
      customsBrokerStatus: initialData?.customsBrokerStatus || "pending",
      riskCategory: initialData?.riskCategory || "normal",
      containerNumber: initialData?.containerNumber || "",
      sealNumber: initialData?.sealNumber || "",
      estimatedDeparture: initialData?.estimatedDeparture || "",
      estimatedArrival: initialData?.estimatedArrival || "",
      notes: initialData?.notes || "",
      products: initialData?.products || []
    }
  });

  // Watch cargoType for conditional rendering
  const cargoType = form.watch("cargoType");
  
  // Watch totalValue for real-time cost calculation
  const totalValue = parseFloat(form.watch("totalValue") || "0");

  const createImportMutation = useMutation({
    mutationFn: async (data: ExpandedImportFormData) => {
      const url = isEditing && initialData && 'id' in initialData 
        ? `/api/imports/${initialData.id}` 
        : '/api/imports';
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

  const onSubmit = (data: ExpandedImportFormData) => {
    // Calculate total value for LCL based on products
    if (cargoType === 'LCL' && data.products && data.products.length > 0) {
      const calculatedTotal = data.products.reduce((sum, product) => 
        sum + (product.quantity * product.unitPrice), 0
      );
      data.totalValue = calculatedTotal.toString();
    }

    createImportMutation.mutate(data);
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

  const incotermOptions = [
    { value: "FOB", label: "FOB - Free on Board" },
    { value: "CIF", label: "CIF - Cost, Insurance & Freight" },
    { value: "EXW", label: "EXW - Ex Works" }
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
            {isEditing ? 'Atualize os dados da importação' : 'Preencha os dados para criar uma nova importação operacional'}
          </p>
        </div>
        
        <Button variant="outline" onClick={() => setLocation('/imports')}>
          Voltar
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Transporte
              </TabsTrigger>
              <TabsTrigger value="customs" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Despachante
              </TabsTrigger>
              <TabsTrigger value="documentation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="costs" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Custos
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
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
                            {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
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
                    name="cargoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Carga *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de carga" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FCL">FCL - Full Container Load</SelectItem>
                            <SelectItem value="LCL">LCL - Less than Container Load</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transportMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Transporte *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o método de transporte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transportOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
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
                    name="incoterms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterms *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione os incoterms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incotermOptions.map((option) => (
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

                  <FormField
                    control={form.control}
                    name="totalValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Anchor className="h-5 w-5" />
                    Informações de Transporte
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porto de Origem *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Shanghai, China" />
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
                        <FormLabel>Porto de Destino *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Santos, Brasil" />
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
                        <FormLabel>Porto de Embarque Específico</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Shanghai Port Terminal 1" />
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
                        <FormLabel>Porto de Desembarque Específico</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Santos Terminal 2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="finalDestination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino Final</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: São Paulo, SP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terminalLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terminal Específico</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Terminal Libra T37" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingLine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Companhia Marítima</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: COSCO, MSC, Maersk" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vesselName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Navio</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: COSCO SHIPPING UNIVERSE" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="voyageNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Viagem</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 024E/024W" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {cargoType === 'FCL' && (
                    <>
                      <FormField
                        control={form.control}
                        name="containerNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Container</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: TEMU1234567" />
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
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="estimatedDeparture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Estimada de Embarque</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
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
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customs Broker Tab */}
            <TabsContent value="customs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Despachante Aduaneiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customsBrokerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Despachante</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um despachante" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(customsBrokers) && customsBrokers.map((broker: any) => (
                              <SelectItem key={broker.id} value={broker.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{broker.companyName}</span>
                                  <span className="text-xs text-gray-500">
                                    {broker.specialization?.slice(0, 2).join(', ')}
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
                    name="customsBrokerStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status do Despachante</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="assigned">Designado</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria de Risco</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria de risco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baixo</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Alto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exchangeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Câmbio</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.0001" placeholder="Ex: 5.2345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="customsProcessingNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações do Desembaraço</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Observações, instruções especiais ou comentários do despachante"
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

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentação Aduaneira
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="masterBillOfLading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Master Bill of Lading</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: COSU1234567890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="houseBillOfLading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House Bill of Lading</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: ABC1234567890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="importDeclarationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da DI (Declaração de Importação)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 24123456789" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da LI (Licença de Importação)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: LI24123456" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Costs Tab */}
            <TabsContent value="costs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Custos e Seguro
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="insuranceValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Seguro</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="insuranceCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seguradora</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome da seguradora" />
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
                          <FormLabel>Observações Gerais</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Observações, instruções especiais ou comentários sobre a importação"
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductManager
                    products={form.watch("products") || []}
                    suppliers={Array.isArray(suppliers) ? suppliers : []}
                    onProductsChange={(products) => form.setValue("products", products)}
                  />
                </CardContent>
              </Card>

              {/* Cost Calculator */}
              <ImportCostCalculator 
                totalValue={totalValue}
              />
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setLocation('/imports')}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createImportMutation.isPending}
              className="min-w-32"
            >
              {createImportMutation.isPending 
                ? "Salvando..." 
                : isEditing 
                  ? "Atualizar" 
                  : "Criar Importação"
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}