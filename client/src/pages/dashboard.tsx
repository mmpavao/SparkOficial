import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMetrics } from "@/hooks/useMetrics";
import { useTranslation } from "@/contexts/I18nContext";
import MetricsCard from "@/components/common/MetricsCard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getGreeting, getFirstName, getRoleDisplayName } from "@/utils/roleUtils";

import { 
  Plus,
  FileText,
  Package,
  PiggyBank,
  CreditCard,
  Truck,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { metrics, creditApplications, imports } = useMetrics();





  return (
    <div className="space-y-6">
        {/* Personalized Welcome Section */}
        <div className="bg-gradient-spark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {getGreeting()}, {getFirstName(user?.fullName)}! 👋
            </h2>
            <p className="opacity-90 mb-1">
              {getRoleDisplayName(user?.role as any)} na {user?.companyName}
            </p>
            <p className="opacity-75 text-sm">
              {t.dashboard.manageCreditsAndImports}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user?.fullName?.split(' ').map(name => name[0]).join('').slice(0, 2) || 'SC'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title={t.dashboard.availableCredit}
          value={`R$ ${metrics.totalCreditApproved.toLocaleString('pt-BR')}`}
          icon={CreditCard}
          iconColor="text-green-600"
        />

        <MetricsCard
          title={t.dashboard.activeImports}
          value={metrics.activeImports}
          icon={Truck}
          iconColor="text-blue-600"
        />

        <MetricsCard
          title={t.dashboard.totalImports}
          value={`R$ ${metrics.totalImportValue.toLocaleString('pt-BR')}`}
          icon={BarChart3}
          iconColor="text-purple-600"
        />

        <MetricsCard
          title={t.dashboard.totalImports}
          value={metrics.totalImports}
          icon={Package}
          iconColor="text-spark-600"
        />
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.recentImports}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t.common.smartphonessamsung}</p>
                    <p className="text-sm text-gray-600">{t.common.shenzhensantos}</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">{t.common.emtransito}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t.common.componenteseletronic}</p>
                    <p className="text-sm text-gray-600">{t.common.beijingsaopaulo}</p>
                  </div>
                </div>
                <span className="text-sm text-yellow-600 font-medium">{t.common.alfandega}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.common.actions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-between bg-spark-50 hover:bg-spark-100 text-gray-900 border border-spark-200">
              <div className="flex items-center">
                <Plus className="w-4 h-4 text-spark-600 mr-3" />
                <span className="font-medium">{t.imports.newImport}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 text-gray-600 mr-3" />
                <span className="font-medium">{t.credit.requestCredit}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-600 mr-3" />
                <span className="font-medium">{t.reports.generateReport}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
