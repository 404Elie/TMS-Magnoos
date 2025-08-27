import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Only show admin panel to admin@magnoos.com
  if (!user || user.email !== 'admin@magnoos.com') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Access denied. This page is restricted to administrators only.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handleDeleteAllTestData = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000); // Reset after 5 seconds
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiRequest("DELETE", "/api/admin/cleanup-test-data");
      const result = await response.json();
      
      toast({
        title: "✅ Test Data Deleted",
        description: `Deleted ${result.deleted.travelRequests} travel requests and ${result.deleted.bookings} bookings`,
        className: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
      });
      
      setConfirmDelete(false);
    } catch (error) {
      toast({
        title: "❌ Delete Failed",
        description: "Failed to delete test data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administrator tools for testing and maintenance
          </p>
        </div>

        {/* Admin Info */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Database className="h-4 w-4" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Logged in as: <strong>{user.email}</strong> | Role: <strong>Administrator</strong>
          </AlertDescription>
        </Alert>

        {/* Test Data Management */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Trash2 className="h-5 w-5" />
              Test Data Cleanup
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Delete all travel requests and bookings for testing purposes. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-300 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Warning:</strong> This will permanently delete ALL travel requests and bookings in the system. 
                Only use this for testing before deployment.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDeleteAllTestData}
                disabled={isDeleting}
                variant={confirmDelete ? "destructive" : "outline"}
                className={`flex-1 ${
                  confirmDelete 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                }`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting 
                  ? "Deleting..." 
                  : confirmDelete 
                    ? "Click Again to Confirm Delete" 
                    : "Delete All Test Data"
                }
              </Button>
              
              {confirmDelete && (
                <Button
                  onClick={() => setConfirmDelete(false)}
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              )}
            </div>
            
            {confirmDelete && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ⚠️ Click "Delete All Test Data" again within 5 seconds to confirm
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
            <CardDescription>
              How to use the admin panel for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Before Deployment:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• Test all travel request workflows completely</li>
                <li>• Create sample bookings and verify operations dashboard</li>
                <li>• Use the delete function to clean up all test data</li>
                <li>• Deploy with a clean database</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Security Notes:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• Only admin@magnoos.com can access this panel</li>
                <li>• Delete functions require double confirmation</li>
                <li>• All admin actions are logged to the console</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}