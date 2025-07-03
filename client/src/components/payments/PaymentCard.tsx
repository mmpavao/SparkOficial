import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { 
  MoreVertical, 
  Eye, 
  CreditCard, 
  Edit, 
  X, 
  DollarSign, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface PaymentCardProps {
  payment: {
    id: number;
    paymentType: string;
    amount: string;
    dueDate: string;
    status: string;
    installmentNumber?: number;
    totalInstallments?: number;
    importId: number;
  };
  onCancel?: (paymentId: number) => void;
}

export function PaymentCard({ payment, onCancel }: PaymentCardProps) {
  const [, setLocation] = useLocation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment': return 'Entrada (30%)';
      case 'installment': return `${payment.installmentNumber}ª Parcela`;
      default: return type;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Pago',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle,
          dotColor: 'bg-green-500'
        };
      case 'pending':
        return {
          label: 'Pendente',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Clock,
          dotColor: 'bg-yellow-500'
        };
      case 'overdue':
        return {
          label: 'Vencido',
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: AlertCircle,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: 'Programado',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: Calendar,
          dotColor: 'bg-blue-500'
        };
    }
  };

  const statusInfo = getStatusInfo(payment.status);
  const StatusIcon = statusInfo.icon;

  const handleViewDetails = () => {
    setLocation(`/payments/details/${payment.id}`);
  };

  const handlePay = () => {
    // Pre-carregar dados antes da navegação para transição instantânea
    const queryClient = useQueryClient();
    queryClient.prefetchQuery({
      queryKey: ['/api/payment-schedules', payment.id],
      queryFn: () => apiRequest("GET", `/api/payment-schedules/${payment.id}`),
      staleTime: 1000 * 60 * 5
    });
    
    // Navegação instantânea
    setLocation(`/payments/pay/${payment.id}`);
  };

  const handleEdit = () => {
    setLocation(`/payments/edit/${payment.id}`);
  };

  const handleCancelConfirm = () => {
    if (onCancel) {
      onCancel(payment.id);
    }
    setShowCancelDialog(false);
  };

  const isOverdue = new Date(payment.dueDate) < new Date() && payment.status === 'pending';

  return (
    <>
      <Card className="hover:shadow-md transition-shadow border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusInfo.dotColor}`} />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {getPaymentTypeLabel(payment.paymentType)}
                </h3>
                <p className="text-sm text-gray-500">
                  Importação #{payment.importId}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </DropdownMenuItem>
                {payment.status === 'pending' && (
                  <DropdownMenuItem onClick={handlePay}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pagar
                  </DropdownMenuItem>
                )}
                {payment.status === 'pending' && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {payment.status === 'pending' && (
                  <DropdownMenuItem 
                    onClick={() => setShowCancelDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            {/* Valor */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Valor</span>
              </div>
              <span className="font-semibold text-lg text-gray-900">
                {formatCurrency(payment.amount).replace('R$', 'US$')}
              </span>
            </div>

            {/* Data de Vencimento */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Vencimento</span>
              </div>
              <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(payment.dueDate)}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Status</span>
              </div>
              <Badge className={`${statusInfo.color} border`}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Ação rápida baseada no status */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {payment.status === 'pending' && (
              <Button 
                onClick={handlePay}
                className="w-full"
                variant={isOverdue ? "destructive" : "default"}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isOverdue ? 'Pagar Agora (Vencido)' : 'Pagar Agora'}
              </Button>
            )}
            {payment.status === 'paid' && (
              <Button 
                onClick={handleViewDetails}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Comprovantes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este pagamento? Esta ação não pode ser desfeita.
              <br /><br />
              <strong>Pagamento:</strong> {getPaymentTypeLabel(payment.paymentType)}<br />
              <strong>Valor:</strong> {formatCurrency(payment.amount).replace('R$', 'US$')}<br />
              <strong>Vencimento:</strong> {formatDate(payment.dueDate)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Pagamento</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}