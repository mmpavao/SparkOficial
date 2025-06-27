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
    entregue_agente: "bg-green-100 text-green-800 border-green-200",
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
    entregue_agente: "border-l-green-500",
    transporte_maritimo: "border-l-orange-500",
    transporte_aereo: "border-l-orange-500",
    desembaraco: "border-l-indigo-500",
    transporte_nacional: "border-l-teal-500",
    concluido: "border-l-emerald-500",
    cancelado: "border-l-red-500",
  };
  return colors[status as keyof typeof colors] || "border-l-gray-300";
};

const getIconColor = (status: string) => {
  const colors = {
    planejamento: "bg-blue-500",
    producao: "bg-yellow-500",
    entregue_agente: "bg-green-500",
    transporte_maritimo: "bg-orange-500",
    transporte_aereo: "bg-orange-500",
    desembaraco: "bg-indigo-500",
    transporte_nacional: "bg-teal-500",
    concluido: "bg-emerald-500",
    cancelado: "bg-red-500",
  };
  return colors[status as keyof typeof colors] || "bg-gray-500";
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

  const handleCardClick = () => {
    setLocation(`/imports/details/${importData.id}`);
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
      <Card 
        className={`hover:shadow-md transition-shadow border-l-4 ${getBorderColor(importData.status)} cursor-pointer`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Icon and Basic Info */}
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(importData.status)}`}>
                <Package className="w-5 h-5 text-white" />
              </div>

              {/* Import Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {importData.importName || `Cadeiras AMS`}
                  </h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{createdDate}</p>
                
                {/* Mini info cards */}
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`${getStatusColor(importData.status)} text-xs px-2 py-1`}
                  >
                    {getStatusLabel(importData.status)}
                  </Badge>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {importData.incoterms || 'FOB'}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {importData.cargoType || 'FCL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Value and Actions */}
            <div className="flex items-center gap-4">
              {/* Products Mini Card */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Produtos</p>
                <p className="text-sm font-medium text-gray-700">
                  {products.length > 0 ? (
                    products.slice(0, 1).map((product: any) => 
                      product.name || product.description || 'tennis'
                    )[0]
                  ) : (
                    'tennis'
                  )}
                </p>
              </div>

              {/* Value Card */}
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Valor Total</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalValue, importData.currency || "USD")}
                </div>
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