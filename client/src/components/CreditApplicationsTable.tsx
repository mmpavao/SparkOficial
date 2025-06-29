import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  FileText,
  Building,
  DollarSign,
  Calendar
} from "lucide-react";

interface CreditApplication {
  id: number;
  legalCompanyName: string;
  requestedAmount: string;
  status: string;
  financialStatus?: string;
  adminStatus?: string;
  createdAt: string;
  creditLimit?: string;
  finalCreditLimit?: string;
  requiredDocuments?: any;
  optionalDocuments?: any;
}

interface CreditApplicationsTableProps {
  applications: CreditApplication[];
  isLoading: boolean;
}

export default function CreditApplicationsTable({ applications, isLoading }: CreditApplicationsTableProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const permissions = useUserPermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<number | null>(null);

  // Status mapping function
  const getStatusInfo = (application: CreditApplication) => {
    if (application.financialStatus === 'approved') {
      return { 
        label: 'Aprovado', 
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    } else if (application.financialStatus === 'rejected') {
      return { 
        label: 'Rejeitado', 
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    } else if (application.status === 'approved' || application.status === 'submitted_to_financial') {
      return { 
        label: 'Análise Final', 
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else if (application.status === 'under_review') {
      return { 
        label: 'Em Análise', 
        variant: 'outline' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    } else {
      return { 
        label: 'Pendente', 
        variant: 'outline' as const,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      };
    }
  };

  // Count uploaded documents
  const countUploadedDocuments = (application: CreditApplication) => {
    const requiredDocs = application.requiredDocuments || {};
    const optionalDocs = application.optionalDocuments || {};
    
    let totalFilesUploaded = 0;
    
    Object.values(requiredDocs).forEach(doc => {
      if (Array.isArray(doc)) {
        totalFilesUploaded += doc.length;
      } else if (doc) {
        totalFilesUploaded += 1;
      }
    });
    
    Object.values(optionalDocs).forEach(doc => {
      if (Array.isArray(doc)) {
        totalFilesUploaded += doc.length;
      } else if (doc) {
        totalFilesUploaded += 1;
      }
    });

    return totalFilesUploaded;
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    if (!amount) return 'N/A';
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  // Delete mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return await apiRequest(`/api/credit/applications/${applicationId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-applications"] });
      toast({
        title: "Sucesso!",
        description: "Solicitação de crédito excluída com sucesso.",
      });
      setShowDeleteDialog(false);
      setApplicationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a solicitação.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (applicationId: number) => {
    setApplicationToDelete(applicationId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (applicationToDelete) {
      deleteApplicationMutation.mutate(applicationToDelete);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Crédito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Crédito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma solicitação de crédito encontrada</p>
            <p className="text-sm text-gray-400">
              Suas solicitações de crédito aparecerão aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {permissions.canViewAllApplications 
              ? "Todas as Solicitações de Crédito" 
              : "Minhas Solicitações de Crédito"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Valor Solicitado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => {
                  const statusInfo = getStatusInfo(application);
                  const documentsCount = countUploadedDocuments(application);
                  
                  return (
                    <TableRow key={application.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        #{application.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-sm">
                            {application.legalCompanyName || 'Empresa'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            {formatCurrency(application.requestedAmount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            documentsCount >= 10 
                              ? 'bg-green-100 text-green-700' 
                              : documentsCount >= 5
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-orange-100 text-orange-700'
                          }`}>
                            {documentsCount} docs
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(application.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/credit/details/${application.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            
                            {(application.status === 'pending' || application.status === 'under_review') && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/credit/edit/${application.id}`)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(application.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta solicitação de crédito? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteApplicationMutation.isPending}
            >
              {deleteApplicationMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}