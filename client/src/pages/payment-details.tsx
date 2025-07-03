
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  ArrowLeft, 
  Download,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Edit,
  Eye,
  ExternalLink,
  User,
  Globe,
  Receipt,
  History
} from "lucide-react";

export default function PaymentDetailsPage() {
  const [, params] = useRoute("/payments/details/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const paymentId = params?.id ? parseInt(params.id) : null;
  const [showReceipts, setShowReceipts] = useState(false);

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['/api/payments', paymentId],
    queryFn: () => apiRequest(`/api/payments/${paymentId}`, 'GET'),
    enabled: !!paymentId && !!user
  });

  const { data: supplierData } = useQuery({
    queryKey: ['/api/payments/supplier', paymentId],
    queryFn: () => apiRequest(`/api/payments/${paymentId}/supplier`, 'GET'),
    enabled: !!paymentId && !!payment
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ['/api/payments/history', paymentId],
    queryFn: () => apiRequest(`/api/payments/${paymentId}/history`, 'GET'),
    enabled: !!paymentId && !!payment
  });

  const { data: receipts } = useQuery({
    queryKey: ['/api/payments/receipts', paymentId],
    queryFn: () => apiRequest(`/api/payments/${paymentId}/receipts`, 'GET'),
    enabled: !!paymentId && !!payment && payment.status === 'paid'
  });

  const downloadReceiptMutation = useMutation({
    mutationFn: (receiptId: number) => apiRequest(`/api/payments/receipts/${receiptId}/download`, 'GET'),
    onSuccess: (data) => {
      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante-pagamento-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: () => {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o comprovante.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Pagamento não encontrado</p>
        <Button onClick={() => setLocation('/imports')} className="mt-4">
          Voltar para Importações
        </Button>
      </div>
    );
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment': return `Entrada (30%)`;
      case 'installment': return `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`;
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { 
        label: "Pago", 
        color: "bg-green-100 text-green-700 border-green-200", 
        icon: CheckCircle 
      },
      pending: { 
        label: "Pendente", 
        color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
        icon: Clock 
      },
      overdue: { 
        label: "Vencido", 
        color: "bg-red-100 text-red-700 border-red-200", 
        icon: AlertCircle 
      },
      cancelled: { 
        label: "Cancelado", 
        color: "bg-gray-100 text-gray-700 border-gray-200", 
        icon: AlertCircle 
      },
      processing: { 
        label: "Processando", 
        color: "bg-blue-100 text-blue-700 border-blue-200", 
        icon: Clock 
      },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      wire_transfer: "Transferência Bancária",
      swift_transfer: "Transferência SWIFT", 
      letter_of_credit: "Carta de Crédito",
      remittance: "Remessa Online",
      paycomex_credit: "PayComex - Cartão",
      paycomex_pix: "PayComex - PIX",
      other: "Outro",
    };
    return methods[method as keyof typeof methods] || method;
  };

  const statusInfo = getStatusBadge(payment.status);
  const StatusIcon = statusInfo.icon;
  const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
  const canPay = ['pending', 'overdue'].includes(payment.status);
  const canEdit = ['pending', 'overdue'].includes(payment.status);

  const handleDownloadReceipt = (receiptId: number) => {
    downloadReceiptMutation.mutate(receiptId);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/imports/details/${payment.importId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getPaymentTypeLabel(payment.paymentType)}
            </h1>
            <p className="text-gray-600">
              Pagamento #{payment.id} • {formatCurrency(payment.amount).replace('R$', 'US$')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${statusInfo.color} border flex items-center gap-1`}>
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </Badge>
          
          {/* Actions */}
          <div className="flex gap-2">
            {canPay && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setLocation(`/payments/pay/${payment.id}`)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar Agora
              </Button>
            )}
            
            {canEdit && (
              <Button 
                variant="outline"
                onClick={() => setLocation(`/payments/edit/${payment.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Atraso */}
      {isOverdue && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  Pagamento em atraso há {Math.ceil((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                </p>
                <p className="text-sm text-red-700">
                  Realize o pagamento o quanto antes para evitar complicações na importação.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="supplier">Fornecedor</TabsTrigger>
              {payment.status === 'paid' && <TabsTrigger value="receipts">Comprovantes</TabsTrigger>}
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            {/* Detalhes do Pagamento */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Informações do Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo de Pagamento</label>
                        <p className="text-lg font-semibold text-gray-900">{getPaymentTypeLabel(payment.paymentType)}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Valor</label>
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(payment.amount).replace('R$', 'US$')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Moeda</label>
                        <p className="text-base font-medium text-gray-900">{payment.currency || 'USD'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Data de Vencimento</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <p className={`text-base font-medium ${
                            isOverdue ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {formatDate(payment.dueDate)}
                          </p>
                        </div>
                      </div>
                      
                      {payment.status === 'paid' && payment.paidAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Data do Pagamento</label>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <p className="text-base font-medium text-green-600">
                              {formatDate(payment.paidAt)}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {payment.paymentMethod && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Método de Pagamento</label>
                          <p className="text-base font-medium text-gray-900">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-medium">{statusInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {payment.notes && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Observações</label>
                        <p className="text-sm bg-gray-50 p-3 rounded border mt-1">{payment.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dados do Fornecedor */}
            <TabsContent value="supplier" className="space-y-6">
              {supplierData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      Dados do Fornecedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nome da Empresa</label>
                          <p className="text-lg font-semibold text-gray-900">{supplierData.companyName}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Pessoa de Contato</label>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <p className="text-base font-medium text-gray-900">{supplierData.contactName}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <a href={`mailto:${supplierData.email}`} className="text-base font-medium text-blue-600 hover:underline">
                              {supplierData.email}
                            </a>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Telefone</label>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <p className="text-base font-medium text-gray-900">{supplierData.phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Endereço</label>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-red-600 mt-1" />
                            <div>
                              <p className="text-base font-medium text-gray-900">{supplierData.address}</p>
                              <p className="text-sm text-gray-600">
                                {supplierData.city}, {supplierData.state} - {supplierData.country}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dados Bancários */}
                    <Separator />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        Dados Bancários
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Banco</label>
                          <p className="text-base font-medium text-gray-900">{supplierData.bankName || 'A definir'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Agência</label>
                          <p className="text-base font-medium text-gray-900">{supplierData.bankBranch || 'A definir'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Conta</label>
                          <p className="text-base font-medium text-gray-900">{supplierData.bankAccount || 'A definir'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">SWIFT</label>
                          <p className="text-base font-medium text-gray-900">{supplierData.swiftCode || 'A definir'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Comprovantes */}
            {payment.status === 'paid' && (
              <TabsContent value="receipts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-green-600" />
                      Comprovantes de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {receipts && receipts.length > 0 ? (
                      <div className="space-y-4">
                        {receipts.map((receipt: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-6 w-6 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">{receipt.fileName}</p>
                                <p className="text-sm text-green-600">
                                  Enviado em {formatDate(receipt.uploadedAt)} • {(receipt.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReceipt(receipt.id)}
                              disabled={downloadReceiptMutation.isPending}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum comprovante disponível</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Histórico */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-600" />
                    Histórico do Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory && paymentHistory.length > 0 ? (
                    <div className="space-y-4">
                      {paymentHistory.map((event: any, index: number) => (
                        <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{event.description}</p>
                            <p className="text-sm text-gray-600">{formatDate(event.timestamp)}</p>
                            {event.notes && (
                              <p className="text-sm text-gray-700 mt-1">{event.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum evento registrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Ações e Informações */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canPay && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setLocation(`/payments/pay/${payment.id}`)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar Agora
                </Button>
              )}
              
              {canEdit && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation(`/payments/edit/${payment.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Pagamento
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation(`/imports/details/${payment.importId}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Importação
              </Button>
            </CardContent>
          </Card>

          {/* Status do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <StatusIcon className="h-5 w-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <Badge className={`${statusInfo.color} border mb-2`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {statusInfo.label}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  {payment.status === 'paid' 
                    ? `Pago em ${formatDate(payment.paidAt)}`
                    : payment.status === 'pending' 
                    ? `Vence em ${formatDate(payment.dueDate)}`
                    : 'Status do pagamento'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Criado em:</span>
                  <span className="font-medium">{formatDate(payment.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ID do Pagamento:</span>
                  <span className="font-medium">#{payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Importação:</span>
                  <span className="font-medium">#{payment.importId}</span>
                </div>
                {payment.installmentNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Parcela:</span>
                    <span className="font-medium">{payment.installmentNumber}/{payment.totalInstallments}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
