/**
 * Pure functions for metrics calculation
 */
import type { CreditApplication, Import } from "@shared/schema";
import type { MetricsData } from "@/types";

export function calculateCreditMetrics(applications: CreditApplication[]) {
  const totalRequested = applications.reduce(
    (sum, app) => sum + Number(app.requestedAmount || 0), 0
  );

  const approvedApps = applications.filter(app => app.financialStatus === 'approved');
  const totalApproved = approvedApps.reduce(
    (sum, app) => sum + Number(app.creditLimit || 0), 0
  );

  const utilizationRate = totalApproved > 0 ? (totalRequested / totalApproved) : 0;

  return {
    totalRequested,
    totalApproved,
    utilizationRate,
    pendingCount: applications.filter(app => app.status === 'pending').length,
    approvedCount: approvedApps.length,
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
  totalUsers: number = 0
): MetricsData {
  const creditMetrics = calculateCreditMetrics(creditApplications);
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