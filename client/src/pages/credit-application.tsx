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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import UnifiedDocumentUpload from "@/components/UnifiedDocumentUpload";
import { formatCnpj } from "@/lib/cnpj";
import { formatCpf } from "@/lib/cpf";
import { formatCep } from "@/lib/cep";
import { formatPhone } from "@/lib/phone";
import { formatUSDInput, parseUSDInput, validateUSDRange } from "@/lib/currency";
import { normalizeUrl, isValidUrl } from "@/lib/url";
import PreparationGuideModal from "@/components/credit/PreparationGuideModal";
import { 
  companyInfoSchema, 
  commercialInfoSchema, 
  creditInfoSchema,
  type InsertCreditApplication 
} from "@shared/schema";
import { 
  Building,
  User,
  Users,
  CreditCard,
  FileText,
  CheckCircle,
  Upload,
  Loader2,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Building2,
  Globe,
  DollarSign,
  Package,
  TrendingUp,
  MessageSquare,
  Calendar,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Minus,
  Trash2,
  XCircle,
  BarChart3
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

// Generate dynamic mandatory documents based on shareholders
const generateMandatoryDocuments = (shareholders: Array<{name: string; cpf: string; percentage: number}>) => {
  const baseDocs = [
    // 📁 1. Contrato Social (OBRIGATÓRIO)
    { 
      key: 'articles_of_association', 
      label: '🇧🇷 Contrato Social registrado na Junta Comercial', 
      subtitle: 'Articles of Association',
      observation: '💬 Instruir o cliente a enviar o contrato social completo e atualizado, com carimbo da Junta Comercial.',
      required: true 
    },
    // 🆔 2. Cartão CNPJ (OBRIGATÓRIO)
    { 
      key: 'business_license', 
      label: '🇧🇷 Cartão do CNPJ ou Certidão Simplificada da Junta Comercial', 
      subtitle: 'Business License',
      observation: '💬 Se preferir: pedir o comprovante de inscrição e situação cadastral da Receita Federal.',
      required: true 
    }
  ];

  // 3. Documentos dos Sócios (OBRIGATÓRIO)
  if (shareholders.length >= 2) {
    // Add documents for each shareholder
    shareholders.forEach((shareholder, index) => {
      baseDocs.push({
        key: `legal_representative_id_${index + 1}`,
        label: `🇧🇷 Documento de identificação do sócio ${shareholder.name} — CPF + RG ou CNH`,
        subtitle: 'Legal Representative ID Copy',
        observation: '💬 Solicitar documentos pessoais dos sócios administradores, preferencialmente em um único arquivo por sócio.',
        required: true
      });
    });
  } else {
    // Single shareholder
    baseDocs.push({
      key: 'legal_representative_id',
      label: '🇧🇷 Documento de identificação do(s) sócio(s) — CPF + RG ou CNH',
      subtitle: 'Legal Representative ID Copy',
      observation: '💬 Solicitar documentos pessoais dos sócios administradores, preferencialmente em um único arquivo por sócio.',
      required: true
    });
  }

  return baseDocs;
};

const optionalDocuments = [
  // 🧾 Documentação Fiscal (Agora Opcional)
  { 
    key: 'tax_registration_certificate', 
    label: '🇧🇷 Certidões Negativas de Débito (CND)', 
    subtitle: 'Tax Registration Certificate',
    observation: '💬 Receita Federal (Dívida Ativa + Tributos Federais), Estadual e Municipal. Todas podem ser obtidas gratuitamente nos sites dos respectivos órgãos.',
    required: false 
  },
  { 
    key: 'certificate_of_incorporation', 
    label: '🇧🇷 Certidão Simplificada da Junta Comercial', 
    subtitle: 'Certificate of Incorporation',
    observation: '💬 Documento pode ser emitido online no site da Junta Comercial do estado da empresa.',
    required: false 
  },
  // 📊 Documentação Financeira (Agora Opcional)
  { 
    key: 'financial_statements', 
    label: '🇧🇷 Balanços patrimoniais e DRE assinados pelo contador (últimos 3 anos)', 
    subtitle: 'Financial Statements (Last 3 Years)',
    observation: '💬 Idealmente com carimbo do CRC e assinatura digital. Se não houver balanço, pode-se aceitar declaração de faturamento.',
    required: false 
  },
  // 🌎 Comércio Exterior (Agora Opcional)
  { 
    key: 'export_import_license', 
    label: '🇧🇷 Habilitação no RADAR (Siscomex) ou Licença de Importação atual', 
    subtitle: 'Export/Import License',
    observation: '💬 Enviar cópia do comprovante de habilitação (print do portal Gov.br/Siscomex).',
    required: false 
  },
  // 📊 2. Documentação Financeira
  { 
    key: 'bank_reference_letter', 
    label: '🇧🇷 Carta do banco da empresa atestando relacionamento positivo', 
    subtitle: 'Bank Reference Letter',
    observation: '💬 Pode ser um e-mail oficial do gerente com assinatura eletrônica ou papel timbrado.',
    required: false 
  },
  { 
    key: 'credit_report', 
    label: '🇧🇷 Relatório da Serasa Experian / Boa Vista / Quod ou similar', 
    subtitle: 'Credit Report',
    observation: '💬 Documento não obrigatório, mas fortemente recomendado. Pode ser solicitado diretamente pela empresa no portal do bureau.',
    required: false 
  },
  // 🌎 4. Comércio Exterior e Operação
  { 
    key: 'customs_registration_certificate', 
    label: '🇧🇷 Mesmo documento do RADAR ou comprovante de atuação com despacho aduaneiro', 
    subtitle: 'Customs Registration Certificate',
    observation: '💬 Pode ser o mesmo arquivo usado na linha anterior.',
    required: false 
  },
  { 
    key: 'business_operation_certificates', 
    label: '🇧🇷 Alvará de Funcionamento ou Licença Municipal', 
    subtitle: 'Business Operation Certificates',
    observation: '💬 Documento expedido pela prefeitura ou secretaria de desenvolvimento econômico local.',
    required: false 
  },
  // 🤝 5. Comercial
  { 
    key: 'supplier_contract_sample', 
    label: '🇧🇷 Modelo de contrato com clientes ou fornecedores', 
    subtitle: 'Supplier Contract Sample',
    observation: '💬 Pode ser um modelo padrão, mesmo que em português. O objetivo é mostrar como a empresa formaliza negócios.',
    required: false 
  },
  { 
    key: 'main_customers_list', 
    label: '🇧🇷 Lista dos principais clientes, com país de destino e valor médio', 
    subtitle: 'Main Customers List',
    observation: '💬 Enviar como tabela simples com Nome da empresa, País, Produto e Valor médio/ano.',
    required: false 
  },
  { 
    key: 'sales_contracts_purchase_orders', 
    label: '🇧🇷 Exemplos reais de pedidos recentes ou contratos assinados', 
    subtitle: 'Sales Contracts / Purchase Orders',
    observation: '💬 Aceita até 3 PDFs ou imagens de pedidos/contratos de venda recentes (últimos 6 meses).',
    required: false 
  },
  { 
    key: 'insurance_claim_record', 
    label: '🇧🇷 Histórico de uso de seguro comercial ou declaração de que nunca utilizou', 
    subtitle: 'Insurance Claim Record (if any)',
    observation: '💬 Se houver, anexar comprovação. Caso contrário, instruir o cliente a anexar uma declaração assinada de que não há sinistros anteriores.',
    required: false 
  }
];

export default function CreditApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<InsertCreditApplication>>({});
  const [showPreparationModal, setShowPreparationModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, any>>({});
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [currentProduct, setCurrentProduct] = useState("");
  const [customDocuments, setCustomDocuments] = useState<Array<{key: string; name: string; observation?: string}>>([]);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [, setLocation] = useLocation();
  const [temporaryApplicationId, setTemporaryApplicationId] = useState<number | null>(null);

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



  // Submit application state with debounce protection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitInProgress, setSubmitInProgress] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(false);
  
  // Temporary application ID for immediate document persistence
  const [tempApplicationId, setTempApplicationId] = useState<number | null>(null);

  // Custom documents functions
  const addCustomDocument = () => {
    if (newDocumentName.trim()) {
      const customKey = `custom_${Date.now()}`;
      const newDoc = {
        key: customKey,
        name: newDocumentName.trim(),
        observation: "Documento adicional fornecido pelo cliente"
      };
      setCustomDocuments(prev => [...prev, newDoc]);
      setNewDocumentName("");
    }
  };

  const removeCustomDocument = (key: string) => {
    setCustomDocuments(prev => prev.filter(doc => doc.key !== key));
    // Also remove from uploaded documents
    setUploadedDocuments(prev => {
      const updatedDocs = { ...prev };
      delete updatedDocs[key];
      return updatedDocs;
    });
  };

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

  // Handle document upload in step 4 - Support multiple documents like details page
  const handleDocumentUpload = async (documentKey: string, file: File) => {
    setUploadingDocument(documentKey);

    try {
      // Validate file before uploading
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Arquivo muito grande (máximo 10MB)');
      }

      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        throw new Error(`Formato não suportado. Use: ${validExtensions.join(', ')}`);
      }

      // Convert file to base64 for local storage
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const documentInfo = {
          filename: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.id || 'temp_user',
          data: base64Data.split(',')[1], // Remove data:type;base64, prefix
          file: file // Store actual file object for later upload
        };

        setUploadedDocuments(prev => {
          const currentDocs = prev[documentKey];

          // If no documents exist for this key, create array with first document
          if (!currentDocs) {
            return {
              ...prev,
              [documentKey]: [documentInfo]
            };
          }

          // If current value is not an array, convert to array and add new document
          if (!Array.isArray(currentDocs)) {
            return {
              ...prev,
              [documentKey]: [currentDocs, documentInfo]
            };
          }

          // Add to existing array
          return {
            ...prev,
            [documentKey]: [...currentDocs, documentInfo]
          };
        });

        setUploadingDocument(null);
        toast({
          title: "Documento preparado!",
          description: `${file.name} será enviado com a solicitação.`,
        });

         // Create temporary application if not exists
         if (!temporaryApplicationId) {
          const tempAppData = {
            userId: user?.id,
            status: 'draft',
            currentStep: 4,
            documentsStatus: 'pending',
            legalCompanyName: companyForm.getValues("legalCompanyName") || "Empresa Temporária",
            cnpj: companyForm.getValues("cnpj") || "00.000.000/0000-00",
            address: companyForm.getValues("address") || "Endereço Temporário",
            city: companyForm.getValues("city") || "Cidade Temporária",
            state: companyForm.getValues("state") || "SP",
            zipCode: companyForm.getValues("zipCode") || "00000-000",
            phone: companyForm.getValues("phone") || "(11) 00000-0000",
            email: companyForm.getValues("email") || user?.email || "temp@temp.com",
            shareholders: [{ name: "Temporário", cpf: "000.000.000-00", percentage: 100 }],
            businessSector: commercialForm.getValues("businessSector") || "outros",
            annualRevenue: commercialForm.getValues("annualRevenue") || "ate_500k",
            mainImportedProducts: commercialForm.getValues("mainImportedProducts") || "Produtos Temporários",
            mainOriginMarkets: commercialForm.getValues("mainOriginMarkets") || "China",
            requestedAmount: creditForm.getValues("requestedAmount") || "100000",
            productsToImport: creditForm.getValues("productsToImport") || ["outros"],
            monthlyImportVolume: creditForm.getValues("monthlyImportVolume") || "10000",
            justification: creditForm.getValues("justification") || "Aplicação temporária para upload de documentos"
          };

          try {
            const tempAppResponse = await apiRequest("/api/credit/applications", "POST", tempAppData);
            setTemporaryApplicationId(tempAppResponse.id);
          } catch (error: any) {
            console.error("Temporary application creation error:", error);
            toast({
              title: "Erro",
              description: error.message || "Erro ao criar aplicação temporária",
              variant: "destructive",
            });
          }
        }
      };

      reader.onerror = () => {
        throw new Error('Erro ao processar o arquivo');
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      setUploadingDocument(null);
      toast({
        title: "Erro na preparação",
        description: error.message || "Não foi possível preparar o documento.",
        variant: "destructive",
      });
    }
  };

  const removeDocument = (documentKey: string, index?: number) => {
    setUploadedDocuments(prev => {
      const newDocs = { ...prev };
      if (index !== undefined) {
        // Remove specific document from array
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
        // Remove entire document key
        delete newDocs[documentKey];
      }
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
        // Must have all mandatory documents uploaded to complete step 4
        const currentShareholders = companyForm.getValues().shareholders || [];
        const currentDynamicMandatoryDocuments = generateMandatoryDocuments(currentShareholders);
        const mandatoryUploaded = currentDynamicMandatoryDocuments.filter(doc => 
          uploadedDocuments[doc.key]
        ).length;
        return mandatoryUploaded >= currentDynamicMandatoryDocuments.length;
      default:
        return false;
    }
  };

  const submitApplication = async () => {
    // Enhanced protection against multiple submissions
    if (isSubmitting || submitInProgress || submissionCompleted) {
      console.log('Submission blocked - already in progress or completed');
      return;
    }
    
    // Set all protection flags immediately
    setIsSubmitting(true);
    setSubmitInProgress(true);
    
    // Add a longer timestamp check to prevent rapid resubmissions
    const now = Date.now();
    if ((window as any).lastSubmissionTime && (now - (window as any).lastSubmissionTime) < 30000) {
      console.log('Submission blocked - too recent (30s cooldown)');
      setIsSubmitting(false);
      setSubmitInProgress(false);
      return;
    }
    
    (window as any).lastSubmissionTime = now;
    try {
      // Calculate documents status based on uploaded documents
      const currentShareholders = companyForm.getValues().shareholders || [];
      const currentDynamicMandatoryDocuments = generateMandatoryDocuments(currentShareholders);
      const mandatoryUploaded = currentDynamicMandatoryDocuments.filter(doc => 
        uploadedDocuments[doc.key]
      ).length;

      let documentsStatus = "pending";
      let applicationStatus = "pre_analysis";

      if (mandatoryUploaded >= currentDynamicMandatoryDocuments.length) {
        documentsStatus = "complete";
        applicationStatus = "pre_analysis";
      } else if (mandatoryUploaded > 0) {
        documentsStatus = "partial";
        applicationStatus = "pre_analysis";
      }

      // Prepare document data for inclusion in application submission
      const documentsForSubmission: Record<string, any> = {};
      const mandatoryDocKeys = currentDynamicMandatoryDocuments.map(doc => doc.key);

      // Convert uploaded documents to base64 format for database storage
      for (const [key, docData] of Object.entries(uploadedDocuments)) {
        const documentsArray = Array.isArray(docData) ? docData : [docData];
        const processedDocs = [];

        for (const docInfo of documentsArray) {
          if (docInfo && docInfo.data) {
            processedDocs.push({
              filename: docInfo.filename,
              originalName: docInfo.originalName,
              size: docInfo.size,
              type: docInfo.type,
              uploadedAt: docInfo.uploadedAt,
              uploadedBy: docInfo.uploadedBy,
              data: docInfo.data,
              isMandatory: mandatoryDocKeys.includes(key)
            });
          }
        }

        if (processedDocs.length > 0) {
          documentsForSubmission[key] = processedDocs.length === 1 ? processedDocs[0] : processedDocs;
        }
      }

      // Separate required and optional documents
      const requiredDocuments: Record<string, any> = {};
      const optionalDocuments: Record<string, any> = {};

      for (const [key, docs] of Object.entries(documentsForSubmission)) {
        if (mandatoryDocKeys.includes(key)) {
          requiredDocuments[key] = docs;
        } else {
          optionalDocuments[key] = docs;
        }
      }

      // Debug: Log document preparation
      console.log('🔍 FRONTEND DEBUG - Documents prepared for submission:');
      console.log('uploadedDocuments keys:', Object.keys(uploadedDocuments));
      console.log('documentsForSubmission keys:', Object.keys(documentsForSubmission));
      console.log('requiredDocuments keys:', Object.keys(requiredDocuments));
      console.log('optionalDocuments keys:', Object.keys(optionalDocuments));
      console.log('mandatoryDocKeys:', mandatoryDocKeys);

      // Create application data with embedded documents
      const applicationData = {
        ...formData,
        ...creditForm.getValues(),
        userId: user?.id,
        status: applicationStatus,
        currentStep: 4,
        documentsStatus: documentsStatus,
        requiredDocuments: requiredDocuments,
        optionalDocuments: optionalDocuments
      };

      console.log('🚀 FRONTEND DEBUG - Final applicationData structure:');
      console.log('Has requiredDocuments:', !!applicationData.requiredDocuments);
      console.log('Has optionalDocuments:', !!applicationData.optionalDocuments);
      console.log('RequiredDocuments count:', Object.keys(applicationData.requiredDocuments || {}).length);
      console.log('OptionalDocuments count:', Object.keys(applicationData.optionalDocuments || {}).length);

      // Submit application with documents using chunked approach
      console.log('📤 FRONTEND DEBUG - Sending application data...');
      
      // First, send application without documents
      const applicationWithoutDocs = { ...applicationData };
      applicationWithoutDocs.requiredDocuments = {};
      applicationWithoutDocs.optionalDocuments = {};
      
      const response = await apiRequest("/api/credit/applications", "POST", applicationWithoutDocs);
      const applicationId = response.id;
      
      console.log('✅ Application created with ID:', applicationId);
      
      // Then, send documents separately if any exist
      if (Object.keys(requiredDocuments).length > 0 || Object.keys(optionalDocuments).length > 0) {
        console.log('📎 Sending documents separately...');
        
        const documentPayload = {
          applicationId: applicationId,
          requiredDocuments: requiredDocuments,
          optionalDocuments: optionalDocuments
        };
        
        await apiRequest(`/api/credit/applications/${applicationId}/documents-batch`, "POST", documentPayload);
        console.log('✅ Documents saved successfully');
      }

      // Force immediate cache invalidation and refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      await queryClient.refetchQueries({ queryKey: ["/api/credit/applications"] });

      // Mark as completed to prevent further submissions
      setSubmissionCompleted(true);

      toast({
        title: "Sucesso!",
        description: "Solicitação de crédito enviada com sucesso com todos os documentos.",
      });

      // Wait before navigation to ensure cache is updated and user sees success message
      setTimeout(() => {
        setLocation('/credit');
      }, 1500);

    } catch (error: any) {
      console.error("Application submission error:", error);
      
      // Handle duplicate submission (HTTP 429)
      if (error.status === 429) {
        toast({
          title: "Solicitação já enviada",
          description: "Sua solicitação já foi processada com sucesso. Aguarde um momento antes de enviar uma nova.",
          variant: "default",
        });
        
        // Mark as completed to prevent further attempts
        setSubmissionCompleted(true);
        
        // Navigate after showing success message
        setTimeout(() => {
          setLocation('/credit');
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao enviar solicitação",
          variant: "destructive",
        });
        
        // Reset states on error to allow retry
        setIsSubmitting(false);
        setSubmitInProgress(false);
      }
    }
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
                          <Input 
                            placeholder="empresa.com, www.empresa.com ou https://www.empresa.com"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            onBlur={(e) => {
                              const normalizedUrl = normalizeUrl(e.target.value);
                              if (normalizedUrl && isValidUrl(normalizedUrl)) {
                                field.onChange(normalizedUrl);
                              }
                            }}
                          />
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
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                                min="0"
                                max="100"
                                step="1"
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
      {currentStep === 4 && (() => {
        // Calculate dynamic mandatory documents based on shareholders
        const shareholders = companyForm.getValues().shareholders || [];
        const dynamicMandatoryDocuments = generateMandatoryDocuments(shareholders);
        const minimumRequired = dynamicMandatoryDocuments.length; // Only the 3 mandatory documents

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-600" />
                Documentação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Multiple shareholders notification */}
              {shareholders.length >= 2 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Documentação para Múltiplos Sócios</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Detectamos {shareholders.length} sócios na empresa. Documentos específicos são necessários para cada sócio:
                      </p>
                      <ul className="text-sm text-amber-700 mt-2 space-y-1">
                        {shareholders.map((shareholder, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <strong>{shareholder.name}</strong> - {shareholder.percentage}% da empresa
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Required Documents */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-red-700">Documentos Obrigatórios</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Para prosseguir com a solicitação, você deve anexar <strong>todos os documentos obrigatórios</strong>. Os demais podem ser enviados posteriormente:
                </p>

                {/* Progress indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">
                      Documentos Obrigatórios Anexados: {dynamicMandatoryDocuments.filter(doc => uploadedDocuments[doc.key]).length} / {dynamicMandatoryDocuments.length}
                    </span>
                    <span className="text-xs text-blue-600">
                      Mínimo: {minimumRequired} para enviar solicitação
                    </span>
                  </div>
                </div>

                {dynamicMandatoryDocuments.map((doc) => (
                  <UnifiedDocumentUpload
                    key={doc.key}
                    documentKey={doc.key}
                    documentLabel={doc.label}
                    documentSubtitle={doc.subtitle}
                    documentObservation={doc.observation}
                    isRequired={doc.required}
                    uploadedDocuments={uploadedDocuments}
                    applicationId={temporaryApplicationId}
                    isUploading={uploadingDocument === doc.key}
                    onUpload={handleDocumentUpload}
                    onRemove={removeDocument}
                    allowMultiple={false}
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
                  {optionalDocuments.map((doc) => (
                    <UnifiedDocumentUpload
                      key={doc.key}
                      documentKey={doc.key}
                      documentLabel={doc.label}
                      documentSubtitle={doc.subtitle}
                      documentObservation={doc.observation}
                      isRequired={doc.required}
                      uploadedDocuments={uploadedDocuments}
                      applicationId={temporaryApplicationId}
                      isUploading={uploadingDocument === doc.key}
                      onUpload={handleDocumentUpload}
                      onRemove={removeDocument}
                      allowMultiple={false}
                    />
                  ))}
              </div>
            </div>

            {/* Custom Documents Module */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-green-700">Documentos Adicionais</h3>
              </div>
              <p className="text-sm text-gray-600">
                Tem algum documento específico que gostaria de anexar? Adicione documentos personalizados abaixo:
              </p>

              {/* Add Custom Document Input */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do documento (ex: Certificado ISO, Licença Específica, etc.)"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addCustomDocument}
                    disabled={!newDocumentName.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* List of Custom Documents */}
              {customDocuments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Seus Documentos Adicionais:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customDocuments.map((customDoc) => (
                      <div key={customDoc.key} className="relative">
                        <UnifiedDocumentUpload
                          documentKey={customDoc.key}
                          documentLabel={`🇧🇷 ${customDoc.name}`}
                          documentSubtitle="Custom Document"
                          documentObservation={customDoc.observation || "Documento adicional fornecido pelo cliente"}
                          isRequired={false}
                          uploadedDocuments={uploadedDocuments}
                          applicationId={temporaryApplicationId}
                          isUploading={uploadingDocument === customDoc.key}
                          onUpload={handleDocumentUpload}
                          onRemove={removeDocument}
                          allowMultiple={false}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomDocument(customDoc.key)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
        );
      })()}

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
            disabled={isSubmitting || submitInProgress || submissionCompleted || !getStepStatus(4)}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || submitInProgress ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : submissionCompleted ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Enviado com Sucesso
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