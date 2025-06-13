import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCnpj } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  CreditCard,
  Mail,
  Phone,
  Save,
  Key,
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { user } = useAuth();

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailImports: true,
    emailCredit: true,
    emailReports: false,
    smsImports: false,
    smsCredit: true,
    pushNotifications: true
  });

  // Security preferences state
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = (formData: FormData) => {
    const data = {
      companyName: formData.get("companyName"),
      cnpj: formData.get("cnpj"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
    };
    updateProfileMutation.mutate(data);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Preferência salva",
      description: "Sua preferência de notificação foi atualizada.",
    });
  };

  const handleSecurityChange = (key: string, value: boolean | number) => {
    setSecurity(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Configuração atualizada",
      description: "Sua configuração de segurança foi salva.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie sua conta e preferências</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <CardTitle>Informações Pessoais</CardTitle>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveProfile(formData);
              }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        defaultValue={user?.fullName || ""}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user?.email || ""}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={user?.phone || ""}
                        disabled={!isEditing}
                        onChange={(e) => {
                          if (isEditing) {
                            e.target.value = formatPhone(e.target.value);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        name="cnpj"
                        defaultValue={user?.cnpj || ""}
                        disabled={!isEditing}
                        onChange={(e) => {
                          if (isEditing) {
                            e.target.value = formatCnpj(e.target.value);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      defaultValue={user?.companyName || ""}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-spark-600 hover:bg-spark-700"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <CardTitle>Preferências de Notificação</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Email</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Atualizações de Importação</p>
                      <p className="text-sm text-gray-600">Receba emails sobre o status das suas importações</p>
                    </div>
                    <Switch
                      checked={notifications.emailImports}
                      onCheckedChange={(checked) => handleNotificationChange("emailImports", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações de Crédito</p>
                      <p className="text-sm text-gray-600">Alertas sobre limite de crédito e aprovações</p>
                    </div>
                    <Switch
                      checked={notifications.emailCredit}
                      onCheckedChange={(checked) => handleNotificationChange("emailCredit", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Relatórios Semanais</p>
                      <p className="text-sm text-gray-600">Resumo semanal das suas operações</p>
                    </div>
                    <Switch
                      checked={notifications.emailReports}
                      onCheckedChange={(checked) => handleNotificationChange("emailReports", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">SMS</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Importações Urgentes</p>
                      <p className="text-sm text-gray-600">SMS para importações que precisam de atenção</p>
                    </div>
                    <Switch
                      checked={notifications.smsImports}
                      onCheckedChange={(checked) => handleNotificationChange("smsImports", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de Crédito</p>
                      <p className="text-sm text-gray-600">SMS quando crédito estiver baixo</p>
                    </div>
                    <Switch
                      checked={notifications.smsCredit}
                      onCheckedChange={(checked) => handleNotificationChange("smsCredit", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Push</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-sm text-gray-600">Receba notificações no navegador</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <CardTitle>Segurança da Conta</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação de Dois Fatores</p>
                  <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                </div>
                <Switch
                  checked={security.twoFactorAuth}
                  onCheckedChange={(checked) => handleSecurityChange("twoFactorAuth", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações de Login</p>
                  <p className="text-sm text-gray-600">Seja notificado sobre novos acessos</p>
                </div>
                <Switch
                  checked={security.loginNotifications}
                  onCheckedChange={(checked) => handleSecurityChange("loginNotifications", checked)}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="sessionTimeout">Timeout da Sessão (minutos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => handleSecurityChange("sessionTimeout", parseInt(e.target.value))}
                  className="mt-1 w-32"
                  min="5"
                  max="120"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Sua sessão expirará após este período de inatividade
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <CardTitle>Informações de Faturamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Faturamento e Pagamentos
                </h3>
                <p className="text-gray-600 mb-4">
                  Gerencie seus métodos de pagamento e histórico de faturas.
                </p>
                <Button variant="outline">
                  Configurar Faturamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}