import { useQuery } from "@tanstack/react-query";
import { User, CreditApplication, Import } from "@shared/schema";
import { MetricsData } from "@/types";
import { QUERY_KEYS } from "@/lib/constants";
import { buildMetricsData } from "@/lib/metrics";

export function useMetrics(isAdmin = false) {
  const { data: user } = useQuery<User>({
    queryKey: QUERY_KEYS.auth,
  });

  const { data: creditApplications = [] } = useQuery<CreditApplication[]>({
    queryKey: isAdmin ? QUERY_KEYS.admin.creditApplications : QUERY_KEYS.creditApplications,
  });

  const { data: imports = [] } = useQuery<Import[]>({
    queryKey: isAdmin ? QUERY_KEYS.admin.imports : QUERY_KEYS.imports,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: QUERY_KEYS.admin.users,
    enabled: isAdmin,
  });

  const calculateMetrics = (): MetricsData => {
    // Credit calculations
    const totalCreditRequested = creditApplications.reduce(
      (sum, app) => sum + Number(app.requestedAmount || 0), 0
    );

    const approvedApplications = creditApplications.filter(app => app.status === 'approved');
    const totalCreditApproved = approvedApplications.reduce(
      (sum, app) => sum + Number(app.approvedAmount || 0), 0
    );

    const utilizationRate = totalCreditApproved > 0 
      ? (totalCreditRequested / totalCreditApproved) 
      : 0;

    // Import calculations
    const activeImports = imports.filter(imp => 
      ['planning', 'ordered', 'production', 'shipped', 'in_transit', 'customs'].includes(imp.status)
    ).length;

    const completedImports = imports.filter(imp => 
      ['delivered', 'completed'].includes(imp.status)
    ).length;

    const totalImportValue = imports.reduce(
      (sum, imp) => sum + Number(imp.totalValue || 0), 0
    );

    return {
      totalUsers: users.length,
      totalCreditRequested,
      totalCreditApproved,
      totalImports: imports.length,
      activeImports,
      completedImports,
      totalImportValue,
      utilizationRate,
    };
  };

  return {
    user,
    creditApplications,
    imports,
    users: isAdmin ? users : [],
    metrics: calculateMetrics(),
    isLoading: false, // Simplified for now
  };
}