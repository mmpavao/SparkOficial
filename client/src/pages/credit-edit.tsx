import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { formatUSDInput, parseUSDInput, validateUSDRange } from "@/lib/currency";
import { formatCnpj, validateCnpj } from "@/lib/cnpj";
import { formatCpf, validateCpf } from "@/lib/cpf";
import { formatCep, validateCep } from "@/lib/cep";
import { 
  ArrowLeft, 
  Save, 
  Plus,
  X,
  Building,
  CreditCard,
  FileText,
  Users
} from "lucide-react";

// Form schemas
import { z } from "zod";

const editCreditApplicationSchema = z.object({
  legalCompanyName: z.string().min(1, "Razão social é obrigatória"),
  tradingName: z.string().optional(),
  cnpj: z.string().min(1, "CNPJ é obrigatório").refine(validateCnpj, "CNPJ inválido"),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(1, "CEP é obrigatório").refine(validateCep, "CEP inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  website: z.string().optional(),
  businessSector: z.string().min(1, "Setor de negócio é obrigatório"),
  annualRevenue: z.string().min(1, "Receita anual é obrigatória"),
  mainImportedProducts: z.string().min(1, "Principais produtos importados são obrigatórios"),
  mainOriginMarkets: z.string().min(1, "Principais mercados de origem são obrigatórios"),
  requestedAmount: z.string().min(1, "Valor solicitado é obrigatório"),
  monthlyImportVolume: z.string().min(1, "Volume mensal de importação é obrigatório"),
  justification: z.string().min(10, "Justificativa deve ter pelo menos 10 caracteres"),
});

type EditCreditApplicationForm = z.infer<typeof editCreditApplicationSchema>;

export default function CreditEditPage() {
  const [match, params] = useRoute("/credit/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [productTags, setProductTags] = useState<string[]>([]);
  const [currentProduct, setCurrentProduct] = useState("");

  const applicationId = params?.id ? parseInt(params.id) : null;

  // Fetch credit application details
  const { data: application, isLoading } = useQuery({
    queryKey: ["/api/credit/applications", applicationId],
    queryFn: async () => {
      return await apiRequest(`/api/credit/applications/${applicationId}`, "GET");
    },
    enabled: !!applicationId,
  }) as { data: any, isLoading: boolean };

  const form = useForm<EditCreditApplicationForm>({
    resolver: zodResolver(editCreditApplicationSchema),
    defaultValues: {
      legalCompanyName: "",
      tradingName: "",
      cnpj: "",
      stateRegistration: "",
      municipalRegistration: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      website: "",
      businessSector: "",
      annualRevenue: "",
      mainImportedProducts: "",
      mainOriginMarkets: "",
      requestedAmount: "",
      monthlyImportVolume: "",
      justification: "",
    },
  });

  // Load application data into form when available
  useEffect(() => {
    if (application) {
      const appData = application;
      form.reset({
        legalCompanyName: appData.legalCompanyName || "",
        tradingName: appData.tradingName || "",
        cnpj: appData.cnpj || "",
        stateRegistration: appData.stateRegistration || "",
        municipalRegistration: appData.municipalRegistration || "",
        address: appData.address || "",
        city: appData.city || "",
        state: appData.state || "",
        zipCode: appData.zipCode || "",
        phone: appData.phone || "",
        email: appData.email || "",
        website: appData.website || "",
        businessSector: appData.businessSector || "",
        annualRevenue: appData.annualRevenue || "",
        mainImportedProducts: appData.mainImportedProducts || "",
        mainOriginMarkets: appData.mainOriginMarkets || "",
        requestedAmount: appData.requestedAmount || "",
        monthlyImportVolume: appData.monthlyImportVolume || "",
        justification: appData.justification || "",
      });

      // Load product tags
      if (appData.productsToImport && Array.isArray(appData.productsToImport)) {
        setProductTags(appData.productsToImport);
      }
    }
  }, [application, form]);

  // Update credit application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (data: EditCreditApplicationForm) => {
      const applicationData = {
        ...data,
        productsToImport: productTags,
        requestedAmount: parseUSDInput(data.requestedAmount).toString(),
      };
      
      return await apiRequest(`/api/credit/applications/${applicationId}`, "PUT", applicationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications", applicationId] });
      toast({
        title: "Sucesso!",
        description: "Solicitação de crédito atualizada com sucesso.",
      });
      // Navigate to details page after successful update
      setTimeout(() => {
        setLocation(`/credit/details/${applicationId}`);
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditCreditApplicationForm) => {
    updateApplicationMutation.mutate(data);
  };

  const addProductTag = () => {
    if (currentProduct.trim() && !productTags.includes(currentProduct.trim())) {
      setProductTags([...productTags, currentProduct.trim()]);
      setCurrentProduct("");
    }
  };

  const removeProductTag = (tagToRemove: string) => {
    setProductTags(productTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProductTag();
    }
  };

  if (!match) {
    return <div>Página não encontrada</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Solicitação não encontrada</h3>
        <p className="text-gray-500">A solicitação de crédito não foi encontrada ou você não tem permissão para editá-la.</p>
      </div>
    );
  }

  // Check if application can be edited
  if (application.status !== 'pending' && application.status !== 'under_review') {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Não é possível editar</h3>
        <p className="text-gray-500">Apenas solicitações pendentes podem ser editadas.</p>
        <Button 
          className="mt-4"
          onClick={() => setLocation(`/credit/details/${applicationId}`)}
        >
          Ver Detalhes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation(`/credit/details/${applicationId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Solicitação #{application.id}
            </h1>
            <p className="text-gray-600">Atualize as informações da sua solicitação de crédito</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="legalCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome Empresarial Ltda" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tradingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome comercial" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="00.000.000/0000-00"
                          onChange={(e) => {
                            const formatted = formatCnpj(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stateRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscrição Estadual</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000.000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipalRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscrição Municipal</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00000000" />
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
                        <Input {...field} type="email" placeholder="contato@empresa.com" />
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
                        <Input {...field} placeholder="(11) 99999-9999" />
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
                        <Input {...field} placeholder="https://www.empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rua, Avenida, número, bairro" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="São Paulo" />
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
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SP" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="00000-000"
                          onChange={(e) => {
                            const formatted = formatCep(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Commercial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Informações Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessSector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor de Negócio *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="electronics">Eletrônicos</SelectItem>
                          <SelectItem value="textiles">Têxtil e Confecção</SelectItem>
                          <SelectItem value="machinery">Máquinas e Equipamentos</SelectItem>
                          <SelectItem value="automotive">Automotivo</SelectItem>
                          <SelectItem value="chemicals">Químicos</SelectItem>
                          <SelectItem value="food">Alimentos</SelectItem>
                          <SelectItem value="toys">Brinquedos</SelectItem>
                          <SelectItem value="furniture">Móveis</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receita Anual *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a faixa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="up_to_500k">Até R$ 500.000</SelectItem>
                          <SelectItem value="500k_to_2m">R$ 500.000 - R$ 2.000.000</SelectItem>
                          <SelectItem value="2m_to_10m">R$ 2.000.000 - R$ 10.000.000</SelectItem>
                          <SelectItem value="10m_to_50m">R$ 10.000.000 - R$ 50.000.000</SelectItem>
                          <SelectItem value="above_50m">Acima de R$ 50.000.000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mainImportedProducts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principais Produtos Importados *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Descreva os principais produtos que sua empresa importa"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainOriginMarkets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principais Mercados de Origem *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Informe os principais países/regiões de onde sua empresa importa"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Credit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Dados do Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requestedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Solicitado (USD) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="$100,000.00"
                          onChange={(e) => {
                            const formatted = formatUSDInput(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">Entre $100.000 e $1.000.000</p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyImportVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Mensal de Importação *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o volume" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="up_to_50k">Até $50.000</SelectItem>
                          <SelectItem value="50k_to_100k">$50.000 - $100.000</SelectItem>
                          <SelectItem value="100k_to_250k">$100.000 - $250.000</SelectItem>
                          <SelectItem value="250k_to_500k">$250.000 - $500.000</SelectItem>
                          <SelectItem value="above_500k">Acima de $500.000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Produtos para Importar</FormLabel>
                <div className="space-y-3 mt-2">
                  <div className="flex gap-2">
                    <Input
                      value={currentProduct}
                      onChange={(e) => setCurrentProduct(e.target.value)}
                      placeholder="Digite um produto e pressione Enter"
                      onKeyPress={handleKeyPress}
                    />
                    <Button 
                      type="button" 
                      onClick={addProductTag}
                      disabled={!currentProduct.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {productTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {productTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeProductTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Explique como o crédito será utilizado e o propósito das importações"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/credit/details/${applicationId}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateApplicationMutation.isPending}
              className="bg-spark-600 hover:bg-spark-700"
            >
              {updateApplicationMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {updateApplicationMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}