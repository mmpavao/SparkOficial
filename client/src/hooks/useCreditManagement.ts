import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface CreditUsageData {
  used: number;
  available: number;
  limit: number;
}

export function useCreditUsage(applicationId: number) {
  return useQuery<CreditUsageData>({
    queryKey: ['/api/credit/usage', applicationId],
    queryFn: () => apiRequest(`/api/credit/usage/${applicationId}`, 'GET'),
    enabled: !!applicationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useCreditManagement() {
  const queryClient = useQueryClient();

  const createImportWithCredit = useMutation({
    mutationFn: async (importData: any) => {
      return apiRequest('/api/imports', 'POST', importData);
    },
    onSuccess: () => {
      // Invalidate credit usage queries to update dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/credit/usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credit/applications'] });
    },
  });

  const confirmCreditUsage = useMutation({
    mutationFn: async ({ creditApplicationId, importId }: { creditApplicationId: number; importId: number }) => {
      return apiRequest(`/api/credit/confirm/${creditApplicationId}/${importId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit/usage'] });
    },
  });

  const releaseCredit = useMutation({
    mutationFn: async ({ creditApplicationId, importId }: { creditApplicationId: number; importId: number }) => {
      return apiRequest(`/api/credit/release/${creditApplicationId}/${importId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit/usage'] });
    },
  });

  return {
    createImportWithCredit,
    confirmCreditUsage,
    releaseCredit,
  };
}