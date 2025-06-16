import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Building2, MapPin, Phone, Mail } from "lucide-react";

// Form validation schema using only existing supplier fields
const editSupplierSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contactName: z.string().min(1, "Nome do contato é obrigatório"),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().optional(),
  country: z.string().min(1, "País é obrigatório"),
  specialization: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type EditSupplierForm = z.infer<typeof editSupplierSchema>;

export default function SupplierEditPage() {
  const [match, params] = useRoute("/suppliers/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Form setup
  const form = useForm<EditSupplierForm>({
    resolver: zodResolver(editSupplierSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "China",
      specialization: "",
      status: "active",
    },
  });

  // Update form when supplier data loads
  useEffect(() => {
    if (supplier) {
      form.reset({
        companyName: supplier.companyName || "",
        contactName: supplier.contactName || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        country: supplier.country || "China",
        specialization: supplier.specialization || "",
        status: supplier.status || "active",
      });
    }
  }, [supplier, form]);

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async (data: EditSupplierForm) => {
      setIsSubmitting(true);
      const response = await apiRequest("PUT", `/api/suppliers/${supplierId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor atualizado",
        description: "As informações do fornecedor foram atualizadas com sucesso.",
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
    onSettled: () => {
      setIsSubmitting(false);
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
              <div>
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  placeholder="Nome da empresa chinesa"
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contactName">Pessoa de Contato *</Label>
                <Input
                  id="contactName"
                  {...form.register("contactName")}
                  placeholder="Nome do contato principal"
                />
                {form.formState.errors.contactName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.contactName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPerson">Contato Adicional</Label>
                <Input
                  id="contactPerson"
                  {...form.register("contactPerson")}
                  placeholder="Pessoa de contato secundária"
                />
              </div>

              <div>
                <Label htmlFor="specialization">Especialização</Label>
                <Input
                  id="specialization"
                  {...form.register("specialization")}
                  placeholder="Área de especialização"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+86 xxx xxxx xxxx"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="email@empresa.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Endereço Completo *</Label>
              <Textarea
                id="address"
                {...form.register("address")}
                placeholder="Endereço completo da empresa"
                rows={3}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  {...form.register("city")}
                  placeholder="Cidade"
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="state">Província/Estado</Label>
                <Input
                  id="state"
                  {...form.register("state")}
                  placeholder="Província"
                />
              </div>

              <div>
                <Label htmlFor="country">País *</Label>
                <Select
                  value={form.watch("country")}
                  onValueChange={(value) => form.setValue("country", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Hong Kong">Hong Kong</SelectItem>
                    <SelectItem value="Taiwan">Taiwan</SelectItem>
                    <SelectItem value="Singapore">Singapura</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.country && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.country.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: "active" | "inactive") => form.setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setLocation(`/suppliers/details/${supplierId}`)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
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
    </div>
  );
}