import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function SuppliersPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteSupplier, setDeleteSupplier] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data to check if admin
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  const typedUser = user as any;
  const isAdmin = typedUser?.role === "admin" || typedUser?.email === "pavaosmart@gmail.com";

  // Fetch suppliers data - use admin endpoint if admin
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: isAdmin ? ["/api/admin/suppliers"] : ["/api/suppliers"]
  });

  // Filter suppliers
  const filteredSuppliers = (suppliers as any[]).filter((supplier: any) =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      const response = await apiRequest("DELETE", `/api/suppliers/${supplierId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fornecedor excluído",
        description: "O fornecedor foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDeleteSupplier(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteSupplier = (supplier: any) => {
    setDeleteSupplier(supplier);
  };

  const confirmDelete = () => {
    if (deleteSupplier) {
      deleteSupplierMutation.mutate(deleteSupplier.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fornecedores
          </h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores chineses</p>
        </div>
        <Button onClick={() => setLocation('/suppliers/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar fornecedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppliers List */}
      <div className="space-y-4">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600">Nenhum fornecedor encontrado</div>
            <Button
              onClick={() => setLocation('/suppliers/new')}
              className="mt-4"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar primeiro fornecedor
            </Button>
          </div>
        ) : (
          filteredSuppliers.map((supplier: any) => (
            <div key={supplier.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {supplier.companyName}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Fornecedor Chinês
                    </Badge>
                    {isAdmin && (supplier as any).companyName && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        {(supplier as any).companyName}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Local: <strong>{supplier.city}, {supplier.country}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Tel: <strong>{supplier.phone}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Email: <strong>{supplier.email}</strong></span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocation(`/suppliers/details/${supplier.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation(`/suppliers/edit/${supplier.id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteSupplier(supplier)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSupplier} onOpenChange={() => setDeleteSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{deleteSupplier?.companyName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}