import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  Download,
  CreditCard,
  Building2,
  User,
  Receipt
} from 'lucide-react';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number;
}

export default function PaymentDetailsModal({ isOpen, onClose, paymentId }: PaymentDetailsModalProps) {
  const { data: payment, isLoading } = useQuery({
    queryKey: ['/api/payment-schedules', paymentId],
    queryFn: () => apiRequest('GET', `/api/payment-schedules/${paymentId}`),
    enabled: isOpen
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pago', color: 'bg-green-100 text-green-700 border-green-200' };
      case 'pending':
        return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      case 'overdue':
        return { label: 'Vencido', color: 'bg-red-100 text-red-700 border-red-200' };
      default:
        return { label: 'Programado', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  const getPaymentTypeLabel = (type: string, installmentNumber?: number) => {
    switch (type) {
      case 'down_payment': return 'Entrada (30%)';
      case 'installment': return `${installmentNumber}ª Parcela`;
      default: return type;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <p className="text-gray-600">Pagamento não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusInfo = getStatusInfo(payment.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Detalhes do Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Tipo</label>
                  <p className="font-medium">
                    {getPaymentTypeLabel(payment.paymentType, payment.installmentNumber)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Valor</label>
                  <p className="font-bold text-blue-600 text-lg">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Vencimento</label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <Badge className={`${statusInfo.color} border`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>

              {payment.totalInstallments && (
                <div>
                  <label className="text-sm text-gray-600">Parcela</label>
                  <p className="font-medium">
                    {payment.installmentNumber} de {payment.totalInstallments} parcelas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Pagamento (se pago) */}
          {payment.status === 'paid' && payment.paymentData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Pagamento Realizado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Data do Pagamento</label>
                    <p className="font-medium">
                      {payment.paymentData.paymentDate ? formatDate(payment.paymentData.paymentDate) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Método</label>
                    <p className="font-medium flex items-center gap-1">
                      {payment.paymentData.paymentMethod?.includes('paycomex') ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                      {payment.paymentData.paymentMethod?.includes('paycomex') ? 'PayComex' : 'Externo'}
                    </p>
                  </div>
                  {payment.paymentData.transactionId && (
                    <div>
                      <label className="text-sm text-gray-600">ID da Transação</label>
                      <p className="font-mono text-sm">{payment.paymentData.transactionId}</p>
                    </div>
                  )}
                </div>

                {payment.paymentData.notes && (
                  <div>
                    <label className="text-sm text-gray-600">Observações</label>
                    <p className="bg-gray-50 p-3 rounded-lg">{payment.paymentData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comprovantes */}
          {payment.status === 'paid' && payment.paymentData?.receipts && payment.paymentData.receipts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comprovantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payment.paymentData.receipts.map((receipt: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Comprovante {index + 1}</p>
                          <p className="text-sm text-gray-600">
                            {receipt.filename || `comprovante_${index + 1}.pdf`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Download do comprovante
                          const link = document.createElement('a');
                          link.href = `data:${receipt.mimetype};base64,${receipt.data}`;
                          link.download = receipt.filename || `comprovante_${index + 1}.pdf`;
                          link.click();
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações da Importação */}
          {payment.import && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Importação Relacionada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nome da Importação</label>
                    <p className="font-medium">{payment.import.importName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Valor Total</label>
                    <p className="font-medium">{formatCurrency(payment.import.totalValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}