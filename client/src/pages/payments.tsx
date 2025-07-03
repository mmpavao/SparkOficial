import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
import { formatCurrency, formatCompactNumber } from "@/lib/formatters";
import { PaymentCard } from "@/components/payments/PaymentCard";
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  X
} from "lucide-react";

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
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cancelPaymentId, setCancelPaymentId] = useState<number | null>(null);

  // Buscar cronogramas de pagamento
  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['/api/payment-schedules'],
    queryFn: () => apiRequest('/api/payment-schedules', 'GET'),
    enabled: !!user
  });

  // Buscar métricas de pagamento
  const { data: metricsData } = useQuery({
    queryKey: ['/api/payment-schedules/metrics'],
    queryFn: () => apiRequest('/api/payment-schedules/metrics', 'GET'),
    enabled: !!user
  });

  // Mutação para cancelar pagamento
  const cancelPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return apiRequest(`/api/payment-schedules/${paymentId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso.",
      });
      setCancelPaymentId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o pagamento.",
        variant: "destructive",
      });
    },
  });

  const handleCancelPayment = (paymentId: number) => {
    setCancelPaymentId(paymentId);
  };

  const handleConfirmCancel = () => {
    if (cancelPaymentId) {
      cancelPaymentMutation.mutate(cancelPaymentId);
    }
  };

  // Processar dados dos pagamentos - dados diretos do backend
  const payments = paymentsData || [];

  // Filtrar pagamentos
  const filteredPayments = payments.filter((payment: PaymentSchedule) => {
    const matchesSearch = 
      payment.id?.toString().includes(searchTerm) ||
      payment.importId?.toString().includes(searchTerm) ||
      payment.paymentType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesType = typeFilter === "all" || payment.paymentType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Métricas padrão
  const defaultMetrics = {
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    overduePayments: 0,
    totalAmount: "0",
    pendingAmount: "0",
    paidAmount: "0",
    overdueAmount: "0"
  };

  const metrics = metricsData || defaultMetrics;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Erro ao carregar pagamentos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronograma de Pagamentos</h1>
          <p className="text-gray-600">
            Gerencie todos os seus pagamentos de importação
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.totalPayments}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.pendingPayments}
                </p>
                <p className="text-sm text-yellow-600 font-medium">
                  {formatCurrency(metrics.pendingAmount || "0").replace('R$', 'US$')}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.paidPayments}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {formatCurrency(metrics.paidAmount || "0").replace('R$', 'US$')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.overduePayments}
                </p>
                <p className="text-sm text-red-600 font-medium">
                  {formatCurrency(metrics.overdueAmount || "0").replace('R$', 'US$')}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por ID ou importação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="down_payment">Entrada</SelectItem>
                <SelectItem value="installment">Parcela</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Filtros ativos:</span>
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Busca: {searchTerm}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {statusFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tipo: {typeFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setTypeFilter("all")}
                  />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum pagamento encontrado
              </h3>
              <p className="text-gray-600">
                {paymentsData?.length === 0 
                  ? "Você ainda não possui pagamentos programados."
                  : "Tente ajustar os filtros para encontrar pagamentos específicos."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPayments.map((payment: PaymentSchedule) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onCancel={handleCancelPayment}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={!!cancelPaymentId} onOpenChange={() => setCancelPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este pagamento? Esta ação não pode ser desfeita.
              O pagamento será removido do cronograma e poderá afetar o limite de crédito disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Pagamento</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelPaymentMutation.isPending}
            >
              {cancelPaymentMutation.isPending ? "Cancelando..." : "Sim, Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}