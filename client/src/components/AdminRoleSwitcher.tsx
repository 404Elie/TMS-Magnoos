import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, TrendingUp, Calendar } from "lucide-react";
import type { User } from "@shared/schema";

interface AdminRoleSwitcherProps {
  user: User;
}

export default function AdminRoleSwitcher({ user }: AdminRoleSwitcherProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChanging, setIsChanging] = useState(false);

  const currentRole = user.activeRole || user.role;

  const switchRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      return await apiRequest("POST", "/api/admin/switch-role", { role: newRole });
    },
    onSuccess: () => {
      toast({
        title: "Role Switched",
        description: "Successfully switched to new role",
      });
      // Invalidate all queries to refresh data for new role
      queryClient.invalidateQueries();
      setIsChanging(false);
      // Refresh the page to reload with new role
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to switch role. Please try again.",
        variant: "destructive",
      });
      setIsChanging(false);
    },
  });

  const handleRoleChange = (newRole: string) => {
    if (newRole !== currentRole) {
      setIsChanging(true);
      switchRoleMutation.mutate(newRole);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Users className="w-4 h-4" />;
      case 'pm':
        return <TrendingUp className="w-4 h-4" />;
      case 'operations':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'manager':
        return 'Manager';
      case 'pm':
        return 'Project Manager';
      case 'operations':
        return 'Operations';
      default:
        return role;
    }
  };

  // Only show role switcher for admin users
  if (user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      <Badge variant="outline" className="text-xs">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Acting as:</span>
        <Select
          value={currentRole}
          onValueChange={handleRoleChange}
          disabled={isChanging}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue>
              <div className="flex items-center space-x-2">
                {getRoleIcon(currentRole)}
                <span>{getRoleLabel(currentRole)}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manager">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Manager</span>
              </div>
            </SelectItem>
            <SelectItem value="pm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Project Manager</span>
              </div>
            </SelectItem>
            <SelectItem value="operations">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Operations</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}