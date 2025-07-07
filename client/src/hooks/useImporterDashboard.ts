import { useQuery } from '@tanstack/react-query';

interface ImporterDashboardData {
  creditMetrics: {
    approvedAmount: number;
    usedAmount: number;
    availableAmount: number;
    utilizationRate: number;
  };
  importMetrics: {
    totalImports: number;
    activeImports: number;
    completedImports: number;
    totalValue: number;
  };
  supplierMetrics: {
    totalSuppliers: number;
    activeSuppliers: number;
  };
  recentActivity: {
    imports: Array<{
      id: number;
      name: string;
      status: string;
      totalValue: string;
      date: string;
    }>;
    creditApplications: Array<{
      id: number;
      status: string;
      amount: string;
      date: string;
    }>;
  };
  statusBreakdown: {
    planning: number;
    production: number;
    shipping: number;
    completed: number;
  };
  upcomingPayments: Array<{
    id: number;
    type: 'installment' | 'entry';
    amount: number;
    dueDate: string;
    daysUntilDue: number;
    importId: number;
    importName?: string;
    supplier?: string;
  }>;
}

export function useImporterDashboard(enabled: boolean) {
  return useQuery<ImporterDashboardData>({
    queryKey: ['/api/dashboard/importer'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/importer', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}