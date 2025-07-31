import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ManagerDashboard from "@/pages/manager-dashboard";
import PMDashboard from "@/pages/pm-dashboard";
import OperationsDashboard from "@/pages/operations-dashboard";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnoos-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // If authenticated, route based on user role
  return (
    <Switch>
      <Route path="/">
        {user?.role === 'manager' && <ManagerDashboard />}
        {user?.role === 'pm' && <PMDashboard />}
        {user?.role === 'operations' && <OperationsDashboard />}
        {!user?.role && <NotFound />}
      </Route>
      
      {/* Role-specific routes with strict access control */}
      <Route path="/manager">
        {user?.role === 'manager' ? <ManagerDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/pm">
        {user?.role === 'pm' ? <PMDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/operations">
        {user?.role === 'operations' ? <OperationsDashboard /> : <NotFound />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
