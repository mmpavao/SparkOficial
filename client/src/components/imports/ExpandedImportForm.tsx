import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Package, Truck, Ship, Plane, Calculator, FileText, DollarSign, User, Building2, Calendar, Anchor } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProductManager } from "./ProductManager";
import { CostCalculationSystem } from "./CostCalculationSystem";
import { z } from "zod";
import { useTranslation } from "react-i18next";

// Expanded import form schema including customs broker fields
const expandedImportFormSchema = z.object({
  // Basic fields (existing)
  creditApplicationId: z.number().optional(),
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
  customsBrokerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  customsBrokerId: z.number().optional(),
  customsBrokerStatus: z.enum(["pending", "assigned", "processing", "completed"]).default("pending"),
  customsProcessingNotes: z.string().optional(),
  paymentMethod: z.enum(['credit', 'own_funds']).default('credit'),
  
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
    quantity: z.coerce.number().min(1, "Quantidade deve ser maior que zero"),
    unitPrice: z.coerce.number().min(0, "Preço unitário deve ser maior ou igual a zero"),
    totalValue: z.coerce.number().min(0),
    supplierId: z.number().optional()
  }).transform((data) => ({
    ...data,
    quantity: Number(data.quantity),
    unitPrice: Number(data.unitPrice),
    totalValue: Number(data.totalValue)
  }))).optional(),
  
  notes: z.string().optional()
}).refine((data) => {
  // Se paymentMethod for 'credit', creditApplicationId é obrigatório
  if (data.paymentMethod === 'credit') {
    return data.creditApplicationId !== undefined && data.creditApplicationId > 0;
  }
  // Se for 'own_funds', creditApplicationId não é necessário
  return true;
}, {
  message: "Aplicação de crédito é obrigatória quando usar créditos aprovados",
  path: ["creditApplicationId"]
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("basic");
  const [customsBrokerInfo, setCustomsBrokerInfo] = useState<{
    valid: boolean;
    customsBroker?: any;
    message?: string;
  } | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  
  // Definir a ordem das abas
  const tabOrder = ["basic", "products", "shipping", "customs", "documentation", "costs"];
  const currentTabIndex = tabOrder.indexOf(activeTab);
  const isLastTab = currentTabIndex === tabOrder.length - 1;
  
  const goToNextTab = () => {
    if (currentTabIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentTabIndex + 1]);
    }
  };
  
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

  // Function to verify customs broker email
  const verifyCustomsBrokerEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      setCustomsBrokerInfo(null);
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const response = await fetch(`/api/customs-broker/verify-email/${encodeURIComponent(email)}`);
      const result = await response.json();
      
      setCustomsBrokerInfo(result);
      
      if (result.valid && result.customsBroker) {
        // Set the customs broker ID in the form
        form.setValue('customsBrokerId', result.customsBroker.id);
        form.setValue('customsBrokerStatus', 'assigned');
      } else {
        form.setValue('customsBrokerId', undefined);
        form.setValue('customsBrokerStatus', 'pending');
      }
    } catch (error) {
      console.error('Error verifying customs broker email:', error);
      setCustomsBrokerInfo({
        valid: false,
        message: t('forms.errorVerifyingEmail')
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

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
      creditApplicationId: initialData?.creditApplicationId,
      supplierId: initialData?.supplierId,
      paymentMethod: initialData?.paymentMethod || 'own_funds',
      customsBrokerEmail: initialData?.customsBrokerEmail || "",
      customsBrokerId: initialData?.customsBrokerId,
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
      // Use dedicated operational imports API for own funds
      const baseUrl = data.paymentMethod === 'own_funds' ? '/api/imports/operational' : '/api/imports';
      const url = isEditing && initialData && 'id' in initialData 
        ? `${baseUrl}/${initialData.id}` 
        : baseUrl;
      const method = isEditing ? 'PUT' : 'POST';
      return apiRequest(url, method, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      toast({
        title: t('common.success'),
        description: isEditing ? t('imports.importUpdatedSuccess') : t('imports.importCreatedSuccess')
      });
      setLocation('/imports');
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('imports.saveError'),
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ExpandedImportFormData) => {
    // Calculate total value for LCL based on products
    if (cargoType === 'LCL' && data.products && data.products.length > 0) {
      const calculatedTotal = data.products.reduce((sum, product) => 
        sum + (Number(product.quantity) * Number(product.unitPrice)), 0
      );
      data.totalValue = calculatedTotal.toString();
    }

    // Se for recurso próprio, garantir que creditApplicationId seja undefined
    if (data.paymentMethod === 'own_funds') {
      data.creditApplicationId = undefined;
    }

    createImportMutation.mutate(data);
  };

  const transportOptions = [
    { value: "maritimo", label: t('imports.maritime'), icon: Ship },
    { value: "aereo", label: t('imports.air'), icon: Plane },
    { value: "terrestre", label: t('imports.land'), icon: Truck }
  ];

  const statusOptions = [
    { value: "planejamento", label: t('status.planning') },
    { value: "producao", label: t('imports.production') },
    { value: "entregue_agente", label: t('reports.deliveredAgent') },
    { value: "transporte_maritimo", label: t('reports.maritimeTransport') },
    { value: "transporte_aereo", label: t('imports.airTransport') },
    { value: "desembaraco", label: t('reports.clearance') },
    { value: "transporte_nacional", label: t('reports.nationalTransport') },
    { value: "concluido", label: t('status.completed') }
  ];

  const incotermOptions = [
    { value: "FOB", label: t('incoterms.fob') },
    { value: "CIF", label: t('incoterms.cif') },
    { value: "EXW", label: t('incoterms.exw') }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? t('imports.editImport') : t('imports.newImport')}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? t('imports.updateImportData') : t('imports.fillDataToCreateOperationalImport')}
          </p>
        </div>
        
        <Button variant="outline" onClick={() => setLocation('/imports')}>
          {t('common.back')}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('imports.basic')}
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('nav.products')}
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Ship className="h-4 w-4" />
                {t('imports.transport')}
              </TabsTrigger>
              <TabsTrigger value="customs" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('imports.customsBroker')}
              </TabsTrigger>
              <TabsTrigger value="documentation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('imports.documents')}
              </TabsTrigger>
              <TabsTrigger value="costs" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('imports.costs')}
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t('imports.basicInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="importName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('imports.importName')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('imports.importNameExample')} />
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
                        <FormLabel>{t('imports.importCode')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('imports.importCodeExample')} />
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
                        <FormLabel>{t('imports.paymentMethod')} *</FormLabel>
                        <Select onValueChange={(value) => {
                          if (value === "own_funds") {
                            field.onChange(undefined);
                            form.setValue("paymentMethod", "own_funds");
                          } else {
                            field.onChange(parseInt(value));
                            form.setValue("paymentMethod", "credit");
                          }
                        }} value={field.value ? field.value.toString() : form.watch("paymentMethod") === "own_funds" ? "own_funds" : undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('imports.selectPaymentMethod')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="own_funds">
                              <div className="flex flex-col">
                                <span className="font-medium">💰 {t('imports.ownFunds')}</span>
                                <span className="text-xs text-gray-500">
                                  {t('imports.ownFundsDesc')}
                                </span>
                              </div>
                            </SelectItem>
                            {creditApplications.length > 0 && (
                              <>
                                <SelectItem value="credits-header" disabled>
                                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                                    {t('imports.approvedCredits')}
                                  </div>
                                </SelectItem>
                                {creditApplications.map((app: any, index: number) => (
                                  <SelectItem key={app.id || index} value={app.id?.toString() || `credit-app-${index}`}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        🏦 US$ {parseInt(app.finalCreditLimit || app.requestedAmount || '0').toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {t('imports.terms')}: {app.finalApprovedTerms || 'N/A'} {t('common.days')}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </>
                            )}
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
                        <FormLabel>{t('imports.supplier')}</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('imports.selectSupplier')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(suppliers) && suppliers.map((supplier: any, index: number) => (
                              <SelectItem key={supplier.id || index} value={supplier.id?.toString() || `supplier-${index}`}>
                                {supplier.companyName || t('imports.supplierWithoutName')}
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
                        <FormLabel>{t('imports.cargoType')} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('imports.selectCargoType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FCL">{t('cargo.fcl')}</SelectItem>
                            <SelectItem value="LCL">{t('cargo.lcl')}</SelectItem>
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
                        <FormLabel>{t('imports.shippingMethod')} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('imports.selectMethod')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transportOptions.map((option, index) => (
                              <SelectItem key={option.value || index} value={option.value || `transport-${index}`}>
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
                        <FormLabel>{t('imports.incoterms')} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('imports.selectIncoterms')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incotermOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value || `incoterm-${option.label}`}>
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
                        <FormLabel>{t('imports.totalValue')} *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t('imports.autoCalculatedProducts')} 
                            type="number" 
                            disabled={true}
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          {t('imports.autoCalculatedDesc')}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t('imports.productManagement')}
                  </CardTitle>
                  <CardDescription>
                    {t('imports.productManagementDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductManager 
                    products={(form.watch("products") as any[]) || []}
                    suppliers={suppliers || []}
                    onProductsChange={(products: any[]) => {
                      // Converter strings para números antes de salvar
                      const convertedProducts = products.map(product => ({
                        ...product,
                        quantity: Number(product.quantity || 0),
                        unitPrice: Number(product.unitPrice || 0),
                        totalValue: Number(product.totalValue || 0)
                      }));
                      
                      form.setValue("products", convertedProducts);
                      // Calcula automaticamente o valor total
                      const totalValue = convertedProducts.reduce((sum, product) => 
                        sum + (Number(product.quantity) * Number(product.unitPrice)), 0
                      );
                      form.setValue("totalValue", totalValue.toString());
                    }}
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
                    {t('imports.shippingInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('imports.portOfLoading')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('imports.portOfLoadingExample')} />
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
                        <FormLabel>{t('imports.portOfDischarge')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('imports.portOfDischargeExample')} />
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
                        <FormLabel>{t('imports.specificLoadingPort')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('imports.specificLoadingPortExample')} />
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
                        <FormLabel>{t('imports.specificDischargePort')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('imports.specificDischargePortExample')} />
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
                        <FormLabel>{t('imports.finalDestination')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('imports.finalDestinationExample')} />
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
                    name="customsBrokerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Despachante</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="Digite o email do despachante"
                            onBlur={(e) => {
                              field.onBlur();
                              verifyCustomsBrokerEmail(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {isVerifyingEmail && (
                          <div className="text-sm text-blue-600">
                            Verificando email...
                          </div>
                        )}
                        {customsBrokerInfo && (
                          <div className={`text-sm ${customsBrokerInfo.valid ? 'text-green-600' : 'text-red-600'}`}>
                            {customsBrokerInfo.valid ? (
                              <div className="space-y-1">
                                <div className="font-medium">✓ Despachante encontrado:</div>
                                <div>{customsBrokerInfo.customsBroker?.fullName}</div>
                                <div className="text-gray-600">{customsBrokerInfo.customsBroker?.companyName}</div>
                              </div>
                            ) : (
                              <div>⚠ {customsBrokerInfo.message}</div>
                            )}
                          </div>
                        )}
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
              <CostCalculationSystem 
                products={(form.watch("products") || []) as any[]}
                suppliers={Array.isArray(suppliers) ? suppliers : []}
                incoterm={form.watch("incoterm") || "FOB"}
                onCostsChange={(costs) => {
                  // Aqui você pode salvar os custos no formulário se necessário
                  console.log("Costs updated:", costs);
                }}
              />

              {/* Observações Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Observações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações sobre a Importação</FormLabel>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setLocation('/imports')}>
              Cancelar
            </Button>
            
            <div className="flex space-x-4">
              {!isLastTab ? (
                <Button 
                  type="button" 
                  onClick={goToNextTab}
                  className="min-w-32"
                >
                  Próximo
                </Button>
              ) : (
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
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}