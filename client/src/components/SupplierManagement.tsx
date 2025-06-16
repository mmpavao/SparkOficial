
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSupplierSchema, type InsertSupplier } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Search
} from "lucide-react";

interface SupplierManagementProps {
  onSelectSupplier?: (supplier: any) => void;
  selectedSupplierId?: number;
}

export default function SupplierManagement({ onSelectSupplier, selectedSupplierId }: SupplierManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/suppliers");
      return response.json();
    },
  });

  // Form setup
  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "China",
      zipCode: "",
      businessRegistration: "",
      taxId: "",
      bankName: "",
      bankAccount: "",
      swiftCode: "",
      productCategories: [],
      specialization: "",
      certifications: [],
      preferredPaymentTerms: "T/T",
      minimumOrderValue: "",
      leadTime: "",
      qualityStandards: [],
      exportLicenses: [],
      status: "active",
      rating: 5,
      notes: "",
    },
  });

  // Mutations
  const createSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("/api/suppliers", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor criado!",
        description: "O fornecedor foi cadastrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSupplier> }) => {
      const response = await apiRequest(`/api/suppliers/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor atualizado!",
        description: "As informações foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setEditingSupplier(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/suppliers/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor removido",
        description: "O fornecedor foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSupplier) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    form.reset(supplier);
    setShowAddDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este fornecedor?")) {
      deleteSupplierMutation.mutate(id);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier: any) =>
    supplier.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Inativo</Badge>;
      case "blacklisted":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Bloqueado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Fornecedores</h2>
          <p className="text-gray-600">Cadastre e gerencie seus fornecedores da China</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-spark-600 hover:bg-spark-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do fornecedor chinês
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Shenzhen Electronics Co." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Contato *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Li Wei" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contato@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+86 138 0000 0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Localização
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Endereço Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, número, distrito" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Shenzhen" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado/Província</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Guangdong" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o país" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="China">China</SelectItem>
                              <SelectItem value="Hong Kong">Hong Kong</SelectItem>
                              <SelectItem value="Taiwan">Taiwan</SelectItem>
                              <SelectItem value="South Korea">Coreia do Sul</SelectItem>
                              <SelectItem value="Vietnam">Vietnã</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="518000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Informações Comerciais
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="preferredPaymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Termos de Pagamento Preferidos</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="T/T">T/T (Transferência)</SelectItem>
                              <SelectItem value="L/C">L/C (Carta de Crédito)</SelectItem>
                              <SelectItem value="D/P">D/P (Documents against Payment)</SelectItem>
                              <SelectItem value="D/A">D/A (Documents against Acceptance)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="minimumOrderValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Mínimo do Pedido (USD)</FormLabel>
                          <FormControl>
                            <Input placeholder="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="leadTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo de Produção</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 15-30 dias" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avaliação (1-5 estrelas)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5">⭐⭐⭐⭐⭐ (5 estrelas)</SelectItem>
                              <SelectItem value="4">⭐⭐⭐⭐ (4 estrelas)</SelectItem>
                              <SelectItem value="3">⭐⭐⭐ (3 estrelas)</SelectItem>
                              <SelectItem value="2">⭐⭐ (2 estrelas)</SelectItem>
                              <SelectItem value="1">⭐ (1 estrela)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especialização</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva os produtos e serviços especializados do fornecedor..."
                            {...field}
                          />
                        </FormControl>
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
                          <Textarea 
                            placeholder="Informações adicionais sobre o fornecedor..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setEditingSupplier(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                  >
                    {(createSupplierMutation.isPending || updateSupplierMutation.isPending)
                      ? "Salvando..." 
                      : editingSupplier 
                        ? "Atualizar Fornecedor" 
                        : "Criar Fornecedor"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar fornecedores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Carregando fornecedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhum fornecedor encontrado</p>
            <p className="text-sm text-gray-400">
              {searchQuery ? "Tente alterar o termo de busca" : "Clique em 'Novo Fornecedor' para começar"}
            </p>
          </div>
        ) : (
          filteredSuppliers.map((supplier: any) => (
            <Card 
              key={supplier.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSupplierId === supplier.id ? "ring-2 ring-spark-500" : ""
              }`}
              onClick={() => onSelectSupplier?.(supplier)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg truncate">{supplier.companyName}</CardTitle>
                    <p className="text-sm text-gray-600 truncate">{supplier.contactName}</p>
                  </div>
                  {getStatusBadge(supplier.status)}
                </div>
                <div className="flex items-center gap-1">
                  {getRatingStars(supplier.rating)}
                  <span className="text-sm text-gray-500 ml-2">({supplier.rating}/5)</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{supplier.city}, {supplier.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span className="truncate">{supplier.phone}</span>
                  </div>
                  {supplier.specialization && (
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span className="truncate">{supplier.specialization}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(supplier);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(supplier.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
