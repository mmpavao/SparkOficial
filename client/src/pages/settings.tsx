import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
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
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
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
        description: t.common.suasinformacoesforam,
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || t.common.erroaoatualizarperfi,
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
      description: t.common.suapreferenciadenoti,
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
        <h1 className="text-3xl font-bold text-gray-900">{t.settings.title}</h1>
        <p className="text-gray-600">{t.user.gerenciesuacontaepre}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">{t.settings.profile}</TabsTrigger>
          <TabsTrigger value="preferences">{t.settings.preferences}</TabsTrigger>
          <TabsTrigger value="notifications">{t.settings.notifications}</TabsTrigger>
          <TabsTrigger value="security">{t.settings.security}</TabsTrigger>
          <TabsTrigger value="billing">{t.common.faturamento}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <CardTitle>{t.common.informacoespessoais}</CardTitle>
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
                      <Label htmlFor="fullName">{t.common.nomecompleto}</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        defaultValue={user?.fullName || ""}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{t.common.email}</Label>
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
                      <Label htmlFor="phone">{t.common.telefone}</Label>
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
                    <Label htmlFor="companyName">{t.common.nomedaempresa}</Label>
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

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <CardTitle>{t.settings.preferences}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t.settings.language}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.common.idiomadainterface}</p>
                    <p className="text-sm text-gray-600">{t.common.escolhaoidiomaparaai}</p>
                  </div>
                  <div className="min-w-[200px]">
                    <LanguageSelector />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t.common.formatoregional}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.common.formatodemoeda}</p>
                      <p className="text-sm text-gray-600">{t.common.comovaloresmonetario}</p>
                    </div>
                    <Select defaultValue="BRL">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">{t.currency.BRL} (R$)</SelectItem>
                        <SelectItem value="USD">{t.currency.USD} ($)</SelectItem>
                        <SelectItem value="EUR">{t.currency.EUR} (€)</SelectItem>
                        <SelectItem value="CNY">{t.currency.CNY} (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.common.formatodedata}</p>
                      <p className="text-sm text-gray-600">{t.common.comodatassaoexibidas}</p>
                    </div>
                    <Select defaultValue="dd/mm/yyyy">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">{t.common.ddmmaaaa}</SelectItem>
                        <SelectItem value="mm/dd/yyyy">{t.common.mmddyyyy}</SelectItem>
                        <SelectItem value="yyyy-mm-dd">{t.common.yyyymmdd}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <CardTitle>{t.common.preferenciasdenotifi}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t.common.email}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.common.atualizacoesdeimport}</p>
                      <p className="text-sm text-gray-600">{t.common.recebaemailssobreost}</p>
                    </div>
                    <Switch
                      checked={notifications.emailImports}
                      onCheckedChange={(checked) => handleNotificationChange("emailImports", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.common.notificacoesdecredit}</p>
                      <p className="text-sm text-gray-600">{t.common.alertassobrelimitede}</p>
                    </div>
                    <Switch
                      checked={notifications.emailCredit}
                      onCheckedChange={(checked) => handleNotificationChange("emailCredit", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.reports.relatoriossemanais}</p>
                      <p className="text-sm text-gray-600">{t.common.resumosemanaldassuas}</p>
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
                      <p className="font-medium">{t.common.importacoesurgentes}</p>
                      <p className="text-sm text-gray-600">{t.common.smsparaimportacoesqu}</p>
                    </div>
                    <Switch
                      checked={notifications.smsImports}
                      onCheckedChange={(checked) => handleNotificationChange("smsImports", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.common.alertasdecredito}</p>
                      <p className="text-sm text-gray-600">{t.common.smsquandocreditoesti}</p>
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
                <h3 className="text-lg font-medium mb-4">{t.common.push}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.common.notificacoespush}</p>
                    <p className="text-sm text-gray-600">{t.common.recebanotificacoesno}</p>
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
                <CardTitle>{t.user.segurancadaconta}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.common.autenticacaodedoisfa}</p>
                  <p className="text-sm text-gray-600">{t.common.adicioneumacamadaext}</p>
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
                  <p className="text-sm text-gray-600">{t.common.sejanotificadosobren}</p>
                </div>
                <Switch
                  checked={security.loginNotifications}
                  onCheckedChange={(checked) => handleSecurityChange("loginNotifications", checked)}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="sessionTimeout">{t.common.timeoutdasessaominut}</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => handleSecurityChange("sessionTimeout", parseInt(e.target.value))}
                  className="mt-1 w-32"
                  min="5"
                  max="120"
                />
                <p className="text-sm text-gray-600 mt-1">{t.common.suasessaoexpiraraapo}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />{t.common.alterarsenha}</Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />{t.user.excluirconta}</Button>
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
                <CardTitle>{t.common.informacoesdefaturam}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.common.faturamentoepagament}</h3>
                <p className="text-gray-600 mb-4">{t.common.gerencieseusmetodosd}</p>
                <Button variant="outline">{t.common.configurarfaturament}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}