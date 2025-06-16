import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSupplierSchema } from "@shared/schema";
import { 
  ArrowLeft, 
  Save, 
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { z } from "zod";

type EditSupplierForm = z.infer<typeof insertSupplierSchema>;

export default function SupplierEditPage() {
  const [match, params] = useRoute("/suppliers/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supplierId = params?.id ? parseInt(params.id) : null;

  // Fetch supplier details
  const { data: supplier, isLoading } = useQuery({
    queryKey: ["/api/suppliers", supplierId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/suppliers/${supplierId}`);
      return response.json();
    },
    enabled: !!supplierId,
  });

  const form = useForm<EditSupplierForm>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      position: "",
      phone: "",
      email: "",
      website: "",
      wechat: "",
      address: "",
      city: "",
      province: "",
      specialization: "",
      description: "",
      minimumOrder: "",
      paymentTerms: "",
      leadTime: "",
      certifications: "",
    },
  });

  // Load supplier data into form when available
  useEffect(() => {
    if (supplier) {
      form.reset({
        companyName: supplier.companyName || "",
        contactName: supplier.contactName || "",
        position: supplier.position || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        website: supplier.website || "",
        wechat: supplier.wechat || "",
        address: supplier.address || "",
        city: supplier.city || "",
        province: supplier.province || "",
        specialization: supplier.specialization || "",
        description: supplier.description || "",
        minimumOrder: supplier.minimumOrder || "",
        paymentTerms: supplier.paymentTerms || "",
        leadTime: supplier.leadTime || "",
        certifications: supplier.certifications || "",
      });
    }
  }, [supplier, form]);

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async (data: EditSupplierForm) => {
      const response = await apiRequest("PUT", `/api/suppliers/${supplierId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor atualizado",
        description: "Os dados do fornecedor foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", supplierId] });
      setLocation(`/suppliers/details/${supplierId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditSupplierForm) => {
    updateSupplierMutation.mutate(data);
  };

  if (!match || !supplierId) {
    return <div>Fornecedor não encontrado</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!supplier) {
    return <div>Fornecedor não encontrado</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation(`/suppliers/details/${supplierId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Fornecedor</h1>
            <p className="text-muted-foreground">{supplier.companyName}</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Shanghai Electronics Co." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialização</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Eletrônicos, Têxtil, Máquinas" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Empresa</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Descreva os produtos e serviços oferecidos pela empresa..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Li Wei" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posição/Cargo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Sales Manager" />
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
                        <Input {...field} placeholder="Ex: +86 138 0013 8000" />
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
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Ex: contact@company.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: https://www.company.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wechat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WeChat</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: wechat_id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Room 1502, Building A, 123 Nanjing Road" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Shanghai" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Província *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Shanghai" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informações Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minimumOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pedido Mínimo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 100 peças" />
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
                        <Input {...field} placeholder="Ex: 15-20 dias" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termos de Pagamento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 30% antecipado, 70% antes do embarque" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificações</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Ex: ISO 9001, CE, RoHS, FCC..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/suppliers/details/${supplierId}`)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateSupplierMutation.isPending}
            >
              {updateSupplierMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}