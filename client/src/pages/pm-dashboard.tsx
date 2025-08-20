import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Check, TrendingUp } from "lucide-react";
import type { TravelRequestWithDetails } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PMDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Fetch travel requests (only user's own requests for PM role)
  const { data: allRequests, isLoading: requestsLoading } = useQuery<TravelRequestWithDetails[]>({
    queryKey: ["/api/travel-requests"],
    retry: false,
  });

  // Helper function to get status badge
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
                          {statsLoading ? "..." : allRequests?.length || 0}
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
                        <p className="text-sm font-medium text-white/90">Approved</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : allRequests?.filter(r => r.status === 'pm_approved').length || 0}
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
                        <p className="text-sm font-medium text-white/90">Pending</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : allRequests?.filter(r => r.status === 'submitted').length || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <TrendingUp className="w-7 h-7 text-[#0032FF]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[#00D9C0] to-[#A3E635] border-[#00D9C0] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">Completed</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : allRequests?.filter(r => r.status === 'operations_completed').length || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <Check className="w-7 h-7 text-[#00D9C0]" />
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

            <TabsContent value="submit" className="space-y-8 dark:bg-magnoos-dark light:bg-transparent">
              <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Submit Travel Request</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Fill out the details for your travel request
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-300">Submit Request form will be available here.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This form allows Project Managers to submit travel requests for approval.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}