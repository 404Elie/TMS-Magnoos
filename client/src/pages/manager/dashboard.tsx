import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModernLayout from "@/components/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Plane, Clock, Check, Flag, TrendingUp, Users, DollarSign, Calendar, BarChart3, PieChart, TrendingDown } from "lucide-react";
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

        {/* Main Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Spending */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Spending</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Track monthly travel expenditures</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-64 bg-gradient-to-t from-blue-500/20 to-blue-600/5 rounded-lg flex items-end justify-between px-4 pb-4 relative overflow-hidden">
                {/* Chart background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-blue-50/30 dark:from-blue-900/20 dark:to-blue-800/10"></div>
                
                {/* Month bars */}
                <div className="relative flex items-end gap-4 h-full w-full justify-around pt-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-16 w-8 bg-blue-400 rounded-t"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Jan</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-24 w-8 bg-blue-500 rounded-t"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Feb</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-8 bg-blue-500 rounded-t"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Mar</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-28 w-8 bg-blue-600 rounded-t"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Apr</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-22 w-8 bg-blue-500 rounded-t"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">May</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-32 w-8 bg-blue-600 rounded-t"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Jun</span>
                  </div>
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-2 top-4 flex flex-col justify-between h-48 text-xs text-gray-500 dark:text-gray-400">
                  <span>$20,000</span>
                  <span>$15,000</span>
                  <span>$10,000</span>
                  <span>$5,000</span>
                  <span>$0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Purpose Breakdown */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Travel Purpose Breakdown</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Distribution of travel purposes</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex items-center justify-center h-64 relative">
                {/* Pie chart circle */}
                <div className="w-48 h-48 rounded-full relative overflow-hidden" style={{
                  background: `conic-gradient(
                    #3b82f6 0deg 162deg,
                    #8b5cf6 162deg 252deg,
                    #10b981 252deg 324deg,
                    #84cc16 324deg 360deg
                  )`
                }}>
                  <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">100%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="absolute right-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Sales Visits: 45%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Delivery: 25%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Events: 20%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-lime-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Other: 10%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Spending */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Department Spending</CardTitle>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Travel spending breakdown by department</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-600 dark:text-gray-400">Loading department spending...</div>
                </div>
              ) : stats?.departmentSpending && stats.departmentSpending.length > 0 ? (
                stats.departmentSpending.map((dept: { department: string; total: number; percentage: number }, index: number) => {
                  // Define colors for each department
                  const colors = [
                    { bg: "bg-blue-50 dark:bg-blue-900/20", dot: "bg-blue-500" },
                    { bg: "bg-purple-50 dark:bg-purple-900/20", dot: "bg-purple-500" },
                    { bg: "bg-green-50 dark:bg-green-900/20", dot: "bg-green-500" },
                    { bg: "bg-lime-50 dark:bg-lime-900/20", dot: "bg-lime-500" },
                    { bg: "bg-orange-50 dark:bg-orange-900/20", dot: "bg-orange-500" },
                    { bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500" },
                  ];
                  const colorSet = colors[index % colors.length];
                  
                  return (
                    <div key={dept.department} className={`flex items-center justify-between p-4 ${colorSet.bg} rounded-lg`} data-testid={`department-${dept.department.toLowerCase().replace(/\s+/g, '-')}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 ${colorSet.dot} rounded-full`}></div>
                        <span className="font-medium text-gray-900 dark:text-white">{dept.department}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white" data-testid={`amount-${dept.department.toLowerCase().replace(/\s+/g, '-')}`}>
                          ${dept.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400" data-testid={`percentage-${dept.department.toLowerCase().replace(/\s+/g, '-')}`}>
                          {dept.percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8" data-testid="empty-department-spending">
                  <div className="text-gray-600 dark:text-gray-400 mb-2">No department spending data available</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">Complete some travel requests to see analytics</div>
                  <div className="text-xs text-gray-400 dark:text-gray-600 mt-2">Analytics will show once operations teams complete bookings with actual costs</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avg. Trip Cost */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg. Trip Cost</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">$2,850.00</div>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Travelers */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Travelers</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">24</div>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Variance */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Budget Variance</div>
                  <div className="text-3xl font-bold text-green-600">-8.2%</div>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                  <TrendingDown className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernLayout>
    </ProtectedRoute>
  );
}