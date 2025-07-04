import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
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
}

export default function PaymentCard({ payment }: PaymentCardProps) {
  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment':
        return 'Entrada (30%)';
      case 'installment':
        return `${payment.installmentNumber}ª Parcela ${payment.totalInstallments ? `(${payment.totalInstallments} dias)` : ''}`;
      default:
        return type;
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
  const isOverdue = new Date(payment.dueDate) < new Date() && payment.status === 'pending';

  return (
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
          
          {/* Status Badge */}
          <Badge className={`${statusInfo.color} border`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Valor</p>
              <p className="font-medium text-gray-900">
                {formatCurrency(parseFloat(payment.amount), 'USD')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Vencimento</p>
              <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(payment.dueDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Overdue Alert */}
        {isOverdue && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700 font-medium">
                Pagamento em atraso
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}