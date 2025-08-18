import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  Edit,
  KeyRound,
  Save,
  X
} from "lucide-react";

interface ImporterDetails {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  cnpj: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  role: string;
  // Financial terms fields
  defaultAdminFeeRate?: number | null;
  defaultDownPaymentRate?: number | null;
  defaultPaymentTerms?: string | null;
}

interface CreditApplication {
  id: number;
  legalCompanyName: string;
  requestedAmount: string;
  status: string;
  financialStatus: string;
  adminStatus: string;
  createdAt: string;
  finalCreditLimit?: string;
}

interface Import {
  id: number;
  importName: string;
  totalValue: string;
  status: string;
  createdAt: string;
  cargoType: string;
}

interface CreditUsage {
  totalLimit: number;
  totalUsed: number;
  available: number;
  utilizationPercentage: number;
}

export default function ImporterDetailsPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/importers/:id");
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ImporterDetails>>({});
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importerId = params?.id ? parseInt(params.id) : 0;

  // Fetch importer details
  const { data: importer, isLoading: importerLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}`, "GET"),
    enabled: !!importerId,
  });

  // Fetch credit applications
  const { data: creditApplications = [], isLoading: creditsLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}/credit-applications`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}/credit-applications`, "GET"),
    enabled: !!importerId,
  });

  // Fetch imports
  const { data: imports = [], isLoading: importsLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}/imports`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}/imports`, "GET"),
    enabled: !!importerId,
  });

  // Fetch credit usage summary
  const { data: creditUsage, isLoading: usageLoading } = useQuery({
    queryKey: [`/api/admin/importers/${importerId}/credit-usage`],
    queryFn: () => apiRequest(`/api/admin/importers/${importerId}/credit-usage`, "GET"),
    enabled: !!importerId,
  });

  // Update importer mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ImporterDetails>) => 
      apiRequest(`/api/test/importers/${importerId}`, "PUT", data),
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('messages.successUpdate'),
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/importers/${importerId}`] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('messages.errorUpdate'),
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: () => apiRequest(`/api/admin/importers/${importerId}/reset-password`, "POST"),
    onSuccess: (response) => {
      toast({
        title: t('common.success'),
        description: t('admin.passwordResetWithTemp', { password: response.temporaryPassword }),
      });
      setShowResetPassword(false);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('messages.errorPasswordReset'),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleResetPassword = () => {
    resetPasswordMutation.mutate();
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(numValue);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{t('status.active')}</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">{t('status.inactive')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('status.pending')}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">{t('status.approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">{t('status.rejected')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getCreditStatusBadge = (status: string, financialStatus?: string, adminStatus?: string) => {
    if (adminStatus === 'finalized') return <Badge className="bg-blue-100 text-blue-800">{t('status.finalized')}</Badge>;
    if (financialStatus === 'approved') return <Badge className="bg-green-100 text-green-800">{t('status.approvedFinancially')}</Badge>;
    if (status === 'pre_approved') return <Badge className="bg-yellow-100 text-yellow-800">{t('status.preApproved')}</Badge>;
    if (status === 'pending') return <Badge className="bg-orange-100 text-orange-800">{t('status.underAnalysis')}</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-800">{t('status.rejected')}</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  };

  if (importerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/importers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        <div className="flex justify-center py-8">
          <div className="text-gray-500">{t('importer.loadingDetails')}</div>
        </div>
      </div>
    );
  }

  if (!importer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/importers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">{t('importer.notFound')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/importers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{importer.fullName}</h1>
            <p className="text-gray-600">{importer.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(importer.status)}
          <Button
            variant="outline"
            onClick={() => setShowResetPassword(true)}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {t('admin.renewPassword')}
          </Button>
          {!isEditing ? (
            <Button
              onClick={() => {
                setIsEditing(true);
                setEditData(importer);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="financial">{t('tabs.financial')}</TabsTrigger>
          <TabsTrigger value="credit">{t('tabs.credit')}</TabsTrigger>
          <TabsTrigger value="imports">{t('tabs.imports')}</TabsTrigger>
          <TabsTrigger value="activity">{t('tabs.activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('sections.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('importer.fullName')}</label>
                    {isEditing ? (
                      <Input
                        value={editData.fullName || ''}
                        onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                      />
                    ) : (
                      <p className="font-semibold">{importer.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('common.email')}</label>
                    {isEditing ? (
                      <Input
                        value={editData.email || ''}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                      />
                    ) : (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {importer.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('importer.phone')}</label>
                    {isEditing ? (
                      <Input
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      />
                    ) : (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {importer.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('common.company')}</label>
                    {isEditing ? (
                      <Input
                        value={editData.companyName || ''}
                        onChange={(e) => setEditData({...editData, companyName: e.target.value})}
                      />
                    ) : (
                      <p className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {importer.companyName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('importer.cnpj')}</label>
                    <p className="font-mono">{importer.cnpj}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('importer.registrationDate')}</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(importer.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('common.address')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('common.address')}</label>
                  {isEditing ? (
                    <Input
                      value={editData.address || ''}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
                    />
                  ) : (
                    <p>{importer.address}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('importer.city')}</label>
                    {isEditing ? (
                      <Input
                        value={editData.city || ''}
                        onChange={(e) => setEditData({...editData, city: e.target.value})}
                      />
                    ) : (
                      <p>{importer.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('importer.state')}</label>
                    {isEditing ? (
                      <Input
                        value={editData.state || ''}
                        onChange={(e) => setEditData({...editData, state: e.target.value})}
                      />
                    ) : (
                      <p>{importer.state}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('importer.creditApplications')}</p>
                    <p className="text-2xl font-bold">{creditApplications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('tabs.imports')}</p>
                    <p className="text-2xl font-bold">{imports.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('importer.creditLimit')}</p>
                    <p className="text-2xl font-bold">
                      {creditUsage ? formatCurrency(creditUsage.totalLimit) : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('importer.utilization')}</p>
                    <p className="text-2xl font-bold">
                      {creditUsage ? `${creditUsage.utilizationPercentage}%` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Financial Terms Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('financial.globalTerms')}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {t('financial.globalTermsDescription')}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Admin Fee Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('importer.adminRate')}</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder={t('placeholders.example10')}
                    value={editData.defaultAdminFeeRate || ''}
                    onChange={(e) => setEditData({...editData, defaultAdminFeeRate: parseFloat(e.target.value) || null})}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500">{t('forms.adminRatePercentage')}</p>
                </div>

                {/* Down Payment Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('importer.downPayment')}</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder={t('placeholders.example30')}
                    value={editData.defaultDownPaymentRate || ''}
                    onChange={(e) => setEditData({...editData, defaultDownPaymentRate: parseInt(e.target.value) || null})}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500">{t('forms.downPaymentPercentage')}</p>
                </div>

                {/* Payment Terms */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('importer.paymentTerms')}</label>
                  <Input
                    type="text"
                    placeholder={t('placeholders.paymentTerms')}
                    value={editData.defaultPaymentTerms || ''}
                    onChange={(e) => setEditData({...editData, defaultPaymentTerms: e.target.value})}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500">{t('forms.paymentTermsDays')}</p>
                </div>
              </div>

              {/* Current Settings Display */}
              {!isEditing && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">{t('forms.currentSettings')}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('forms.adminRate')}</span>
                      <span className="ml-2 font-medium">
                        {importer.defaultAdminFeeRate ? `${importer.defaultAdminFeeRate}%` : t('financial.notConfigured')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('forms.downPayment')}</span>
                      <span className="ml-2 font-medium">
                        {importer.defaultDownPaymentRate ? `${importer.defaultDownPaymentRate}%` : t('financial.notConfigured')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('forms.terms')}</span>
                      <span className="ml-2 font-medium">
                        {importer.defaultPaymentTerms ? `${importer.defaultPaymentTerms} ${t('financial.days')}` : t('financial.notConfigured')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">{t('importer.globalBenefits')}</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>{t('importer.benefit1')}</li>
                  <li>{t('importer.benefit2')}</li>
                  <li>{t('importer.benefit3')}</li>
                  <li>{t('importer.benefit4')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit" className="space-y-6">
          {/* Credit Usage Summary */}
          {creditUsage && (
            <Card>
              <CardHeader>
                <CardTitle>{t('importer.creditUsageSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{t('importer.totalLimit')}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(creditUsage.totalLimit)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{t('importer.inUse')}</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(creditUsage.totalUsed)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{t('importer.available')}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(creditUsage.available)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${creditUsage.utilizationPercentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {creditUsage.utilizationPercentage}% {t('credit.utilized')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Applications */}
          <Card>
            <CardHeader>
              <CardTitle>{t('importer.creditApplications')}</CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <div className="text-center py-4">{t('common.loading')}</div>
              ) : creditApplications.length > 0 ? (
                <div className="space-y-4">
                  {creditApplications.map((credit: CreditApplication) => (
                    <div key={credit.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{t('credit.applicationHash')}{credit.id}</h4>
                          <p className="text-sm text-gray-600">{credit.legalCompanyName}</p>
                          <p className="text-sm text-gray-600">
                            {t('credit.requested')}: {formatCurrency(credit.requestedAmount)}
                          </p>
                          {credit.finalCreditLimit && (
                            <p className="text-sm font-medium text-green-600">
                              {t('status.approved')}: {formatCurrency(credit.finalCreditLimit)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(credit.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          {getCreditStatusBadge(credit.status, credit.financialStatus, credit.adminStatus)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('credit.noCreditApplicationsFound')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('imports.importHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {importsLoading ? (
                <div className="text-center py-4">{t('common.loading')}</div>
              ) : imports.length > 0 ? (
                <div className="space-y-4">
                  {imports.map((importItem: Import) => (
                    <div key={importItem.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{importItem.importName}</h4>
                          <p className="text-sm text-gray-600">
                            {t('common.amount')}: {formatCurrency(importItem.totalValue)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('imports.type')}: {importItem.cargoType === 'FCL' ? t('cargo.fclContainer') : t('cargo.lclConsolidated')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(importItem.createdAt)}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(importItem.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('imports.noImportsFound')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('activity.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                {t('activity.logsInDevelopment')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.renewPassword')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.renewPasswordConfirmation', { name: importer.fullName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? t('admin.renewing') : t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}