import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModernLayout from "@/components/ModernLayout";
import { Plane, Clock, Check, Flag, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import type { User } from "@shared/schema";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch recent requests for preview
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/travel-requests"],
  });

  return (
    <ModernLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Business Unit Manager Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Overview of travel requests, approvals, and team analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Requests */}
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Requests</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.totalRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Plane className="w-6 h-6 text-[#0032FF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Pending Approvals</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.pendingRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-[#0032FF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved This Month */}
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Approved</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.approvedRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Check className="w-6 h-6 text-[#0032FF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Completed</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.completedRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Flag className="w-6 h-6 text-[#0032FF]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Quick Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Active Travelers</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {statsLoading ? "..." : "12"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">This Month Budget</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${statsLoading ? "..." : "45,200"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Avg. Processing Time</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {statsLoading ? "..." : "2.3 days"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="w-5 h-5 text-green-600" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Operations KSA</span>
                  <span className="font-semibold text-green-600">Excellent</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Operations UAE</span>
                  <span className="font-semibold text-green-600">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Approval Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">94%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5 text-purple-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : requests && requests.length > 0 ? (
                  requests.slice(0, 3).map((request: any) => (
                    <div key={request.id} className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.traveler?.firstName} {request.traveler?.lastName}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {request.destination} • {request.status}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernLayout>
  );
}