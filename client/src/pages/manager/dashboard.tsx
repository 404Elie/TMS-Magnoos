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
                    {statsLoading ? "..." : stats?.pendingRequests || 0}
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
          <Card className="relative overflow-hidden border-none shadow-2xl col-span-1 lg:col-span-1 h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#111827]"></div>
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 400 200" className="w-full h-full">
                <path d="M0,100 Q100,50 200,80 T400,100 L400,200 L0,200 Z" fill="url(#waveGradient1)" />
                <path d="M0,120 Q150,70 300,90 T400,120 L400,200 L0,200 Z" fill="url(#waveGradient2)" />
                <defs>
                  <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                  </linearGradient>
                  <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <CardContent className="relative p-6 h-full flex flex-col justify-between text-white">
              <div>
                <h3 className="text-xl font-bold mb-2">Active Operations</h3>
                <p className="text-white/80 text-sm">
                  {statsLoading ? "Loading..." : `${stats?.totalRequests || 0} Travelers • ${stats?.pendingApprovals || 0} Pending`}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-all">
                  View Details
                </button>
                <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-900 hover:bg-white/90 transition-all">
                  Manage
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Budget */}
          <Card className="relative overflow-hidden border-none shadow-2xl h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <CardContent className="relative p-6 h-full flex flex-col justify-between text-white">
              <div>
                <h3 className="text-4xl font-bold">
                  ${statsLoading ? "..." : "75,400"}
                </h3>
                <p className="text-white/90 text-sm mt-1">Monthly Budget Used</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-all flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget Details
                </button>
                <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-900 hover:bg-white/90 transition-all">
                  Reports
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Approval Efficiency */}
          <Card className="relative overflow-hidden border-none shadow-2xl h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#111827]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
            <div className="absolute top-4 right-4 w-16 h-16 opacity-30">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polyline points="20,60 30,45 40,55 50,35 60,45 70,25 80,30" fill="none" stroke="#3b82f6" strokeWidth="3"/>
                <circle cx="80" cy="30" r="3" fill="#3b82f6"/>
                <circle cx="70" cy="25" r="2" fill="#8b5cf6"/>
                <circle cx="60" cy="45" r="2" fill="#6366f1"/>
              </svg>
            </div>
            <CardContent className="relative p-6 h-full flex flex-col justify-between text-white">
              <div>
                <h3 className="text-4xl font-bold">
                  {statsLoading ? "..." : "94%"}
                </h3>
                <p className="text-white/90 text-sm mt-1">Approval Efficiency</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Processing Time */}
          <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {statsLoading ? "..." : "2.3"}
                </div>
                <div className="text-white/80 text-sm">Avg. Days Processing</div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Efficiency */}
          <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {statsLoading ? "..." : "87%"}
                </div>
                <div className="text-white/80 text-sm">Budget Efficiency</div>
              </div>
            </CardContent>
          </Card>

          {/* Operations Status */}
          <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#111827] text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
            <CardContent className="relative p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">System Status</span>
                </div>
                <div className="text-xl font-bold">
                  {statsLoading ? "..." : `${(parseInt(stats?.approvedMonth || "0") / parseInt(stats?.totalRequests || "1") * 100).toFixed(0)}%`}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white/20 rounded"></div>
                  <span className="text-xs text-white/70">Operations KSA</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white/20 rounded"></div>
                  <span className="text-xs text-white/70">Operations UAE</span>
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
  );
}