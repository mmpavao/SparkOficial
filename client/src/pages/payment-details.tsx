import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Building2, 
  FileText, 
  CreditCard,
  Download,
  Edit,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

interface PaymentSchedule {
  id: number;
  importId: number;
  paymentType: string;
  dueDate: string;
  amount: string;
  currency: string;
  status: string;
  installmentNumber?: number;
  totalInstallments?: number;
  paymentReceipts?: string[];
  paymentDate?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  importData?: {
    importName: string;
    supplierId: number;
    supplierData?: {
      companyName: string;
      contactName: string;
      phone: string;
      email: string;
      bankName?: string;
      bankAccount?: string;
      swiftCode?: string;
    };
  };
}

interface PaymentDetailsPageProps {
  params: { id: string };
}

export default function PaymentDetailsPage({ params }: PaymentDetailsPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const paymentId = parseInt(params.id);

  // Buscar detalhes do pagamento
  const { data: payment, isLoading, error } = useQuery<PaymentSchedule>({
    queryKey: ['/api/payment-schedules', paymentId],
    enabled: !!paymentId,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      paid: { label: "Pago", className: "bg-green-100 text-green-800 border-green-300" },
      overdue: { label: "Vencido", className: "bg-red-100 text-red-800 border-red-300" },
      processing: { label: "Processando", className: "bg-blue-100 text-blue-800 border-blue-300" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handlePayNow = () => {
    setLocation(`/payments/${paymentId}/pay`);
  };

  const handleEdit = () => {
    setLocation(`/payments/${paymentId}/edit`);
  };

  const handleViewReceipts = () => {
    if (payment?.paymentReceipts && payment.paymentReceipts.length > 0) {
      // Abrir modal ou página para visualizar comprovantes
      toast({
        title: "Comprovantes",
        description: `${payment.paymentReceipts.length} comprovante(s) disponível(is)`,
      });
    }
  };

  const downloadReceipt = (receiptUrl: string, index: number) => {
    // Simular download do comprovante
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = `comprovante-${paymentId}-${index + 1}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <DollarSign className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando detalhes do pagamento...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Erro ao carregar detalhes do pagamento</p>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/payments')}
            className="mt-4"
          >
            Voltar aos Pagamentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/payments')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalhes do Pagamento #{paymentId}
            </h1>
            <p className="text-gray-600">
              {payment.importData?.importName || `Importação #${payment.importId}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {payment.status === 'pending' && (
            <Button onClick={handlePayNow} className="bg-green-600 hover:bg-green-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar Agora
            </Button>
          )}
          {payment.status === 'paid' && payment.paymentReceipts && payment.paymentReceipts.length > 0 && (
            <Button variant="outline" onClick={handleViewReceipts}>
              <FileText className="w-4 h-4 mr-2" />
              Ver Comprovantes
            </Button>
          )}
          {payment.status === 'pending' && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Status e Valor Principal */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor do Pagamento</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(payment.amount).replace('R$', `${payment.currency}$`)}
                </p>
                <p className="text-sm text-gray-600">
                  {payment.paymentType === 'installment' && payment.installmentNumber && payment.totalInstallments
                    ? `Parcela ${payment.installmentNumber} de ${payment.totalInstallments}`
                    : payment.paymentType === 'down_payment' 
                      ? 'Pagamento à vista'
                      : 'Pagamento único'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(payment.status)}
              <p className="text-sm text-gray-600 mt-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Vencimento: {formatDate(payment.dueDate)}
              </p>
              {payment.paymentDate && (
                <p className="text-sm text-green-600 mt-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Pago em: {formatDate(payment.paymentDate)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dados do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment.importData?.supplierData ? (
              <>
                <div>
                  <p className="text-sm text-gray-600">Empresa</p>
                  <p className="font-medium">{payment.importData.supplierData.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contato</p>
                  <p className="font-medium">{payment.importData.supplierData.contactName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{payment.importData.supplierData.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{payment.importData.supplierData.email}</p>
                  </div>
                </div>
                {payment.importData.supplierData.bankName && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Dados Bancários</p>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Banco:</strong> {payment.importData.supplierData.bankName}</p>
                        <p className="text-sm"><strong>Conta:</strong> {payment.importData.supplierData.bankAccount}</p>
                        {payment.importData.supplierData.swiftCode && (
                          <p className="text-sm"><strong>SWIFT:</strong> {payment.importData.supplierData.swiftCode}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-500">Dados do fornecedor não disponíveis</p>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Histórico de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment.status === 'paid' ? (
              <>
                <div>
                  <p className="text-sm text-gray-600">Método de Pagamento</p>
                  <p className="font-medium">{payment.paymentMethod || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data do Pagamento</p>
                  <p className="font-medium">{payment.paymentDate ? formatDate(payment.paymentDate) : 'Não disponível'}</p>
                </div>
                {payment.paymentNotes && (
                  <div>
                    <p className="text-sm text-gray-600">Observações</p>
                    <p className="font-medium">{payment.paymentNotes}</p>
                  </div>
                )}
                {payment.paymentReceipts && payment.paymentReceipts.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Comprovantes</p>
                    <div className="space-y-2">
                      {payment.paymentReceipts.map((receipt, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">Comprovante {index + 1}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReceipt(receipt, index)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Pagamento ainda não realizado</p>
                <Button 
                  onClick={handlePayNow}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  Realizar Pagamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}