import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Package,
  DollarSign,
  Calendar,
  Ship,
  Plane,
  Truck,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Calculator,
  MoreHorizontal
} from "lucide-react";
import { calculateAdminFee, getAdminFeeFromCredit, getDownPaymentFromCredit, formatUSD } from "@/lib/adminFeeCalculator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ImportDetailsPage() {
  const [match, params] = useRoute("/imports/details/:id");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserPermissions();
  const queryClient = useQueryClient();

  // Extract importId from URL path
  const importId = params?.id ? parseInt(params.id) : 
    location.startsWith('/imports/details/') ? 
    parseInt(location.split('/imports/details/')[1]) : null;

  // Fetch import details
  const { data: importData, isLoading, error } = useQuery({
    queryKey: ["/api/imports", importId],
    queryFn: async () => {
      if (isAdmin) {
        return await apiRequest(`/api/admin/imports/${importId}`, "GET");
      } else {
        return await apiRequest(`/api/imports/${importId}`, "GET");
      }
    },
    enabled: !!importId,
  });

  // Fetch credit application associated with this import
  const { data: creditApplication } = useQuery({
    queryKey: ["/api/credit/applications", importData?.creditApplicationId],
    queryFn: async () => {
      if (!importData?.creditApplicationId) return null;
      if (isAdmin) {
        return await apiRequest(`/api/admin/credit-applications/${importData.creditApplicationId}`, "GET");
      } else {
        return await apiRequest(`/api/credit/applications/${importData.creditApplicationId}`, "GET");
      }
    },
    enabled: !!importData?.creditApplicationId,
  });

  // Fetch payment schedule
  const { data: paymentSchedule = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/payments/schedule', importId],
    queryFn: () => apiRequest(`/api/payments/schedule/${importId}`, 'GET'),
    enabled: !!importId,
    retry: false
  });

  // Generate payment schedule mutation
  const generatePaymentsMutation = useMutation({
    mutationFn: () => apiRequest(`/api/payments/generate/${importId}`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/schedule', importId] });
      toast({
        title: "Cronograma gerado com sucesso",
        description: "O cronograma de pagamentos foi criado baseado nas condições de crédito aprovadas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar cronograma",
        description: error.message || "Não foi possível gerar o cronograma de pagamentos.",
        variant: "destructive",
      });
    }
  });

  if (!importId) {
    return <div>Importação não encontrada</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!importData) {
    return <div>Importação não encontrada</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Em Andamento</Badge>;
      case "planning":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Planejamento</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getShippingIcon = (method: string) => {
    switch (method) {
      case "sea":
        return <Ship className="w-4 h-4" />;
      case "air":
        return <Plane className="w-4 h-4" />;
      case "land":
        return <Truck className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getShippingLabel = (method: string) => {
    switch (method) {
      case "sea":
        return "Marítimo";
      case "air":
        return "Aéreo";
      case "land":
        return "Terrestre";
      default:
        return method;
    }
  };

  const getPaymentTypeLabel = (type: string, payment: any) => {
    switch (type) {
      case 'down_payment': return `Down Payment (30%)`;
      case 'installment': return `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`;
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const canEdit = importData.status === 'planning' && (isAdmin || importData.userId === user?.id);
  const canCancel = !['cancelled', 'completed'].includes(importData.status) && (isAdmin || importData.userId === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/imports")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {importData.importName || "Detalhes da Importação"}
            </h1>
            <p className="text-gray-600">
              Importação ID: {importData.id} • {formatUSD(parseFloat(importData.totalValue) || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados">Dados da Importação</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Informações da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome da Importação</label>
                      <p className="text-sm font-semibold text-gray-900">{importData.importName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(importData.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tipo de Carga</label>
                      <p className="text-sm text-gray-900">{importData.cargoType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Método de Envio</label>
                      <div className="flex items-center gap-2">
                        {getShippingIcon(importData.shippingMethod)}
                        <span className="text-sm text-gray-900">{getShippingLabel(importData.shippingMethod)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Incoterms</label>
                      <p className="text-sm text-gray-900">{importData.incoterms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Entrega Prevista</label>
                      <p className="text-sm text-gray-900">Não definida</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { stage: 'Estimativa Criada', completed: true },
                      { stage: 'Início da Produção', completed: false },
                      { stage: 'Entregue ao Agente', completed: false },
                      { stage: 'Transporte Marítimo', completed: false }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={`text-sm ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {item.stage}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Analysis */}
              {creditApplication && (
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Calculator className="w-5 h-5" />
                      Análise Financeira
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-green-600">Valor Total</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatUSD(parseFloat(importData.totalValue) || 0)}
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-gray-600">Moeda</p>
                          <p className="font-medium">{importData.currency}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Produtos</p>
                          <p className="font-medium">{importData.products?.length || 1}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cronograma de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Carregando cronograma de pagamentos...</p>
                </div>
              ) : paymentSchedule.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhum cronograma de pagamentos encontrado</p>
                  <Button 
                    onClick={() => generatePaymentsMutation.mutate()}
                    disabled={generatePaymentsMutation.isPending}
                  >
                    {generatePaymentsMutation.isPending ? 'Gerando...' : 'Gerar Cronograma'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentSchedule.map((payment: any) => (
                    <div key={payment.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {getPaymentTypeLabel(payment.paymentType, payment)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              {formatUSD(parseFloat(payment.amount) || 0)}
                            </p>
                            <p className={`text-sm ${
                              payment.status === 'paid' ? 'text-green-600' :
                              payment.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {getStatusLabel(payment.status)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setLocation(`/payments/details/${payment.id}`)}>
                                Ver Detalhes
                              </DropdownMenuItem>
                              {payment.status === 'pending' && (
                                <DropdownMenuItem onClick={() => setLocation(`/payments/pay/${payment.id}`)}>
                                  Pagar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum documento carregado ainda</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}