import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import PaymentCheckoutModal from "./PaymentCheckoutModal";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  DollarSign,
  Edit,
  MoreHorizontal,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface ImportPaymentsListProps {
  importId: number;
}

interface PaymentSchedule {
  id: number;
  importId: number;
  paymentType: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: string;
  installmentNumber?: number;
  totalInstallments?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function ImportPaymentsList({ importId }: ImportPaymentsListProps) {
  const [, setLocation] = useLocation();
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const { isFinanceira } = useUserPermissions();

  // Ocultar completamente para usuários Financeira
  if (isFinanceira) {
    return null;
  }

  // Buscar pagamentos específicos desta importação
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['/api/payment-schedules', { importId }],
    queryFn: () => apiRequest('/api/payment-schedules', 'GET'),
    select: (data: PaymentSchedule[]) => {
      const filtered = data.filter(payment => payment.importId === importId);
      // Ordenar cronologicamente: down_payment primeiro, depois parcelas por data de vencimento
      return filtered.sort((a, b) => {
        if (a.paymentType === 'down_payment' && b.paymentType !== 'down_payment') return -1;
        if (a.paymentType !== 'down_payment' && b.paymentType === 'down_payment') return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencido
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment':
        return 'Entrada (10%)';
      case 'installment':
        return 'Parcela do Financiado';
      default:
        return type;
    }
  };

  const handleViewDetails = (paymentId: number) => {
    setLocation(`/payments/${paymentId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!paymentsData || paymentsData.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
        <p className="text-gray-500">
          Esta importação ainda não possui cronograma de pagamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Cronograma de Pagamentos</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {paymentsData.length} {paymentsData.length === 1 ? 'pagamento' : 'pagamentos'}
        </Badge>
      </div>

      <div className="space-y-3">
        {paymentsData.map((payment) => {
          const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
          const gradientClass = payment.paymentType === 'down_payment' 
            ? isOverdue ? 'from-orange-50 to-red-50 border-orange-200' : 'from-blue-50 to-indigo-50 border-blue-200'
            : 'from-blue-50 to-indigo-50 border-blue-200';

          return (
            <Card key={payment.id} className={`bg-gradient-to-r ${gradientClass}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {getPaymentTypeLabel(payment.paymentType)}
                    {payment.installmentNumber && ` (${payment.installmentNumber}/${payment.totalInstallments})`}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(isOverdue ? 'overdue' : payment.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(payment.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {payment.status === 'pending' ? (
                          <DropdownMenuItem onClick={() => {
                            setSelectedPaymentId(payment.id);
                            setCheckoutModalOpen(true);
                          }}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pagar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-gray-500" disabled>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pagar (View-only)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-gray-500" disabled>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar (View-only)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-gray-500" disabled>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancelar (View-only)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(parseFloat(payment.amount), payment.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <span className="ml-2 font-medium">
                      {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${
                      isOverdue ? 'text-red-600' : 
                      payment.status === 'paid' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {isOverdue ? 'Vencido' : 
                       payment.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Checkout Modal */}
      {selectedPaymentId && (
        <PaymentCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            setSelectedPaymentId(null);
          }}
          paymentId={selectedPaymentId}
        />
      )}
    </div>
  );
}