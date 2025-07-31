import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Users, RotateCcw } from "lucide-react";

export default function AdminRoleSwitcher() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest("POST", "/api/admin/switch-role", { role });
    },
    onSuccess: () => {
      toast({
        title: "Role Switched",
        description: "Successfully switched to the selected role.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Refresh the page to update the UI
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleSwitch = () => {
    if (selectedRole) {
      switchRoleMutation.mutate(selectedRole);
    }
  };

  if ((user as any)?.role !== 'admin') {
    return null;
  }

  const currentRole = (user as any)?.activeRole || 'manager';

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-medium text-orange-900">Admin Mode</h3>
              <div className="text-sm text-orange-700">
                Currently viewing as: <Badge variant="outline" className="ml-1">{currentRole.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Switch role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleRoleSwitch} 
                disabled={!selectedRole || switchRoleMutation.isPending}
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {switchRoleMutation.isPending ? "Switching..." : "Switch"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}