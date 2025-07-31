import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminRoleSwitcher from "@/components/AdminRoleSwitcher";
import logoPath from "@assets/ChatGPT Image May 7, 2025, 03_07_22 PM_1753942249102.png";
import type { User } from "@shared/schema";

interface HeaderProps {
  currentRole?: string;
  userName?: string;
  userImage?: string;
}

export default function Header({ currentRole, userName, userImage }: HeaderProps) {
  const { user } = useAuth();

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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Magnoos Logo */}
            <div className="flex items-center space-x-3">
              <img src={logoPath} alt="Magnoos Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-magnoos-dark">Magnoos</h1>
                <p className="text-xs text-gray-500">Travel Management</p>
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
                <AvatarFallback className="bg-magnoos-blue text-white text-sm">
                  {typedUser ? getInitials(`${typedUser.firstName || ''} ${typedUser.lastName || ''}`.trim() || typedUser.email || 'U') : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {userName || `${typedUser?.firstName || ''} ${typedUser?.lastName || ''}`.trim() || typedUser?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {currentRole ? getRoleDisplayName(currentRole) : getRoleDisplayName(typedUser?.activeRole || typedUser?.role || 'user')}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="hidden sm:flex"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
