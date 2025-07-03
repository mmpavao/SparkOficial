
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, CreditCard, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { formatCurrency, formatDate } from "@/lib/formatters";
import PaymentCard from "@/components/payments/PaymentCard";

interface Payment {
  id: number;
  importId: number;
  importName?: string;
  paymentType: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: string;
  installmentNumber?: number;
  totalInstallments?: number;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

interface PaymentMetrics {
  totalPayments: number;
  pendingPayments: number;
  paidPayments: number;
  overduePayments: number;
  totalValue: number;
  paidValue: number;
  pendingValue: number;
  overdueValue: number;
}

const calculateMetrics = (payments: Payment[]): PaymentMetrics => {
  const now = new Date();
  
  const pending = payments.filter(p => p.status === 'pending');
  const paid = payments.filter(p => p.status === 'paid');
  const overdue = payments.filter(p => p.status === 'pending' && new Date(p.dueDate) < now);

  return {
    totalPayments: payments.length,
    pendingPayments: pending.length,
    paidPayments: paid.length,
    overduePayments: overdue.length,
    totalValue: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    paidValue: paid.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    pendingValue: pending.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    overdueValue: overdue.reduce((sum, p) => sum + parseFloat(p.amount), 0),
  };
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const permissions = useUserPermissions();

  // Fetch payments data
  const { data: paymentsData = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/payments/schedule'],
    queryFn: async () => {
      const response = await fetch('/api/payments/schedule');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    enabled: !!user
  });

  const payments = paymentsData as Payment[];
  const metrics = calculateMetrics(payments);

  // Filter payments based on active tab
  const getFilteredPayments = () => {
    let filtered = payments;

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(p => p.status === 'pending');
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(p => p.status === 'paid');
    } else if (activeTab === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(p => p.status === 'pending' && new Date(p.dueDate) < now);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.importName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(p => p.paymentType === typeFilter);
    }

    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  const handlePaymentUpdate = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permissions.isFinanceira 
              ? "Análise de Pagamentos" 
              : permissions.isAdmin 
                ? "Todos os Pagamentos" 
                : "Meus Pagamentos"}
          </h1>
          <p className="text-gray-600 mt-1">
            {permissions.isAdmin || permissions.isFinanceira 
              ? "Gerencie e monitore todos os pagamentos da plataforma"
              : "Acompanhe seus pagamentos e cronograma de quitação"}
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalPayments}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.pendingPayments}</p>
                <p className="text-xs text-gray-500">{formatCurrency(metrics.pendingValue).replace('R$', 'US$')}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-green-600">{metrics.paidPayments}</p>
                <p className="text-xs text-gray-500">{formatCurrency(metrics.paidValue).replace('R$', 'US$')}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{metrics.overduePayments}</p>
                <p className="text-xs text-gray-500">{formatCurrency(metrics.overdueValue).replace('R$', 'US$')}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Buscar pagamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
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
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredPayments.length} resultado{filteredPayments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todos ({metrics.totalPayments})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({metrics.pendingPayments})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Pagos ({metrics.paidPayments})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Vencidos ({metrics.overduePayments})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Payments List */}
          <div className="grid gap-4">
            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                      ? "Tente ajustar os filtros de busca."
                      : "Nenhum pagamento foi encontrado para este período."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPayments.map((payment) => (
                <PaymentCard 
                  key={payment.id} 
                  payment={payment} 
                  onPaymentUpdate={handlePaymentUpdate}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Card for filtered results */}
      {filteredPayments.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Filtrado</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)).replace('R$', 'US$')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Valor Pago</p>
                <p className="text-xl font-bold text-green-900">
                  {formatCurrency(
                    filteredPayments
                      .filter(p => p.status === 'paid')
                      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                  ).replace('R$', 'US$')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendente</p>
                <p className="text-xl font-bold text-yellow-900">
                  {formatCurrency(
                    filteredPayments
                      .filter(p => p.status === 'pending')
                      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                  ).replace('R$', 'US$')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">Em Atraso</p>
                <p className="text-xl font-bold text-red-900">
                  {formatCurrency(
                    filteredPayments
                      .filter(p => {
                        const now = new Date();
                        return p.status === 'pending' && new Date(p.dueDate) < now;
                      })
                      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                  ).replace('R$', 'US$')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
