import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { formatCnpj } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import DataTable from "@/components/common/DataTable";
import { Users, UserPlus, Shield, UserCog, Trash2 } from "lucide-react";
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
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      return await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: t.common.success,
        description: t.common.usuariocriadocomsuce,
      });
    },
    onError: (error) => {
      toast({
        title: t.common.erro,
        description: t.common.erroaocriarusuario,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: t.common.success,
        description: "Role do usuário atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: t.common.error,
        description: "Erro ao atualizar role do usuário",
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário desativado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao desativar usuário",
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

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const columns = [
    {
      key: "fullName" as keyof User,
      label: "Nome",
      sortable: true,
    },
    {
      key: "email" as keyof User,
      label: "Email",
      sortable: true,
    },
    {
      key: "companyName" as keyof User,
      label: "Empresa",
      sortable: true,
    },
    {
      key: "cnpj" as keyof User,
      label: "CNPJ",
      render: (value: string) => formatCnpj(value),
    },
    {
      key: "phone" as keyof User,
      label: "Telefone",
      render: (value: string) => formatPhone(value),
    },
    {
      key: "role" as keyof User,
      label: "Role",
      render: (value: string) => (
        <Badge variant={value === "admin" ? "default" : "secondary"}>
          {value === "admin" ? "Administrador" : "Importador"}
        </Badge>
      ),
    },
    {
      key: "createdAt" as keyof User,
      label: "Criado em",
      render: (value: Date | null) => 
        value ? new Date(value).toLocaleDateString("pt-BR") : "-",
    },
  ];

  const actions = [
    {
      label: "Alterar Role",
      onClick: (user: User) => {
        const newRole = user.role === "admin" ? "importer" : "admin";
        updateRoleMutation.mutate({ userId: user.id, role: newRole });
      },
      condition: (user: User) => user.email !== "pavaosmart@gmail.com",
    },
    {
      label: "Desativar",
      onClick: (user: User) => {
        if (confirm(`Tem certeza que deseja desativar o usuário ${user.fullName}?`)) {
          deactivateUserMutation.mutate(user.id);
        }
      },
      variant: "destructive" as const,
      condition: (user: User) => user.email !== "pavaosmart@gmail.com" && user.role !== "inactive",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-spark-600" />{t.user.gestaodeusuarios}</h1>
          <p className="text-gray-600 mt-1">{t.user.gerencieusuariosdosi}</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-spark-600 hover:bg-spark-700">
              <UserPlus className="w-4 h-4 mr-2" />{t.user.criarusuario}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.user.criarnovousuario}</DialogTitle>
              <DialogDescription>{t.reports.preenchaosdadosparac}</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.nomecompleto}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.common.digiteonomecompleto} {...field} />
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
                      <FormLabel>{t.common.email}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.common.senha}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
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
                        <FormLabel>{t.common.confirmarsenha}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.nomedaempresa}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.common.digiteonomedaempresa} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00.000.000/0000-00" 
                            {...field}
                            onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                          />
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
                        <FormLabel>{t.common.telefone}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
                            {...field}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.user.tipodeusuario}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.common.selecioneotipo} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="importer">{t.common.importador}</SelectItem>
                          <SelectItem value="admin">{t.common.administrador}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >{t.common.cancelar}</Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-spark-600 hover:bg-spark-700"
                  >
                    {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.user.usuariosdosistema}</CardTitle>
          <CardDescription>{t.user.listadetodososusuari}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users as User[]}
            columns={columns}
            actions={actions}
            emptyMessage="Nenhum usuário encontrado"
          />
        </CardContent>
      </Card>
    </div>
  );
}