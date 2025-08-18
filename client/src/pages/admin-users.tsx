import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPhone } from "@/lib/phone";
import { Users, UserPlus, MoreVertical, Edit, UserCheck, UserX } from "lucide-react";
import type { User } from "@shared/schema";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {}
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('/api/admin/users', 'GET'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiRequest(`/api/admin/users/${userId}/role`, 'PUT', { role }),
    onSuccess: () => {
      toast({
        title: t("success.roleUpdated"),
        description: t("success.roleUpdatedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("errors.updateRoleError"),
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/admin/users/${userId}/deactivate`, 'PUT'),
    onSuccess: () => {
      toast({
        title: t("users.userDeactivated"),
        description: t("users.userDeactivatedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("users.deactivateError"),
        variant: "destructive",
      });
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

  const getStatusBadge = (status: string | undefined) => {
    const userStatus = status || 'active';
    return userStatus === 'active' ? (
      <Badge className="bg-green-100 text-green-800">{t("status.active")}</Badge>
    ) : (
      <Badge variant="destructive">{t("status.inactive")}</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800">{t("roles.admin")}</Badge>;
      case 'financeira':
        return <Badge className="bg-purple-100 text-purple-800">{t("roles.financeira")}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t("roles.importer")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("nav.manageUsers")}</h1>
          <p className="text-gray-600">{t("admin.manageUsersDescription")}</p>
        </div>
        <Button 
          className="bg-spark-600 hover:bg-spark-700"
          onClick={() => setLocation('/admin/users/new')}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t("admin.newUser")}
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid gap-6">
        {users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("admin.noUsersFound")}</h3>
              <p className="text-gray-600 text-center">
                {t("admin.createFirstUserDescription")}
              </p>
              <Button 
                className="mt-4 bg-spark-600 hover:bg-spark-700"
                onClick={() => setLocation('/admin/users/new')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t("admin.createFirstUser")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t("admin.usersCount", { count: users.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t("common.name")}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t("common.email")}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t("common.phone")}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t("common.status")}</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user: User) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-600">{user.companyName}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-900">{user.email}</td>
                          <td className="py-3 px-4 text-gray-900">{formatPhone(user.phone)}</td>
                          <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                          <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleConfirmAction(
                                    t("buttons.makeAdmin"),
                                    t("admin.confirmMakeAdmin", { name: user.fullName }),
                                    () => updateRoleMutation.mutate({ userId: user.id, role: 'admin' })
                                  )}
                                  disabled={user.role === 'admin'}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  {t("admin.makeAdmin")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleConfirmAction(
                                    t("buttons.makeFinanceira"),
                                    t("admin.confirmMakeFinanceira", { name: user.fullName }),
                                    () => updateRoleMutation.mutate({ userId: user.id, role: 'financeira' })
                                  )}
                                  disabled={user.role === 'financeira'}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  {t("admin.makeFinanceira")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleConfirmAction(
                                    t("buttons.makeImporter"),
                                    t("admin.confirmMakeImporter", { name: user.fullName }),
                                    () => updateRoleMutation.mutate({ userId: user.id, role: 'importer' })
                                  )}
                                  disabled={user.role === 'importer'}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  {t("admin.makeImporter")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleConfirmAction(
                                    t("admin.deactivateUser"),
                                    t("admin.confirmDeactivateUser", { name: user.fullName }),
                                    () => deactivateUserMutation.mutate(user.id)
                                  )}
                                  disabled={user.status === 'inactive'}
                                  className="text-red-600"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  {t("admin.deactivate")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {users.map((user: User) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                        <p className="text-sm text-gray-600">{user.companyName}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleConfirmAction(
                              t("buttons.makeAdmin"),
                              t("admin.confirmMakeAdmin", { name: user.fullName }),
                              () => updateRoleMutation.mutate({ userId: user.id, role: 'admin' })
                            )}
                            disabled={user.role === 'admin'}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {t("admin.makeAdmin")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleConfirmAction(
                              t("buttons.makeFinanceira"),
                              t("admin.confirmMakeFinanceira", { name: user.fullName }),
                              () => updateRoleMutation.mutate({ userId: user.id, role: 'financeira' })
                            )}
                            disabled={user.role === 'financeira'}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {t("admin.makeFinanceira")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleConfirmAction(
                              t("buttons.makeImporter"),
                              t("admin.confirmMakeImporter", { name: user.fullName }),
                              () => updateRoleMutation.mutate({ userId: user.id, role: 'importer' })
                            )}
                            disabled={user.role === 'importer'}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {t("admin.makeImporter")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleConfirmAction(
                              t("admin.deactivateUser"),
                              t("admin.confirmDeactivateUser", { name: user.fullName }),
                              () => deactivateUserMutation.mutate(user.id)
                            )}
                            disabled={user.status === 'inactive'}
                            className="text-red-600"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {t("admin.deactivate")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">{t("common.email")}:</span> {user.email}</div>
                      <div><span className="font-medium">{t("common.phone")}:</span> {formatPhone(user.phone)}</div>
                      <div className="flex items-center justify-between">
                        <div><span className="font-medium">Role:</span> {getRoleBadge(user.role)}</div>
                        <div><span className="font-medium">{t("common.status")}:</span> {getStatusBadge(user.status)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({...confirmDialog, open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog({...confirmDialog, open: false})}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmDialog.action();
                setConfirmDialog({...confirmDialog, open: false});
              }}
            >
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}