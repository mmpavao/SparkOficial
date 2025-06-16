import { useQuery } from "@tanstack/react-query";
import { User, CreditApplication, Import } from "@shared/schema";
import { MetricsData } from "@/types";
import { QUERY_KEYS } from "@/lib/constants";
import { buildMetricsData } from "@/lib/metrics";

export function useMetrics(isAdmin = false, isFinanceira = false) {
  const { data: user } = useQuery<User>({
    queryKey: QUERY_KEYS.auth,
  });

  // Determine correct endpoints based on user role
  const creditEndpoint = isAdmin 
    ? QUERY_KEYS.admin.creditApplications 
    : isFinanceira 
      ? ['financeira', 'credit-applications']
      : QUERY_KEYS.creditApplications;

  const importsEndpoint = isAdmin
    ? QUERY_KEYS.admin.imports
    : isFinanceira
      ? ['financeira', 'imports'] 
      : QUERY_KEYS.imports;

  const { data: creditApplications = [] } = useQuery<CreditApplication[]>({
    queryKey: creditEndpoint,
  });

  const { data: imports = [] } = useQuery<Import[]>({
    queryKey: importsEndpoint,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: QUERY_KEYS.admin.users,
    enabled: isAdmin,
  });

  const metrics = buildMetricsData(creditApplications, imports, users.length, user?.role);

  return {
    user,
    creditApplications,
    imports,
    users: isAdmin ? users : [],
    metrics,
    isLoading: false,
  };
}