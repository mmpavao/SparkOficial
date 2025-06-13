import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from "lucide-react";

export default function CreditPage() {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Mock data - in real app this would come from API
  const creditData = {
    availableLimit: 250000,
    usedCredit: 75000,
    pendingApplications: 1,
    approvedLimit: 100000,
    applications: [
      {
        id: 1,
        amount: 150000,
        status: "pending",
        date: "2024-06-10",
        purpose: "Importação de eletrônicos"
      },
      {
        id: 2,
        amount: 100000,
        status: "approved",
        date: "2024-05-15",
        purpose: "Capital de giro"
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const usagePercentage = (creditData.usedCredit / creditData.approvedLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crédito</h1>
          <p className="text-gray-600">Gerencie seu limite de crédito e solicitações</p>
        </div>
        <Button 
          onClick={() => setShowApplicationForm(true)}
          className="bg-spark-600 hover:bg-spark-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Solicitar Crédito
        </Button>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Limite Aprovado</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {creditData.approvedLimit.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
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
                  R$ {creditData.usedCredit.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponível</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(creditData.approvedLimit - creditData.usedCredit).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solicitações Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creditData.pendingApplications}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Utilização do Crédito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>R$ {creditData.usedCredit.toLocaleString()} utilizado</span>
              <span>R$ {creditData.approvedLimit.toLocaleString()} limite total</span>
            </div>
            <Progress value={usagePercentage} className="h-3" />
            <p className="text-sm text-gray-600">
              {usagePercentage.toFixed(1)}% do limite utilizado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Applications History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creditData.applications.map((application) => (
              <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-spark-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-spark-600" />
                  </div>
                  <div>
                    <p className="font-medium">R$ {application.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{application.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(application.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {getStatusBadge(application.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Solicitar Crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Valor Solicitado</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ex: 50000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="purpose">Finalidade</Label>
                <Input
                  id="purpose"
                  placeholder="Ex: Importação de produtos"
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Solicitação enviada!",
                      description: "Sua solicitação de crédito foi enviada para análise.",
                    });
                    setShowApplicationForm(false);
                  }}
                  className="flex-1 bg-spark-600 hover:bg-spark-700"
                >
                  Solicitar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}