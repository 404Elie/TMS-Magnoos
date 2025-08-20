import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const typedUser = user as User | undefined;

  // Get the current effective role for the user
  const getCurrentRole = (user: User | undefined) => {
    if (!user) return null;
    return user.role === 'admin' ? (user.activeRole || 'admin') : user.role;
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!isLoading && isAuthenticated && allowedRoles && typedUser) {
      const currentRole = getCurrentRole(typedUser);
      if (currentRole && !allowedRoles.includes(currentRole)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        // Redirect to appropriate dashboard based on current role
        setTimeout(() => {
          switch (currentRole) {
            case 'manager':
              window.location.href = "/manager";
              break;
            case 'pm':
              window.location.href = "/pm";
              break;
            case 'operations_ksa':
            case 'operations_uae':
              window.location.href = "/operations";
              break;
            default:
              window.location.href = "/";
          }
        }, 500);
        return;
      }
    }
  }, [isAuthenticated, isLoading, typedUser, allowedRoles, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnoos-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && typedUser) {
    const currentRole = getCurrentRole(typedUser);
    if (currentRole && !allowedRoles.includes(currentRole)) {
      return null; // Will redirect in useEffect
    }
  }

  return <>{children}</>;
}
