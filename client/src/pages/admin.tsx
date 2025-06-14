import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useMetrics } from "@/hooks/useMetrics";
import { useTranslation } from "@/contexts/I18nContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, CreditCard, Package, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MetricsCard from "@/components/common/MetricsCard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { User, CreditApplication, Import } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Check if user is admin (using email for now)
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";

  const { metrics, users: allUsers, creditApplications: allCreditApplications, imports: allImports } = useMetrics(isAdmin);

  // Update credit application status
  const updateCreditMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PUT", `/api/admin/credit-applications/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      toast({
        title: t.common.success,
        description: "Status da solicitação de crédito foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: "Erro ao atualizar status da solicitação.",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      under_review: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.admin.title}</h1>
        <p className="text-gray-600">Gerencie usuários, créditos e importações</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Crédito Solicitado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalCreditRequested)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Crédito Aprovado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalCreditApproved)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Importações</p>
                <p className="text-2xl font-bold text-gray-900">{allImports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="credit">Solicitações de Crédito</TabsTrigger>
          <TabsTrigger value="imports">Importações</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.companyName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.cnpj}</TableCell>
                      <TableCell>
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Valor Solicitado</TableHead>
                    <TableHead>Propósito</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCreditApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {(allUsers.find((u: User) => u.id === application.userId)?.companyName) || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(application.requestedAmount))}</TableCell>
                      <TableCell>{application.purpose}</TableCell>
                      <TableCell>
                        <StatusBadge status={application.status} type="credit" />
                      </TableCell>
                      <TableCell>
                        {formatDate(application.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCreditMutation.mutate({
                                  id: application.id,
                                  status: 'approved'
                                })}
                                disabled={updateCreditMutation.isPending}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateCreditMutation.mutate({
                                  id: application.id,
                                  status: 'rejected'
                                })}
                                disabled={updateCreditMutation.isPending}
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports">
          <Card>
            <CardHeader>
              <CardTitle>Importações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Estimada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allImports.map((importItem) => (
                    <TableRow key={importItem.id}>
                      <TableCell className="font-medium">{importItem.productDescription}</TableCell>
                      <TableCell>{importItem.supplierName}</TableCell>
                      <TableCell>{formatCurrency(Number(importItem.totalValue))}</TableCell>
                      <TableCell>
                        <StatusBadge status={importItem.status} type="import" />
                      </TableCell>
                      <TableCell>
                        {formatDate(importItem.estimatedDelivery)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}