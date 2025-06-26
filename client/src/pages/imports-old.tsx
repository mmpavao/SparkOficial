import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/I18nContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertImportSchema, type InsertImport } from "@shared/schema";
import AdminImportFilters from "@/components/AdminImportFilters";
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar,
  DollarSign,
  Ship,
  Plane,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Building,
  Box,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ImportsPage() {
  const [showNewImportForm, setShowNewImportForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [adminFilters, setAdminFilters] = useState({});
  const [products, setProducts] = useState([{
    name: "",
    description: "",
    hsCode: "",
    quantity: 1,
    unitPrice: "",
    totalValue: ""
  }]);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isAdmin } = useUserPermissions();
  const [, setLocation] = useLocation();

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
      containerType: "",
      containerNumber: "",
      sealNumber: "",
      status: "planning",
      currentStage: "estimativa"
    },
  });

  // API queries and mutations
  const { data: imports, isLoading } = useQuery({
    queryKey: isAdmin ? ["/api/admin/imports"] : ["/api/imports"],
  });

  const createImportMutation = useMutation({
    mutationFn: async (data: InsertImport) => {
      return apiRequest('/api/imports', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Importação criada!",
        description: "A nova importação foi criada com sucesso.",
      });
      form.reset();
      setProducts([{ name: "", description: "", hsCode: "", quantity: 1, unitPrice: "", totalValue: "" }]);
      setShowNewImportForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/imports"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateImportStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/imports/${id}`, 'PATCH', { status });
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado!",
        description: "O status da importação foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/imports"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate real metrics from API data
  const calculateMetrics = () => {
    if (!imports || !Array.isArray(imports)) {
      return {
        totalImports: 0,
        activeImports: 0,
        completedImports: 0,
        totalValue: 0,
        imports: []
      };
    }

    const importsArray = imports as any[];
    const totalImports = importsArray.length;
    const activeImports = importsArray.filter(imp => 
      ['ordered', 'shipped', 'customs'].includes(imp.status)
    ).length;
    const completedImports = importsArray.filter(imp => imp.status === 'delivered').length;
    const totalValue = importsArray.reduce((sum, imp) => sum + parseFloat(imp.totalValue || 0), 0);

    return {
      totalImports,
      activeImports,
      completedImports,
      totalValue,
      imports: importsArray
    };
  };

  const importData = calculateMetrics();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      delivered: { label: t.imports.status.delivered, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      customs: { label: t.imports.status.customs, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      in_transit: { label: t.imports.status.in_transit, icon: Ship, className: "bg-blue-100 text-blue-800" },
      ordered: { label: t.imports.status.ordered, icon: Package, className: "bg-purple-100 text-purple-800" },
      planning: { label: t.imports.status.planning, icon: Clock, className: "bg-gray-100 text-gray-800" },
      cancelled: { label: t.imports.status.cancelled, icon: AlertCircle, className: "bg-red-100 text-red-800" }
    };
    
    const config = statusMap[status as keyof typeof statusMap];
    if (!config) return <Badge variant="secondary">{status}</Badge>;
    
    const Icon = config.icon;
    return <Badge className={config.className}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "overdue":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const applyFilters = (importsArray: any[]) => {
    let filtered = [...importsArray];
    
    if (isAdmin && adminFilters) {
      const { search, status, supplier, minValue, maxValue } = adminFilters as any;
      
      if (search) {
        filtered = filtered.filter(imp => 
          imp.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
          imp.productDescription?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (status && status !== "all") {
        filtered = filtered.filter(imp => imp.status === status);
      }
      
      if (supplier) {
        filtered = filtered.filter(imp => 
          imp.supplierName?.toLowerCase().includes(supplier.toLowerCase())
        );
      }
      
      if (minValue) {
        filtered = filtered.filter(imp => parseFloat(imp.totalValue || 0) >= parseFloat(minValue));
      }
      
      if (maxValue) {
        filtered = filtered.filter(imp => parseFloat(imp.totalValue || 0) <= parseFloat(maxValue));
      }
    }

    return filtered;
  };

  const filteredImports = applyFilters(importData.imports);

  const onSubmit = (data: InsertImport) => {
    // Calculate total value from all products for LCL
    const totalProductValue = products.reduce((sum, product) => {
      return sum + (parseFloat(product.totalValue) || 0);
    }, 0);
    
    // Prepare submission data
    const submissionData = {
      ...data,
      products: form.watch("cargoType") === "LCL" ? products : [{
        name: data.productName,
        description: data.productDescription,
        hsCode: "",
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalValue: data.totalValue
      }],
      totalValue: form.watch("cargoType") === "LCL" ? totalProductValue.toString() : data.totalValue
    };
    
    createImportMutation.mutate(submissionData);
  };

  // Handle import actions
  const cancelImportMutation = useMutation({
    mutationFn: async (importId: number) => {
      return apiRequest(`/api/imports/${importId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Importação cancelada",
        description: "A importação foi cancelada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/imports"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (importId: number) => {
    setLocation(`/import-details/${importId}`);
  };

  const handleEditImport = (importId: number) => {
    setLocation(`/import-edit/${importId}`);
  };

  const handleCancelImport = (importId: number) => {
    if (confirm("Tem certeza que deseja cancelar esta importação?")) {
      cancelImportMutation.mutate(importId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando importações...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.imports.title}</h1>
          <p className="text-gray-600 mt-1">Gerencie suas importações da China</p>
        </div>
        <Button
          onClick={() => setLocation('/imports/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.imports.newImport}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Importações</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importData.totalImports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Importações Ativas</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importData.activeImports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importData.completedImports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${importData.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Filters */}
      {isAdmin && (
        <AdminImportFilters onFiltersChange={setAdminFilters} />
      )}

      {/* New Import Form */}
      {showNewImportForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nova Importação
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewImportForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
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
                              <Input placeholder="Ex: TCLU1234567" {...field} value={field.value || ""} />
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
                              <Input placeholder="Ex: 123456" {...field} value={field.value || ""} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                    onClick={() => setShowNewImportForm(false)}
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
      )}

      {/* Imports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Importações</span>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {filteredImports.length} importação{filteredImports.length !== 1 ? 'ões' : ''}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredImports.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma importação encontrada</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowNewImportForm(true)}
              >
                Criar primeira importação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredImports.map((importItem: any) => (
                <div key={importItem.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {isAdmin ? importItem.companyName || "Empresa não identificada" : importItem.importName || `Importação #${importItem.id}`}
                        </h3>
                        {getStatusBadge(importItem.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Fornecedor:</span>
                          <p className="font-medium">{importItem.supplierName}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Valor:</span>
                          <p className="font-medium">${parseFloat(importItem.totalValue || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Tipo:</span>
                          <p className="font-medium">{importItem.cargoType || "FCL"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewDetails(importItem.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {(!isAdmin || importItem.status === 'planning') && (
                          <DropdownMenuItem onClick={() => handleEditImport(importItem.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {importItem.status !== 'delivered' && importItem.status !== 'cancelled' && (
                          <DropdownMenuItem 
                            onClick={() => handleCancelImport(importItem.id)}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}