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
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { formatCnpj } from "@/lib/cnpj";
import { formatCpf } from "@/lib/cpf";
import { formatCep } from "@/lib/cep";
import { formatPhone } from "@/lib/phone";
import { formatUSDInput, parseUSDInput, validateUSDRange } from "@/lib/currency";
import PreparationGuideModal from "@/components/credit/PreparationGuideModal";
import { SmartDocumentUpload } from "@/components/SmartDocumentUpload";
import { 
  companyInfoSchema, 
  commercialInfoSchema, 
  creditInfoSchema,
  type InsertCreditApplication 
} from "@shared/schema";
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
  Trash2,
  AlertCircle,
  Info,
  Eye
} from "lucide-react";

// Multi-step form type definitions
type CompanyInfoForm = {
  legalCompanyName: string;
  tradingName?: string;
  cnpj: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  shareholders: Array<{
    name: string;
    cpf: string;
    percentage: number;
  }>;
};

type CommercialInfoForm = {
  businessSector: string;
  annualRevenue: string;
  mainImportedProducts: string;
  mainOriginMarkets: string;
};

type CreditInfoForm = {
  requestedAmount: string;
  productsToImport: string[];
  monthlyImportVolume: string;
  justification: string;
};

// Business sectors for dropdown
const businessSectors = [
  "Tecnologia",
  "Máquinas e Equipamentos", 
  "Automotivo",
  "Têxtil",
  "Químico/Farmacêutico",
  "Alimentos",
  "Construção Civil",
  "Eletrônicos",
  "Outro"
];

// Revenue ranges
const revenueRanges = [
  "Até R$ 1 milhão",
  "R$ 1 a 5 milhões", 
  "R$ 5 a 20 milhões",
  "R$ 20 a 50 milhões",
  "R$ 50 a 100 milhões",
  "Acima de R$ 100 milhões"
];

// Document requirements
const requiredDocuments = [
  { key: "contractSocial", name: "Contrato Social", description: "Contrato social completo da empresa" },
  { key: "shareholderDocs", name: "Documentos dos Sócios", description: "CPF e RG de todos os sócios" }
];

const optionalDocuments = [
  { key: "businessLicense", name: "Alvará de Funcionamento", description: "Cópia atualizada da licença comercial da empresa" },
  { key: "incorporationCert", name: "Certificado de Constituição", description: "Certificado de constituição da empresa" },
  { key: "companyProfile", name: "Perfil da Empresa", description: "Apresentação institucional da empresa" },
  { key: "financialStatements", name: "Demonstrações Financeiras (3 anos)", description: "Balanços, DRE e fluxo de caixa" },
  { key: "bankReference", name: "Carta de Referência Bancária", description: "Carta do banco principal da empresa" },
  { key: "creditReport", name: "Relatório de Crédito", description: "Relatório de crédito da empresa" },
  { key: "taxCertificate", name: "Certificado Fiscal", description: "Comprovação de regularidade fiscal" },
  { key: "importLicense", name: "Licença de Importação", description: "Licenças de importação (se aplicável)" },
  { key: "customsRegistration", name: "Registro Alfandegário", description: "Certificado de registro alfandegário" },
  { key: "operationCertificates", name: "Certificados Operacionais", description: "Certificados específicos do setor" },
  { key: "legalRepId", name: "Documento do Representante Legal", description: "CPF e RG do representante legal" },
  { key: "supplierContracts", name: "Contratos com Fornecedores", description: "Modelos de contrato com fornecedores" },
  { key: "customerList", name: "Lista de Principais Clientes", description: "Lista com principais clientes e volumes" },
  { key: "insuranceClaims", name: "Registro de Sinistros (3 anos)", description: "Histórico de sinistros de seguro" },
  { key: "salesContracts", name: "Contratos de Venda", description: "Exemplos de contratos ou POs recentes" }
];

