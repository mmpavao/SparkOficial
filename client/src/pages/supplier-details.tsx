import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Package,
  Calendar,
  AlertTriangle
} from "lucide-react";

export default function SupplierDetailsPage() {
  const [match, params] = useRoute("/suppliers/details/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const supplierId = params?.id ? parseInt(params.id) : null;

  // Fetch supplier details
  const { data: supplier, isLoading } = useQuery({
    queryKey: ["/api/suppliers", supplierId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/suppliers/${supplierId}`);
      return response.json();
    },
    enabled: !!supplierId,
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/suppliers/${supplierId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor excluído",
        description: "O fornecedor foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setLocation("/suppliers");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteSupplier = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteSupplierMutation.mutate();
    setShowDeleteDialog(false);
  };

  if (!match || !supplierId) {
    return <div>Fornecedor não encontrado</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!supplier) {
    return <div>Fornecedor não encontrado</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/suppliers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{supplier.companyName}</h1>
            <p className="text-muted-foreground">Detalhes do fornecedor</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/suppliers/edit/${supplier.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteSupplier}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nome da Empresa
                  </label>
                  <p className="font-medium">{supplier.companyName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Pessoa de Contato
                  </label>
                  <p className="font-medium">{supplier.contactName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Posição/Cargo
                  </label>
                  <p className="font-medium">{supplier.position || "Não informado"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Especialização
                  </label>
                  <p className="font-medium">{supplier.specialization || "Não informado"}</p>
                </div>
              </div>

              {supplier.description && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Descrição da Empresa
                    </label>
                    <p className="mt-1 text-sm">{supplier.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Telefone
                    </label>
                    <p className="font-medium">{supplier.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      E-mail
                    </label>
                    <p className="font-medium">{supplier.email}</p>
                  </div>
                </div>

                {supplier.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Website
                      </label>
                      <p className="font-medium">
                        <a 
                          href={supplier.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {supplier.website}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {supplier.wechat && (
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        WeChat
                      </label>
                      <p className="font-medium">{supplier.wechat}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Endereço
                  </label>
                  <p className="font-medium">{supplier.address}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cidade
                  </label>
                  <p className="font-medium">{supplier.city}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Província
                  </label>
                  <p className="font-medium">{supplier.province}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    País
                  </label>
                  <p className="font-medium">China</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Ativo
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <Badge variant="secondary">
                    Fornecedor Chinês
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID</span>
                  <span className="text-sm font-mono">#{supplier.id}</span>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Adicionado em
                </label>
                <p className="text-sm flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {supplier.createdAt ? 
                    new Date(supplier.createdAt).toLocaleDateString('pt-BR') : 
                    "Data não disponível"
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Comerciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.minimumOrder && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Pedido Mínimo
                  </label>
                  <p className="font-medium">{supplier.minimumOrder}</p>
                </div>
              )}

              {supplier.paymentTerms && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Termos de Pagamento
                  </label>
                  <p className="font-medium">{supplier.paymentTerms}</p>
                </div>
              )}

              {supplier.leadTime && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tempo de Produção
                  </label>
                  <p className="font-medium">{supplier.leadTime}</p>
                </div>
              )}

              {supplier.certifications && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Certificações
                  </label>
                  <p className="text-sm">{supplier.certifications}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation(`/suppliers/edit/${supplier.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Fornecedor
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation("/imports/new")}
              >
                <Package className="h-4 w-4 mr-2" />
                Nova Importação
              </Button>

              <Separator />

              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDeleteSupplier}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Fornecedor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{supplier.companyName}"?
              <br /><br />
              <strong>Esta ação não pode ser desfeita.</strong> Todas as informações do fornecedor 
              serão permanentemente removidas do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Definitivamente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}