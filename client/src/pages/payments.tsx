import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  Clock,
  Eye,
  Edit,
  MoreHorizontal,
  Trash2
} from "lucide-react";

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

export default function PaymentsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Buscar cronograma de pagamentos
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["/api/payment-schedules"],
    queryFn: () => apiRequest("GET", "/api/payment-schedules")
  });

  const payments: PaymentSchedule[] = paymentsData || [];

  // Calcular métricas
  const totalPayments = payments.length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const paidPayments = payments.filter(p => p.status === 'paid').length;
  const overduePayments = payments.filter(p => {
    if (p.status === 'paid') return false;
    const dueDate = new Date(p.dueDate);
    const today = new Date();
    return dueDate < today;
  }).length;

  const totalAmount = payments.reduce((sum, payment) => {
    return sum + parseFloat(payment.amount);
  }, 0);

  const paidAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  const overdueAmount = payments
    .filter(p => {
      if (p.status === 'paid') return false;
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      return dueDate < today;
    })
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  // Filtrar pagamentos
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === "" || 
      payment.paymentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.importId.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesType = typeFilter === "all" || payment.paymentType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Função para obter status badge
  const getStatusBadge = (status: string, dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    
    if (status === 'paid') {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Pago</Badge>;
    } else if (due < today) {
      return <Badge className="bg-red-100 text-red-700 border-red-300">Vencido</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cronograma de Pagamentos</h1>
        <p className="text-gray-600 mt-2">Gerencie todos os seus pagamentos de importação</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-12 w-12 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
                <p className="text-sm text-gray-500">{formatCurrency(totalAmount, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-12 w-12 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
                <p className="text-sm text-yellow-600">{formatCurrency(pendingAmount, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-gray-900">{paidPayments}</p>
                <p className="text-sm text-green-600">{formatCurrency(paidAmount, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-gray-900">{overduePayments}</p>
                <p className="text-sm text-red-600">{formatCurrency(overdueAmount, 'USD')}</p>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar por ID ou importação...</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID ou importação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Todos os Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Todos os Tipos</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="down_payment">Entrada</SelectItem>
                  <SelectItem value="installment">Parcela</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos - Formato Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos Programados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-900">
                    {payment.paymentType === 'down_payment' ? 'Entrada (30%)' : 
                     `${payment.installmentNumber}ª Parcela (${payment.paymentType})`}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payment.status, payment.dueDate)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/payments/${payment.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        {payment.status === 'pending' && (
                          <DropdownMenuItem onClick={() => setLocation(`/payments/${payment.id}/pay`)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pagar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setLocation(`/payments/${payment.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="ml-2 font-medium">{formatCurrency(parseFloat(payment.amount), payment.currency as 'USD' | 'BRL')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <span className="ml-2 font-medium">{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Importação:</span>
                    <span className="ml-2 font-medium">#{payment.importId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-gray-600">Não há pagamentos que correspondam aos filtros selecionados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}