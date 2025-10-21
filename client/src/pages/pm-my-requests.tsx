import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import ModernLayout from "@/components/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PlusCircle } from "lucide-react";
import type { TravelRequestWithDetails, User } from "@shared/schema";
import { format } from "date-fns";
import { formatDestinations } from "@/lib/destinationUtils";

export default function PMMyRequests() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;

  // Fetch travel requests (only user's own requests for PM role)
  const { data: allRequests, isLoading: requestsLoading } = useQuery<TravelRequestWithDetails[]>({
    queryKey: ["/api/travel-requests"],
    retry: false,
  });

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pending Approval</Badge>;
      case "pm_approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "pm_rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case "operations_completed":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <ModernLayout currentRole="manager">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              My Travel Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              View and track the status of your submitted travel requests
            </p>
          </div>
          
          {/* My Requests List */}
          <div className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Loading your requests...</p>
              </div>
            ) : allRequests && allRequests.length > 0 ? (
              allRequests.map((request) => (
                <Card key={request.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {request.traveler?.firstName} {request.traveler?.lastName} - {formatDestinations(request)}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {request.purpose} • {format(new Date(request.departureDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Project: {request.project?.name || 'No project assigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ${(Number(request.estimatedFlightCost || 0) + Number(request.estimatedHotelCost || 0) + Number(request.estimatedOtherCost || 0)).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total Estimated
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">No requests found</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You haven't submitted any travel requests yet.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ModernLayout>
    </ProtectedRoute>
  );
}