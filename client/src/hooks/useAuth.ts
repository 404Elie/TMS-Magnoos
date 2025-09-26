import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Never refetch automatically
    gcTime: Infinity, // Keep in cache forever
    networkMode: "online",
    enabled: true, // Only run once
  });

  // If we get a 401, redirect to login immediately
  if (error || (!isLoading && !user)) {
    window.location.href = "/api/login";
    return {
      user: null,
      isLoading: true, // Keep loading to prevent further renders
      isAuthenticated: false,
    };
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
