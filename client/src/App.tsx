import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import ManagerDashboard from "@/pages/manager-dashboard";
import PMDashboard from "@/pages/pm-dashboard";
import OperationsDashboard from "@/pages/operations-dashboard";
import AdminUsers from "@/pages/admin-users";
import AdminPanel from "@/pages/admin-panel";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import type { User } from "@shared/schema";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const typedUser = user as User | undefined;

  // Get the current effective role for the user
  const getCurrentRole = (user: User | undefined) => {
    if (!user) return null;
    // Admin users can switch roles, default to manager if no activeRole is set
    if (user.role === 'admin') {
      return user.activeRole || 'manager';
    }
    return user.role;
  };

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-magnoos-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnoos-primary mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  const currentRole = getCurrentRole(typedUser);

  // If authenticated, route based on user role
  return (
    <Switch>
      <Route path="/">
        {currentRole === 'manager' && <ManagerDashboard />}
        {currentRole === 'pm' && <PMDashboard />}
        {currentRole === 'operations' && <OperationsDashboard />}
        {!currentRole && <ManagerDashboard />}
      </Route>
      
      {/* Role-specific routes with admin access control */}
      <Route path="/manager">
        {(currentRole === 'manager' || typedUser?.role === 'admin') ? <ManagerDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/pm">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <PMDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/operations">
        {(currentRole === 'operations' || typedUser?.role === 'admin') ? <OperationsDashboard /> : <NotFound />}
      </Route>
      
      {/* Admin-only routes */}
      <Route path="/admin/users">
        {typedUser?.role === 'admin' ? <AdminUsers /> : <NotFound />}
      </Route>
      
      <Route path="/admin">
        {typedUser?.role === 'admin' ? <AdminPanel /> : <NotFound />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <div 
      className="min-h-screen text-foreground transition-all duration-300" 
      style={{ 
        background: theme === 'light' 
          ? 'linear-gradient(135deg, hsl(175, 100%, 98%) 0%, hsl(0, 0%, 100%) 25%, hsl(51, 100%, 98%) 50%, hsl(0, 0%, 100%) 75%, hsl(175, 100%, 98%) 100%)' 
          : 'hsl(var(--background))' 
      }}
    >
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
