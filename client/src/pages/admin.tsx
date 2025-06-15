import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useMetrics } from "@/hooks/useMetrics";
import { useTranslation } from "@/contexts/I18nContext";
import { useLocation } from "wouter";
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
  const [location, setLocation] = useLocation();

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
        description: t.admin.creditStatusUpdated,
      });
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.admin.creditStatusError,
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
            <h2 className="text-xl font-semibold mb-2">{t.admin.accessDenied}</h2>
            <p className="text-gray-600">
              {t.admin.noPermission}
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
        <p className="text-gray-600">{t.admin.manageUsersCreditsImports}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t.admin.totalUsers}</p>
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
                <p className="text-sm font-medium text-gray-600">{t.admin.requestedCredit}</p>
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
                <p className="text-sm font-medium text-gray-600">{t.admin.approvedCredit}</p>
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
                <p className="text-sm font-medium text-gray-600">{t.admin.totalImports}</p>
                <p className="text-2xl font-bold text-gray-900">{allImports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">{t.admin.users}</TabsTrigger>
          <TabsTrigger value="credit">{t.admin.applications}</TabsTrigger>
          <TabsTrigger value="imports">{t.admin.imports}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t.admin.users}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.name}</TableHead>
                    <TableHead>{t.admin.company}</TableHead>
                    <TableHead>{t.auth.email}</TableHead>
                    <TableHead>{t.auth.cnpj}</TableHead>
                    <TableHead>{t.admin.requestDate}</TableHead>
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
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pré-Análise de Solicitações de Crédito
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Análise administrativa completa antes do envio à financeira
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Valor Solicitado</TableHead>
                    <TableHead>Completude</TableHead>
                    <TableHead>Pré-Análise</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCreditApplications.map((application) => {
                    // Calculate completion score based on available documents
                    const requiredDocs = application.requiredDocuments ? Object.keys(JSON.parse(application.requiredDocuments as string)) : [];
                    const optionalDocs = application.optionalDocuments ? Object.keys(JSON.parse(application.optionalDocuments as string)) : [];
                    const totalDocs = requiredDocs.length + optionalDocs.length;
                    const completionScore = Math.round((totalDocs / 18) * 100);
                    
                    // Parse review data if available
                    let reviewData = {};
                    try {
                      if (application.reviewNotes) {
                        reviewData = JSON.parse(application.reviewNotes);
                      }
                    } catch (e) {
                      // Handle invalid JSON
                    }
                    
                    const preAnalysisStatus = (reviewData as any)?.preAnalysisStatus || 'pending';
                    const riskLevel = (reviewData as any)?.riskAssessment || 'medium';
                    
                    return (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.legalCompanyName}</TableCell>
                        <TableCell>{formatCurrency(Number(application.requestedAmount || 0)).replace('R$', 'US$')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                              <div 
                                className={`h-2 rounded-full ${
                                  completionScore >= 80 ? 'bg-green-500' : 
                                  completionScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${completionScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{completionScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            preAnalysisStatus === 'pre_approved' ? 'bg-green-100 text-green-800' :
                            preAnalysisStatus === 'needs_documents' ? 'bg-blue-100 text-blue-800' :
                            preAnalysisStatus === 'needs_clarification' ? 'bg-orange-100 text-orange-800' :
                            preAnalysisStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {preAnalysisStatus === 'pending' && 'Pendente'}
                            {preAnalysisStatus === 'pre_approved' && 'Pré-Aprovado'}
                            {preAnalysisStatus === 'needs_documents' && 'Precisa Docs'}
                            {preAnalysisStatus === 'needs_clarification' && 'Precisa Info'}
                            {preAnalysisStatus === 'rejected' && 'Rejeitado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                            riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {riskLevel === 'low' && 'Baixo'}
                            {riskLevel === 'medium' && 'Médio'}
                            {riskLevel === 'high' && 'Alto'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(application.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/credit-analysis/${application.id}`)}
                            >
                              Analisar
                            </Button>
                            <Button
                              variant={application.status === 'pending' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateCreditMutation.mutate({ 
                                id: application.id, 
                                status: application.status === 'pending' ? 'approved' : 'pending' 
                              })}
                              disabled={updateCreditMutation.isPending}
                            >
                              {application.status === 'pending' ? 'Aprovar' : 'Pendente'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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