import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { brazilianStates, businessSectors, revenueRanges } from "@/lib/constants";

// Form schemas
const companyInfoSchema = z.object({
  legalCompanyName: z.string().min(1, "Nome da empresa é obrigatório"),
  tradingName: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP deve ter 8 dígitos"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  website: z.string().optional(),
  shareholders: z.array(z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
    percentage: z.number().min(1).max(100, "Porcentagem deve estar entre 1 e 100")
  })).min(1, "Pelo menos um sócio é obrigatório")
});

const commercialInfoSchema = z.object({
  businessSector: z.string().min(1, "Setor é obrigatório"),
  annualRevenue: z.string().min(1, "Faturamento anual é obrigatório"),
  mainImportedProducts: z.string().min(1, "Produtos importados são obrigatórios"),
  mainOriginMarkets: z.string().min(1, "Mercados de origem são obrigatórios")
});

const creditInfoSchema = z.object({
  requestedAmount: z.string().min(1, "Valor solicitado é obrigatório"),
  productsToImport: z.array(z.string()).min(1, "Pelo menos um produto é obrigatório"),
  monthlyImportVolume: z.string().min(1, "Volume mensal é obrigatório"),
  justification: z.string().min(10, "Justificativa deve ter pelo menos 10 caracteres")
});

type CompanyInfoForm = z.infer<typeof companyInfoSchema>;
type CommercialInfoForm = z.infer<typeof commercialInfoSchema>;
type CreditInfoForm = z.infer<typeof creditInfoSchema>;

// Document types
const mandatoryDocuments = [
  { key: "contract_social", label: "Contrato Social" },
  { key: "cnpj_certificate", label: "Certificado CNPJ" },
  { key: "financial_statement", label: "Demonstrativo Financeiro" },
  { key: "tax_clearance", label: "Certidão Negativa" },
  { key: "business_license", label: "Alvará de Funcionamento" }
];

const optionalDocuments = [
  { key: "bank_reference", label: "Referência Bancária" },
  { key: "commercial_reference", label: "Referência Comercial" },
  { key: "insurance_policy", label: "Apólice de Seguro" }
];

