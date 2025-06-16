import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatCnpj } from "@/lib/cnpj";
import { formatCpf } from "@/lib/cpf";
import { formatCep } from "@/lib/cep";
import { formatPhone } from "@/lib/phone";
import { formatUSDInput, parseUSDInput, validateUSDRange } from "@/lib/currency";
import { 
  Building2, 
  Users, 
  BarChart3, 
  DollarSign, 
  FileText, 
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Plus,
  Trash2
} from "lucide-react";
import { z } from "zod";

// Simplified 3-step form schemas
const step1Schema = z.object({
  legalCompanyName: z.string().min(2, "Nome obrigatório"),
  cnpj: z.string().min(14, "CNPJ obrigatório"),
  address: z.string().min(5, "Endereço obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().min(2, "Estado obrigatório"),
  zipCode: z.string().min(8, "CEP obrigatório"),
  phone: z.string().min(10, "Telefone obrigatório"),
  email: z.string().email("Email inválido"),
  businessSector: z.string().min(1, "Setor obrigatório"),
  annualRevenue: z.string().min(1, "Faturamento obrigatório"),
});

const step2Schema = z.object({
  requestedAmount: z.string().min(1, "Valor obrigatório"),
  mainImportedProducts: z.string().min(10, "Produtos obrigatórios"),
  monthlyImportVolume: z.string().min(1, "Volume obrigatório"),
  justification: z.string().min(20, "Justificativa obrigatória"),
});

const step3Schema = z.object({
  documentsConfirmed: z.boolean().refine(val => val === true, "Confirmação obrigatória"),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step3Form = z.infer<typeof step3Schema>;

// Business sectors
const businessSectors = [
  "Máquinas e Equipamentos",
  "Eletrônicos e Tecnologia",
  "Têxtil",
  "Automotivo",
  "Químico",
  "Alimentício",
  "Farmacêutico",
  "Construção Civil",
  "Energia",
  "Outros"
];

// Revenue ranges
const revenueRanges = [
  "Até R$ 1 milhão",
  "R$ 1 - 5 milhões",
  "R$ 5 - 20 milhões",
  "R$ 20 - 100 milhões",
  "Acima de R$ 100 milhões"
];

export default function CreditApplicationNew() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Form instances for each step
  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      legalCompanyName: user?.companyName || "",
      cnpj: user?.cnpj || "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: user?.phone || "",
      email: user?.email || "",
      businessSector: "",
      annualRevenue: "",
    },
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      requestedAmount: "",
      mainImportedProducts: "",
      monthlyImportVolume: "",
      justification: "",
    },
  });

  const step3Form = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      documentsConfirmed: false,
    },
  });

  // Submit application mutation
  const submitApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/credit/applications", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      toast({
        title: "Sucesso!",
        description: "Solicitação de crédito enviada com sucesso.",
      });
      setTimeout(() => {
        setLocation('/credit');
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar solicitação",
        variant: "destructive",
      });
    },
  });

  // Navigation functions
  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = await step1Form.trigger();
      if (isValid) {
        setFormData((prev: any) => ({ ...prev, ...step1Form.getValues() }));
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      isValid = await step2Form.trigger();
      if (isValid) {
        setFormData((prev: any) => ({ ...prev, ...step2Form.getValues() }));
        setCurrentStep(3);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitApplication = async () => {
    const isValid = await step3Form.trigger();
    if (!isValid) return;

    const finalData = {
      ...formData,
      ...step2Form.getValues(),
      ...step3Form.getValues(),
      status: "pending",
      documentsStatus: "pending",
      currency: "USD",
      tradingName: formData.legalCompanyName || "",
      stateRegistration: "",
      municipalRegistration: "",
      website: "",
      shareholders: [{ name: user?.companyName || "", cpf: "", percentage: 100 }],
      mainOriginMarkets: "China",
      productsToImport: [formData.mainImportedProducts || ""],
      requiredDocuments: null,
      optionalDocuments: null,
    };

    submitApplicationMutation.mutate(finalData);
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => {
        const isCurrent = step === currentStep;
        const isCompleted = step < currentStep;
        
        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                isCurrent 
                  ? 'border-spark-600 bg-spark-600 text-white' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : 'border-gray-300 bg-white text-gray-400'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{step}</span>
              )}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const stepTitles = [
    "Dados da Empresa",
    "Dados do Crédito", 
    "Documentação"
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitação de Crédito</h1>
          <p className="text-gray-600">Preencha todas as informações para solicitar seu crédito de importação</p>
        </div>

        <StepIndicator />

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            {currentStep === 1 && <Building2 className="w-5 h-5 text-blue-600" />}
            {currentStep === 2 && <DollarSign className="w-5 h-5 text-green-600" />}
            {currentStep === 3 && <FileText className="w-5 h-5 text-orange-600" />}
            {stepTitles[currentStep - 1]}
          </h2>
        </div>

        {/* Step 1: Company Data */}
        {currentStep === 1 && (
          <Card>
            <CardContent className="pt-6">
              <Form {...step1Form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={step1Form.control}
                      name="legalCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step1Form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00.000.000/0000-00"
                              {...field}
                              onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={step1Form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={step1Form.control}
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
                      control={step1Form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado *</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step1Form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00000-000"
                              {...field}
                              onChange={(e) => field.onChange(formatCep(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={step1Form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999"
                              {...field}
                              onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step1Form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="email@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={step1Form.control}
                      name="businessSector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor de Atuação *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o setor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessSectors.map((sector) => (
                                <SelectItem key={sector} value={sector}>
                                  {sector}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step1Form.control}
                      name="annualRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Faturamento Anual *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a faixa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {revenueRanges.map((range) => (
                                <SelectItem key={range} value={range}>
                                  {range}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Credit Data */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="pt-6">
              <Form {...step2Form}>
                <form className="space-y-6">
                  {/* Credit Amount */}
                  <FormField
                    control={step2Form.control}
                    name="requestedAmount"
                    render={({ field }) => {
                      const currentValue = parseUSDInput(field.value || '0');
                      const validation = validateUSDRange(currentValue);
                      const isValid = validation.isValid && currentValue >= 100000;
                      
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            Valor Solicitado (USD) *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="$250,000"
                                value={field.value ? formatUSDInput(field.value) : ''}
                                onChange={(e) => {
                                  const numValue = parseUSDInput(e.target.value);
                                  field.onChange(numValue.toString());
                                }}
                                className={`pl-8 pr-10 text-lg font-medium ${
                                  field.value && currentValue > 0
                                    ? isValid 
                                      ? 'border-green-300 focus:border-green-500' 
                                      : 'border-red-300 focus:border-red-500'
                                    : ''
                                }`}
                              />
                              <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              {field.value && currentValue > 0 && (
                                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                                  {isValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Valores aceitos: USD $100.000 a USD $1.000.000</span>
                            {field.value && currentValue > 0 && (
                              <span className={`font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                {isValid ? '✓ Valor válido' : 'Valor fora da faixa permitida'}
                              </span>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Main Products */}
                  <FormField
                    control={step2Form.control}
                    name="mainImportedProducts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principais Produtos a Importar *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Componentes eletrônicos, matérias-primas, equipamentos industriais..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 mt-1">
                          Descreva detalhadamente os produtos que pretende importar
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Monthly Import Volume */}
                  <FormField
                    control={step2Form.control}
                    name="monthlyImportVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume Mensal de Importação *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o volume mensal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ate_50k">Até USD $50.000</SelectItem>
                            <SelectItem value="50k_100k">USD $50.000 - $100.000</SelectItem>
                            <SelectItem value="100k_250k">USD $100.000 - $250.000</SelectItem>
                            <SelectItem value="250k_500k">USD $250.000 - $500.000</SelectItem>
                            <SelectItem value="500k_1m">USD $500.000 - $1.000.000</SelectItem>
                            <SelectItem value="acima_1m">Acima de USD $1.000.000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Justification */}
                  <FormField
                    control={step2Form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo do Crédito *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Preciso de capital para aumentar volume de compras e conseguir melhores preços dos fornecedores chineses..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          <p><strong>Exemplos:</strong></p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>"Aumentar volume de compras para conseguir melhores preços"</li>
                            <li>"Aproveitar oportunidade sazonal (Black Friday, Natal)"</li>
                            <li>"Diversificar produtos e expandir para novos mercados"</li>
                            <li>"Melhorar prazo de pagamento com fornecedores"</li>
                          </ul>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Mínimo 20 caracteres</span>
                          <span>{field.value?.length || 0}/500</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documentation */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="pt-6">
              <Form {...step3Form}>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <FileText className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          Documentos Necessários
                        </h3>
                        <p className="text-blue-800 mb-4">
                          Após o envio da solicitação, nossa equipe entrará em contato para orientar sobre os documentos específicos necessários para sua análise.
                        </p>
                        <div className="space-y-2 text-sm text-blue-700">
                          <p><strong>Documentos geralmente solicitados:</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Contrato Social e alterações</li>
                            <li>Cartão CNPJ atualizado</li>
                            <li>Balanço Patrimonial dos últimos 2 anos</li>
                            <li>DRE dos últimos 12 meses</li>
                            <li>Comprovante de endereço da empresa</li>
                            <li>Documentos pessoais dos sócios</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-800 text-sm">
                        <strong>Observação Importante:</strong> Dependendo do tipo de operação e tamanho da empresa, nossa equipe de análise pode solicitar documentos adicionais ou dispensar alguns documentos complementares. Você será notificado sobre quaisquer documentos adicionais necessários após o envio da solicitação.
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={step3Form.control}
                    name="documentsConfirmed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            Confirmo que estou ciente dos documentos necessários e que nossa equipe entrará em contato para orientações específicas sobre a documentação.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              className="bg-spark-600 hover:bg-spark-700 flex items-center gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={submitApplication}
              disabled={submitApplicationMutation.isPending}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {submitApplicationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}