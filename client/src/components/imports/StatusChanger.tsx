import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Truck, Package, MapPin, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StatusChangerProps {
  importId: number;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

const STATUS_OPTIONS = [
  { 
    value: 'planejamento', 
    label: 'Planejamento', 
    icon: Clock, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Importação em fase de planejamento'
  },
  { 
    value: 'producao', 
    label: 'Produção', 
    icon: Package, 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Produtos em produção no fornecedor'
  },
  { 
    value: 'entregue_agente', 
    label: 'Entregue ao Agente', 
    icon: Building, 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Produtos entregues ao agente de carga'
  },
  { 
    value: 'transporte_maritimo', 
    label: 'Transporte Marítimo', 
    icon: Truck, 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Em transporte marítimo internacional'
  },
  { 
    value: 'transporte_aereo', 
    label: 'Transporte Aéreo', 
    icon: Truck, 
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    description: 'Em transporte aéreo internacional'
  },
  { 
    value: 'desembaraco', 
    label: 'Desembaraço', 
    icon: AlertCircle, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Processo de desembaraço aduaneiro'
  },
  { 
    value: 'transporte_nacional', 
    label: 'Transporte Nacional', 
    icon: MapPin, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Transporte para destino final'
  },
  { 
    value: 'concluido', 
    label: 'Concluído', 
    icon: CheckCircle2, 
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Importação finalizada com sucesso'
  }
];

export default function StatusChanger({ importId, currentStatus, onStatusChange }: StatusChangerProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return await apiRequest(`/api/imports/${importId}/status`, 'PUT', { status: newStatus });
    },
    onSuccess: (data, newStatus) => {
      toast({
        title: "Status atualizado",
        description: `Status da importação alterado para: ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`,
      });
      
      // Invalidar cache das importações e detalhes
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      queryClient.invalidateQueries({ queryKey: [`/api/imports/${importId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/imports/${importId}`] });
      
      // Callback para o componente pai
      onStatusChange?.(newStatus);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error?.message || "Ocorreu um erro ao atualizar o status da importação",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = () => {
    if (selectedStatus !== currentStatus) {
      updateStatusMutation.mutate(selectedStatus);
    }
  };

  const getCurrentStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const currentStatusConfig = getCurrentStatusConfig(currentStatus);
  const selectedStatusConfig = getCurrentStatusConfig(selectedStatus);
  const CurrentIcon = currentStatusConfig.icon;
  const SelectedIcon = selectedStatusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CurrentIcon className="w-5 h-5" />
          Alterar Status da Importação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Status Atual
          </label>
          <Badge className={`${currentStatusConfig.color} px-3 py-1`}>
            <CurrentIcon className="w-4 h-4 mr-2" />
            {currentStatusConfig.label}
          </Badge>
        </div>

        {/* Seletor de Novo Status */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Novo Status
          </label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => {
                const Icon = status.icon;
                return (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{status.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {selectedStatus !== currentStatus && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedStatusConfig.description}
            </p>
          )}
        </div>

        {/* Preview do Novo Status */}
        {selectedStatus !== currentStatus && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <Badge className={`${selectedStatusConfig.color} px-3 py-1`}>
              <SelectedIcon className="w-4 h-4 mr-2" />
              {selectedStatusConfig.label}
            </Badge>
          </div>
        )}

        {/* Botão de Ação */}
        <Button 
          onClick={handleStatusChange}
          disabled={selectedStatus === currentStatus || updateStatusMutation.isPending}
          className="w-full"
        >
          {updateStatusMutation.isPending ? (
            "Atualizando..."
          ) : selectedStatus === currentStatus ? (
            "Selecione um novo status"
          ) : (
            `Alterar para ${selectedStatusConfig.label}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}