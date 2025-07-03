import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Mail
} from "lucide-react";

export default function PaymentDetailsPage() {
  const [, params] = useRoute("/payments/details/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const paymentId = params?.id ? parseInt(params.id) : null;

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
      case 'down_payment': return `Down Payment (30%)`;
      case 'installment': return `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`;
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { label: "Pago", color: "bg-green-100 text-green-700", icon: CheckCircle },
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      overdue: { label: "Vencido", color: "bg-red-100 text-red-700", icon: AlertCircle },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const statusInfo = getStatusBadge(payment.status);
  const StatusIcon = statusInfo.icon;

  const handleDownloadReceipt = () => {
    if (payment.receiptUrl) {
      // Implementar download do comprovante
      window.open(payment.receiptUrl, '_blank');
    }
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
              Pagamento ID: {payment.id} • {formatCurrency(payment.amount).replace('R$', 'US$')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className="h-5 w-5" />
          <Badge className={`${statusInfo.color} border-0`}>
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Pagamento */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Detalhes do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Tipo de Pagamento</label>
                  <p className="text-base font-semibold text-gray-900">{getPaymentTypeLabel(payment.paymentType)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Valor</label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(payment.amount).replace('R$', 'US$')}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Data de Vencimento</label>
                  <p className="text-base font-medium text-gray-900">{formatDate(payment.dueDate)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <span className="font-medium">{statusInfo.label}</span>
                  </div>
                </div>
                {payment.paidDate && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Data do Pagamento</label>
                    <p className="text-base font-medium text-green-600">{formatDate(payment.paidDate)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados do Fornecedor */}
          {supplierData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Dados de Pagamento do Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Nome da Empresa</label>
                    <p className="text-base font-semibold text-gray-900">{supplierData.companyName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Contato</label>
                    <p className="text-base font-medium text-gray-900">{supplierData.contactName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-base font-medium text-blue-600">{supplierData.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-base font-medium text-gray-900">{supplierData.phone}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Endereço</label>
                    <p className="text-base font-medium text-gray-900">
                      {supplierData.address}, {supplierData.city}, {supplierData.province}
                    </p>
                  </div>
                </div>

                {/* Dados Bancários do Fornecedor */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Dados Bancários</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">Banco</label>
                      <p className="text-base font-medium text-gray-900">{supplierData.bankName || 'A definir'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">Agência</label>
                      <p className="text-base font-medium text-gray-900">{supplierData.bankBranch || 'A definir'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">Conta</label>
                      <p className="text-base font-medium text-gray-900">{supplierData.bankAccount || 'A definir'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">SWIFT</label>
                      <p className="text-base font-medium text-gray-900">{supplierData.swiftCode || 'A definir'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Ações e Comprovante */}
        <div className="space-y-6">
          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment.status === 'pending' && (
                <Button 
                  className="w-full"
                  onClick={() => setLocation(`/payments/pay/${payment.id}`)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Efetuar Pagamento
                </Button>
              )}
              {payment.status === 'pending' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation(`/payments/edit/${payment.id}`)}
                >
                  Editar Pagamento
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Comprovante */}
          {payment.status === 'paid' && payment.receiptUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  Comprovante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700">Pagamento Confirmado</p>
                  <p className="text-xs text-green-600">
                    Pago em {formatDate(payment.paidDate)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Comprovante
                </Button>
              </CardContent>
            </Card>
          )}

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
                {payment.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Método:</span>
                    <span className="font-medium">{payment.paymentMethod}</span>
                  </div>
                )}
                {payment.notes && (
                  <div className="space-y-1">
                    <span className="text-gray-500">Observações:</span>
                    <p className="text-sm bg-gray-50 p-2 rounded border">{payment.notes}</p>
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