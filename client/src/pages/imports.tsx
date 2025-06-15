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
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Building,
  Box
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch imports data based on user type
  const { data: imports = [], isLoading } = useQuery({
    queryKey: isAdmin ? ["/api/admin/imports"] : ["/api/imports"],
  });

  // Form setup
  const form = useForm<InsertImport>({
    resolver: zodResolver(insertImportSchema),
    defaultValues: {
      productName: "",
      productDescription: "",
      quantity: 1,
      unitPrice: "",
      totalValue: "",
      supplierName: "",
      supplierLocation: "",
      currency: "USD",
      shippingMethod: "sea",
      containerType: "20ft",
      fobPrice: "",
      cifPrice: "",
      weight: "",
      volume: "",
      incoterms: "FOB",
      notes: "",
    },
  });

  // Create import mutation
  const createImportMutation = useMutation({
    mutationFn: async (data: InsertImport) => {
      return await apiRequest("POST", "/api/imports", data);
    },
    onSuccess: () => {
      toast({
        title: "Importação criada!",
        description: "Sua nova importação foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/imports"] });
      setShowNewImportForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, data }: { id: number; status: string; data?: any }) => {
      const endpoint = isAdmin ? `/api/admin/imports/${id}/status` : `/api/imports/${id}/status`;
      return await apiRequest("PATCH", endpoint, { status, ...data });
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
    const completedImports = importsArray.filter(imp => 
      ['completed', 'delivered'].includes(imp.status)
    ).length;
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

  // Apply filters based on user type
  const applyFilters = (importsArray: any[]) => {
    let filtered = importsArray;

    // Status filter (both admin and importer)
    if (filterStatus !== "all") {
      filtered = filtered.filter(imp => imp.status === filterStatus);
    }

    // Admin-specific filters
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
    // Calculate total value from all products
    const totalProductValue = products.reduce((sum, product) => {
      return sum + (parseFloat(product.totalValue) || 0);
    }, 0);
    
    // Prepare submission data
    const submissionData = {
      ...data,
      products: form.watch("cargoType") === "LCL" ? products : [{
        name: data.productName,
        description: data.productDescription,
        hsCode: data.hsCode || "",
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
      return apiRequest('DELETE', `/api/imports/${importId}`);
    },
    onSuccess: () => {
      toast({
        title: "Importação cancelada",
        description: "A importação foi cancelada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar importação",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  const handleCancelImport = (importId: number) => {
    cancelImportMutation.mutate(importId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.imports.title}</h1>
          <p className="text-gray-600">
            {isAdmin ? "Gerencie todas as importações do sistema" : "Gerencie suas importações da China"}
          </p>
        </div>
        {!isAdmin && (
          <Button 
            onClick={() => setShowNewImportForm(true)}
            className="bg-spark-600 hover:bg-spark-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.imports.newImport}
          </Button>
        )}
      </div>

      {/* Admin Filters */}
      {isAdmin && (
        <AdminImportFilters onFiltersChange={setAdminFilters} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.dashboard.totalImports}</p>
                <p className="text-2xl font-bold text-gray-900">{importData.totalImports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.dashboard.activeImports}</p>
                <p className="text-2xl font-bold text-gray-900">{importData.activeImports}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{importData.completedImports}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {importData.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-spark-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-spark-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder={t.common.search + "..."} className="pl-10" />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t.common.filter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="planning">{t.imports.status.planning}</SelectItem>
                <SelectItem value="ordered">{t.imports.status.ordered}</SelectItem>
                <SelectItem value="in_transit">{t.imports.status.in_transit}</SelectItem>
                <SelectItem value="customs">{t.imports.status.customs}</SelectItem>
                <SelectItem value="delivered">{t.imports.status.delivered}</SelectItem>
                <SelectItem value="cancelled">{t.imports.status.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Imports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t.common.loading}...</p>
          </div>
        ) : filteredImports.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">{t.dashboard.noData}</p>
            <p className="text-sm text-gray-400">
              {filterStatus === "all" 
                ? t.imports.clickNewImport
                : t.imports.tryChangeFilter}
            </p>
          </div>
        ) : (
          filteredImports.map((importItem: any) => (
            <Card key={importItem.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="font-semibold text-lg">
                        {isAdmin ? `${importItem.companyName || 'Empresa'} - IMP-${String(importItem.id).padStart(3, '0')}` : `IMP-${String(importItem.id).padStart(3, '0')}`}
                      </h3>
                      {getStatusBadge(importItem.status)}
                    </div>
                    <p className="text-gray-600 mb-2">{importItem.productDescription}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="font-medium">Fornecedor:</span>
                        <span className="ml-1">{importItem.supplierName}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="font-medium">Local:</span>
                        <span className="ml-1">{importItem.supplierLocation}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span className="font-medium">Valor:</span>
                        <span className="ml-1">{importItem.currency} {parseFloat(importItem.totalValue).toLocaleString()}</span>
                      </div>
                      {importItem.estimatedDelivery && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">Previsão:</span>
                          <span className="ml-1">{new Date(importItem.estimatedDelivery).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {importItem.trackingNumber && (
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          <span className="font-medium">Rastreamento:</span>
                          <span className="ml-1">{importItem.trackingNumber}</span>
                        </div>
                      )}
                      {importItem.notes && (
                        <div className="flex items-center md:col-span-2">
                          <span className="font-medium">Observações:</span>
                          <span className="ml-1">{importItem.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Dropdown Menu with Actions - Following exact credit pattern */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/import/details/${(importItem as any).id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        
                        {/* Editar - disponível para importações em planejamento e permissões corretas */}
                        {(importItem.status?.toLowerCase() === 'planning' && (isAdmin || (importItem as any).userId === user?.id)) ? (
                          <DropdownMenuItem onClick={() => setLocation(`/import/edit/${(importItem as any).id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <Edit className="w-4 h-4 mr-2 opacity-50" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        
                        {/* Cancelar - disponível para importações não finalizadas e permissões corretas */}
                        {(importItem.status?.toLowerCase() !== 'canceled' && importItem.status?.toLowerCase() !== 'completed' && (isAdmin || (importItem as any).userId === user?.id)) ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleCancelImport((importItem as any).id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                              <Trash2 className="w-4 h-4 mr-2 opacity-50" />
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Import Form Modal */}
      {showNewImportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nova Importação</CardTitle>
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
                    
                    {/* Informações do Contêiner - apenas para FCL */}
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

                  {/* Informações dos Produtos */}
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
                            
                            <div className="text-sm text-gray-600">
                              <strong>Valor Total: USD ${product.totalValue || "0.00"}</strong>
                            </div>
                          </div>
                        ))}
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
                  </div>

                  {/* Informações de Preço */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Informações de Preço
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Unitário *</FormLabel>
                            <FormControl>
                              <Input placeholder="50.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fobPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço FOB</FormLabel>
                            <FormControl>
                              <Input placeholder="45000.00" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cifPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço CIF</FormLabel>
                            <FormControl>
                              <Input placeholder="48000.00" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="totalValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Total *</FormLabel>
                            <FormControl>
                              <Input placeholder="50000.00" {...field} />
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

                  {/* Informações do Fornecedor */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Fornecedor
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="supplierName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Fornecedor *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Shenzhen Electronics Co." {...field} />
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
                            <FormLabel>Localização *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Shenzhen, China" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Informações de Transporte */}
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
                                <SelectItem value="20ft">Container 20ft</SelectItem>
                                <SelectItem value="40ft">Container 40ft</SelectItem>
                                <SelectItem value="40ft-hc">Container 40ft HC</SelectItem>
                                <SelectItem value="lcl">LCL (Carga Fracionada)</SelectItem>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                                <SelectItem value="CIF">CIF - Cost, Insurance, Freight</SelectItem>
                                <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                                <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso Total (kg)</FormLabel>
                            <FormControl>
                              <Input placeholder="1500" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="volume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volume (m³)</FormLabel>
                            <FormControl>
                              <Input placeholder="25.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                            className="min-h-[80px]"
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewImportForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createImportMutation.isPending}
                      className="flex-1 bg-spark-600 hover:bg-spark-700"
                    >
                      {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
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