export default function CreditApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<InsertCreditApplication>>({});
  const [showPreparationModal, setShowPreparationModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [uploadingDocuments, setUploadingDocuments] = useState<Record<string, boolean>>({});
  const [productTags, setProductTags] = useState<string[]>([]);
  const [currentProduct, setCurrentProduct] = useState("");
  const [, setLocation] = useLocation();

  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-spark-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  // Form instances for each step
  const companyForm = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
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
      shareholders: [{ name: "", cpf: "", percentage: 0 }],
    },
  });

  const commercialForm = useForm<CommercialInfoForm>({
    resolver: zodResolver(commercialInfoSchema),
    defaultValues: {
      businessSector: "",
      annualRevenue: "",
      mainImportedProducts: "",
      mainOriginMarkets: "",
    },
  });

  const creditForm = useForm<CreditInfoForm>({
    resolver: zodResolver(creditInfoSchema),
    defaultValues: {
      requestedAmount: "",
      productsToImport: [],
      monthlyImportVolume: "",
      justification: "",
    },
  });



  // Submit application mutation
  const submitApplicationMutation = useMutation({
    mutationFn: async (data: Partial<InsertCreditApplication>) => {
      const response = await apiRequest("/api/credit/applications", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      toast({
        title: "Sucesso!",
        description: "Solicitação de crédito enviada com sucesso.",
      });
      // Navigate to credit management page with smooth transition
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

  // Add/remove shareholders
  const addShareholder = () => {
    const current = companyForm.getValues("shareholders");
    companyForm.setValue("shareholders", [...current, { name: "", cpf: "", percentage: 0 }]);
  };

  const removeShareholder = (index: number) => {
    const current = companyForm.getValues("shareholders");
    if (current.length > 1) {
      companyForm.setValue("shareholders", current.filter((_, i) => i !== index));
    }
  };

  // Product tags functions
  const addProductTag = () => {
    if (currentProduct.trim() && !productTags.includes(currentProduct.trim())) {
      const newTags = [...productTags, currentProduct.trim()];
      setProductTags(newTags);
      setCurrentProduct("");
      creditForm.setValue("productsToImport", newTags);
      // Force form validation update
      creditForm.trigger("productsToImport");
    }
  };

  const removeProductTag = (tagToRemove: string) => {
    const newTags = productTags.filter(tag => tag !== tagToRemove);
    setProductTags(newTags);
    creditForm.setValue("productsToImport", newTags);
    // Force form validation update
    creditForm.trigger("productsToImport");
  };

  const handleProductKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProductTag();
    }
  };

  // Document upload handler with uploading state management
  const handleDocumentUpload = (documentKey: string, file: File) => {
    // Set uploading state
    setUploadingDocuments(prev => ({
      ...prev,
      [documentKey]: true
    }));

    // Simulate upload process (in real implementation this would be an API call)
    setTimeout(() => {
      setUploadedDocuments(prev => ({
        ...prev,
        [documentKey]: file
      }));

      // Clear uploading state
      setUploadingDocuments(prev => ({
        ...prev,
        [documentKey]: false
      }));

      toast({
        title: "Sucesso",
        description: `Documento "${file.name}" anexado com sucesso.`,
      });
    }, 1000);
  };

  const removeDocument = (documentKey: string) => {
    setUploadedDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[documentKey];
      return newDocs;
    });
  };

  // Step navigation with flexible movement
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      // Save current form data before switching
      if (currentStep === 1) {
        setFormData(prev => ({ ...prev, ...companyForm.getValues() }));
      } else if (currentStep === 2) {
        setFormData(prev => ({ ...prev, ...commercialForm.getValues() }));
      } else if (currentStep === 3) {
        setFormData(prev => ({ ...prev, ...creditForm.getValues() }));
      }
      setCurrentStep(step);
    }
  };

  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = await companyForm.trigger();
      if (isValid) {
        setFormData(prev => ({ ...prev, ...companyForm.getValues() }));
      }
    } else if (currentStep === 2) {
      isValid = await commercialForm.trigger();
      if (isValid) {
        setFormData(prev => ({ ...prev, ...commercialForm.getValues() }));
      }
    } else if (currentStep === 3) {
      isValid = await creditForm.trigger();
      if (isValid) {
        setFormData(prev => ({ ...prev, ...creditForm.getValues() }));
      }
    }
    
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check step completion status
  const getStepStatus = (step: number) => {
    switch (step) {
      case 1:
        const companyData = companyForm.getValues();
        return companyData.legalCompanyName && companyData.cnpj && companyData.address && 
               companyData.city && companyData.state && companyData.zipCode && 
               companyData.phone && companyData.email && companyData.shareholders.length > 0;
      case 2:
        const commercialData = commercialForm.getValues();
        return commercialData.businessSector && commercialData.annualRevenue && 
               commercialData.mainImportedProducts && commercialData.mainOriginMarkets;
      case 3:
        const creditData = creditForm.getValues();
        return creditData.requestedAmount && 
               productTags.length > 0 &&
               creditData.monthlyImportVolume && creditData.justification;
      case 4:
        return false; // Documents step requires actual document uploads
      default:
        return false;
    }
  };

  const submitApplication = () => {
    const finalData = {
      ...formData,
      ...creditForm.getValues(),
      status: "pending",
      currentStep: 4,
      documentsStatus: "pending"
    };
    submitApplicationMutation.mutate(finalData);
  };

  // Interactive step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => {
        const isCompleted = getStepStatus(step) || step < currentStep;
        const isCurrent = step === currentStep;
        const isClickable = step <= currentStep || isCompleted;
        
        return (
          <div key={step} className="flex items-center">
            <button
              onClick={() => isClickable && goToStep(step)}
              disabled={!isClickable}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                isCurrent 
                  ? 'bg-spark-600 border-spark-600 text-white shadow-lg' 
                  : isCompleted 
                    ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                    : isClickable
                      ? 'border-gray-400 text-gray-600 hover:border-spark-400 hover:text-spark-600'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
              title={isClickable ? `Ir para ${stepTitles[step - 1]}` : 'Complete a etapa anterior primeiro'}
            >
              {isCompleted && !isCurrent ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{step}</span>
              )}
            </button>
            {step < 4 && (
              <div className={`w-16 h-0.5 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const stepTitles = [
    "Dados da Empresa",
    "Informações Comerciais", 
    "Dados do Crédito",
    "Documentação"
  ];

  return (
    <>
      {/* Preparation Guide Modal */}
      <PreparationGuideModal
        isOpen={showPreparationModal}
        onClose={() => setShowPreparationModal(false)}
        onContinue={() => setShowPreparationModal(false)}
      />

      {/* Requirements Modal */}
      <PreparationGuideModal
        isOpen={showRequirementsModal}
        onClose={() => setShowRequirementsModal(false)}
        onContinue={() => setShowRequirementsModal(false)}
      />

      <div className="space-y-6">
        {/* Header - Following standard pattern */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitação de Crédito</h1>
            <p className="text-gray-600 mt-1">Preencha todas as informações para solicitar seu crédito de importação</p>
          </div>
          
          {/* Requirements Button */}
          <Button
            variant="outline"
            onClick={() => setShowRequirementsModal(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 shrink-0"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Todos os Requisitos
          </Button>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Current Step Title */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{stepTitles[currentStep - 1]}</h2>
        </div>

      {/* Step 1: Company Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...companyForm}>
              <form className="space-y-6">
                {/* Basic Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="legalCompanyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome Empresarial Ltda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={companyForm.control}
                    name="tradingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Fantasia</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome comercial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Registration Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00.000.000/0000-00"
                            {...field}
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
                    control={companyForm.control}
                    name="stateRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000.000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={companyForm.control}
                    name="municipalRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Municipal</FormLabel>
                        <FormControl>
                          <Input placeholder="000000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço *</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, Avenida, número, bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={companyForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00000-000"
                            {...field}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={companyForm.control}
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
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(11) 99999-9999"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={companyForm.control}
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
                    control={companyForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Shareholders Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Estrutura Societária
                    </h3>
                    <Button type="button" onClick={addShareholder} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Sócio
                    </Button>
                  </div>
                  
                  {companyForm.watch("shareholders").map((_, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                      <FormField
                        control={companyForm.control}
                        name={`shareholders.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Sócio *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name={`shareholders.${index}.cpf`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000.000.000-00"
                                {...field}
                                onChange={(e) => {
                                  const formatted = formatCpf(e.target.value);
                                  field.onChange(formatted);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name={`shareholders.${index}.percentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Participação (%) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="50"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeShareholder(index)}
                          disabled={companyForm.watch("shareholders").length === 1}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Percentage validation */}
                  <div className="text-sm text-gray-600">
                    Total de participação: {
                      companyForm.watch("shareholders").reduce((sum, s) => sum + (s.percentage || 0), 0)
                    }% (deve somar 100%)
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Commercial Information */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Informações Comerciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...commercialForm}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={commercialForm.control}
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
                    control={commercialForm.control}
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
                
                <FormField
                  control={commercialForm.control}
                  name="mainImportedProducts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principais Produtos Importados *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Componentes eletrônicos, matérias-primas, etc."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={commercialForm.control}
                  name="mainOriginMarkets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principais Mercados de Origem *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: China, EUA, União Europeia, etc."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Credit Information */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Dados do Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...creditForm}>
              <form className="space-y-6">
                {/* Credit Amount */}
                <FormField
                  control={creditForm.control}
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


                
                {/* Products to Import - Tag System */}
                <FormField
                  control={creditForm.control}
                  name="productsToImport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Produtos a Importar *
                      </FormLabel>
                      
                      <div className="flex gap-2">
                        <Input
                          value={currentProduct}
                          onChange={(e) => setCurrentProduct(e.target.value)}
                          onKeyPress={handleProductKeyPress}
                          placeholder="Digite um produto e pressione Enter"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          onClick={addProductTag}
                          disabled={!currentProduct.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Adicionar
                        </Button>
                      </div>

                      {/* Product Tags Display */}
                      {productTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          {productTags.map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeProductTag(tag)}
                                className="text-blue-600 hover:text-blue-800 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {productTags.length === 0 && (
                        <p className="text-sm text-gray-500">Adicione pelo menos um produto</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monthly Import Volume */}
                <FormField
                  control={creditForm.control}
                  name="monthlyImportVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        Volume Mensal de Importação *
                      </FormLabel>
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
                  control={creditForm.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo do Crédito *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Preciso de capital para aumentar volume de compras e conseguir melhores preços dos fornecedores chineses. Com maior volume, posso reduzir custos e melhorar margem de lucro..."
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

      {/* Step 4: Documentation */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-600" />
              Documentação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required Documents */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-red-700">Documentos Obrigatórios</h3>
              </div>
              <p className="text-sm text-gray-600">
                Estes documentos são obrigatórios para análise da solicitação de crédito:
              </p>
              
              {requiredDocuments.map((doc) => (
                <SmartDocumentUpload
                  key={doc.key}
                  documentKey={doc.key}
                  documentLabel={doc.name}
                  isRequired={true}
                  isUploaded={!!uploadedDocuments[doc.key]}
                  isUploading={!!uploadingDocuments[doc.key]}
                  onUpload={(file) => handleDocumentUpload(doc.key, file)}
                />
              ))}
            </div>

            {/* Optional Documents */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-blue-700">Documentos Complementares</h3>
              </div>
              <p className="text-sm text-gray-600">
                Estes documentos podem ser anexados agora ou posteriormente. Quanto mais documentos fornecidos, mais rápida será a análise:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optionalDocuments.map((doc, index) => (
                  <SmartDocumentUpload
                    key={index}
                    documentKey={`optional_${index}`}
                    documentLabel={doc.name}
                    isRequired={false}
                    isUploaded={!!uploadedDocuments[`optional_${index}`]}
                    isUploading={!!uploadingDocuments[`optional_${index}`]}
                    onUpload={(file) => handleDocumentUpload(`optional_${index}`, file)}
                  />
                ))}
              </div>
            </div>

            {/* Information Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Observação Importante</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Dependendo do tipo de operação e tamanho da empresa, nossa equipe de análise pode solicitar documentos adicionais ou dispensar alguns documentos complementares. Você será notificado sobre quaisquer documentos adicionais necessários após o envio da solicitação.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        
        {currentStep < 4 ? (
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