export default function CreditApplicationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form states
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [productTags, setProductTags] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, any>>({});
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  
  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitInProgress, setSubmitInProgress] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(false);

  // Form hooks
  const companyForm = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      shareholders: [{ name: "", cpf: "", percentage: 100 }]
    }
  });

  const commercialForm = useForm<CommercialInfoForm>({
    resolver: zodResolver(commercialInfoSchema)
  });

  const creditForm = useForm<CreditInfoForm>({
    resolver: zodResolver(creditInfoSchema),
    defaultValues: {
      productsToImport: []
    }
  });

  // Document upload handler
  const handleDocumentUpload = async (documentKey: string, file: File) => {
    if (!file) return;

    try {
      setUploadingDocument(documentKey);

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const documentInfo = {
          filename: `${documentKey}_${Date.now()}.${file.name.split('.').pop()}`,
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.email || "unknown",
          data: base64Data
        };

        setUploadedDocuments(prev => {
          const currentDocs = prev[documentKey];
          
          if (!currentDocs) {
            return {
              ...prev,
              [documentKey]: [documentInfo]
            };
          }

          if (!Array.isArray(currentDocs)) {
            return {
              ...prev,
              [documentKey]: [currentDocs, documentInfo]
            };
          }

          return {
            ...prev,
            [documentKey]: [...currentDocs, documentInfo]
          };
        });

        setUploadingDocument(null);
        toast({
          title: "Documento carregado!",
          description: `${file.name} foi adicionado com sucesso.`,
        });
      };

      reader.onerror = () => {
        throw new Error('Erro ao processar o arquivo');
      };

      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error("Document upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
      setUploadingDocument(null);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep === 1) {
      setFormData(prev => ({ ...prev, company: companyForm.getValues() }));
    } else if (currentStep === 2) {
      setFormData(prev => ({ ...prev, commercial: commercialForm.getValues() }));
    } else if (currentStep === 3) {
      setFormData(prev => ({ ...prev, credit: creditForm.getValues() }));
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep === 2) {
      if (companyForm.formState.isValid) {
        setFormData(prev => ({ ...prev, company: companyForm.getValues() }));
      }
    } else if (currentStep === 3) {
      if (commercialForm.formState.isValid) {
        setFormData(prev => ({ ...prev, commercial: commercialForm.getValues() }));
      }
    } else if (currentStep === 4) {
      if (creditForm.formState.isValid) {
        setFormData(prev => ({ ...prev, credit: creditForm.getValues() }));
      }
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submission handler
  const submitApplication = async () => {
    if (isSubmitting || submitInProgress || submissionCompleted) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitInProgress(true);
    
    try {
      const currentShareholders = companyForm.getValues().shareholders || [];
      
      // Prepare document data
      const requiredDocuments: Record<string, any> = {};
      const optionalDocs: Record<string, any> = {};

      for (const [key, docData] of Object.entries(uploadedDocuments)) {
        const isMandatory = mandatoryDocuments.some(doc => doc.key === key);
        if (isMandatory) {
          requiredDocuments[key] = docData;
        } else {
          optionalDocs[key] = docData;
        }
      }

      const applicationData = {
        ...formData,
        ...creditForm.getValues(),
        userId: user?.id,
        status: "pre_analysis",
        documentsStatus: "complete",
        currency: "USD",
        productsToImport: productTags.length > 0 ? productTags : ["Outros"],
        requiredDocuments: JSON.stringify(requiredDocuments),
        optionalDocuments: JSON.stringify(optionalDocs),
        shareholders: JSON.stringify(currentShareholders)
      };

      const response = await apiRequest("/api/credit/applications", "POST", applicationData);
      
      queryClient.invalidateQueries({ queryKey: ['/api/credit/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/importer'] });
      
      setSubmissionCompleted(true);
      
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de crédito foi enviada com sucesso.",
      });

      setTimeout(() => {
        setLocation('/credit');
      }, 1000);
      
    } catch (error: any) {
      console.error("Submission error:", error);
      
      toast({
        title: "Erro ao enviar",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      });
      
      setSubmissionCompleted(false);
    } finally {
      setIsSubmitting(false);
      setSubmitInProgress(false);
    }
  };

  const removeDocument = (documentKey: string, index?: number) => {
    setUploadedDocuments(prev => {
      const newDocs = { ...prev };
      if (index !== undefined) {
        const currentDocs = newDocs[documentKey];
        if (Array.isArray(currentDocs)) {
          const updatedDocs = currentDocs.filter((_, i) => i !== index);
          if (updatedDocs.length === 0) {
            delete newDocs[documentKey];
          } else {
            newDocs[documentKey] = updatedDocs;
          }
        }
      } else {
        delete newDocs[documentKey];
      }
      return newDocs;
    });
  };

  const addProductTag = (product: string) => {
    if (product && !productTags.includes(product)) {
      setProductTags([...productTags, product]);
    }
  };

  const removeProductTag = (index: number) => {
    setProductTags(productTags.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solicitação de Crédito
          </h1>
          <p className="text-gray-600">
            Complete todas as etapas para solicitar seu crédito de importação
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              Etapa {currentStep} de 4
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 4) * 100)}% concluído
            </span>
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Informações da Empresa"}
              {currentStep === 2 && "Informações Comerciais"}
              {currentStep === 3 && "Informações de Crédito"}
              {currentStep === 4 && "Upload de Documentos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <Form {...companyForm}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="legalCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="00.000.000/0000-00" />
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
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brazilianStates.map((state) => (
                                <SelectItem key={state.code} value={state.code}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="00000-000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={companyForm.control}
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
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
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
                            <Input {...field} placeholder="https://" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            )}

            {/* Step 2: Commercial Information */}
            {currentStep === 2 && (
              <Form {...commercialForm}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={commercialForm.control}
                      name="businessSector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor de Atividade *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o setor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessSectors.map((sector) => (
                                <SelectItem key={sector.value} value={sector.value}>
                                  {sector.label}
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
                                <SelectItem key={range.value} value={range.value}>
                                  {range.label}
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
                          <Textarea {...field} rows={3} />
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
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}

            {/* Step 3: Credit Information */}
            {currentStep === 3 && (
              <Form {...creditForm}>
                <form className="space-y-6">
                  <FormField
                    control={creditForm.control}
                    name="requestedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Solicitado (USD) *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="10000" max="1000000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Produtos a Importar *</FormLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Digite um produto e pressione Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value) {
                              addProductTag(value);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <Button type="button" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {productTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeProductTag(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={creditForm.control}
                    name="monthlyImportVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume Mensal de Importação (USD) *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={creditForm.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justificativa *</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Documentos Obrigatórios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mandatoryDocuments.map((doc) => (
                      <div key={doc.key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{doc.label}</span>
                          {uploadedDocuments[doc.key] ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentUpload(doc.key, file);
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {uploadingDocument === doc.key && (
                            <div className="text-sm text-blue-600">Enviando...</div>
                          )}
                          {uploadedDocuments[doc.key] && (
                            <div className="text-sm text-green-600">
                              Documento enviado com sucesso
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Documentos Opcionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {optionalDocuments.map((doc) => (
                      <div key={doc.key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{doc.label}</span>
                          {uploadedDocuments[doc.key] ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentUpload(doc.key, file);
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {uploadingDocument === doc.key && (
                            <div className="text-sm text-blue-600">Enviando...</div>
                          )}
                          {uploadedDocuments[doc.key] && (
                            <div className="text-sm text-green-600">
                              Documento enviado com sucesso
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submitApplication}
                  disabled={isSubmitting || submitInProgress || submissionCompleted}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}