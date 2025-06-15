import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { 
  ArrowLeft,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Building2,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download
} from "lucide-react";

export default function ImportDetailsPage() {
  const [match, params] = useRoute("/import/details/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useUserPermissions();

  const importId = params?.id ? parseInt(params.id) : null;

  // Fetch import details
  const { data: importData, isLoading } = useQuery({
    queryKey: ["/api/imports", importId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/imports/${importId}`);
      return response.json();
    },
    enabled: !!importId,
  }) as { data: any, isLoading: boolean };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/imports/${importId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      toast({
        title: "Importação cancelada",
        description: "A importação foi cancelada com sucesso.",
      });
      window.location.href = '/imports';
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a importação.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-spark-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Importação não encontrada</h2>
        <p className="text-gray-600 mb-4">A importação solicitada não existe ou você não tem permissão para visualizá-la.</p>
        <Button onClick={() => window.location.href = '/imports'}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Importações
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planejamento: { label: "Planejamento", variant: "secondary" as const, icon: Clock },
      em_andamento: { label: "Em Andamento", variant: "default" as const, icon: Truck },
      concluida: { label: "Concluída", variant: "outline" as const, icon: CheckCircle },
      cancelada: { label: "Cancelada", variant: "destructive" as const, icon: AlertTriangle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planejamento;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const canEdit = importData.status === 'planejamento' && 
                 (permissions.isAdmin || importData.userId === user?.id);
  const canCancel = importData.status !== 'cancelada' && importData.status !== 'concluida' &&
                   (permissions.isAdmin || importData.userId === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/imports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {importData.importNumber || `IMP-${importData.id.toString().padStart(3, '0')}`}
            </h1>
            <p className="text-gray-600">Detalhes da Importação</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(importData.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="text-sm text-gray-900">{importData.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(importData.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fornecedor</label>
                  <p className="text-sm text-gray-900">{importData.supplierName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Local de Origem</label>
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <MapPin className="w-3 h-3" />
                    {importData.supplierLocation}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor Total</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(importData.totalValue, 'USD')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Data Estimada</label>
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <Calendar className="w-3 h-3" />
                    {formatDate(importData.estimatedArrival)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {importData.observations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {importData.observations}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Importador</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{importData.user?.companyName || 'N/A'}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-500">Criado em</label>
                  <p className="text-sm text-gray-900">{formatDate(importData.createdAt)}</p>
                </div>
                {importData.updatedAt && importData.updatedAt !== importData.createdAt && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Atualizado em</label>
                    <p className="text-sm text-gray-900">{formatDate(importData.updatedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4 mr-2" />
                Imprimir Detalhes
              </Button>
              
              {canEdit && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/import/edit/${importData.id}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Importação
                </Button>
              )}
              
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancelar Importação
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Importação</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar esta importação? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancelar Importação
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}