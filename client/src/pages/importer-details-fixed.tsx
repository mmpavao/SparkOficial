import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { 
  ArrowLeft, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  Edit,
  KeyRound,
  Save,
  X
} from "lucide-react";

interface ImporterDetails {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  cnpj: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  address: string;
  city: string;
  state: string;
}

interface CreditApplication {
  id: number;
  userId: number;
  legalCompanyName: string;
  requestedAmount: string;
  status: string;
  financialStatus: string;
  adminStatus: string;
  createdAt: string;
  finalCreditLimit?: string;
}

interface Import {
  id: number;
  importName: string;
  totalValue: string;
  status: string;
  createdAt: string;
  cargoType: string;
}

export default function ImporterDetailsPage() {
  const [, params] = useRoute("/importers/:id");
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ImporterDetails>>({});
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importerId = params?.id ? parseInt(params.id) : 0;

  // Fetch importer details
  const { data: importer, isLoading: importerLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}`, "GET"),
    enabled: !!importerId,
  });

  // Fetch credit applications
  const { data: allCreditApplications = [], isLoading: creditsLoading } = useQuery({
    queryKey: ['/api/admin/credit-applications'],
    enabled: !!importerId,
  });

  // Filter credit applications for this importer
  const creditApplications = allCreditApplications.filter((app: any) => app.userId === importerId);

  // Fetch imports
  const { data: allImports = [], isLoading: importsLoading } = useQuery({
    queryKey: ['/api/admin/imports'],
    enabled: !!importerId,
  });

  // Filter imports for this importer
  const imports = allImports.filter((imp: any) => imp.userId === importerId);

  // Calculate credit usage from the data we have
  const approvedApplications = creditApplications.filter((app: any) => 
    app.adminStatus === 'finalized' && app.finalCreditLimit
  );
  
  const totalLimit = approvedApplications.reduce((sum: number, app: any) => 
    sum + parseFloat(app.finalCreditLimit || '0'), 0
  );
  
  const totalUsed = imports
    .filter((imp: any) => imp.status !== 'cancelled')
    .reduce((sum: number, imp: any) => sum + parseFloat(imp.totalValue || '0'), 0);
  
  const creditUsage = {
    totalLimit,
    totalUsed,
    available: totalLimit - totalUsed,
    utilizationPercentage: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
  };

  // Update importer mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ImporterDetails>) => 
      apiRequest(`/api/admin/importers/${importerId}`, "PUT", data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Dados do importador atualizados com sucesso",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/importers/${importerId}`] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar dados do importador",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (newPassword: string) => 
      apiRequest(`/api/admin/importers/${importerId}/reset-password`, "POST", { password: newPassword }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Senha redefinida com sucesso",
      });
      setShowResetPassword(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao redefinir senha",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (importerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!importer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Importador não encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/importers')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{importer.fullName}</h1>
            <p className="text-gray-600">{importer.companyName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowResetPassword(true)}
            variant="outline"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Redefinir Senha
          </Button>
          {!isEditing ? (
            <Button
              onClick={() => {
                setIsEditing(true);
                setEditData(importer);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="credit">Análise de Crédito</TabsTrigger>
          <TabsTrigger value="imports">Importações</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                    {isEditing ? (
                      <Input
                        value={editData.fullName || ''}
                        onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                      />
                    ) : (
                      <p className="font-semibold">{importer.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    {isEditing ? (
                      <Input
                        value={editData.email || ''}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                      />
                    ) : (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {importer.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    {isEditing ? (
                      <Input
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      />
                    ) : (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {importer.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Empresa</label>
                    {isEditing ? (
                      <Input
                        value={editData.companyName || ''}
                        onChange={(e) => setEditData({...editData, companyName: e.target.value})}
                      />
                    ) : (
                      <p className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {importer.companyName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CNPJ</label>
                    <p className="font-mono">{importer.cnpj}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(importer.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Endereço</label>
                  {isEditing ? (
                    <Input
                      value={editData.address || ''}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
                    />
                  ) : (
                    <p>{importer.address}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cidade</label>
                  {isEditing ? (
                    <Input
                      value={editData.city || ''}
                      onChange={(e) => setEditData({...editData, city: e.target.value})}
                    />
                  ) : (
                    <p>{importer.city}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  {isEditing ? (
                    <Input
                      value={editData.state || ''}
                      onChange={(e) => setEditData({...editData, state: e.target.value})}
                    />
                  ) : (
                    <p>{importer.state}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Solicitações de Crédito</p>
                    <p className="text-2xl font-bold">{creditApplications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Importações</p>
                    <p className="text-2xl font-bold">{imports.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Limite de Crédito</p>
                    <p className="text-2xl font-bold">
                      {totalLimit > 0 ? formatCurrency(totalLimit) : 'US$ NaN'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Utilização</p>
                    <p className="text-2xl font-bold">
                      {totalLimit > 0 ? `${creditUsage.utilizationPercentage.toFixed(1)}%` : 'undefined%'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credit" className="space-y-6">
          {/* Credit Usage Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Uso de Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Limite Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalLimit)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Em Uso</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(totalUsed)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Disponível</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(creditUsage.available)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${Math.min(creditUsage.utilizationPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {creditUsage.utilizationPercentage.toFixed(1)}% utilizado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credit Applications List */}
          <Card>
            <CardHeader>
              <CardTitle>Aplicações de Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              {creditApplications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma aplicação de crédito encontrada</p>
              ) : (
                <div className="space-y-4">
                  {creditApplications.map((app: any) => (
                    <div key={app.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{app.legalCompanyName}</h3>
                          <p className="text-sm text-gray-600">ID: #{app.id}</p>
                        </div>
                        <Badge variant={
                          app.adminStatus === 'finalized' ? 'default' :
                          app.financialStatus === 'approved' ? 'secondary' :
                          app.preAnalysisStatus === 'pre_approved' ? 'outline' : 'destructive'
                        }>
                          {app.adminStatus === 'finalized' ? 'Finalizado' :
                           app.financialStatus === 'approved' ? 'Aprovado' :
                           app.preAnalysisStatus === 'pre_approved' ? 'Pré-aprovado' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">Solicitado</p>
                          <p className="font-semibold">{formatCurrency(parseFloat(app.requestedAmount))}</p>
                        </div>
                        {app.finalCreditLimit && (
                          <div>
                            <p className="text-sm text-gray-600">Aprovado</p>
                            <p className="font-semibold">{formatCurrency(parseFloat(app.finalCreditLimit))}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Criado em</p>
                          <p className="font-semibold">{new Date(app.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importações</CardTitle>
            </CardHeader>
            <CardContent>
              {imports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma importação encontrada</p>
              ) : (
                <div className="space-y-4">
                  {imports.map((imp: any) => (
                    <div key={imp.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{imp.importName}</h3>
                          <p className="text-sm text-gray-600">ID: #{imp.id}</p>
                        </div>
                        <Badge variant="outline">{imp.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">Valor</p>
                          <p className="font-semibold">{formatCurrency(parseFloat(imp.totalValue))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tipo</p>
                          <p className="font-semibold">{imp.cargoType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Criado em</p>
                          <p className="font-semibold">{new Date(imp.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">
                Funcionalidade de atividades será implementada em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja redefinir a senha deste importador?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetPasswordMutation.mutate('100senha')}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Redefinir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}