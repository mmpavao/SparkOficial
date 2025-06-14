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

  const metrics = buildMetricsData(creditApplications, imports, users.length);

  return {
    user,
    creditApplications,
    imports,
    users: isAdmin ? users : [],
    metrics,
    isLoading: false, // Simplified for now
  };
}