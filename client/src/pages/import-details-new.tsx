import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  ArrowLeft, 
  Edit, 
  Package,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

// Componente de informações básicas da importação
function ImportBasicInfo({ importData }: { importData: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações da Importação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nome da Importação</label>
              <p className="font-semibold">{importData.importName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Valor Total</label>
              <p className="font-semibold">{formatCurrency(importData.totalValue).replace('R$', 'US$')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <Badge variant={importData.status === 'planning' ? 'secondary' : 'default'}>
                {importData.status === 'planning' ? 'Planejamento' : importData.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Carga</label>
              <p>{importData.cargoType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Método de Envio</label>
              <p>{importData.shippingMethod === 'sea' ? 'Marítimo' : importData.shippingMethod}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Incoterms</label>
              <p>{importData.incoterms}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {importData.products?.map((product: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Produto</label>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quantidade</label>
                    <p>{product.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Preço Unitário</label>
                    <p>{formatCurrency(product.unitPrice).replace('R$', 'US$')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor Total</label>
                    <p className="font-semibold">{formatCurrency(product.totalValue).replace('R$', 'US$')}</p>
                  </div>
                </div>
                {product.description && (
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <p className="text-sm text-gray-700">{product.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de cronograma de pagamentos
function ImportPayments({ importId }: { importId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentSchedule = [], isLoading, error } = useQuery({
    queryKey: ['/api/payments/schedule', importId],
    queryFn: () => apiRequest(`/api/payments/schedule/${importId}`, 'GET'),
    retry: false
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: () => apiRequest(`/api/payments/generate/${importId}`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/schedule', importId] });
      toast({
        title: "Cronograma gerado com sucesso",
        description: "O cronograma de pagamentos foi criado baseado nas condições de crédito aprovadas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar cronograma",
        description: error.message || "Não foi possível gerar o cronograma de pagamentos.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div>Carregando cronograma de pagamentos...</div>;
  }

  const getPaymentTypeLabel = (type: string, payment: any) => {
    switch (type) {
      case 'down_payment': return `Down Payment (30%)`;
      case 'installment': return `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`;
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cronograma de Pagamentos
            </div>
            {(error || paymentSchedule.length === 0) && (
              <Button
                onClick={() => generatePaymentsMutation.mutate()}
                disabled={generatePaymentsMutation.isPending}
                size="sm"
              >
                {generatePaymentsMutation.isPending ? 'Gerando...' : 'Gerar Cronograma'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentSchedule.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Nenhum cronograma de pagamento encontrado
              </p>
              <p className="text-sm text-gray-400">
                Clique em "Gerar Cronograma" para criar os pagamentos baseados nas condições de crédito aprovadas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentSchedule.map((payment: any, index: number) => (
                <div key={payment.id || index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">
                          {getPaymentTypeLabel(payment.paymentType, payment)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Vencimento: {formatDate(payment.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(payment.amount).replace('R$', 'US$')}
                      </p>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de documentos da importação
function ImportDocuments({ importId }: { importId: number }) {
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['/api/import-documents', importId],
    queryFn: () => apiRequest(`/api/import-documents/${importId}`, 'GET')
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('importId', importId.toString());
      
      return apiRequest('/api/import-documents/upload', 'POST', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import-documents', importId] });
      toast({
        title: "Documento enviado com sucesso",
        description: "O documento foi anexado à importação.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar documento",
        description: "Ocorreu um erro ao anexar o documento.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploadingDoc(null);
    }
  });

  const documentTypes = [
    { key: 'proforma_invoice', label: 'Proforma Invoice' },
    { key: 'commercial_invoice', label: 'Commercial Invoice' },
    { key: 'bill_of_lading', label: 'Bill of Lading (B/L)' },
    { key: 'packing_list', label: 'Packing List' },
    { key: 'certificate_origin', label: 'Certificado de Origem' },
    { key: 'import_license', label: 'Licença de Importação' },
    { key: 'insurance_policy', label: 'Apólice de Seguro' },
    { key: 'bank_documents', label: 'Documentos Bancários' },
    { key: 'customs_declaration', label: 'Declaração Aduaneira' },
    { key: 'transport_documents', label: 'Documentos de Transporte' },
    { key: 'quality_certificate', label: 'Certificado de Qualidade' },
    { key: 'other', label: 'Outros Documentos' }
  ];

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return;
    
    setUploadingDoc(documentType);
    uploadMutation.mutate({ file, documentType });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos da Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentTypes.map((docType) => {
              const existingDoc = documents.find((doc: any) => doc.documentType === docType.key);
              
              return (
                <div key={docType.key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{docType.label}</h4>
                    {existingDoc ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  {existingDoc ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Enviado em: {formatDate(existingDoc.uploadedAt)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Download do documento
                            window.open(`/api/import-documents/download/${existingDoc.id}`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id={`file-${docType.key}`}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, docType.key);
                          }
                        }}
                        disabled={uploadingDoc === docType.key}
                      />
                      <label
                        htmlFor={`file-${docType.key}`}
                        className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
                          uploadingDoc === docType.key ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">
                          {uploadingDoc === docType.key ? 'Enviando...' : 'Anexar Documento'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImportDetailsPage() {
  const [match, params] = useRoute("/imports/details/:id");
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserPermissions();

  const importId = params?.id ? parseInt(params.id) : 
    location.startsWith('/imports/details/') ? 
    parseInt(location.split('/imports/details/')[1]) : null;

  const { data: importData, isLoading, error } = useQuery({
    queryKey: ["/api/imports", importId],
    queryFn: async () => {
      if (!importId) throw new Error("ID da importação não encontrado");
      
      const endpoint = isAdmin 
        ? `/api/admin/imports/${importId}`
        : `/api/imports/${importId}`;
      
      return apiRequest(endpoint, 'GET');
    },
    enabled: !!importId,
  });

  if (isLoading) {
    return <div className="p-6">Carregando detalhes da importação...</div>;
  }

  if (error || !importData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Erro</h1>
        <p>Não foi possível carregar os detalhes da importação.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/imports')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{importData.importName}</h1>
            <p className="text-gray-600">
              Importação ID: {importData.id} • {formatCurrency(importData.totalValue).replace('R$', 'US$')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setLocation(`/imports/edit/${importId}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Sistema de Abas */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Dados da Importação</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="mt-6">
          <ImportBasicInfo importData={importData} />
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          <ImportPayments importId={importId!} />
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6">
          <ImportDocuments importId={importId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}