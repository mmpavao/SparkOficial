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
  zipCode: string;
  role: string;
  // Financial terms fields
  defaultAdminFeeRate?: number | null;
  defaultDownPaymentRate?: number | null;
  defaultPaymentTerms?: string | null;
}

interface CreditApplication {
  id: number;
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

interface CreditUsage {
  totalLimit: number;
  totalUsed: number;
  available: number;
  utilizationPercentage: number;
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
  const { data: creditApplications = [], isLoading: creditsLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}/credit-applications`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}/credit-applications`, "GET"),
    enabled: !!importerId,
  });

  // Fetch imports
  const { data: imports = [], isLoading: importsLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}/imports`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}/imports`, "GET"),
    enabled: !!importerId,
  });

  // Fetch credit usage summary
  const { data: creditUsage, isLoading: usageLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}/credit-usage`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}/credit-usage`, "GET"),
    enabled: !!importerId,
  });

  // Update importer mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ImporterDetails>) => 
      apiRequest(`/api/test/importers/${importerId}`, "PUT", data),
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
    mutationFn: () => apiRequest(`/api/admin/importers/${importerId}/reset-password`, "POST"),
    onSuccess: (response) => {
      toast({
        title: "Sucesso",
        description: `Senha redefinida: ${response.temporaryPassword}`,
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

  const handleResetPassword = () => {
    resetPasswordMutation.mutate();
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getCreditStatusBadge = (status: string, financialStatus?: string, adminStatus?: string) => {
    if (adminStatus === 'finalized') return <Badge className="bg-blue-100 text-blue-800">Finalizado</Badge>;
    if (financialStatus === 'approved') return <Badge className="bg-green-100 text-green-800">Aprovado Financeiramente</Badge>;
    if (status === 'pre_approved') return <Badge className="bg-yellow-100 text-yellow-800">Pré-aprovado</Badge>;
    if (status === 'pending') return <Badge className="bg-orange-100 text-orange-800">Em Análise</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  };

  if (importerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/importers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="flex justify-center py-8">
          <div className="text-gray-500">Carregando detalhes do importador...</div>
        </div>
      </div>
    );
  }

  if (!importer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/importers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">Importador não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/importers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{importer.fullName}</h1>
            <p className="text-gray-600">{importer.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(importer.status)}
          <Button
            variant="outline"
            onClick={() => setShowResetPassword(true)}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Renovar Senha
          </Button>
          {!isEditing ? (
            <Button
              onClick={() => {
                setIsEditing(true);
                setEditData(importer);
              }}
              className="bg-blue-600 hover:bg-blue-700"
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Condições Financeiras</TabsTrigger>
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
                      {formatDate(importer.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
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
                <div className="grid grid-cols-2 gap-4">
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
                      {creditUsage ? formatCurrency(creditUsage.totalLimit) : '-'}
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
                      {creditUsage ? `${creditUsage.utilizationPercentage}%` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Financial Terms Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Condições Financeiras Globais
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure os termos padrão que serão aplicados automaticamente às importações deste cliente.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Admin Fee Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa Administrativa (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ex: 10"
                    value={editData.defaultAdminFeeRate || ''}
                    onChange={(e) => setEditData({...editData, defaultAdminFeeRate: parseFloat(e.target.value) || null})}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500">Percentual aplicado sobre o valor financiado</p>
                </div>

                {/* Down Payment Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entrada (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Ex: 30"
                    value={editData.defaultDownPaymentRate || ''}
                    onChange={(e) => setEditData({...editData, defaultDownPaymentRate: parseInt(e.target.value) || null})}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500">Percentual de entrada obrigatória</p>
                </div>

                {/* Payment Terms */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prazos de Pagamento</label>
                  <Input
                    type="text"
                    placeholder="Ex: 30,60,90,120"
                    value={editData.defaultPaymentTerms || ''}
                    onChange={(e) => setEditData({...editData, defaultPaymentTerms: e.target.value})}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500">Prazos em dias, separados por vírgula</p>
                </div>
              </div>

              {/* Current Settings Display */}
              {!isEditing && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Configurações Atuais:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Taxa Admin:</span>
                      <span className="ml-2 font-medium">
                        {importer.defaultAdminFeeRate ? `${importer.defaultAdminFeeRate}%` : 'Não configurado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Entrada:</span>
                      <span className="ml-2 font-medium">
                        {importer.defaultDownPaymentRate ? `${importer.defaultDownPaymentRate}%` : 'Não configurado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Prazos:</span>
                      <span className="ml-2 font-medium">
                        {importer.defaultPaymentTerms ? `${importer.defaultPaymentTerms} dias` : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Benefícios das Condições Globais:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Importações futuras usarão automaticamente essas configurações</li>
                  <li>• Não será necessário selecionar aplicação de crédito a cada importação</li>
                  <li>• Cliente terá experiência mais fluida e rápida</li>
                  <li>• Mantém consistência nos termos aplicados</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit" className="space-y-6">
          {/* Credit Usage Summary */}
          {creditUsage && (
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Uso de Crédito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Limite Total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(creditUsage.totalLimit)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Em Uso</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(creditUsage.totalUsed)}
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
                      style={{ width: `${creditUsage.utilizationPercentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {creditUsage.utilizationPercentage}% utilizado
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : creditApplications.length > 0 ? (
                <div className="space-y-4">
                  {creditApplications.map((credit: CreditApplication) => (
                    <div key={credit.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Solicitação #{credit.id}</h4>
                          <p className="text-sm text-gray-600">{credit.legalCompanyName}</p>
                          <p className="text-sm text-gray-600">
                            Solicitado: {formatCurrency(credit.requestedAmount)}
                          </p>
                          {credit.finalCreditLimit && (
                            <p className="text-sm font-medium text-green-600">
                              Aprovado: {formatCurrency(credit.finalCreditLimit)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(credit.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          {getCreditStatusBadge(credit.status, credit.financialStatus, credit.adminStatus)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma solicitação de crédito encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Importações</CardTitle>
            </CardHeader>
            <CardContent>
              {importsLoading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : imports.length > 0 ? (
                <div className="space-y-4">
                  {imports.map((importItem: Import) => (
                    <div key={importItem.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{importItem.importName}</h4>
                          <p className="text-sm text-gray-600">
                            Valor: {formatCurrency(importItem.totalValue)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Tipo: {importItem.cargoType === 'FCL' ? 'Container Completo' : 'Carga Fracionada'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(importItem.createdAt)}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(importItem.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma importação encontrada
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
              <div className="text-center py-8 text-gray-500">
                Logs de atividade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renovar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja renovar a senha do importador {importer.fullName}? 
              Uma nova senha será gerada e exibida para você.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Renovando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}