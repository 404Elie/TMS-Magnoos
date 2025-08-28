import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import AdminRoleSwitcher from "@/components/AdminRoleSwitcher";
import logoPath from "@assets/Magnoos-Logo (3)_1756107685181.png";
import type { User } from "@shared/schema";
import { 
  Home, 
  Users, 
  Plane, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Building2
} from "lucide-react";

interface NavigationItem {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/",
    roles: ["admin", "manager", "pm", "operations_ksa", "operations_uae"]
  },
  {
    label: "Travel Requests",
    icon: Plane,
    path: "/",
    roles: ["admin", "manager", "pm", "operations_ksa", "operations_uae"]
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/",
    roles: ["admin", "pm", "operations_ksa", "operations_uae"]
  },
  {
    label: "Documents",
    icon: FileText,
    path: "/documents",
    roles: ["admin", "operations_ksa", "operations_uae"]
  },
  {
    label: "Users",
    icon: Users,
    path: "/admin/users",
    roles: ["admin"]
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/admin",
    roles: ["admin"]
  }
];

export default function ModernSidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  const typedUser = user as User | undefined;
  
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

  const getCurrentRole = (user: User | undefined) => {
    if (!user) return null;
    if (user.role === 'admin') {
      return user.activeRole || 'manager';
    }
    return user.role;
  };

  const currentRole = getCurrentRole(typedUser);
  
  const visibleItems = navigationItems.filter(item => 
    currentRole && item.roles.includes(currentRole)
  );

  return (
    <div className="w-56 h-screen sidebar-bg border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <img src={logoPath} alt="Magnoos Logo" className="w-6 h-6 object-contain" />
          <div>
            <h1 className="text-sm font-bold text-foreground">Magnoos</h1>
            <p className="text-xs text-muted-foreground">Travel Mgmt</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.label}
              onClick={() => setLocation(item.path)}
              className={`
                w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'sidebar-active shadow-md' 
                  : 'sidebar-text hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Profile & Controls */}
      <div className="border-t border-border p-4 space-y-3">
        {/* User Profile */}
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30">
          <Avatar className="w-8 h-8">
            <AvatarImage src={typedUser?.profileImageUrl || undefined} alt="User Avatar" />
            <AvatarFallback className="modern-gradient-primary text-white text-xs">
              {typedUser ? getInitials(`${typedUser.firstName || ''} ${typedUser.lastName || ''}`.trim() || typedUser.email || 'U') : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {`${typedUser?.firstName || ''} ${typedUser?.lastName || ''}`.trim() || typedUser?.email || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getRoleDisplayName(currentRole || 'user')}
            </p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}