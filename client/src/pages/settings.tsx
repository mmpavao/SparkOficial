import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCnpj } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSelector from "@/components/ui/language-selector";
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
  Trash2,
  Upload,
  Camera
} from "lucide-react";

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || "",
    cnpj: user?.cnpj || "",
  });

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter menos de 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/user/profile", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);
      setAvatarPreview(null);
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      avatar: avatarPreview
    };
    updateProfileMutation.mutate(data);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
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
              <form onSubmit={handleSaveProfile}>
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={avatarPreview || (user?.avatar ? user.avatar : undefined)} />
                      <AvatarFallback className="bg-spark-600 text-white text-xl font-medium">
                        {user?.fullName && getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-lg font-medium">{user?.fullName}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      {isEditing && (
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Alterar Foto
                          </Button>
                          {avatarPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAvatarPreview(null)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </Button>
                          )}
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
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
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
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
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                          disabled={!isEditing}
                          placeholder="(11) 99999-9999"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                          id="cnpj"
                          name="cnpj"
                          value={formData.cnpj}
                          onChange={(e) => handleInputChange("cnpj", formatCnpj(e.target.value))}
                          disabled={!isEditing}
                          placeholder="00.000.000/0000-00"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            fullName: user?.fullName || "",
                            email: user?.email || "",
                            phone: user?.phone || "",
                            companyName: user?.companyName || "",
                            cnpj: user?.cnpj || "",
                          });
                          setAvatarPreview(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
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

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Preferências do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Idioma</Label>
                <p className="text-sm text-gray-500 mb-3">Selecione seu idioma preferido</p>
                <LanguageSelector />
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Formato de Data</Label>
                <p className="text-sm text-gray-500 mb-3">Como as datas são exibidas</p>
                <Select defaultValue="dd/mm/yyyy">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/AAAA (brasileiro)</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/AAAA (americano)</SelectItem>
                    <SelectItem value="yyyy-mm-dd">AAAA-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Moeda</Label>
                <p className="text-sm text-gray-500 mb-3">Moeda padrão para exibição</p>
                <Select defaultValue="brl">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brl">Real Brasileiro (R$)</SelectItem>
                    <SelectItem value="usd">Dólar Americano (US$)</SelectItem>
                    <SelectItem value="eur">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Preferências de Notificação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Notificações por Email</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Importações</Label>
                      <p className="text-sm text-gray-500">Atualizações sobre suas importações</p>
                    </div>
                    <Switch
                      checked={notifications.emailImports}
                      onCheckedChange={(checked) => handleNotificationChange("emailImports", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Crédito</Label>
                      <p className="text-sm text-gray-500">Status de solicitações de crédito</p>
                    </div>
                    <Switch
                      checked={notifications.emailCredit}
                      onCheckedChange={(checked) => handleNotificationChange("emailCredit", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Relatórios</Label>
                      <p className="text-sm text-gray-500">Relatórios semanais e mensais</p>
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
                <h3 className="text-lg font-medium mb-4">Notificações SMS</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Importações Urgentes</Label>
                      <p className="text-sm text-gray-500">Alertas críticos sobre importações</p>
                    </div>
                    <Switch
                      checked={notifications.smsImports}
                      onCheckedChange={(checked) => handleNotificationChange("smsImports", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Aprovação de Crédito</Label>
                      <p className="text-sm text-gray-500">Quando crédito for aprovado/negado</p>
                    </div>
                    <Switch
                      checked={notifications.smsCredit}
                      onCheckedChange={(checked) => handleNotificationChange("smsCredit", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Configurações de Segurança</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
                </div>
                <Switch
                  checked={security.twoFactorAuth}
                  onCheckedChange={(checked) => handleSecurityChange("twoFactorAuth", checked)}
                />
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Timeout de Sessão</Label>
                <p className="text-sm text-gray-500 mb-3">Tempo em minutos para logout automático</p>
                <Select 
                  value={security.sessionTimeout.toString()} 
                  onValueChange={(value) => handleSecurityChange("sessionTimeout", parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="0">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Notificações de Login</Label>
                  <p className="text-sm text-gray-500">Receba alertas de novos logins</p>
                </div>
                <Switch
                  checked={security.loginNotifications}
                  onCheckedChange={(checked) => handleSecurityChange("loginNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alterar Senha</h3>
                <Button variant="outline" className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}