import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSupplierSchema } from "@shared/schema";
import { ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

const editSupplierSchema = insertSupplierSchema.omit({ userId: true });

export default function SupplierEditPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supplierId = window.location.pathname.split('/').pop();

  const { data: supplier, isLoading } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}`],
  });

  const form = useForm<z.infer<typeof editSupplierSchema>>({
    resolver: zodResolver(editSupplierSchema),
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
      preferredPaymentTerms: "",
      minimumOrderValue: "",
      leadTime: "",
      qualityStandards: [],
      exportLicenses: [],
      status: "active",
      rating: 5,
      notes: "",
    },
  });

  // Update form when supplier data is loaded
  useEffect(() => {
    if (supplier) {
      form.reset({
        companyName: supplier.companyName || "",
        contactName: supplier.contactName || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        country: supplier.country || "China",
        zipCode: supplier.zipCode || "",
        businessRegistration: supplier.businessRegistration || "",
        taxId: supplier.taxId || "",
        bankName: supplier.bankName || "",
        bankAccount: supplier.bankAccount || "",
        swiftCode: supplier.swiftCode || "",
        productCategories: supplier.productCategories || [],
        specialization: supplier.specialization || "",
        certifications: supplier.certifications || [],
        preferredPaymentTerms: supplier.preferredPaymentTerms || "",
        minimumOrderValue: supplier.minimumOrderValue || "",
        leadTime: supplier.leadTime || "",
        qualityStandards: supplier.qualityStandards || [],
        exportLicenses: supplier.exportLicenses || [],
        status: supplier.status || "active",
        rating: supplier.rating || 5,
        notes: supplier.notes || "",
      });
    }
  }, [supplier, form]);

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editSupplierSchema>) => {
      const response = await apiRequest("PUT", `/api/suppliers/${supplierId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor atualizado",
        description: "As informações do fornecedor foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}`] });
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

  const onSubmit = (data: z.infer<typeof editSupplierSchema>) => {
    updateSupplierMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Fornecedor não encontrado</h2>
          <p className="text-gray-600 mt-2">O fornecedor solicitado não existe ou foi removido.</p>
          <Button onClick={() => setLocation('/suppliers')} className="mt-4">
            Voltar para Fornecedores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation(`/suppliers/details/${supplierId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Fornecedor</h1>
            <p className="text-gray-600">Atualize as informações do fornecedor chinês</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
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
                        <Input placeholder="Nome da empresa chinesa" {...field} />
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
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da pessoa de contato" {...field} />
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
                        <Input type="email" placeholder="email@empresa.com" {...field} />
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
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
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
                        <Input placeholder="Cidade" {...field} />
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
                      <FormLabel>Província/Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Província ou estado" {...field} />
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
                      <FormControl>
                        <Input placeholder="País" {...field} />
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
              <CardTitle>Informações Comerciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registro Empresarial</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de registro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Fiscal</FormLabel>
                      <FormControl>
                        <Input placeholder="Identificação fiscal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do banco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta Bancária</FormLabel>
                      <FormControl>
                        <Input placeholder="Número da conta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="swiftCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código SWIFT</FormLabel>
                      <FormControl>
                        <Input placeholder="Código SWIFT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredPaymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termos de Pagamento Preferidos</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 30% antecipado, 70% contra BL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Trading Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Comerciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialização</FormLabel>
                      <FormControl>
                        <Input placeholder="Área de especialização" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minimumOrderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mínimo do Pedido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: USD 10,000" {...field} />
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
                      <FormLabel>Lead Time</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 15-30 dias" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionais sobre o fornecedor"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
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
              <Save className="w-4 h-4 mr-2" />
              {updateSupplierMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}