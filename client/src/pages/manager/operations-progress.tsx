import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModernLayout from "@/components/ModernLayout";
import { 
  Globe2, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  DollarSign,
  BarChart3,
  Target
} from "lucide-react";

interface OperationsStats {
  activeBookings: number;
  completedThisMonth: number;
  pendingTasks: number;
  completionRate: number;
  monthlySpend: number;
  avgProcessingDays: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OperationsProgress() {
  // Fetch operations stats
  const { data: operationsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mock data for KSA and UAE operations stats
  const ksaStats: OperationsStats = {
    activeBookings: 8,
    completedThisMonth: 24,
    pendingTasks: 3,
    completionRate: 96,
    monthlySpend: 42500,
    avgProcessingDays: 2.1
  };

  const uaeStats: OperationsStats = {
    activeBookings: 12,
    completedThisMonth: 31,
    pendingTasks: 5,
    completionRate: 89,
    monthlySpend: 57800,
    avgProcessingDays: 2.8
  };

  return (
    <ModernLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-blue-600" />
            Operations Progress Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitor KSA and UAE operations teams performance and progress
          </p>
        </div>

        {/* Combined Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Active</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : ksaStats.activeBookings + uaeStats.activeBookings}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-[#2563eb]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#16a34a] via-[#22c55e] to-[#15803d] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Completed</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : ksaStats.completedThisMonth + uaeStats.completedThisMonth}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <CheckCircle className="w-6 h-6 text-[#16a34a]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#111827] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Pending Tasks</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : ksaStats.pendingTasks + uaeStats.pendingTasks}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Spend</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? "..." : formatCurrency(ksaStats.monthlySpend + uaeStats.monthlySpend)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <DollarSign className="w-6 h-6 text-[#0ea5e9]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* KSA Operations */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span>Operations KSA</span>
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">
                    Excellent
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Bookings</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{ksaStats.activeBookings}</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{ksaStats.completedThisMonth}</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{ksaStats.completionRate}%</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Processing</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{ksaStats.avgProcessingDays}d</p>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Spend</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(ksaStats.monthlySpend)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* Status Indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">System Status</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Pending Tasks</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{ksaStats.pendingTasks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UAE Operations */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-orange-200 dark:border-orange-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <span>Operations UAE</span>
                  <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                    Good
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Bookings</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{uaeStats.activeBookings}</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{uaeStats.completedThisMonth}</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{uaeStats.completionRate}%</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Processing</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{uaeStats.avgProcessingDays}d</p>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Spend</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(uaeStats.monthlySpend)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              {/* Status Indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">System Status</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Pending Tasks</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{uaeStats.pendingTasks}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparative Analytics */}
        <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] opacity-95"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <CardContent className="relative p-6 text-white">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-[#2563eb]" />
              </div>
              <h3 className="text-xl font-bold text-white">Performance Comparison</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <h4 className="font-semibold text-white mb-4">Efficiency Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/90">KSA Processing Speed</span>
                    <span className="text-sm font-medium text-green-300">{ksaStats.avgProcessingDays}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/90">UAE Processing Speed</span>
                    <span className="text-sm font-medium text-orange-300">{uaeStats.avgProcessingDays}d</span>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">Best Performer</span>
                      <span className="text-sm font-bold text-cyan-300">KSA</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <h4 className="font-semibold text-white mb-4">Success Rates</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/90">KSA Success Rate</span>
                    <span className="text-sm font-medium text-green-300">{ksaStats.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/90">UAE Success Rate</span>
                    <span className="text-sm font-medium text-orange-300">{uaeStats.completionRate}%</span>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">Difference</span>
                      <span className="text-sm font-bold text-cyan-300">+{ksaStats.completionRate - uaeStats.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <h4 className="font-semibold text-white mb-4">Cost Efficiency</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/90">KSA Monthly Cost</span>
                    <span className="text-sm font-medium text-cyan-300">{formatCurrency(ksaStats.monthlySpend)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/90">UAE Monthly Cost</span>
                    <span className="text-sm font-medium text-orange-300">{formatCurrency(uaeStats.monthlySpend)}</span>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">Total Combined</span>
                      <span className="text-sm font-bold text-purple-300">{formatCurrency(ksaStats.monthlySpend + uaeStats.monthlySpend)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
}