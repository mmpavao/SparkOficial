import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertImportSchema, type InsertImport } from "@shared/schema";
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
  AlertCircle
} from "lucide-react";

export default function ImportsPage() {
  const [showNewImportForm, setShowNewImportForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch real imports data
  const { data: imports = [], isLoading } = useQuery({
    queryKey: ["/api/imports"],
  });

  // Form setup
  const form = useForm<InsertImport>({
    resolver: zodResolver(insertImportSchema),
    defaultValues: {
      supplierName: "",
      supplierLocation: "",
      productDescription: "",
      totalValue: "",
      currency: "USD",
      status: "planning",
      notes: "",
    },
  });

  // Create import mutation
  const createImportMutation = useMutation({
    mutationFn: async (data: InsertImport) => {
      return await apiRequest("/api/imports", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Importação criada!",
        description: "Sua nova importação foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
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

  // Calculate real metrics from API data
  const calculateMetrics = () => {
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
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Entregue</Badge>;
      case "shipped":
        return <Badge className="bg-blue-100 text-blue-800"><Ship className="w-3 h-3 mr-1" />Enviado</Badge>;
      case "customs":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Na Alfândega</Badge>;
      case "ordered":
        return <Badge className="bg-purple-100 text-purple-800"><Package className="w-3 h-3 mr-1" />Pedido Feito</Badge>;
      case "planning":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Planejamento</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

  const filteredImports = filterStatus === "all" 
    ? importData.imports 
    : importData.imports.filter(imp => imp.status === filterStatus);

  const onSubmit = (data: InsertImport) => {
    createImportMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importações</h1>
          <p className="text-gray-600">Gerencie suas importações da China</p>
        </div>
        <Button 
          onClick={() => setShowNewImportForm(true)}
          className="bg-spark-600 hover:bg-spark-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Importação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Importações</p>
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
                <p className="text-sm text-gray-600">Importações Ativas</p>
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
                <Input placeholder="Buscar por código, fornecedor..." className="pl-10" />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="ordered">Pedido Feito</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="customs">Na Alfândega</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Imports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando importações...</p>
          </div>
        ) : filteredImports.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma importação encontrada</p>
            <p className="text-sm text-gray-400">
              {filterStatus === "all" 
                ? "Clique em 'Nova Importação' para começar" 
                : "Tente alterar o filtro de status"}
            </p>
          </div>
        ) : (
          filteredImports.map((importItem: any) => (
            <Card key={importItem.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="font-semibold text-lg">IMP-{String(importItem.id).padStart(3, '0')}</h3>
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
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição dos Produtos</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Smartphones Samsung" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Fornecedor</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do fornecedor" {...field} />
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
                          <FormLabel>Valor Total (USD)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Ex: 50000" {...field} />
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
                          <FormLabel>Localização do Fornecedor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Shenzhen, China" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Informações adicionais..." {...field} value={field.value || ""} />
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