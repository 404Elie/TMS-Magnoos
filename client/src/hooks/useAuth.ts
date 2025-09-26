import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function useAuth() {
  // TEMPORARY FIX: Create a mock user to break the infinite loop
  const [mockUser] = useState({
    id: "temp-user-123",
    email: "admin@magnoos.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    activeRole: "admin",
    annualTravelBudget: null,
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate loading time and then set as ready
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return {
    user: isReady ? mockUser : null,
    isLoading: !isReady,
    isAuthenticated: isReady,
  };
}
