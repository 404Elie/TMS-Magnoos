import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModernLayout from "@/components/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Plane, Clock, Check, Flag, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import type { User } from "@shared/schema";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch recent requests for preview
  const { data: requests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/travel-requests"],
  });

  return (
    <ProtectedRoute allowedRoles={["pm"]}>
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Requests</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.totalRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Plane className="w-6 h-6 text-[#2563eb]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#8b5cf6] to-[#6d28d9] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Pending Approvals</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.pendingApprovals || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-[#7c3aed]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved This Month */}
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#111827] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Approved</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.approvedRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Check className="w-6 h-6 text-[#16a34a]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Completed</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : stats?.completedRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Flag className="w-6 h-6 text-[#0ea5e9]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hero Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Operations Hub */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg col-span-1 lg:col-span-1 h-48">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Active Operations</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {statsLoading ? "Loading..." : `${stats?.totalRequests || 0} Travelers • ${stats?.pendingApprovals || 0} Pending`}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">
                  View Details
                </button>
                <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-all">
                  Manage
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Budget */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg h-48">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${statsLoading ? "..." : "75,400"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Monthly Budget Used</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget Details
                </button>
                <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-all">
                  Reports
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Approval Efficiency */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg h-48">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : "94%"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Approval Efficiency</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Processing Time */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                  {statsLoading ? "..." : "2.3"}
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">Avg. Days Processing</div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Efficiency */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                  {statsLoading ? "..." : "87%"}
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">Budget Efficiency</div>
              </div>
            </CardContent>
          </Card>

          {/* Operations Status */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900 dark:text-white">System Status</span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : `${(parseInt(stats?.approvedMonth || "0") / parseInt(stats?.totalRequests || "1") * 100).toFixed(0)}%`}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-slate-600 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Operations KSA</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-slate-600 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Operations UAE</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Analytics */}
          <div className="space-y-4">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200 dark:border-slate-600">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Team Performance</h4>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {statsLoading ? "..." : stats?.approvedMonth || "0"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">This Month Approvals</div>
                <div className="mt-3 h-8 bg-gray-100 dark:bg-slate-700 rounded flex items-center">
                  <div className="flex space-x-1 px-2">
                    <div className="w-1 h-4 bg-blue-400 rounded"></div>
                    <div className="w-1 h-3 bg-blue-300 rounded"></div>
                    <div className="w-1 h-5 bg-blue-500 rounded"></div>
                    <div className="w-1 h-2 bg-blue-200 rounded"></div>
                    <div className="w-1 h-4 bg-blue-400 rounded"></div>
                    <div className="w-1 h-3 bg-blue-300 rounded"></div>
                    <div className="w-1 h-6 bg-blue-600 rounded"></div>
                    <div className="w-1 h-2 bg-blue-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200 dark:border-slate-600">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Team Activity</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Operations KSA</span>
                    <span className="text-sm font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Operations UAE</span>
                    <span className="text-sm font-medium text-green-600">Good</span>
                  </div>
                </div>
                <button className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-all">
                  View Reports
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ModernLayout>
    </ProtectedRoute>
  );
}