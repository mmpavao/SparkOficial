import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { User, CreditApplication, Import } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();

  // Check if user is admin (using email for now)
  const isAdmin = user?.email === "pavaosmart@gmail.com" || user?.role === "admin";

  // Admin queries - fetch ALL data for administrative purposes
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  }) as { data: User[] };

  const { data: allCreditApplications = [] } = useQuery({
    queryKey: ["/api/admin/credit-applications"],
    enabled: isAdmin,
  }) as { data: CreditApplication[] };

  const { data: allImports = [] } = useQuery({
    queryKey: ["/api/admin/imports"],
    enabled: isAdmin,
  }) as { data: Import[] };

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

  // Calculate metrics
  const totalCreditRequested = allCreditApplications.reduce((sum: number, app: CreditApplication) => sum + Number(app.requestedAmount || 0), 0);
  const totalCreditApproved = allCreditApplications.filter((app: CreditApplication) => app.financialStatus === 'approved').reduce((sum: number, app: CreditApplication) => sum + Number(app.creditLimit || 0), 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
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
                  {formatCurrency(totalCreditRequested).replace('R$', 'US$')}
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
                  {formatCurrency(totalCreditApproved).replace('R$', 'US$')}
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

      <Tabs defaultValue="credit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="credit">Solicitações</TabsTrigger>
          <TabsTrigger value="imports">Importações</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Data da Solicitação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.companyName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.cnpj}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {allUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit">
          <Card>
            <CardHeader>
              <CardTitle>Pré-Análise de Solicitações de Crédito</CardTitle>
              <p className="text-sm text-gray-600">Análise administrativa completa antes do envio à financeira</p>
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
                  {allCreditApplications.map((application: CreditApplication) => {
                    // Calculate completion score based on available documents
                    let requiredDocs = [];
                    let optionalDocs = [];
                    
                    try {
                      if (application.requiredDocuments) {
                        if (typeof application.requiredDocuments === 'string') {
                          requiredDocs = Object.keys(JSON.parse(application.requiredDocuments));
                        } else if (typeof application.requiredDocuments === 'object') {
                          requiredDocs = Object.keys(application.requiredDocuments);
                        }
                      }
                    } catch (e) {
                      // Handle invalid JSON for required documents
                    }
                    
                    try {
                      if (application.optionalDocuments) {
                        if (typeof application.optionalDocuments === 'string') {
                          optionalDocs = Object.keys(JSON.parse(application.optionalDocuments));
                        } else if (typeof application.optionalDocuments === 'object') {
                          optionalDocs = Object.keys(application.optionalDocuments);
                        }
                      }
                    } catch (e) {
                      // Handle invalid JSON for optional documents
                    }
                    
                    const totalDocs = requiredDocs.length + optionalDocs.length;
                    const completionScore = Math.round((totalDocs / 18) * 100);
                    
                    // Parse review data if available
                    let reviewData = {};
                    try {
                      if (application.reviewNotes) {
                        if (typeof application.reviewNotes === 'string') {
                          reviewData = JSON.parse(application.reviewNotes);
                        } else if (typeof application.reviewNotes === 'object') {
                          reviewData = application.reviewNotes;
                        }
                      }
                    } catch (e) {
                      // Handle invalid JSON for review notes
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
              {allCreditApplications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma solicitação de crédito encontrada
                </div>
              )}
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
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allImports.map((importItem: Import) => (
                    <TableRow key={importItem.id}>
                      <TableCell className="font-medium">{importItem.importName}</TableCell>
                      <TableCell>{importItem.products && Array.isArray(importItem.products) ? (importItem.products as any)[0]?.name : 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(Number(importItem.totalValue))}</TableCell>
                      <TableCell>
                        <Badge>{importItem.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(importItem.estimatedDelivery)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {allImports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma importação encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}