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
  AlertCircle,
  Ship,
  Plane,
  Truck
} from "lucide-react";

// Componente de informações básicas da importação
function ImportBasicInfo({ importData }: { importData: any }) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      estimativa: { label: "Estimativa", color: "bg-gray-100 text-gray-700" },
      producao: { label: "Produção", color: "bg-blue-100 text-blue-700" },
      entregue_agente: { label: "Entregue Agente", color: "bg-yellow-100 text-yellow-700" },
      transporte_maritimo: { label: "Transporte Marítimo", color: "bg-indigo-100 text-indigo-700" },
      transporte_aereo: { label: "Transporte Aéreo", color: "bg-purple-100 text-purple-700" },
      desembaraco: { label: "Desembaraço", color: "bg-orange-100 text-orange-700" },
      transporte_nacional: { label: "Transporte Nacional", color: "bg-cyan-100 text-cyan-700" },
      concluido: { label: "Concluído", color: "bg-green-100 text-green-700" },
      planning: { label: "Planejamento", color: "bg-gray-100 text-gray-700" },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.planning;
  };

  const statusInfo = getStatusBadge(importData.status);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Informações da Importação */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-blue-600" />
                Informações da Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Nome da Importação</label>
                  <p className="text-lg font-semibold text-gray-900">{importData.importName || `Importação #${importData.id}`}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={`${statusInfo.color} border-0 text-sm px-3 py-1`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Tipo de Carga</label>
                  <p className="text-base font-medium text-gray-900">{importData.cargoType}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Método de Envio</label>
                  <p className="text-base font-medium text-gray-900">
                    {importData.shippingMethod === 'sea' ? 'Marítimo' : 
                     importData.shippingMethod === 'air' ? 'Aéreo' : 
                     importData.shippingMethod}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Incoterms</label>
                  <p className="text-base font-medium text-gray-900">{importData.incoterms}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Entrega Prevista</label>
                  <p className="text-base font-medium text-blue-600">
                    {importData.estimatedDelivery ? 
                      new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR') : 
                      'Não definida'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Análise Financeira */}
        <div>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                <DollarSign className="h-5 w-5" />
                Análise Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-sm font-medium text-gray-500 mb-1">Valor Total</div>
                <div className="text-3xl font-bold text-green-600">
                  US$ {parseFloat(importData.totalValue || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                  <span className="text-sm font-medium text-gray-600">Moeda</span>
                  <span className="font-semibold text-gray-900">{importData.currency || 'USD'}</span>
                </div>
                
                {importData.products && importData.products.length > 0 && (
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                    <span className="text-sm font-medium text-gray-600">Produtos</span>
                    <span className="font-semibold text-gray-900">{importData.products.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <ImportTimeline importData={importData} />

      {/* Card de Produtos */}
      <ProductsSection importData={importData} />
    </div>
  );
}

// Componente Timeline
function ImportTimeline({ importData }: { importData: any }) {
  const timelineSteps = [
    { key: 'estimativa', label: 'Estimativa Criada', icon: FileText },
    { key: 'producao', label: 'Início da Produção', icon: Package },
    { key: 'entregue_agente', label: 'Entregue ao Agente', icon: CheckCircle },
    { key: 'transporte_maritimo', label: 'Transporte Marítimo', icon: Ship },
    { key: 'transporte_aereo', label: 'Transporte Aéreo', icon: Plane },
    { key: 'desembaraco', label: 'Desembaraço', icon: FileText },
    { key: 'transporte_nacional', label: 'Transporte Nacional', icon: Truck },
    { key: 'concluido', label: 'Concluído', icon: CheckCircle },
  ];

  const getCurrentStepIndex = (status: string) => {
    return timelineSteps.findIndex(step => step.key === status);
  };

  const currentStepIndex = getCurrentStepIndex(importData.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isCompleted 
                    ? 'bg-green-100 border-green-500 text-green-600' 
                    : isCurrent 
                      ? 'bg-blue-100 border-blue-500 text-blue-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-gray-500">Etapa atual</p>
                  )}
                  {isCompleted && index < currentStepIndex && (
                    <p className="text-sm text-green-500">✓ Concluída</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de produtos melhorado
function ProductsSection({ importData }: { importData: any }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-blue-600" />
          Produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {importData.products?.map((product: any, index: number) => (
            <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Produto</label>
                    <p className="text-base font-semibold text-gray-900">{product.name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Quantidade</label>
                    <p className="text-base font-medium text-gray-900">{product.quantity?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Preço Unitário</label>
                    <p className="text-base font-medium text-green-600">
                      US$ {parseFloat(product.unitPrice || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Valor Total</label>
                    <p className="text-lg font-bold text-green-600">
                      US$ {parseFloat(product.totalValue || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {product.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <p className="text-sm text-gray-700 mt-1">{product.description}</p>
                  </div>
                )}
                {product.supplierName && (
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-500">Fornecedor</label>
                    <p className="text-sm text-blue-600 mt-1">{product.supplierName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cronograma de Pagamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentSchedule.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum cronograma de pagamentos encontrado</p>
            <Button 
              onClick={() => generatePaymentsMutation.mutate()}
              disabled={generatePaymentsMutation.isPending}
            >
              {generatePaymentsMutation.isPending ? 'Gerando...' : 'Gerar Cronograma'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentSchedule.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(payment.status)}
                  <div>
                    <p className="font-medium">{getPaymentTypeLabel(payment.paymentType, payment)}</p>
                    <p className="text-sm text-gray-500">
                      Vencimento: {formatDate(payment.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                  <p className="text-sm text-gray-500">{getStatusLabel(payment.status)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de documentos
function ImportDocuments({ importId }: { importId: number }) {
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/import-documents', importId],
    queryFn: () => apiRequest(`/api/import-documents/${importId}`, 'GET')
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('importId', importId.toString());

      const response = await fetch('/api/import-documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload do documento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import-documents', importId] });
      setSelectedFiles({});
      toast({
        title: "Documento enviado",
        description: "O documento foi enviado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar o documento.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (file: File, documentType: string) => {
    uploadMutation.mutate({ file, documentType });
  };

  if (isLoading) {
    return <div>Carregando documentos...</div>;
  }

  const documentTypes = [
    'commercial_invoice',
    'packing_list',
    'bill_of_lading',
    'certificate_origin',
    'import_license',
    'insurance_policy'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos da Importação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documentTypes.map((docType) => {
            const existingDoc = documents.find((doc: any) => doc.documentType === docType);
            
            return (
              <div key={docType} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{docType.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-sm text-gray-500">
                    {existingDoc ? 'Documento enviado' : 'Documento pendente'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {existingDoc ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`file-${docType}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, docType);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-${docType}`)?.click()}
                        disabled={uploadMutation.isPending}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadMutation.isPending ? 'Enviando...' : 'Upload'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImportDetailsPage() {
  const [, params] = useRoute("/imports/details/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { permissions } = useUserPermissions();
  const importId = params?.id ? parseInt(params.id) : null;

  const { data: importData, isLoading, error } = useQuery({
    queryKey: ['/api/imports', importId],
    queryFn: () => apiRequest(`/api/imports/${importId}`, 'GET'),
    enabled: !!importId && !!user
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !importData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Importação não encontrada</p>
        <Button onClick={() => setLocation('/imports')} className="mt-4">
          Voltar para Importações
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/imports')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {importData.importName || `Importação #${importData.id}`}
            </h1>
            <p className="text-gray-600">
              Importação ID: {importData.id} • {formatCurrency(importData.totalValue).replace('R$', 'US$')}
            </p>
          </div>
        </div>
        {permissions.canManageApplications && (
          <Button onClick={() => setLocation(`/imports/edit/${importData.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
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