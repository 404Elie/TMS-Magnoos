import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminRoleSwitcher from "@/components/AdminRoleSwitcher";
import logoPath from "@assets/ChatGPT Image May 7, 2025, 03_07_22 PM_1753942249102.png";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface HeaderProps {
  currentRole?: string;
  userName?: string;
  userImage?: string;
}

export default function Header({ currentRole, userName, userImage }: HeaderProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      // Clear any cached data and redirect to auth page
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout request fails, redirect to auth page
      window.location.href = "/auth";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'manager': return 'Manager';
      case 'pm': return 'Project Manager';
      case 'operations': return 'Operations';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const typedUser = user as User | undefined;

  return (
    <header className="bg-magnoos-header shadow-2xl border-b border-magnoos-primary/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Magnoos Logo */}
            <div className="flex items-center space-x-3">
              <img src={logoPath} alt="Magnoos Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-white">Magnoos</h1>
                <p className="text-xs text-blue-300">Travel Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Admin Role Switcher */}
            {typedUser && <AdminRoleSwitcher user={typedUser} />}
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={userImage || typedUser?.profileImageUrl} alt="User Avatar" />
                <AvatarFallback className="magnoos-gradient text-white text-sm">
                  {typedUser ? getInitials(`${typedUser.firstName || ''} ${typedUser.lastName || ''}`.trim() || typedUser.email || 'U') : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">
                  {userName || `${typedUser?.firstName || ''} ${typedUser?.lastName || ''}`.trim() || typedUser?.email || 'User'}
                </p>
                <p className="text-xs text-blue-300">
                  {currentRole ? getRoleDisplayName(currentRole) : getRoleDisplayName(typedUser?.activeRole || typedUser?.role || 'user')}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex border-magnoos-primary/30 text-white hover:bg-magnoos-primary/20 hover:border-magnoos-primary"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
