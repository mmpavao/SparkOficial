import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Building2, MapPin, Phone, Mail } from "lucide-react";

// Schema simplificado para fornecedor chinês
const supplierSchema = z.object({
  companyName: z.string().min(2, "Nome da empresa é obrigatório"),
  contactName: z.string().min(2, "Nome do contato é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  address: z.string().min(5, "Endereço é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  province: z.string().min(2, "Província é obrigatória"),
  productCategories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria"),
  specialization: z.string().optional(),
  minimumOrderValue: z.string().optional(),
  leadTime: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// Categorias de produtos comuns na China
const productCategories = [
  "Eletrônicos",
  "Têxtil e Vestuário",
  "Móveis e Decoração",
  "Brinquedos",
  "Automobilístico",
  "Maquinário",
  "Materiais de Construção",
  "Produtos Químicos",
  "Plásticos",
  "Metal e Aço",
  "Embalagens",
  "Produtos de Beleza",
  "Artigos Esportivos",
  "Instrumentos Médicos",
  "Outros"
];

export default function SupplierNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      productCategories: [],
      specialization: "",
      minimumOrderValue: "",
      leadTime: "",
      notes: "",
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      console.log("Creating supplier with data:", data);
      
      const apiData = {
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.province, // Usando state para província
        country: "China",
        zipCode: "", // Não usado na China
        productCategories: data.productCategories,
        specialization: data.specialization || "",
        minimumOrderValue: data.minimumOrderValue || "",
        leadTime: data.leadTime || "",
        notes: data.notes || "",
        businessRegistration: "",
        taxId: "",
        bankName: "",
        bankAccount: "",
        swiftCode: "",
        certifications: [],
        preferredPaymentTerms: "",
        qualityStandards: [],
        exportLicenses: [],
      };
      
      return apiRequest('/api/suppliers', 'POST', apiData);
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor criado!",
        description: "O novo fornecedor foi cadastrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setLocation('/suppliers');
    },
    onError: (error: any) => {
      console.error("Error creating supplier:", error);
      toast({
        title: "Erro ao criar fornecedor",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    console.log("Form submitted:", data);
    createSupplierMutation.mutate(data);
  };

  const toggleCategory = (category: string) => {
    const current = form.getValues("productCategories");
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    form.setValue("productCategories", updated);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/suppliers')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Fornecedor</h1>
          <p className="text-muted-foreground">Cadastre um novo fornecedor chinês</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  placeholder="Ex: Guangzhou Electronics Co., Ltd."
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome do Contato *</Label>
                <Input
                  id="contactName"
                  {...form.register("contactName")}
                  placeholder="Ex: Zhang Wei"
                />
                {form.formState.errors.contactName && (
                  <p className="text-sm text-red-500">{form.formState.errors.contactName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="contato@empresa.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+86 138 0013 8000"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo *</Label>
              <Input
                id="address"
                {...form.register("address")}
                placeholder="Ex: No. 123, Huancheng West Road, Nansha District"
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  {...form.register("city")}
                  placeholder="Ex: Guangzhou"
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Província *</Label>
                <Select
                  value={form.watch("province")}
                  onValueChange={(value) => form.setValue("province", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a província" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Guangdong">Guangdong</SelectItem>
                    <SelectItem value="Zhejiang">Zhejiang</SelectItem>
                    <SelectItem value="Jiangsu">Jiangsu</SelectItem>
                    <SelectItem value="Shandong">Shandong</SelectItem>
                    <SelectItem value="Fujian">Fujian</SelectItem>
                    <SelectItem value="Shanghai">Shanghai</SelectItem>
                    <SelectItem value="Beijing">Beijing</SelectItem>
                    <SelectItem value="Tianjin">Tianjin</SelectItem>
                    <SelectItem value="Hebei">Hebei</SelectItem>
                    <SelectItem value="Liaoning">Liaoning</SelectItem>
                    <SelectItem value="Outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.province && (
                  <p className="text-sm text-red-500">{form.formState.errors.province.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos e Especialização */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos e Especialização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Categorias de Produtos *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {productCategories.map((category) => (
                  <div
                    key={category}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      form.watch("productCategories").includes(category)
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="text-sm font-medium">{category}</span>
                  </div>
                ))}
              </div>
              {form.formState.errors.productCategories && (
                <p className="text-sm text-red-500">{form.formState.errors.productCategories.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Especialização Principal</Label>
              <Input
                id="specialization"
                {...form.register("specialization")}
                placeholder="Ex: Produtos eletrônicos de consumo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Condições Comerciais */}
        <Card>
          <CardHeader>
            <CardTitle>Condições Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumOrderValue">Pedido Mínimo (USD)</Label>
                <Input
                  id="minimumOrderValue"
                  {...form.register("minimumOrderValue")}
                  placeholder="Ex: 10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadTime">Prazo de Produção</Label>
                <Input
                  id="leadTime"
                  {...form.register("leadTime")}
                  placeholder="Ex: 15-30 dias"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Informações adicionais sobre o fornecedor..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setLocation('/suppliers')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createSupplierMutation.isPending}
            className="min-w-[120px]"
          >
            {createSupplierMutation.isPending ? "Criando..." : "Criar Fornecedor"}
          </Button>
        </div>
      </form>
    </div>
  );
}