/**
 * Pure functions for metrics calculation
 */
import type { CreditApplication, Import } from "@shared/schema";
import type { MetricsData } from "@/types";

export function calculateCreditMetrics(applications: CreditApplication[], userRole?: string) {
  const totalRequested = applications.reduce(
    (sum, app) => sum + Number(app.requestedAmount || 0), 0
  );

  // Applications approved by financeira but not yet finalized by admin
  const financiallyApproved = applications.filter(app => 
    app.financialStatus === 'approved' && app.adminStatus !== 'admin_finalized'
  );
  
  // Applications fully finalized and available to clients
  const finalizedApps = applications.filter(app => 
    app.financialStatus === 'approved' && app.adminStatus === 'admin_finalized'
  );

  // Different logic for different user roles
  let totalApproved = 0;
  
  if (userRole === 'financeira') {
    // Financeira always sees original approved amounts (never changes)
    totalApproved = applications
      .filter(app => app.financialStatus === 'approved')
      .reduce((sum, app) => sum + Number(app.creditLimit || 0), 0);
  } else if (userRole === 'admin') {
    // Admin sees both original and final amounts
    totalApproved = applications
      .filter(app => app.financialStatus === 'approved')
      .reduce((sum, app) => {
        const creditAmount = app.adminStatus === 'admin_finalized' 
          ? Number(app.finalCreditLimit || app.creditLimit || 0)
          : Number(app.creditLimit || 0);
        return sum + creditAmount;
      }, 0);
  } else {
    // Importers only see final amounts (admin-adjusted)
    totalApproved = applications
      .filter(app => app.financialStatus === 'approved' && app.adminStatus === 'admin_finalized')
      .reduce((sum, app) => sum + Number(app.finalCreditLimit || 0), 0);
  }

  const utilizationRate = totalApproved > 0 ? (totalRequested / totalApproved) : 0;

  return {
    totalRequested,
    totalApproved,
    utilizationRate,
    pendingCount: applications.filter(app => app.status === 'pending').length,
    approvedCount: applications.filter(app => app.financialStatus === 'approved').length,
    finalizedCount: finalizedApps.length,
    awaitingFinalizationCount: financiallyApproved.length,
  };
}

export function calculateImportMetrics(imports: Import[]) {
  const activeStatuses = ['planning', 'ordered', 'in_transit', 'customs'];
  const completedStatuses = ['delivered'];

  const activeImports = imports.filter(imp => activeStatuses.includes(imp.status));
  const completedImports = imports.filter(imp => completedStatuses.includes(imp.status));
  
  const totalValue = imports.reduce(
    (sum, imp) => sum + Number(imp.totalValue || 0), 0
  );

  return {
    total: imports.length,
    active: activeImports.length,
    completed: completedImports.length,
    totalValue,
    averageValue: imports.length > 0 ? totalValue / imports.length : 0,
  };
}

export function buildMetricsData(
  creditApplications: CreditApplication[],
  imports: Import[],
  totalUsers: number = 0,
  userRole?: string
): MetricsData {
  const creditMetrics = calculateCreditMetrics(creditApplications, userRole);
  const importMetrics = calculateImportMetrics(imports);

  return {
    totalUsers,
    totalCreditRequested: creditMetrics.totalRequested,
    totalCreditApproved: creditMetrics.totalApproved,
    totalImports: importMetrics.total,
    activeImports: importMetrics.active,
    completedImports: importMetrics.completed,
    totalImportValue: importMetrics.totalValue,
    utilizationRate: creditMetrics.utilizationRate,
  };
}