import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import PaymentCheckoutModal from "@/components/payments/PaymentCheckoutModal";
import { 
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  Building,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function PaymentDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Buscar detalhes do pagamento
  const { data: payment, isLoading } = useQuery({
    queryKey: ['/api/payment-schedules', id],
    queryFn: () => apiRequest(`/api/payment-schedules/${id}`, 'GET'),
    enabled: !!id && !!user
  });

  // Buscar detalhes da importação relacionada
  const { data: importData } = useQuery({
    queryKey: ['/api/imports', payment?.importId],
    queryFn: () => apiRequest(`/api/imports/${payment?.importId}`, 'GET'),
    enabled: !!payment?.importId
  });

  // Buscar detalhes do crédito relacionado
  const { data: creditData } = useQuery({
    queryKey: ['/api/credit/applications', importData?.creditApplicationId],
    queryFn: () => apiRequest(`/api/credit/applications/${importData?.creditApplicationId}`, 'GET'),
    enabled: !!importData?.creditApplicationId
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Vencido
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'down_payment':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          Entrada (10%)
        </Badge>;
      case 'installment':
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
          Parcela do Financiado
        </Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pagamento não encontrado</h2>
          <Button onClick={() => setLocation('/payments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pagamentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/payments')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Pagamento</h1>
            <p className="text-gray-600">Pagamento #{payment.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {getStatusBadge(payment.status)}
          {getPaymentTypeBadge(payment.paymentType)}
          
          {/* Botão Pagar - apenas para pagamentos pendentes */}
          {payment.status === 'pending' && (
            <Button 
              onClick={() => setCheckoutModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Detalhes do Pagamento */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">Valor do Pagamento</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(parseFloat(payment.amount))} {payment.currency}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">Data de Vencimento</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {payment.paymentType === 'installment' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">Parcela</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {payment.installmentNumber} de {payment.totalInstallments}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhes da Importação */}
          {importData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Importação Relacionada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Nome da Importação</p>
                    <p className="text-lg font-semibold text-gray-900">{importData.importName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tipo de Carga</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {importData.cargoType === 'FCL' ? 'Container Completo (FCL)' : 'Carga Fracionada (LCL)'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Valor Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(parseFloat(importData.totalValue))} {importData.currency}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Incoterms</p>
                    <p className="text-lg font-semibold text-gray-900">{importData.incoterms}</p>
                  </div>
                </div>

                {importData.cargoType === 'FCL' && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-600 mb-2">Informações do Container</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Número do Container</p>
                        <p className="font-semibold">{importData.containerNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Número do Selo</p>
                        <p className="font-semibold">{importData.sealNumber}</p>
                      </div>
                    </div>
                  </div>
                )}

                {importData.products && importData.products.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-600 mb-2">Produtos</p>
                    <div className="space-y-2">
                      {importData.products.map((product: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              Quantidade: {product.quantity.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(product.totalValue)} USD
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral - Informações Complementares */}
        <div className="space-y-6">
          {/* Informações do Crédito */}
          {creditData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Crédito Relacionado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Empresa</p>
                  <p className="font-semibold">{creditData.legalCompanyName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Limite de Crédito</p>
                  <p className="font-semibold">
                    {formatCurrency(parseFloat(creditData.finalCreditLimit || creditData.requestedAmount))} USD
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Taxa Administrativa</p>
                  <p className="font-semibold">{creditData.adminFee}%</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">ID do Pagamento</p>
                <p className="font-semibold">#{payment.id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Criado em</p>
                <p className="font-semibold">
                  {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
              
              {payment.updatedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Última Atualização</p>
                  <p className="font-semibold">
                    {new Date(payment.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tipo:</span>
                <span className="font-medium">
                  {payment.paymentType === 'down_payment' ? 'Entrada' : 'Parcela'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="font-medium capitalize">{payment.status}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Moeda:</span>
                <span className="font-medium">{payment.currency}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-semibold">
                <span>Valor Total:</span>
                <span className="text-lg">
                  {formatCurrency(parseFloat(payment.amount))} {payment.currency}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        paymentId={parseInt(id || "0")}
      />
    </div>
  );
}