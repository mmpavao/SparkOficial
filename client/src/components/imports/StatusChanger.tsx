import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, CheckCircle } from "lucide-react";
import { IMPORT_STATUS, IMPORT_STATUS_LABELS, getImportStatusColor, getImportStatusLabelsForShippingMethod } from "@/utils/importStatus";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface StatusChangerProps {
  importId: number;
  currentStatus: string;
  shippingMethod: string;
  onStatusChange?: (newStatus: string) => void;
}

export function StatusChanger({ importId, currentStatus, shippingMethod, onStatusChange }: StatusChangerProps) {
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setIsChanging(true);
    try {
      await apiRequest(`/api/imports/${importId}`, "PUT", { status: newStatus });
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      
      // Call callback if provided
      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      toast({
        title: "Status atualizado",
        description: `Status alterado para: ${IMPORT_STATUS_LABELS[newStatus as keyof typeof IMPORT_STATUS_LABELS]}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da importação",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isChanging}
          className="h-8 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          Status <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(getImportStatusLabelsForShippingMethod(shippingMethod)).map(([status, label]) => (
          <DropdownMenuItem
            key={status}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(status);
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex-1">{label}</span>
            {status === currentStatus && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}