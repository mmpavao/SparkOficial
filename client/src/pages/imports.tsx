import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar,
  DollarSign,
  Ship,
  Plane,
  Plus,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function ImportsPage() {
  const [showNewImportForm, setShowNewImportForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Mock data for imports
  const importData = {
    totalImports: 12,
    activeImports: 3,
    completedImports: 8,
    totalValue: 2450000,
    imports: [
      {
        id: "IMP001",
        description: "Smartphones e Acessórios",
        supplier: "Shenzhen Tech Co.",
        value: 450000,
        status: "in_transit",
        origin: "Shenzhen, China",
        destination: "Santos, SP",
        estimatedArrival: "2024-06-20",
        trackingCode: "BR123456789CN",
        paymentStatus: "paid"
      },
      {
        id: "IMP002", 
        description: "Componentes Eletrônicos",
        supplier: "Beijing Electronics Ltd.",
        value: 280000,
        status: "customs",
        origin: "Beijing, China",
        destination: "São Paulo, SP",
        estimatedArrival: "2024-06-18",
        trackingCode: "BR987654321CN",
        paymentStatus: "pending"
      },
      {
        id: "IMP003",
        description: "Equipamentos de Informática",
        supplier: "Guangzhou Hardware Inc.",
        value: 650000,
        status: "completed",
        origin: "Guangzhou, China", 
        destination: "Rio de Janeiro, RJ",
        estimatedArrival: "2024-06-10",
        trackingCode: "BR456789123CN",
        paymentStatus: "paid"
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case "in_transit":
        return <Badge className="bg-blue-100 text-blue-800"><Ship className="w-3 h-3 mr-1" />Em Trânsito</Badge>;
      case "customs":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Na Alfândega</Badge>;
      case "preparing":
        return <Badge className="bg-purple-100 text-purple-800"><Package className="w-3 h-3 mr-1" />Preparando</Badge>;
      case "delayed":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "overdue":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredImports = filterStatus === "all" 
    ? importData.imports 
    : importData.imports.filter(imp => imp.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importações</h1>
          <p className="text-gray-600">Gerencie suas importações da China</p>
        </div>
        <Button 
          onClick={() => setShowNewImportForm(true)}
          className="bg-spark-600 hover:bg-spark-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Importação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Importações</p>
                <p className="text-2xl font-bold text-gray-900">{importData.totalImports}</p>
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
                <p className="text-sm text-gray-600">Importações Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{importData.activeImports}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{importData.completedImports}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {importData.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-spark-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-spark-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Buscar por código, fornecedor..." className="pl-10" />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="in_transit">Em Trânsito</SelectItem>
                <SelectItem value="customs">Na Alfândega</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="delayed">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Imports List */}
      <div className="space-y-4">
        {filteredImports.map((importItem) => (
          <Card key={importItem.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="font-semibold text-lg">{importItem.id}</h3>
                    {getStatusBadge(importItem.status)}
                    {getPaymentBadge(importItem.paymentStatus)}
                  </div>
                  <p className="text-gray-600 mb-2">{importItem.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {importItem.origin} → {importItem.destination}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Chegada prevista: {new Date(importItem.estimatedArrival).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      R$ {importItem.value.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      {importItem.trackingCode}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Import Form Modal */}
      {showNewImportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nova Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Descrição dos Produtos</Label>
                  <Input id="description" placeholder="Ex: Smartphones Samsung" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input id="supplier" placeholder="Nome do fornecedor" className="mt-1" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Valor Total (R$)</Label>
                  <Input id="value" type="number" placeholder="Ex: 50000" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="origin">Origem</Label>
                  <Input id="origin" placeholder="Ex: Shenzhen, China" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destination">Destino</Label>
                  <Input id="destination" placeholder="Ex: Santos, SP" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="transport">Meio de Transporte</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sea">Marítimo</SelectItem>
                      <SelectItem value="air">Aéreo</SelectItem>
                      <SelectItem value="land">Terrestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" placeholder="Informações adicionais..." className="mt-1" />
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowNewImportForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Importação criada!",
                      description: "Sua nova importação foi registrada com sucesso.",
                    });
                    setShowNewImportForm(false);
                  }}
                  className="flex-1 bg-spark-600 hover:bg-spark-700"
                >
                  Criar Importação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}