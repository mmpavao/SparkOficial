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
import { MoreVertical, Eye, Edit2, XCircle, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { formatCurrency } from "@/lib/formatters";
import type { Import } from "@shared/schema";

interface ImportCardProps {
  importData: Import;
}

const getStatusColor = (status: string) => {
  const colors = {
    planning: "bg-blue-100 text-blue-800 border-blue-200",
    production: "bg-yellow-100 text-yellow-800 border-yellow-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    in_transit: "bg-orange-100 text-orange-800 border-orange-200",
    customs: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
};

const getStatusLabel = (status: string) => {
  const labels = {
    planning: "Planejamento",
    production: "Produção",
    shipped: "Enviado",
    in_transit: "Em Trânsito",
    customs: "Desembaraço",
    delivered: "Entregue",
    completed: "Concluído",
    cancelled: "Cancelado",
  };
  return labels[status as keyof typeof labels] || status;
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

  const canEdit = importData.status === 'planning';
  const canCancel = importData.status !== 'completed' && importData.status !== 'cancelled';

  // Parse products for display
  const products = Array.isArray(importData.products) ? importData.products : [];
  const totalProducts = products.length;
  const totalValue = parseFloat(importData.totalValue || "0");

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {importData.importName || `Importação #${importData.id}`}
                </h3>
                {(isAdmin || isFinanceira) && (
                  <Badge variant="outline" className="text-xs">
                    {importData.user?.companyName || "Empresa não informada"}
                  </Badge>
                )}
              </div>
              <Badge 
                className={`${getStatusColor(importData.status)} border font-medium`}
              >
                {getStatusLabel(importData.status)}
              </Badge>
            </div>

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
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Products Summary */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>
              {totalProducts} {totalProducts === 1 ? "produto" : "produtos"}
              {importData.cargoType && (
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                  {importData.cargoType}
                </span>
              )}
            </span>
          </div>

          {/* Products Preview */}
          {products.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {products.slice(0, 3).map((product, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {product.name}
                  </Badge>
                ))}
                {products.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{products.length - 3} mais
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {formatCurrency(totalValue, importData.currency || "USD")}
              </span>
            </div>

            {/* Shipping Info */}
            <div className="text-right text-sm text-gray-500">
              {importData.incoterms && (
                <div>{importData.incoterms}</div>
              )}
              {importData.shippingMethod && (
                <div className="text-xs">{importData.shippingMethod}</div>
              )}
            </div>
          </div>

          {/* Timeline Info */}
          {importData.estimatedDelivery && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              Entrega estimada: {new Date(importData.estimatedDelivery).toLocaleDateString('pt-BR')}
            </div>
          )}
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