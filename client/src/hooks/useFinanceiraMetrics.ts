
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface FinanceiraMetrics {
  totalApplicationsSubmitted: number;
  totalCreditRequested: number;
  totalCreditApproved: number;
  totalCreditInUse: number;
  totalCreditAvailable: number;
  applicationsByStatus: {
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  approvalRate: number;
  averageApprovalTime: number;
  recentActivity: Array<{
    id: number;
    companyName: string;
    status: string;
    requestedAmount: string;
    approvedAmount?: string;
    submittedAt: string;
  }>;
  monthlyStats: {
    applications: number;
    approvals: number;
    volume: number;
  };
}

export function useFinanceiraMetrics(enabled: boolean = true) {
  return useQuery<FinanceiraMetrics>({
    queryKey: ["/api/financeira/dashboard/metrics"],
    queryFn: async () => {
      const response = await apiRequest("/api/financeira/dashboard/metrics", "GET");
      return response;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
