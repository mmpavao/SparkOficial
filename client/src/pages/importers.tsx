import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  KeyRound, 
  Eye, 
  FileText,
  Users,
  Building,
  Mail,
  Phone,
  RefreshCw,
  Copy
} from "lucide-react";

interface Importer {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  cnpj: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export default function ImportersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [selectedImporter, setSelectedImporter] = useState<Importer | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [importerLogs, setImporterLogs] = useState<any[]>([]);
  const [importerDetails, setImporterDetails] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch importers data
  const { data: importers = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/importers"],
    queryFn: () => apiRequest("/api/admin/importers", "GET"),
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (importerId: number) => {
      return await apiRequest(`/api/admin/importers/${importerId}/reset-password`, "POST");
    },
    onSuccess: (data) => {
      setNewPassword(data.temporaryPassword);
      setShowPasswordDialog(true);
      toast({
        title: "Senha redefinida",
        description: "Nova senha temporária gerada com sucesso",
      });
      setResetPasswordId(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao redefinir senha",
        variant: "destructive",
      });
    },
  });

  // Handle actions
  const handleViewDetails = async (importer: Importer) => {
    try {
      const details = await apiRequest(`/api/admin/importers/${importer.id}`, "GET");
      setImporterDetails(details);
      setSelectedImporter(importer);
      setShowDetailsDialog(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar detalhes do importador",
        variant: "destructive",
      });
    }
  };

  const handleViewLogs = async (importer: Importer) => {
    try {
      const logs = await apiRequest(`/api/admin/importers/${importer.id}/logs`, "GET");
      setImporterLogs(logs);
      setSelectedImporter(importer);
      setShowLogsDialog(true);
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Falha ao carregar logs do importador",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = (importer: Importer) => {
    setSelectedImporter(importer);
    setResetPasswordId(importer.id);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    toast({
      title: "Copiado",
      description: "Senha copiada para a área de transferência",
    });
  };

  const confirmResetPassword = () => {
    if (resetPasswordId) {
      resetPasswordMutation.mutate(resetPasswordId);
    }
  };

  // Filter importers based on search term
  const filteredImporters = importers.filter((importer: Importer) =>
    importer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    importer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    importer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    importer.cnpj.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Importadores</h1>
        </div>
        <div className="flex justify-center py-8">
          <div className="text-gray-500">Carregando importadores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importadores</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os importadores cadastrados na plataforma
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email, empresa ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{importers.length}</p>
                <p className="text-sm text-gray-600">Total de Importadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {importers.filter((i: Importer) => i.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {importers.filter((i: Importer) => i.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {importers.filter((i: Importer) => i.status === 'inactive').length}
                </p>
                <p className="text-sm text-gray-600">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Importers List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Importadores ({filteredImporters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredImporters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                Nenhum importador encontrado
              </div>
              <p className="text-gray-400">
                {searchTerm ? "Tente ajustar os termos de busca" : "Não há importadores cadastrados"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredImporters.map((importer: Importer) => (
                <div 
                  key={importer.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{importer.fullName}</h3>
                        {getStatusBadge(importer.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="h-4 w-4" />
                            <span>{importer.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{importer.email}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="h-4 w-4" />
                            <span>{importer.phone}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            CNPJ: {importer.cnpj}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Cadastrado em: {formatDate(importer.createdAt)}
                        {importer.lastLogin && (
                          <span className="ml-4">
                            Último acesso: {formatDate(importer.lastLogin)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(importer)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(importer)}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Renovar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewLogs(importer)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Logs
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={!!resetPasswordId} onOpenChange={() => setResetPasswordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renovar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja renovar a senha deste importador? 
              Uma nova senha será gerada e enviada por email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Renovando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Display Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Senha Gerada</DialogTitle>
            <DialogDescription>
              A nova senha foi gerada com sucesso. Compartilhe com o importador de forma segura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-semibold">{newPassword}</span>
                <Button onClick={copyPasswordToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Esta senha é temporária. O importador deve alterá-la no primeiro acesso.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Importador</DialogTitle>
          </DialogHeader>
          {importerDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                  <p className="font-semibold">{importerDetails.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(importerDetails.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p>{importerDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <p>{importerDetails.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Empresa</label>
                  <p>{importerDetails.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CNPJ</label>
                  <p>{importerDetails.cnpj}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
                  <p>{formatDate(importerDetails.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Último Acesso</label>
                  <p>{importerDetails.lastLogin ? formatDate(importerDetails.lastLogin) : 'Nunca'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Logs de Atividade</DialogTitle>
            <DialogDescription>
              Histórico de atividades do importador {selectedImporter?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {importerLogs.length > 0 ? (
              <div className="space-y-2">
                {importerLogs.map((log, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-600">{log.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma atividade registrada para este importador
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLogsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}