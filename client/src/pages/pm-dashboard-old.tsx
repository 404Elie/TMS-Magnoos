import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Check, TrendingUp, BarChart3, Users, Calendar, AlertTriangle } from "lucide-react";
import type { TravelRequestWithDetails } from "@shared/schema";

export default function PMDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");


  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Fetch travel requests
  const { data: allRequests, isLoading: requestsLoading } = useQuery<TravelRequestWithDetails[]>({
    queryKey: ["/api/travel-requests"],
    retry: false,
  });



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case "pm_approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "pm_rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "operations_completed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };



  // Calculate project analytics
  const projectAnalytics = allRequests?.reduce((acc, request) => {
    const projectName = request.project?.name || 'Unknown';
    if (!acc[projectName]) {
      acc[projectName] = {
        total: 0,
        approved: 0,
        pending: 0,
        completed: 0,
      };
    }
    acc[projectName].total++;
    if (request.status === 'pm_approved') acc[projectName].approved++;
    if (request.status === 'submitted') acc[projectName].pending++;
    if (request.status === 'operations_completed') acc[projectName].completed++;
    return acc;
  }, {} as Record<string, any>) || {};

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <div className="min-h-screen dark:bg-magnoos-dark light:bg-transparent pm-dashboard">
        <Header currentRole="manager" />
        
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 dark:bg-magnoos-dark light:bg-transparent">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full futuristic-tabs">
            <TabsList className="grid w-full grid-cols-2 bg-muted border border-border backdrop-blur-md pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <TabsTrigger 
                value="dashboard"
                className="custom-tab"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="submit"
                className="custom-tab"
              >
                Submit Request
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 dark:bg-magnoos-dark light:bg-transparent">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-[#FF6F00] to-[#FF6F61] border-[#FF6F00] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">My Requests</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : (stats as any)?.pendingApprovals || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <Clock className="w-7 h-7 text-[#FF6F00]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[#1ABC3C] to-[#A6E05A] border-[#1ABC3C] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">Submitted This Month</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : (stats as any)?.approvedMonth || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <Check className="w-7 h-7 text-[#1ABC3C]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] border-[#0032FF] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">Active Projects</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : (stats as any)?.activeProjects || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <BarChart3 className="w-7 h-7 text-[#0032FF]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[#00D9C0] to-[#A3E635] border-[#00D9C0] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">Avg Response Time</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : (stats as any)?.avgApprovalTime || "N/A"}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <Calendar className="w-7 h-7 text-[#00D9C0]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">My Recent Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-magnoos-blue mx-auto"></div>
                      </div>
                    ) : allRequests && allRequests.length > 0 ? (
                      <div className="bg-gray-50 dark:bg-magnoos-dark space-y-3">
                        {allRequests.slice(0, 3).map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-[#464646]">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {request.destination}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {request.project?.name} • {getStatusBadge(request.status)}
                              </p>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => setActiveTab("submit")}
                              className="text-magnoos-blue hover:text-magnoos-dark-blue"
                              variant="ghost"
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-300 mb-3">No travel requests yet</p>
                        <Button onClick={() => setActiveTab("submit")} size="sm">
                          Submit First Request
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Project Travel Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-magnoos-dark space-y-3">
                      {Object.entries(projectAnalytics).slice(0, 3).map(([projectName, data]) => (
                        <div key={projectName} className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">{projectName}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{data.total} trips</span>
                        </div>
                      ))}
                      {Object.keys(projectAnalytics).length === 0 && (
                        <p className="text-gray-500 dark:text-gray-300 text-center py-4">No travel data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-8 dark:bg-magnoos-dark light:bg-transparent">
              <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Pending Travel Request Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magnoos-blue mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300">Loading pending requests...</p>
                    </div>
                  ) : pendingRequests && pendingRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-slate-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Traveler
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Destination
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Dates
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Est. Cost
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {pendingRequests.map((request) => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="w-8 h-8 mr-3">
                                    <AvatarImage src={request.traveler.profileImageUrl || undefined} />
                                    <AvatarFallback className="bg-magnoos-blue text-white text-xs">
                                      {getInitials(request.traveler.firstName, request.traveler.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {request.traveler.firstName} {request.traveler.lastName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                {request.destination}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {request.project?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {new Date(request.departureDate).toLocaleDateString()} - {new Date(request.returnDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                {formatCurrency(
                                  (parseFloat(request.estimatedFlightCost || "0") +
                                   parseFloat(request.estimatedHotelCost || "0") +
                                   parseFloat(request.estimatedOtherCost || "0"))
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={approveMutation.isPending}
                                    className="bg-green-100 text-green-800 hover:bg-green-200"
                                  >
                                    Approve
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedRequestId(request.id)}
                                        className="bg-red-100 text-red-800 hover:bg-red-200"
                                      >
                                        Reject
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-slate-700">
                                      <DialogHeader>
                                        <DialogTitle className="text-gray-900 dark:text-white">Reject Travel Request</DialogTitle>
                                        <DialogDescription className="text-gray-600 dark:text-gray-300">
                                          Please provide a reason for rejecting this travel request.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="bg-white dark:bg-magnoos-dark space-y-4">
                                        <div>
                                          <Label htmlFor="rejection-reason" className="text-gray-900 dark:text-white">Rejection Reason</Label>
                                          <Textarea
                                            id="rejection-reason"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Enter reason for rejection..."
                                            rows={4}
                                            className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                                          />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <Button variant="outline" onClick={() => {
                                            setRejectionReason("");
                                            setSelectedRequestId(null);
                                          }}>
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={handleReject}
                                            disabled={!rejectionReason.trim() || rejectMutation.isPending}
                                            variant="destructive"
                                          >
                                            {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">No pending approvals</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">All travel requests have been processed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8 dark:bg-magnoos-dark light:bg-transparent">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Travel Requests by Project Chart Placeholder */}
                <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Travel Requests by Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-300">Project Analytics Chart</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Chart visualization would be implemented here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Approval Timeline Placeholder */}
                <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Approval Timeline Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-300">Timeline Analytics Chart</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Chart visualization would be implemented here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Project Details Table */}
              <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Project Travel Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magnoos-blue mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300">Loading project analytics...</p>
                    </div>
                  ) : Object.keys(projectAnalytics).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-slate-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Total Requests
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Approved
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Pending
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Completed
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(projectAnalytics).map(([projectName, data]) => (
                            <tr key={projectName}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                                {projectName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {data.total}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                {data.approved}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                                {data.pending}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                                {data.completed}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">No project data available</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">Analytics will appear once travel requests are submitted</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
