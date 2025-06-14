import { useQuery } from "@tanstack/react-query";
import { User, CreditApplication, Import } from "@shared/schema";

interface MetricsData {
  totalUsers: number;
  totalCreditRequested: number;
  totalCreditApproved: number;
  totalImports: number;
  activeImports: number;
  completedImports: number;
  totalImportValue: number;
  utilizationRate: number;
}

export function useMetrics(isAdmin = false) {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: creditApplications = [] } = useQuery<CreditApplication[]>({
    queryKey: isAdmin ? ["/api/admin/credit-applications"] : ["/api/credit/applications"],
  });

  const { data: imports = [] } = useQuery<Import[]>({
    queryKey: isAdmin ? ["/api/admin/imports"] : ["/api/imports"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
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