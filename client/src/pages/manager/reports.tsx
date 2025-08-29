import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ModernLayout from "@/components/ModernLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileText, TrendingUp, Users, MapPin, DollarSign, BarChart3, Filter } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

export default function Reports() {
  const [dateRange, setDateRange] = useState("6m");
  const [reportType, setReportType] = useState("overview");

  // Fetch reports data
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["/api/reports", { range: dateRange, type: reportType }],
  });

  // Mock data for demonstration
  const travelTrends = [
    { month: 'Jan', requests: 12, completed: 10, cost: 28500 },
    { month: 'Feb', requests: 18, completed: 15, cost: 42300 },
    { month: 'Mar', requests: 15, completed: 14, cost: 35200 },
    { month: 'Apr', requests: 22, completed: 20, cost: 55800 },
    { month: 'May', requests: 19, completed: 17, cost: 48900 },
    { month: 'Jun', requests: 25, completed: 23, cost: 65400 },
  ];

  const topDestinations = [
    { destination: 'Dubai, UAE', trips: 45, cost: 125000 },
    { destination: 'Riyadh, KSA', trips: 38, cost: 98000 },
    { destination: 'London, UK', trips: 22, cost: 85000 },
    { destination: 'New York, USA', trips: 18, cost: 95000 },
    { destination: 'Paris, France', trips: 15, cost: 62000 },
  ];

  const topTravelers = [
    { name: 'Ahmed Al-Rashid', trips: 12, cost: 32000, department: 'Sales' },
    { name: 'Sarah Johnson', trips: 10, cost: 28500, department: 'Engineering' },
    { name: 'Mohammed Hassan', trips: 9, cost: 25800, department: 'Operations' },
    { name: 'Lisa Chen', trips: 8, cost: 24200, department: 'Marketing' },
    { name: 'Omar Al-Farisi', trips: 7, cost: 19500, department: 'Sales' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    // Mock export functionality
    console.log(`Exporting report as ${format}`);
  };

  return (
    <ModernLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              Travel Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Comprehensive travel analytics and reporting dashboard
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => exportReport('excel')}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => exportReport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Time Period
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">Last Month</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Report Type
                </label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="travel_patterns">Travel Patterns</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Department
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Trips</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">149</p>
                  <p className="text-sm text-green-600">+12% vs last period</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Spend</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(376200)}
                  </p>
                  <p className="text-sm text-green-600">-5% vs budget</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Trip Cost</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(2524)}
                  </p>
                  <p className="text-sm text-red-600">+3% vs last period</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Travelers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">42</p>
                  <p className="text-sm text-green-600">+8% vs last period</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Travel Trends */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Travel Trends</CardTitle>
              <CardDescription>Monthly travel requests and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={travelTrends}>
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
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#0032FF" 
                      strokeWidth={3}
                      name="Requests"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#00D9C0" 
                      strokeWidth={3}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Destinations */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top Destinations</CardTitle>
              <CardDescription>Most visited destinations by trip count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDestinations.map((dest, index) => (
                  <div key={dest.destination} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {dest.destination}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {dest.trips} trips
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(dest.cost)}
                      </p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Travelers */}
        <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Top Travelers
            </CardTitle>
            <CardDescription>Most frequent travelers and their spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Traveler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trips
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg. Cost/Trip
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-border">
                  {topTravelers.map((traveler, index) => (
                    <tr key={traveler.name} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {traveler.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {traveler.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{traveler.department}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {traveler.trips}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(traveler.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {formatCurrency(traveler.cost / traveler.trips)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
}