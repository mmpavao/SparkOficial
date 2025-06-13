import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Filter,
  DollarSign,
  Package,
  CreditCard,
  FileText,
  Eye
} from "lucide-react";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last_30_days");
  const [selectedReport, setSelectedReport] = useState("overview");
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Analytics data for reports
  const reportData = {
    overview: {
      totalImported: 2450000,
      totalImports: 12,
      avgImportValue: 204166,
      creditUsed: 75000,
      monthlyGrowth: 15.5,
      topSuppliers: [
        { name: "Shenzhen Tech Co.", value: 850000, imports: 4 },
        { name: "Beijing Electronics Ltd.", value: 620000, imports: 3 },
        { name: "Guangzhou Hardware Inc.", value: 480000, imports: 2 }
      ],
      monthlyImports: [
        { month: "Jan", value: 320000, count: 2 },
        { month: "Fev", value: 450000, count: 3 },
        { month: "Mar", value: 380000, count: 2 },
        { month: "Abr", value: 520000, count: 4 },
        { month: "Mai", value: 780000, count: 1 }
      ]
    },
    financial: {
      totalPaid: 2100000,
      pending: 350000,
      creditLimit: 100000,
      creditUsed: 75000,
      avgPaymentTime: 18,
      paymentMethods: [
        { method: "Transferência Bancária", percentage: 65 },
        { method: "Carta de Crédito", percentage: 25 },
        { method: "Crédito Spark", percentage: 10 }
      ]
    }
  };

  const reportTypes = [
    { value: "overview", label: "Visão Geral" },
    { value: "financial", label: "Financeiro" },
    { value: "imports", label: "Importações" },
    { value: "suppliers", label: "Fornecedores" }
  ];

  const periods = [
    { value: "last_7_days", label: "Últimos 7 dias" },
    { value: "last_30_days", label: "Últimos 30 dias" },
    { value: "last_90_days", label: "Últimos 90 dias" },
    { value: "last_year", label: "Último ano" },
    { value: "custom", label: "Período personalizado" }
  ];

  const generateReport = () => {
    toast({
      title: "Relatório gerado!",
      description: "O relatório foi gerado e está sendo baixado.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise e insights das suas operações</p>
        </div>
        <Button 
          onClick={generateReport}
          className="bg-spark-600 hover:bg-spark-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Report */}
      {selectedReport === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Importado</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {reportData.overview.totalImported.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">+{reportData.overview.monthlyGrowth}%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-spark-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-spark-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Importações</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalImports}</p>
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
                    <p className="text-sm text-gray-600">Valor Médio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {reportData.overview.avgImportValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Crédito Utilizado</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {reportData.overview.creditUsed.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>Principais Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.overview.topSuppliers.map((supplier, index) => (
                  <div key={supplier.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-spark-100 rounded-lg flex items-center justify-center">
                        <span className="text-spark-600 font-semibold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.imports} importações</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {supplier.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.overview.monthlyImports.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{month.month}/2024</p>
                      <p className="text-sm text-gray-600">{month.count} importações</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {month.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Financial Report */}
      {selectedReport === "financial" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Pago</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {reportData.financial.totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendente</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {reportData.financial.pending.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Limite de Crédito</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {reportData.financial.creditLimit.toLocaleString()}
                    </p>
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
                    <p className="text-sm text-gray-600">Tempo Médio Pagamento</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.financial.avgPaymentTime} dias</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.financial.paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{method.method}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-spark-600 h-2 rounded-full"
                          style={{ width: `${method.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{method.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Other Report Types Placeholder */}
      {(selectedReport === "imports" || selectedReport === "suppliers") && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Relatório {reportTypes.find(t => t.value === selectedReport)?.label}
            </h3>
            <p className="text-gray-600 mb-4">
              Este relatório está sendo desenvolvido e estará disponível em breve.
            </p>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar Prévia
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}