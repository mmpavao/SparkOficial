import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  DollarSign,
  Calendar,
  Percent,
  Eye,
  X
} from "lucide-react";

const creditApplicationSchema = z.object({
  requestedAmount: z.string().min(1, "Valor é obrigatório"),
  purpose: z.string().min(10, "Finalidade deve ter pelo menos 10 caracteres"),
  notes: z.string().optional(),
});

type CreditApplicationForm = z.infer<typeof creditApplicationSchema>;

export default function CreditPage() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<CreditApplicationForm>({
    resolver: zodResolver(creditApplicationSchema),
    defaultValues: {
      requestedAmount: "",
      purpose: "",
      notes: "",
    },
  });

  // Fetch credit applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/credit/applications"],
  });

  // Create credit application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: CreditApplicationForm) => {
      const response = await apiRequest("POST", "/api/credit/applications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      toast({
        title: t.credit.applicationSuccess,
        description: t.credit.applicationSent,
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t.credit.applicationError,
        description: error.message || t.common.error,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreditApplicationForm) => {
    createApplicationMutation.mutate(data);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: t.credit.status.pending, variant: "secondary" as const, icon: Clock },
      under_review: { label: t.credit.status.under_review, variant: "default" as const, icon: FileText },
      approved: { label: t.credit.status.approved, variant: "default" as const, icon: CheckCircle },
      rejected: { label: t.credit.status.rejected, variant: "destructive" as const, icon: XCircle },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.credit.title}</h1>
          <p className="text-gray-600">
            {t.credit.requestCredit}
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-spark-600 hover:bg-spark-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.credit.newApplication}
        </Button>
      </div>

      {/* New Credit Application Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t.credit.newApplication}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requestedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Solicitado (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Empresa</label>
                    <Input
                      value={user?.companyName || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finalidade do Crédito</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva para que você pretende usar este crédito (ex: importação de eletrônicos da China, compra de matéria-prima, etc.)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Adicionais (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais que possam ajudar na análise..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createApplicationMutation.isPending}
                    className="bg-spark-600 hover:bg-spark-700"
                  >
                    {createApplicationMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédito Disponível</p>
                <p className="text-2xl font-bold text-green-600">R$ 25.000</p>
                <p className="text-xs text-gray-500 mt-1">Limite aprovado</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédito Utilizado</p>
                <p className="text-2xl font-bold text-blue-600">R$ 15.000</p>
                <p className="text-xs text-gray-500 mt-1">60% do limite</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximo Vencimento</p>
                <p className="text-2xl font-bold text-orange-600">15 dias</p>
                <p className="text-xs text-gray-500 mt-1">R$ 5.000</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando solicitações...</p>
            </div>
          ) : !applications || !Array.isArray(applications) || applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhuma solicitação encontrada</p>
              <p className="text-sm text-gray-400">
                Suas solicitações de crédito aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(applications) && applications.map((application: any) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">
                        Solicitação #{application.id}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Valor: {formatCurrency(application.requestedAmount)}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {application.purpose}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Criado em: {new Date(application.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}