import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AdminMetrics {
  totalImporters: number;
  totalApplications: number;
  applicationsByStatus: { [key: string]: number };
  totalCreditVolume: number;
  approvedCreditVolume: number;
  totalImports: number;
  totalSuppliers: number;
  recentActivity: Array<{
    id: number;
    companyName: string;
    status: string;
    amount: string;
    createdAt: string;
  }>;
}

export function useAdminMetrics(enabled: boolean = true) {
  return useQuery<AdminMetrics>({
    queryKey: ["/api/admin/dashboard/metrics"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/dashboard/metrics", "GET");
      return response;
    },
    enabled, // Only run when enabled
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 20, // 20 minutes
    retry: 1, // Reduce retries
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: false, // Prevent reconnect refetches
  });
}