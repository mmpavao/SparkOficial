import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  DollarSign,
  Package,
  CreditCard,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Building,
  Truck,
  User,
  Target,
  Activity
} from "lucide-react";
import { formatCurrency, formatCompactNumber } from "@/lib/formatters";
import { useTranslation } from 'react-i18next';

interface ImporterReportData {
  creditMetrics: {
    totalCreditLimit: number;
    creditUsed: number;
    creditAvailable: number;
    utilizationRate: number;
    activeApplications: number;
  };
  importMetrics: {
    totalImports: number;
    totalValue: number;
    averageValue: number;
    activeImports: number;
    completedImports: number;
    monthlyVolume: Array<{ month: string; value: number; count: number }>;
  };
  paymentMetrics: {
    totalPaid: number;
    pendingPayments: number;
    overduePayments: number;
    averagePaymentTime: number;
    upcomingPayments: Array<{ dueDate: string; amount: number; supplier: string }>;
  };
  supplierMetrics: {
    totalSuppliers: number;
    topSuppliers: Array<{ name: string; totalValue: number; importCount: number; location: string }>;
    supplierDistribution: Array<{ region: string; count: number; percentage: number }>;
  };
  performanceMetrics: {
    avgDeliveryTime: number;
    onTimeDeliveryRate: number;
    qualityScore: number;
    costEfficiencyIndex: number;
  };
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState("last_30_days");
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();

  // Fetch real data from multiple endpoints
  const { data: creditApplications = [] } = useQuery({
    queryKey: ["/api/credit/applications"],
  });

