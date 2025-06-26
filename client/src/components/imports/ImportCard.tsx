import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical, Eye, Edit2, XCircle, Package, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { formatCurrency } from "@/lib/formatters";
interface ImportItem {
  id: number;
  userId: number;
  importName: string;
  importNumber?: string;
  cargoType: 'FCL' | 'LCL';
  totalValue: string;
  currency: string;
  currentStage: string;
  status: string;
  estimatedDelivery?: string;
  supplierId?: number;
  supplierName?: string;
  companyName?: string;
  products: any[];
  createdAt: string;
  incoterms?: string;
  shippingMethod?: string;
}

interface ImportCardProps {
  importData: any; // Aceita qualquer formato de dados de importação
}

const getStatusColor = (status: string) => {
  const colors = {
    planejamento: "bg-blue-100 text-blue-800 border-blue-200",
    producao: "bg-yellow-100 text-yellow-800 border-yellow-200",
    entregue_agente: "bg-purple-100 text-purple-800 border-purple-200",
    transporte_maritimo: "bg-orange-100 text-orange-800 border-orange-200",
    transporte_aereo: "bg-orange-100 text-orange-800 border-orange-200",
    desembaraco: "bg-indigo-100 text-indigo-800 border-indigo-200",
    transporte_nacional: "bg-teal-100 text-teal-800 border-teal-200",
    concluido: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelado: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
};

const getStatusLabel = (status: string) => {
  const labels = {
    planejamento: "Planejamento",
    producao: "Produção", 
    entregue_agente: "Entregue Agente",
    transporte_maritimo: "Transporte Marítimo",
    transporte_aereo: "Transporte Aéreo",
    desembaraco: "Desembaraço",
    transporte_nacional: "Transporte Nacional",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };
  return labels[status as keyof typeof labels] || status;
};

const getBorderColor = (status: string) => {
  const colors = {
    planejamento: "border-l-blue-500",
    producao: "border-l-yellow-500",
    entregue_agente: "border-l-purple-500",
    transporte_maritimo: "border-l-orange-500",
    transporte_aereo: "border-l-orange-500",
    desembaraco: "border-l-indigo-500",
    transporte_nacional: "border-l-teal-500",
    concluido: "border-l-emerald-500",
    cancelado: "border-l-red-500",
  };
  return colors[status as keyof typeof colors] || "border-l-gray-300";
};

export default function ImportCard({ importData }: ImportCardProps) {
  const [, setLocation] = useLocation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isFinanceira } = useUserPermissions();

  const cancelMutation = useMutation({
    mutationFn: () => apiRequest(`/api/imports/${importData.id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Importação cancelada",
        description: "A importação foi cancelada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar importação",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = () => {
    setLocation(`/imports/${importData.id}`);
  };

  const handleEdit = () => {
    setLocation(`/imports/${importData.id}/edit`);
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    cancelMutation.mutate();
  };

  const canEdit = importData.status === 'planejamento';
  const canCancel = importData.status !== 'concluido' && importData.status !== 'cancelado';

  // Parse products for display
  const products = Array.isArray(importData.products) ? importData.products : [];
  const totalProducts = products.length;
  const totalValue = parseFloat(importData.totalValue || "0");

  // Format creation date
  const createdDate = importData.createdAt ? new Date(importData.createdAt).toLocaleDateString('pt-BR') : '';

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow border-l-4 ${getBorderColor(importData.status)}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            {/* Left side - Icon and Info */}
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                importData.status === 'planejamento' ? 'bg-blue-500' :
                importData.status === 'producao' ? 'bg-yellow-500' :
                importData.status === 'entregue_agente' ? 'bg-purple-500' :
                importData.status === 'transporte_maritimo' ? 'bg-orange-500' :
                importData.status === 'transporte_aereo' ? 'bg-orange-500' :
                importData.status === 'desembaraco' ? 'bg-indigo-500' :
                importData.status === 'transporte_nacional' ? 'bg-teal-500' :
                importData.status === 'concluido' ? 'bg-emerald-500' :
                importData.status === 'cancelado' ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                <Package className="w-6 h-6 text-white" />
              </div>

              {/* Import Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {importData.importName || `Cadeiras AMS`}
                  </h3>

                </div>
                
                <p className="text-sm text-gray-600 mb-2">{createdDate}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <Badge 
                    className={`${getStatusColor(importData.status)} border font-medium text-xs`}
                  >
                    {getStatusLabel(importData.status)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {importData.incoterms || 'Estimativa'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {importData.cargoType || 'FCL'}
                  </span>
                </div>

                {/* Products Preview */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Produtos</span>
                  <div className="mt-1">
                    {products.length > 0 ? (
                      products.slice(0, 2).map((product: any, index: number) => (
                        <span key={index} className="text-gray-700">
                          {product.name || product.description || 'Produto'}
                          {index < Math.min(products.length - 1, 1) && ', '}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-700">tennis</span>
                    )}
                    {products.length > 2 && (
                      <span className="text-gray-500"> +{products.length - 2} mais</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Value and Actions */}
            <div className="flex flex-col items-end gap-4">
              {/* Status and Value */}
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Valor Total</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalValue, importData.currency || "USD")}
                </div>
                {importData.estimatedDelivery && (
                  <div className="text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canCancel && (
                    <DropdownMenuItem onClick={handleCancel} className="text-red-600">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta importação? Esta ação não pode ser desfeita.
              O crédito reservado será liberado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? "Cancelando..." : "Sim, Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}