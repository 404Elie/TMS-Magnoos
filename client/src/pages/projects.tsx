import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ModernLayout from "@/components/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  Database, 
  FileText, 
  Search, 
  FolderOpen,
  Calendar,
  User,
  AlertCircle
} from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all projects
  const { data: projects, isLoading: projectsLoading, error } = useQuery<any[]>({
    queryKey: ["/api/zoho/projects"],
    retry: false,
  });

  // Excel project import mutation
  const importExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/projects/import-excel");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Excel Import Complete",
        description: `Added ${data.projectsAdded} new projects from Excel file. ${data.errors && data.errors.length > 0 ? `Found ${data.errors.length} errors.` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/zoho/projects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Excel Import Failed",
        description: error.message || "Failed to import projects from Excel",
        variant: "destructive",
      });
    },
  });

  // Zoho project sync mutation
  const syncZohoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/projects/sync-zoho");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Zoho Sync Complete",
        description: `Added ${data.projectsAdded} new projects from Zoho API.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/zoho/projects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Zoho Sync Failed",
        description: error.message || "Failed to sync projects from Zoho",
        variant: "destructive",
      });
    },
  });

  // Filter projects based on search query
  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.id.toString().includes(searchQuery)
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">Inactive</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["pm", "manager", "admin"]}>
      <ModernLayout currentRole={(user as any)?.role === 'pm' ? 'pm' : 'manager'}>
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Project Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage all projects and sync data from external sources
              </p>
            </div>

            {/* Sync Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={() => importExcelMutation.mutate()}
                disabled={importExcelMutation.isPending}
                data-testid="button-import-excel"
              >
                {importExcelMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {importExcelMutation.isPending ? "Importing..." : "Import from Excel"}
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => syncZohoMutation.mutate()}
                disabled={syncZohoMutation.isPending}
                data-testid="button-sync-zoho"
              >
                {syncZohoMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                {syncZohoMutation.isPending ? "Syncing..." : "Sync from Zoho API"}
              </Button>
            </div>
          </div>

          {/* Stats and Search */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Project Stats */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Total Projects</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {projectsLoading ? "..." : projects?.length || 0}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Active Projects</h4>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {projectsLoading ? "..." : filteredProjects.filter(p => p.status?.toLowerCase() === 'active').length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <User className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Your Role</h4>
                  <p className="text-lg font-bold text-purple-600 mt-1">
                    {(user as any)?.role === 'pm' ? 'Business Unit Manager' : 'Project Manager'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="lg:w-80">
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search projects by name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white dark:bg-gray-700"
                      data-testid="input-search-projects"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Projects List */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                All Projects ({filteredProjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600 dark:text-gray-300">Loading projects...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
                  <p className="text-red-600">Failed to load projects</p>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="bg-gray-50 dark:bg-gray-700" data-testid={`project-card-${project.id}`}>
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {project.name}
                              </h3>
                              {getStatusBadge(project.status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <div>
                                <span className="font-medium">Project ID:</span> {project.id}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span> {project.status || 'Unknown'}
                              </div>
                              {project.description && (
                                <div className="md:col-span-2">
                                  <span className="font-medium">Description:</span> {project.description}
                                </div>
                              )}
                              {project.created_date && (
                                <div>
                                  <span className="font-medium">Created:</span> {formatDate(project.created_date)}
                                </div>
                              )}
                              {project.end_date && (
                                <div>
                                  <span className="font-medium">End Date:</span> {formatDate(project.end_date)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {searchQuery ? "No projects match your search" : "No projects found"}
                  </p>
                  {!searchQuery && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use the sync buttons above to import projects from Excel or Zoho
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ModernLayout>
    </ProtectedRoute>
  );
}