
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { formatPhone } from "@/lib/phone";
import { formatDate } from "@/lib/formatters";
import { 
  ArrowLeft, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  CreditCard,
  MapPin,
  FileText,
  Activity
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function AdminUserDetailsPage() {
  const [match, params] = useRoute("/admin/users/:id");
  const [, setLocation] = useLocation();
  
  const userId = params?.id ? parseInt(params.id) : null;

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/admin/users', userId],
    queryFn: () => apiRequest(`/api/admin/users/${userId}`, 'GET'),
    enabled: !!userId,
  }) as { data: UserType, isLoading: boolean };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Usuário não encontrado</h2>
            <p className="text-gray-600 mb-4">
              O usuário solicitado não foi encontrado no sistema.
            </p>
            <Button onClick={() => setLocation('/admin/users')}>
              Voltar para lista de usuários
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string | undefined) => {
    const userStatus = status || 'active';
    return userStatus === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="destructive">Inativo</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800">Administrador</Badge>;
      case 'financeira':
        return <Badge className="bg-purple-100 text-purple-800">Financeira</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Importador</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
            <p className="text-muted-foreground">Informações completas do perfil</p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(user.status)}
          {getRoleBadge(user.role)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                  <p className="text-lg font-semibold">{user.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p>{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Telefone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p>{formatPhone(user.phone)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Data de Cadastro</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p>{user.createdAt ? formatDate(user.createdAt) : 'Não disponível'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome da Empresa</label>
                  <p className="text-lg font-semibold">{user.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CNPJ</label>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p>{user.cnpj || 'Não informado'}</p>
                  </div>
                </div>
              </div>
              
              {user.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Endereço</label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p>{user.address}</p>
                      {user.city && user.state && (
                        <p className="text-sm text-gray-600">{user.city}, {user.state}</p>
                      )}
                      {user.zipCode && (
                        <p className="text-sm text-gray-600">CEP: {user.zipCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status e Permissões */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Status e Permissões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status da Conta</label>
                <div className="mt-1">
                  {getStatusBadge(user.status)}
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-600">Nível de Acesso</label>
                <div className="mt-1">
                  {getRoleBadge(user.role)}
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-600">ID do Usuário</label>
                <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Último acesso</span>
                  <span>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Conta criada</span>
                  <span>{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última atualização</span>
                  <span>{user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation(`/admin/users/${user.id}/edit`)}
              >
                <User className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open(`mailto:${user.email}`, '_blank')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open(`tel:${user.phone}`, '_blank')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