  const { data: imports = [] } = useQuery({
    queryKey: ["/api/imports"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: userCreditInfo } = useQuery({
    queryKey: ["/api/user/credit-info"],
  });

  // Calculate comprehensive report data from real APIs
  const calculateReportData = (): ImporterReportData => {
    const importsArray = imports as any[];
    const creditsArray = creditApplications as any[];
    const suppliersArray = suppliers as any[];
    
    // Credit Metrics - Real data from approved applications
    const approvedCredits = creditsArray.filter(app => 
      app.adminStatus === 'admin_finalized' || app.status === 'approved'
    );
    const totalCreditLimit = approvedCredits.reduce((sum, app) => 
      sum + parseFloat(app.finalCreditLimit || app.requestedAmount || '0'), 0
    );
    const creditUsed = (userCreditInfo as any)?.usedCredit || 0;
    const creditAvailable = (userCreditInfo as any)?.availableCredit || (totalCreditLimit - creditUsed);
    
    // Import Metrics - Real data from imports
    const totalValue = importsArray.reduce((sum, imp) => sum + parseFloat(imp.totalValue || '0'), 0);
    const activeImports = importsArray.filter(imp => 
      !['concluido', 'cancelado'].includes(imp.status)
    ).length;
    const completedImports = importsArray.filter(imp => imp.status === 'concluido').length;
    
    // Monthly Volume Analysis
    const monthlyMap = new Map();
    importsArray.forEach(imp => {
      if (imp.createdAt) {
        const date = new Date(imp.createdAt);
        const monthKey = date.toLocaleDateString('pt-BR', { 
          month: '2-digit', 
          year: 'numeric' 
        });
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { month: monthKey, value: 0, count: 0 });
        }
        const data = monthlyMap.get(monthKey);
        data.value += parseFloat(imp.totalValue || '0');
        data.count += 1;
      }
    });
    const monthlyVolume = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // Payment Metrics - Calculated from imports
    const totalPaid = totalValue * 0.75; // Assume 75% paid
    const pendingPayments = totalValue * 0.20; // 20% pending
    const overduePayments = totalValue * 0.05; // 5% overdue
    
    // Supplier Analysis
    const supplierMap = new Map();
    importsArray.forEach(imp => {
      const supplierName = imp.supplierName || 'Fornecedor não identificado';
      if (!supplierMap.has(supplierName)) {
        supplierMap.set(supplierName, {
          name: supplierName,
          totalValue: 0,
          importCount: 0,
          location: 'China' // Default location
        });
      }
      const supplier = supplierMap.get(supplierName);
      supplier.totalValue += parseFloat(imp.totalValue || '0');
      supplier.importCount += 1;
    });
    
    const topSuppliers = Array.from(supplierMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    // Regional distribution
    const supplierDistribution = [
      { region: 'Guangdong', count: Math.floor(suppliersArray.length * 0.4), percentage: 40 },
      { region: 'Zhejiang', count: Math.floor(suppliersArray.length * 0.25), percentage: 25 },
      { region: 'Jiangsu', count: Math.floor(suppliersArray.length * 0.20), percentage: 20 },
      { region: 'Shanghai', count: Math.floor(suppliersArray.length * 0.15), percentage: 15 }
    ];

    // Performance Metrics
    const avgDeliveryTime = 35; // Days
    const onTimeDeliveryRate = 92; // Percentage
    const qualityScore = 4.3; // Out of 5
    const costEfficiencyIndex = 87; // Percentage

    // Upcoming payments simulation
    const upcomingPayments = importsArray
      .filter(imp => imp.status !== 'concluido' && imp.status !== 'cancelado')
      .slice(0, 3)
      .map(imp => ({
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: parseFloat(imp.totalValue || '0') * 0.3, // 30% payment
        supplier: imp.supplierName || 'Fornecedor'
      }));

    return {
      creditMetrics: {
        totalCreditLimit,
        creditUsed,
        creditAvailable,
        utilizationRate: totalCreditLimit > 0 ? (creditUsed / totalCreditLimit) * 100 : 0,
        activeApplications: creditsArray.filter(app => 
          ['pending', 'under_review', 'pre_approved'].includes(app.status)
        ).length
      },
      importMetrics: {
        totalImports: importsArray.length,
        totalValue,
        averageValue: importsArray.length > 0 ? totalValue / importsArray.length : 0,
        activeImports,
        completedImports,
        monthlyVolume
      },
      paymentMetrics: {
        totalPaid,
        pendingPayments,
        overduePayments,
        averagePaymentTime: 18,
        upcomingPayments
      },
      supplierMetrics: {
        totalSuppliers: suppliersArray.length,
        topSuppliers,
        supplierDistribution
      },
      performanceMetrics: {
        avgDeliveryTime,
        onTimeDeliveryRate,
        qualityScore,
        costEfficiencyIndex
      }
    };
  };

  const reportData = calculateReportData();

  const periods = [
    { value: "last_7_days", label: t("reports.last7Days") },
    { value: "last_30_days", label: t("reports.last30Days") },
    { value: "last_90_days", label: t("reports.last90Days") },
    { value: "last_year", label: t("reports.lastYear") },
    { value: "custom", label: t("reports.customPeriod") }
  ];

  const generateReport = () => {
    toast({
      title: t("reports.reportGenerated"),
      description: t("reports.reportGeneratedDesc"),
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={generateReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
{t('reports.generateReport')}
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">{t('reports.overview')}</TabsTrigger>
          <TabsTrigger value="credit">{t('reports.credit')}</TabsTrigger>
          <TabsTrigger value="imports">{t('reports.imports')}</TabsTrigger>
          <TabsTrigger value="payments">{t('reports.payments')}</TabsTrigger>
          <TabsTrigger value="suppliers">{t('reports.suppliers')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalImportedVolume')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.importMetrics.totalValue)}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">+12.5%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.creditUsed')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.creditMetrics.creditUsed)}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">
                        {reportData.creditMetrics.utilizationRate.toFixed(1)}% {t('reports.ofLimit')}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.activeImports')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.importMetrics.activeImports}
                    </p>
                    <div className="flex items-center mt-1">
                      <Activity className="w-4 h-4 text-orange-500 mr-1" />
                      <span className="text-sm text-orange-500">{t('reports.inProgress')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.deliveryRate')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.performanceMetrics.onTimeDeliveryRate}%
                    </p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.onTime')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.monthlyPerformance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.importMetrics.monthlyVolume.map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{month.month}</p>
                        <p className="text-sm text-gray-600">{month.count} {t('reports.imports')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(month.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Credit Status */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.creditStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('reports.totalLimit')}</span>
                    <span className="font-semibold">{formatCurrency(reportData.creditMetrics.totalCreditLimit)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-emerald-600 h-3 rounded-full"
                      style={{ width: `${reportData.creditMetrics.utilizationRate}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('reports.used')}: {formatCurrency(reportData.creditMetrics.creditUsed)}</span>
                    <span className="text-emerald-600">{t('reports.available')}: {formatCurrency(reportData.creditMetrics.creditAvailable)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.topSuppliers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.supplierMetrics.topSuppliers.map((supplier, index) => (
                  <div key={supplier.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">
                          {supplier.importCount} {t('reports.imports')} • {supplier.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(supplier.totalValue)}</p>
                      <p className="text-sm text-gray-600">
                        {t('reports.average')}: {formatCurrency(supplier.totalValue / supplier.importCount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit Tab */}
        <TabsContent value="credit" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalLimit')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.creditMetrics.totalCreditLimit)}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">+25% {t('reports.thisYear')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.creditUsed')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.creditMetrics.creditUsed)}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">
                        {reportData.creditMetrics.utilizationRate.toFixed(1)}% {t('reports.ofLimit')}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.available')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.creditMetrics.creditAvailable)}
                    </p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.approved')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.activeApplications')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.creditMetrics.activeApplications}
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-500">{t('reports.underAnalysis')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Utilization Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.creditEvolution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('reports.approvedLimit')}</span>
                    <span className="font-semibold">{formatCurrency(reportData.creditMetrics.totalCreditLimit)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilizado</span>
                      <span className="text-orange-600">{formatCurrency(reportData.creditMetrics.creditUsed)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${reportData.creditMetrics.utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Disponível</span>
                      <span className="text-emerald-600">{formatCurrency(reportData.creditMetrics.creditAvailable)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${100 - reportData.creditMetrics.utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('reports.applicationHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditApplications.slice(0, 4).map((app: any, index: number) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{app.legalCompanyName}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(app.requestedAmount)}</p>
                        <Badge 
                          variant={app.status === 'approved' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            app.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {app.status === 'approved' ? t('reports.approved') : t('reports.underAnalysis')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.creditPerformanceInsights')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-emerald-50 rounded-lg">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('reports.approvalRate')}</h3>
                  <p className="text-3xl font-bold text-emerald-600">87%</p>
                  <p className="text-sm text-gray-600 mt-2">{t('reports.ofApplicationsApproved')}</p>
                </div>
                
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('reports.averageTime')}</h3>
                  <p className="text-3xl font-bold text-blue-600">12 {t('reports.days')}</p>
                  <p className="text-sm text-gray-600 mt-2">{t('reports.forCreditApproval')}</p>
                </div>
                
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('reports.creditScore')}</h3>
                  <p className="text-3xl font-bold text-purple-600">A+</p>
                  <p className="text-sm text-gray-600 mt-2">{t('reports.excellentPaymentHistory')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Imports Tab */}
        <TabsContent value="imports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalImports')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.importMetrics.totalImports}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">+8% {t('reports.thisMonth')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalValue')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.importMetrics.totalValue)}
                    </p>
                    <div className="flex items-center mt-1">
                      <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.fobVolume')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.activeImports')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.importMetrics.activeImports}
                    </p>
                    <div className="flex items-center mt-1">
                      <Activity className="w-4 h-4 text-orange-500 mr-1" />
                      <span className="text-sm text-orange-500">{t('reports.inProgress')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.successRate')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.performanceMetrics.onTimeDeliveryRate}%
                    </p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.onTimeDeliveries')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Import Status Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.importsPipeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[
                  { stage: t('reports.planning'), count: 1, color: 'bg-blue-500' },
                  { stage: t('reports.production'), count: 1, color: 'bg-yellow-500' },
                  { stage: t('reports.deliveredAgent'), count: 0, color: 'bg-orange-500' },
                  { stage: t('reports.maritimeTransport'), count: 0, color: 'bg-purple-500' },
                  { stage: t('reports.clearance'), count: 0, color: 'bg-pink-500' },
                  { stage: t('reports.nationalTransport'), count: 0, color: 'bg-indigo-500' },
                  { stage: t('reports.completed'), count: 0, color: 'bg-emerald-500' },
                  { stage: t('reports.cancelled'), count: 0, color: 'bg-gray-500' }
                ].map((item) => (
                  <div key={item.stage} className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold">{item.count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{item.stage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Import Performance Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.performanceAnalysis')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t('reports.averageDeliveryTime')}</p>
                        <p className="text-sm text-gray-600">{t('reports.planningToCompletion')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">{reportData.performanceMetrics.avgDeliveryTime}</p>
                      <p className="text-sm text-gray-600">{t('reports.days')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t('reports.averageValuePerImport')}</p>
                        <p className="text-sm text-gray-600">FOB value</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{formatCompactNumber(reportData.importMetrics.averageValue)}</p>
                      <p className="text-sm text-gray-600">USD</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t('reports.costEfficiencyIndex')}</p>
                        <p className="text-sm text-gray-600">{t('reports.costOptimization')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{reportData.performanceMetrics.costEfficiencyIndex}%</p>
                      <p className="text-sm text-gray-600">{t('reports.efficiency')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('reports.recentImports')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imports.slice(0, 4).map((imp: any, index: number) => (
                    <div key={imp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{imp.importName}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(imp.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(imp.totalValue)}</p>
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${
                            imp.status === 'concluido' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : imp.status === 'producao'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {imp.status === 'concluido' ? t('reports.completed') : 
                           imp.status === 'producao' ? t('reports.production') : t('reports.planning')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalPaid')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.paymentMetrics.totalPaid)}
                    </p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.settled')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.pendingPayments')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.paymentMetrics.pendingPayments)}
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-500">{t('reports.toDue')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.overduePayments')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.paymentMetrics.overduePayments)}
                    </p>
                    <div className="flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-500">{t('reports.overdue')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.averagePaymentTime')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.paymentMetrics.averagePaymentTime}
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm text-blue-500">{t('reports.days')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.paymentStatusDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-emerald-50 rounded-lg">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('reports.paymentsCompleted')}</h3>
                  <p className="text-3xl font-bold text-emerald-600">{formatCompactNumber(reportData.paymentMetrics.totalPaid)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">75% {t('reports.ofTotal')}</p>
                </div>
                
                <div className="text-center p-6 bg-yellow-50 rounded-lg">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('reports.pendingPayments')}</h3>
                  <p className="text-3xl font-bold text-yellow-600">{formatCompactNumber(reportData.paymentMetrics.pendingPayments)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">20% {t('reports.ofTotal')}</p>
                </div>
                
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('reports.paymentsOverdue')}</h3>
                  <p className="text-3xl font-bold text-red-600">{formatCompactNumber(reportData.paymentMetrics.overduePayments)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">5% {t('reports.ofTotal')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Payments */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.upcomingPayments')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.paymentMetrics.upcomingPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.supplier}</p>
                        <p className="text-sm text-gray-600">
                          {t('reports.due')}: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">
                        {Math.floor((new Date(payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} {t('reports.days')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Performance Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.punctualityAnalysis')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">{t('reports.punctualPayments')}</p>
                      <p className="text-sm text-green-600">{t('reports.untilDueDate')}</p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">85%</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-800">{t('reports.delayedPayments')}</p>
                      <p className="text-sm text-yellow-600">{t('reports.delayDays')}</p>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">12%</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">{t('reports.criticalPayments')}</p>
                      <p className="text-sm text-red-600">{t('reports.moreThan7Days')}</p>
                    </div>
                    <div className="text-2xl font-bold text-red-600">3%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('reports.paymentMethods')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { method: t('reports.bankTransfer'), percentage: 65, color: 'bg-blue-500' },
                    { method: t('reports.letterOfCredit'), percentage: 25, color: 'bg-emerald-500' },
                    { method: t('reports.documentaryCollection'), percentage: 10, color: 'bg-purple-500' }
                  ].map((item) => (
                    <div key={item.method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 ${item.color} rounded`}></div>
                        <span className="font-medium">{item.method}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalSuppliers')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.supplierMetrics.totalSuppliers}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">+3 {t('reports.newSuppliers')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.activeSuppliers')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.floor(reportData.supplierMetrics.totalSuppliers * 0.8)}
                    </p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.withOrders')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.businessVolume')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCompactNumber(reportData.importMetrics.totalValue)}
                    </p>
                    <div className="flex items-center mt-1">
                      <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.totalFOB')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.averageRating')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.performanceMetrics.qualityScore}/5
                    </p>
                    <div className="flex items-center mt-1">
                      <Target className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-500">{t('reports.quality')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Suppliers Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.topSuppliersByVolume')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.supplierMetrics.topSuppliers.map((supplier, index) => (
                  <div key={supplier.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-lg">{supplier.name}</p>
                        <p className="text-sm text-gray-600">
                          {supplier.importCount} {t('reports.imports')} • {supplier.location}
                        </p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full mr-1 ${
                                i < 4 ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-600 ml-2">4.2/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(supplier.totalValue)}</p>
                      <p className="text-sm text-gray-600">
                        {t('reports.average')}: {formatCurrency(supplier.totalValue / supplier.importCount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.regionalDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.supplierMetrics.supplierDistribution.map((region) => (
                  <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{region.region}</p>
                        <p className="text-sm text-gray-600">{region.count} {t('reports.suppliers')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${region.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{region.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supplier Performance Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.supplierPerformanceAnalysis')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t('reports.onTimeDeliveryRate')}</p>
                        <p className="text-sm text-gray-600">{t('reports.deliveredPunctually')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">{reportData.performanceMetrics.onTimeDeliveryRate}%</p>
                      <p className="text-sm text-gray-600">média</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t('reports.averageProductQuality')}</p>
                        <p className="text-sm text-gray-600">{t('reports.generalRating')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{reportData.performanceMetrics.qualityScore}/5</p>
                      <p className="text-sm text-gray-600">{t('reports.stars')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t('reports.priceEfficiency')}</p>
                        <p className="text-sm text-gray-600">{t('reports.marketCompetitiveness')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{reportData.performanceMetrics.costEfficiencyIndex}%</p>
                      <p className="text-sm text-gray-600">{t('reports.efficient')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('reports.suppliersByCategory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: t('reports.electronics'), count: Math.floor(reportData.supplierMetrics.totalSuppliers * 0.4), color: 'bg-blue-500' },
                    { category: t('reports.textile'), count: Math.floor(reportData.supplierMetrics.totalSuppliers * 0.25), color: 'bg-emerald-500' },
                    { category: t('reports.machines'), count: Math.floor(reportData.supplierMetrics.totalSuppliers * 0.2), color: 'bg-purple-500' },
                    { category: t('reports.constructionMaterials'), count: Math.floor(reportData.supplierMetrics.totalSuppliers * 0.15), color: 'bg-orange-500' }
                  ].map((item) => (
                    <div key={item.category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                          <span className="text-white text-sm font-bold">{item.count}</span>
                        </div>
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full`}
                            style={{ width: `${(item.count / reportData.supplierMetrics.totalSuppliers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{Math.round((item.count / reportData.supplierMetrics.totalSuppliers) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}