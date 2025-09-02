import { useQuery } from "@tanstack/react-query";
import ModernLayout from "@/components/ModernLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, BarChart3, PieChart } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from "recharts";

export default function Budget() {
  // Fetch budget data
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ["/api/budget/overview"],
  });

  // Fetch travel requests for budget analysis
  const { data: requests } = useQuery({
    queryKey: ["/api/travel-requests"],
  });

  // Mock data for demonstration
  const monthlySpendingData = [
    { month: 'Jan', amount: 12500, budget: 15000 },
    { month: 'Feb', amount: 18200, budget: 15000 },
    { month: 'Mar', amount: 14800, budget: 15000 },
    { month: 'Apr', amount: 16500, budget: 15000 },
    { month: 'May', amount: 13200, budget: 15000 },
    { month: 'Jun', amount: 19800, budget: 15000 },
  ];

  const departmentSpending = [
    { department: 'Sales', amount: 45200, color: '#0032FF' },
    { department: 'Engineering', amount: 32100, color: '#8A2BE2' },
    { department: 'Marketing', amount: 28900, color: '#00D9C0' },
    { department: 'Operations', amount: 15600, color: '#A3E635' },
  ];

  const purposeBreakdown = [
    { name: 'Sales Visits', value: 45, color: '#0032FF' },
    { name: 'Delivery', value: 25, color: '#8A2BE2' },
    { name: 'Events', value: 20, color: '#00D9C0' },
    { name: 'Other', value: 10, color: '#A3E635' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <ModernLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            Budget Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitor travel spending, budget allocation, and financial analytics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Budget</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(180000)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <DollarSign className="w-6 h-6 text-[#2563eb]" />
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
                  <p className="text-sm font-medium text-white/90">Spent This Year</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(94600)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-[#0ea5e9]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#8b5cf6] to-[#6d28d9] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Remaining</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(85400)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <TrendingDown className="w-6 h-6 text-[#7c3aed]" />
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
                  <p className="text-sm font-medium text-white/90">Budget Used</p>
                  <p className="text-2xl font-bold text-white mt-1">52.6%</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <PieChart className="w-6 h-6 text-[#16a34a]" />
                </div>
              </div>
              <Progress value={52.6} className="mt-3" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Spending Trend */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Monthly Spending vs Budget
              </CardTitle>
              <CardDescription>Track spending against monthly budget limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySpendingData}>
                    <defs>
                      <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0032FF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0032FF" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-slate-600" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      className="fill-gray-700 dark:fill-white"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      className="fill-gray-700 dark:fill-white"
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#0032FF" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSpending)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="budget" 
                      stroke="#ff0000" 
                      strokeWidth={2}
                      strokeDasharray="5,5"
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Purpose Breakdown */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Travel Purpose Breakdown
              </CardTitle>
              <CardDescription>Distribution of travel purposes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={purposeBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {purposeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Spending */}
        <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Department Spending
            </CardTitle>
            <CardDescription>Travel spending breakdown by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {departmentSpending.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: dept.color }}
                    ></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {dept.department}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(dept.amount)}
                    </span>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {((dept.amount / 121800) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Trip Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(2850)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Travelers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Budget Variance</p>
                  <p className="text-2xl font-bold text-green-600">-8.2%</p>
                </div>
                <TrendingDown className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernLayout>
  );
}