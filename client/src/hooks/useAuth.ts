import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // If there's an auth error, treat as not authenticated rather than loading
  const isAuthError = error?.status === 401 || error?.status === 403;
  
  return {
    user,
    isLoading: isLoading && !isAuthError,
    isAuthenticated: !!user && !isAuthError,
    error: isAuthError ? null : error,
  };
}