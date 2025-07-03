
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  MoreVertical, 
  Eye, 
  CreditCard, 
  Edit, 
  X,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface PaymentCardProps {
  payment: {
    id: number;
    paymentType: string;
    amount: string;
    currency: string;
    dueDate: string;
    status: string;
    installmentNumber?: number;
    totalInstallments?: number;
    paidAt?: string;
    importId: number;
    importName?: string;
  };
  onPaymentUpdate?: () => void;
}

export default function PaymentCard({ payment, onPaymentUpdate }: PaymentCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment': return 'Entrada (30%)';
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
        icon: X 
      },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const handleCancelPayment = async () => {
    try {
      const response = await fetch(`/api/payments/${payment.id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Erro ao cancelar pagamento');

      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso.",
      });

      onPaymentUpdate?.();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar",
        description: error.message || "Não foi possível cancelar o pagamento.",
        variant: "destructive",
      });
    }
    setShowCancelDialog(false);
  };

  const statusInfo = getStatusBadge(payment.status);
  const StatusIcon = statusInfo.icon;
  const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
  const canEdit = ['pending', 'overdue'].includes(payment.status);
  const canPay = ['pending', 'overdue'].includes(payment.status);
  const canCancel = ['pending', 'overdue'].includes(payment.status);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                {getPaymentTypeLabel(payment.paymentType)}
              </CardTitle>
              {payment.importName && (
                <p className="text-sm text-gray-600">
                  Importação: {payment.importName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${statusInfo.color} border`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setLocation(`/payments/details/${payment.id}`)}
                    className="cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </DropdownMenuItem>
                  
                  {canPay && (
                    <DropdownMenuItem 
                      onClick={() => setLocation(`/payments/pay/${payment.id}`)}
                      className="cursor-pointer text-green-600"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar agora
                    </DropdownMenuItem>
                  )}
                  
                  {canEdit && (
                    <DropdownMenuItem 
                      onClick={() => setLocation(`/payments/edit/${payment.id}`)}
                      className="cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  
                  {canCancel && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setShowCancelDialog(true)}
                        className="cursor-pointer text-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Valor</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(payment.amount).replace('R$', 'US$')}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {payment.status === 'paid' ? 'Pago em' : 'Vencimento'}
                </span>
              </div>
              <p className={`text-sm font-medium ${
                isOverdue ? 'text-red-600' : 'text-gray-900'
              }`}>
                {payment.status === 'paid' && payment.paidAt 
                  ? formatDate(payment.paidAt)
                  : formatDate(payment.dueDate)
                }
              </p>
            </div>
          </div>
          
          {isOverdue && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Pagamento em atraso há {Math.ceil((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este pagamento? Esta ação não pode ser desfeita.
              O valor será liberado no seu limite de crédito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelPayment}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancelar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
