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
import DocumentManagement from "@/pages/document-management";
import ProjectsPage from "@/pages/projects";
import AdminUsers from "@/pages/admin-users";
import AdminPanel from "@/pages/admin-panel";
// Business Unit Manager Pages
import BUManagerDashboard from "@/pages/manager/dashboard";
import NewRequest from "@/pages/manager/new-request";
import Approvals from "@/pages/manager/approvals";
import MyRequests from "@/pages/manager/my-requests";
import AllRequests from "@/pages/manager/all-requests";
import Reports from "@/pages/manager/reports";
import OperationsProgress from "@/pages/manager/operations-progress";
// Project Manager Pages  
import PMNewRequest from "@/pages/pm-new-request";
import PMMyRequests from "@/pages/pm-my-requests";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import AdminRoleSwitcher from "@/components/AdminRoleSwitcher";
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
        {(() => {
          try {
            if (currentRole === 'manager') {
              return <PMDashboard />;
            }
            if (currentRole === 'pm') {
              return <BUManagerDashboard />;
            }
            if (currentRole === 'operations_ksa' || currentRole === 'operations_uae') {
              return <OperationsDashboard />;
            }
            if (currentRole === 'admin') {
              return <ManagerDashboard />;
            }
            if (!currentRole) {
              return <ManagerDashboard />;
            }
            
            console.error('No component matched!');
            return <div style={{ color: 'red', padding: '20px', fontSize: '16px' }}>
              ERROR: No component matched currentRole: {currentRole}
            </div>;
          } catch (error) {
            console.error('RENDER ERROR:', error);
            const err = error as Error;
            return <div style={{ color: 'red', padding: '20px', fontSize: '16px' }}>
              RENDER ERROR: {err.message || 'Unknown error'}
              <br />
              Stack: {err.stack || 'No stack trace'}
            </div>;
          }
        })()}
      </Route>
      
      {/* Role-specific routes with admin access control */}
      <Route path="/manager">
        {(currentRole === 'manager' || typedUser?.role === 'admin') ? <ManagerDashboard /> : <NotFound />}
      </Route>
      
      {/* Business Unit Manager Routes */}
      <Route path="/manager/dashboard">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <BUManagerDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/manager/new-request">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <NewRequest /> : <NotFound />}
      </Route>
      
      <Route path="/manager/approvals">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <Approvals /> : <NotFound />}
      </Route>
      
      <Route path="/manager/my-requests">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <MyRequests /> : <NotFound />}
      </Route>
      
      <Route path="/manager/all-requests">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <AllRequests /> : <NotFound />}
      </Route>
      
      <Route path="/manager/reports">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <Reports /> : <NotFound />}
      </Route>
      
      <Route path="/manager/operations-progress">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <OperationsProgress /> : <NotFound />}
      </Route>
      
      <Route path="/pm-dashboard">
        {(currentRole === 'manager' || typedUser?.role === 'admin') ? <PMDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/pm-new-request">
        {(currentRole === 'manager' || typedUser?.role === 'admin') ? <PMNewRequest /> : <NotFound />}
      </Route>
      
      <Route path="/pm-my-requests">
        {(currentRole === 'manager' || typedUser?.role === 'admin') ? <PMMyRequests /> : <NotFound />}
      </Route>
      
      {/* Projects Management Route */}
      <Route path="/projects">
        {(currentRole === 'pm' || currentRole === 'manager' || typedUser?.role === 'admin') ? <ProjectsPage /> : <NotFound />}
      </Route>
      
      <Route path="/pm">
        {(currentRole === 'pm' || typedUser?.role === 'admin') ? <PMDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/operations">
        {(currentRole === 'operations_ksa' || currentRole === 'operations_uae' || typedUser?.role === 'admin') ? <OperationsDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/operations-dashboard">
        {(currentRole === 'operations_ksa' || currentRole === 'operations_uae' || typedUser?.role === 'admin') ? <OperationsDashboard /> : <NotFound />}
      </Route>
      
      <Route path="/documents">
        {(currentRole === 'operations_ksa' || currentRole === 'operations_uae' || typedUser?.role === 'admin') ? <DocumentManagement /> : <NotFound />}
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
        <AdminRoleSwitcher />
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
