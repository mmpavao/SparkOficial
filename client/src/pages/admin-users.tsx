import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatPhone } from "@/lib/phone";
import { Users, UserPlus, MoreVertical, Edit, UserCheck, UserX } from "lucide-react";
import type { User } from "@shared/schema";

const createUserSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  companyName: z.string().min(2, "Nome da empresa obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  phone: z.string().min(10, "Telefone inválido"),
  role: z.enum(["admin", "importer"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function AdminUsersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {}
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateDialogOpen(false);
      toast({
        title: "Sucesso!",
        description: "Usuário criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso!",
        description: "Role do usuário atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a role do usuário.",
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/deactivate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso!",
        description: "Usuário desativado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível desativar o usuário.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      cnpj: "",
      phone: "",
      role: "importer",
    },
  });

  const handleConfirmAction = (title: string, description: string, action: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      description,
      action
    });
  };

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const getStatusBadge = (status: string | undefined) => {
    const userStatus = status || 'active';
    return userStatus === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="destructive">Inativo</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-blue-100 text-blue-800">Administrador</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Importador</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600">Gerencie usuários do sistema e suas permissões</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-spark-600 hover:bg-spark-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="importer">Importador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirme a senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-700">Nome</th>
                        <th className="text-left p-4 font-medium text-gray-700">Email</th>
                        <th className="text-left p-4 font-medium text-gray-700">Telefone</th>
                        <th className="text-left p-4 font-medium text-gray-700">Role</th>
                        <th className="text-left p-4 font-medium text-gray-700">Status</th>
                        <th className="text-center p-4 font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user: User) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{user.fullName}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-900">{user.email}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-900">{formatPhone(user.phone || '')}</div>
                          </td>
                          <td className="p-4">
                            {getRoleBadge(user.role || 'importer')}
                          </td>
                          <td className="p-4">
                            {getStatusBadge((user as any).status)}
                          </td>
                          <td className="p-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleConfirmAction(
                                    "Alterar Role",
                                    `Deseja alterar a role do usuário ${user.fullName}?`,
                                    () => updateRoleMutation.mutate({ 
                                      userId: user.id, 
                                      role: user.role === 'admin' ? 'importer' : 'admin'
                                    })
                                  )}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Alterar Role
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => handleConfirmAction(
                                    "Ativar Usuário",
                                    `Deseja ativar o usuário ${user.fullName}?`,
                                    () => console.log('Ativar usuário', user.id)
                                  )}
                                  className="text-green-600"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Ativar
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => handleConfirmAction(
                                    "Desativar Usuário",
                                    `Deseja desativar o usuário ${user.fullName}? Esta ação pode ser revertida.`,
                                    () => deactivateUserMutation.mutate(user.id)
                                  )}
                                  className="text-red-600"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {users.map((user: User) => (
                  <div
                    key={user.id}
                    className="bg-white border rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleConfirmAction(
                              "Alterar Role",
                              `Deseja alterar a role do usuário ${user.fullName}?`,
                              () => updateRoleMutation.mutate({ 
                                userId: user.id, 
                                role: user.role === 'admin' ? 'importer' : 'admin'
                              })
                            )}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Alterar Role
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleConfirmAction(
                              "Ativar Usuário",
                              `Deseja ativar o usuário ${user.fullName}?`,
                              () => console.log('Ativar usuário', user.id)
                            )}
                            className="text-green-600"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Ativar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleConfirmAction(
                              "Desativar Usuário",
                              `Deseja desativar o usuário ${user.fullName}? Esta ação pode ser revertida.`,
                              () => deactivateUserMutation.mutate(user.id)
                            )}
                            className="text-red-600"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Telefone:</span>
                        <div className="font-medium">{formatPhone(user.phone || '')}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <div className="mt-1">{getRoleBadge(user.role || 'importer')}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Status:</span>
                        <div className="mt-1">{getStatusBadge(user.status || 'active')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmDialog.action();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}