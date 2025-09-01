import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PlusCircle, 
  CheckSquare, 
  Calendar,
  DollarSign,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useState } from "react";
import AdminRoleSwitcher from "@/components/AdminRoleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/Magnoos-Logo (3)_1756107685181.png";

interface SidebarProps {
  currentRole?: string;
}

export default function ModernSidebar({ currentRole }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/auth";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'manager': return 'Project Manager';
      case 'pm': return 'Business Unit Manager';
      case 'operations_ksa': return 'Operations KSA';
      case 'operations_uae': return 'Operations UAE';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const displayRole = currentRole ? getRoleDisplayName(currentRole) : getRoleDisplayName(typedUser?.activeRole || typedUser?.role || 'user');
  const displayName = `${typedUser?.firstName || ''} ${typedUser?.lastName || ''}`.trim();

  // Navigation items based on role
  const getNavigationItems = () => {
    const activeRole = typedUser?.activeRole || typedUser?.role;
    
    if (activeRole === 'pm' || activeRole === 'admin') {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/manager/dashboard", section: "main" },
        { icon: PlusCircle, label: "New Request", href: "/manager/new-request", section: "main" },
        { icon: CheckSquare, label: "Approvals", href: "/manager/approvals", section: "main" },
        { icon: Calendar, label: "My Requests", href: "/manager/my-requests", section: "main" },
        { icon: Globe2, label: "Operations Progress", href: "/manager/operations-progress", section: "main" },
        { icon: DollarSign, label: "Budget", href: "/manager/budget", section: "reports" },
        { icon: FileText, label: "Reports", href: "/manager/reports", section: "reports" },
      ];
    } else if (activeRole === 'manager') {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/pm-dashboard", section: "main" },
        { icon: PlusCircle, label: "New Request", href: "/pm-new-request", section: "main" },
        { icon: Calendar, label: "My Requests", href: "/pm-my-requests", section: "main" },
      ];
    } else if (activeRole === 'operations_ksa' || activeRole === 'operations_uae') {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/operations-dashboard", section: "main" },
        { icon: Calendar, label: "Bookings", href: "/operations-dashboard?tab=bookings", section: "main" },
        { icon: CheckSquare, label: "Requests", href: "/operations-dashboard?tab=requests", section: "main" },
        { icon: DollarSign, label: "Budget", href: "/operations-dashboard?tab=budget", section: "main" },
        { icon: FileText, label: "Documents", href: "/operations-dashboard?tab=documents", section: "documents" },
        { icon: Users, label: "Employees", href: "/operations-dashboard?tab=employees", section: "documents" },
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    if (href.includes('?')) {
      // For URLs with query parameters, check exact match including params
      const currentParams = new URLSearchParams(window.location.search);
      const hrefParams = new URLSearchParams(href.split('?')[1] || '');
      const currentTab = currentParams.get('tab');
      const hrefTab = hrefParams.get('tab');
      
      const [currentBasePath] = location.split('?');
      const [hrefBasePath] = href.split('?');
      
      // Check if base paths match and tabs match (or both are null for dashboard)
      return currentBasePath === hrefBasePath && currentTab === hrefTab;
    }
    return location === href || location.startsWith(href);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <img src={logoPath} alt="Magnoos" className="w-8 h-8" />
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Magnoos</h2>
                <p className="text-xs text-blue-600 dark:text-blue-400">Travel Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-8 w-8"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-600 text-white">
              {getInitials(displayName || 'User')}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{displayName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{displayRole}</p>
            </div>
          )}
        </div>
        
        {/* Admin Role Switcher */}
        {!isCollapsed && typedUser?.role === 'admin' && (
          <div className="mt-3">
            <AdminRoleSwitcher />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-1">
        {/* Main Section */}
        <div className="space-y-1">
          {navigationItems
            .filter(item => item.section === 'main')
            .map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                className={`w-full justify-start ${isCollapsed ? 'p-2' : 'p-3'} ${
                  isActive(item.href) 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && item.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Reports Section */}
        {navigationItems.some(item => item.section === 'reports') && (
          <>
            {!isCollapsed && (
              <Separator className="my-4" />
            )}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                  Reports
                </p>
              )}
              {navigationItems
                .filter(item => item.section === 'reports')
                .map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={`w-full justify-start ${isCollapsed ? 'p-2' : 'p-3'} ${
                      isActive(item.href) 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Documents Section */}
        {navigationItems.some(item => item.section === 'documents') && (
          <>
            {!isCollapsed && (
              <Separator className="my-4" />
            )}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                  Documents
                </p>
              )}
              {navigationItems
                .filter(item => item.section === 'documents')
                .map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={`w-full justify-start ${isCollapsed ? 'p-2' : 'p-3'} ${
                      isActive(item.href) 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {!isCollapsed && <span className="text-xs text-gray-500 dark:text-gray-400">Theme</span>}
        </div>
        
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start ${isCollapsed ? 'p-2' : 'p-3'} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
        >
          <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && 'Logout'}
        </Button>
      </div>
    </div>
  );
}