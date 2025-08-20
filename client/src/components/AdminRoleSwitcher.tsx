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

  const currentRole = (user as any)?.activeRole || 'pm';

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="font-medium text-orange-900 dark:text-orange-100">Admin Mode</h3>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Currently viewing as: <Badge variant="outline" className="ml-1 border-orange-300 text-orange-800 dark:border-orange-600 dark:text-orange-200">{currentRole.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-200 dark:hover:bg-orange-900/20">
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
            
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-200 dark:hover:bg-orange-900/20">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40 border-orange-300 bg-white text-orange-900 dark:border-orange-600 dark:bg-orange-950/30 dark:text-orange-100">
                  <SelectValue placeholder="Switch role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-orange-200 dark:bg-slate-800 dark:border-orange-700">
                  <SelectItem value="pm" className="text-orange-900 dark:text-orange-100">Project Manager</SelectItem>
                  <SelectItem value="manager" className="text-orange-900 dark:text-orange-100">Manager</SelectItem>
                  <SelectItem value="operations_ksa" className="text-orange-900 dark:text-orange-100">Operations KSA</SelectItem>
                  <SelectItem value="operations_uae" className="text-orange-900 dark:text-orange-100">Operations UAE</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleRoleSwitch} 
                disabled={!selectedRole || switchRoleMutation.isPending}
                size="sm"
                className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
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