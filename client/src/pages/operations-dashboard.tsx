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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  DollarSign, 
  PiggyBank, 
  CheckSquare, 
  TrendingUp, 
  Plane, 
  Bed, 
  MapPin,
  Users,
  BarChart3,
  AlertTriangle,
  Plus
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import type { TravelRequestWithDetails, Booking, BudgetTracking, UserWithBudget, ProjectWithBudget } from "@shared/schema";

export default function OperationsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequestWithDetails | null>(null);
  const [bookingEntries, setBookingEntries] = useState([{
    type: "",
    provider: "",
    bookingReference: "",
    cost: "",
    perDiemRate: "",
    details: "",
  }]);
  const [newBooking, setNewBooking] = useState({
    type: "",
    provider: "",
    bookingReference: "",
    cost: "",
    perDiemRate: "",
    details: "",
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Fetch travel requests for operations (approved requests)
  const { data: requests, isLoading: requestsLoading } = useQuery<TravelRequestWithDetails[]>({
    queryKey: ["/api/travel-requests"],
    retry: false,
  });



  // Fetch all bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  // Fetch budget tracking data
  const { data: budgetData, isLoading: budgetLoading } = useQuery<BudgetTracking[]>({
    queryKey: ["/api/budget-tracking"],
    retry: false,
  });

  // Fetch users for budget tracking
  const { data: users } = useQuery({
    queryKey: ["/api/zoho/users"],
    retry: false,
  });

  // Fetch projects for budget tracking
  const { data: projects } = useQuery({
    queryKey: ["/api/zoho/projects"],
    retry: false,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking created successfully!",
      });
      setNewBooking({
        type: "",
        provider: "",
        bookingReference: "",
        cost: "",
        perDiemRate: "",
        details: "",
      });
      setSelectedRequestId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete travel request mutation (enhanced with bookings)
  const completeRequestMutation = useMutation({
    mutationFn: async ({ requestId, bookings }: { requestId: string; bookings: typeof bookingEntries }) => {
      // First create all the bookings
      for (const booking of bookings) {
        if (booking.type && booking.cost) {
          await apiRequest("POST", "/api/bookings", {
            requestId,
            type: booking.type,
            provider: booking.provider || null,
            bookingReference: booking.bookingReference || null,
            cost: booking.cost,
            details: booking.details || null
          });
        }
      }
      
      // Calculate total cost from all bookings
      const totalCost = bookings.reduce((sum, booking) => {
        return sum + (booking.cost ? parseFloat(booking.cost) : 0);
      }, 0);
      
      // Then complete the request
      return await apiRequest("POST", `/api/travel-requests/${requestId}/complete`, { totalCost });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Travel request completed with bookings!",
      });
      setCompletionModalOpen(false);
      setSelectedRequest(null);
      setBookingEntries([{ type: "", provider: "", bookingReference: "", cost: "", perDiemRate: "", details: "" }]);
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to complete request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBooking = () => {
    if (selectedRequestId && newBooking.type && newBooking.cost) {
      createBookingMutation.mutate({
        requestId: selectedRequestId,
        type: newBooking.type,
        provider: newBooking.provider,
        bookingReference: newBooking.bookingReference,
        cost: parseFloat(newBooking.cost),
        details: newBooking.details ? JSON.parse(newBooking.details) : null,
      });
    }
  };

  const handleCompleteRequest = (request: TravelRequestWithDetails) => {
    setSelectedRequest(request);
    setCompletionModalOpen(true);
  };

  const handleCompleteWithBookings = () => {
    if (selectedRequest) {
      completeRequestMutation.mutate({ 
        requestId: selectedRequest.id, 
        bookings: bookingEntries.filter(booking => booking.type && booking.cost)
      });
    }
  };

  const addBookingEntry = () => {
    setBookingEntries([...bookingEntries, { type: "", provider: "", bookingReference: "", cost: "", perDiemRate: "", details: "" }]);
  };

  const updateBookingEntry = (index: number, field: string, value: string) => {
    const updated = [...bookingEntries];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total cost for per diem bookings
    if (updated[index].type === 'per_diem' && selectedRequest) {
      if (field === 'perDiemRate' || (field === 'type' && value === 'per_diem')) {
        const perDiemRate = parseFloat(field === 'perDiemRate' ? value : updated[index].perDiemRate);
        if (perDiemRate > 0) {
          const departureDate = new Date(selectedRequest.departureDate);
          const returnDate = new Date(selectedRequest.returnDate);
          const timeDifference = returnDate.getTime() - departureDate.getTime();
          const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
          const totalCost = perDiemRate * daysDifference;
          updated[index].cost = totalCost.toFixed(2);
        }
      }
    }
    
    setBookingEntries(updated);
  };

  const removeBookingEntry = (index: number) => {
    if (bookingEntries.length > 1) {
      setBookingEntries(bookingEntries.filter((_, i) => i !== index));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTravelStatusBadge = (status: string) => {
    switch (status) {
      case "pm_approved":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Booking in Progress</Badge>;
      case "operations_completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  // Filter requests that operations needs to handle
  const operationsRequests = requests?.filter(req => 
    req.status === 'pm_approved' || req.status === 'operations_completed'
  ) || [];

  // Debug logging removed after issue resolution

  // Calculate user budget summaries
  const userBudgetSummaries = users?.map(user => {
    const userRequests = requests?.filter(req => req.travelerId === user.id) || [];
    const totalSpent = userRequests.reduce((sum, req) => {
      return sum + (parseFloat(req.actualTotalCost || "0"));
    }, 0);
    const annualBudget = parseFloat(user.annualTravelBudget || "15000");
    const utilization = (totalSpent / annualBudget) * 100;
    const tripCount = userRequests.length;

    return {
      ...user,
      totalSpent,
      annualBudget,
      remaining: annualBudget - totalSpent,
      utilization,
      tripCount,
    };
  }) || [];

  // Calculate project budget summaries
  const projectBudgetSummaries = projects?.map(project => {
    // Filter for completed travel requests that have actual costs
    // Try both direct ID matching and zohoProjectId matching
    const projectRequests = requests?.filter(req => {
      const projectIdMatch = String(req.projectId) === String(project.id);
      const zohoIdMatch = String(req.projectId) === String(project.zohoProjectId);
      return (projectIdMatch || zohoIdMatch) && 
             req.status === 'operations_completed' && 
             req.actualTotalCost && 
             parseFloat(req.actualTotalCost) > 0;
    }) || [];
    
    const totalSpent = projectRequests.reduce((sum, req) => {
      return sum + (parseFloat(req.actualTotalCost || "0"));
    }, 0);
    const allocatedBudget = parseFloat(project.travelBudget || "50000");
    const utilization = (totalSpent / allocatedBudget) * 100;
    const tripCount = projectRequests.length;
    const avgCostPerTrip = tripCount > 0 ? totalSpent / tripCount : 0;

    return {
      ...project,
      totalSpent,
      allocatedBudget,
      remaining: allocatedBudget - totalSpent,
      utilization,
      tripCount,
      avgCostPerTrip,
    };
  }) || [];

  // Chart data preparation functions
  const prepareMonthlyTrendData = () => {
    if (!bookings || !bookings.length) {
      // Return sample months with zero data for better UX
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(month => ({ month, amount: 0 }));
    }

    const monthlyData: { [key: string]: number } = {};
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + booking.cost;
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .slice(0, 6); // Show last 6 months
  };

  const prepareExpenseBreakdownData = () => {
    if (!bookings || !bookings.length) {
      // Return sample data for better UX
      return [
        { name: 'Flights', value: 0, color: '#0032FF' },
        { name: 'Hotels', value: 0, color: '#FF6F00' },
        { name: 'Other', value: 0, color: '#1ABC3C' }
      ];
    }

    const typeData: { [key: string]: number } = {};
    bookings.forEach(booking => {
      const type = booking.type.charAt(0).toUpperCase() + booking.type.slice(1) + 's';
      typeData[type] = (typeData[type] || 0) + booking.cost;
    });

    const colors = ['#0032FF', '#FF6F00', '#1ABC3C', '#8A2BE2', '#FF6F61'];
    return Object.entries(typeData)
      .map(([name, value], index) => ({ 
        name, 
        value, 
        color: colors[index % colors.length] 
      }));
  };

  const prepareProjectBudgetData = () => {
    if (!projectBudgetSummaries || !projectBudgetSummaries.length) {
      return [
        { name: 'No Projects', value: 0, color: '#374151' }
      ];
    }

    const colors = ['#0032FF', '#FF6F00', '#1ABC3C', '#8A2BE2', '#FF6F61', '#00D9C0', '#A3E635'];
    return projectBudgetSummaries
      .filter(project => project.totalSpent > 0)
      .slice(0, 7)
      .map((project, index) => ({
        name: project.name?.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
        value: project.totalSpent,
        color: colors[index % colors.length]
      }));
  };

  const prepareProjectSpendingData = () => {
    if (!projectBudgetSummaries || !projectBudgetSummaries.length) {
      return [];
    }

    return projectBudgetSummaries
      .filter(project => project.totalSpent > 0)
      .slice(0, 10)
      .map(project => ({
        name: project.name?.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        spent: project.totalSpent,
        trips: project.tripCount
      }));
  };

  return (
    <ProtectedRoute allowedRoles={["operations"]}>
      <div className="min-h-screen dark:bg-background light:bg-transparent operations-dashboard">
        <Header currentRole="operations" />
        
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 dark:bg-background light:bg-transparent">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full futuristic-tabs">
            <TabsList className="grid w-full grid-cols-4 bg-muted border border-border backdrop-blur-md pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <TabsTrigger 
                value="dashboard" 
                className="custom-tab"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="bookings"
                className="custom-tab"
              >
                Active Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="budget-person"
                className="custom-tab"
              >
                Budget by Person
              </TabsTrigger>
              <TabsTrigger 
                value="budget-project"
                className="custom-tab"
              >
                Budget by Project
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 dark:bg-background light:bg-transparent">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Bookings - Electric Blue to Purple Gradient */}
                <Card className="relative overflow-hidden border-none shadow-2xl gradient-card group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] opacity-90"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Active Bookings</p>
                        <p className="text-3xl font-bold text-white mt-1 transition-all duration-300">
                          {statsLoading ? (
                            <span className="shimmer inline-block w-16 h-8 bg-white/20 rounded"></span>
                          ) : stats?.activeBookings || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                        <Calendar className="w-6 h-6 text-[#0032FF] transition-transform duration-300 hover:scale-110" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Monthly Spend - Teal to Lime Gradient */}
                <Card className="relative overflow-hidden border-none shadow-2xl gradient-card group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1ABC3C] to-[#A6E05A] opacity-90"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Monthly Spend</p>
                        <p className="text-3xl font-bold text-white mt-1 transition-all duration-300">
                          {statsLoading ? (
                            <span className="shimmer inline-block w-20 h-8 bg-white/20 rounded"></span>
                          ) : formatCurrency(stats?.monthlySpend || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                        <DollarSign className="w-6 h-6 text-[#1ABC3C] transition-transform duration-300 hover:scale-110" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Pending Tasks - Orange to Coral Gradient */}
                <Card className="relative overflow-hidden border-none shadow-2xl gradient-card group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6F00] to-[#FF6F61] opacity-90"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Pending Tasks</p>
                        <p className="text-3xl font-bold text-white mt-1 transition-all duration-300">
                          {statsLoading ? (
                            <span className="shimmer inline-block w-16 h-8 bg-white/20 rounded"></span>
                          ) : stats?.pendingTasks || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                        <CheckSquare className="w-6 h-6 text-[#FF6F00] transition-transform duration-300 hover:scale-110" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Beautiful Charts with Magnoos Colors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#00D9C0]" />
                      Monthly Expense Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={prepareMonthlyTrendData()}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00D9C0" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#A3E635" stopOpacity={0.3}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-slate-600" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            className="fill-gray-700 dark:fill-white"
                            tick={{ fontSize: 12, fontWeight: 600 }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            className="fill-gray-700 dark:fill-white"
                            tick={{ fontSize: 12, fontWeight: 600 }}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#111827',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#00D9C0" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#0032FF]" />
                      Expense Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareExpenseBreakdownData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => value > 0 ? `${name}: $${value.toLocaleString()}` : ''}
                            labelStyle={{ fill: 'currentColor', fontSize: 12, fontWeight: 600 }}
                            className="text-gray-900 dark:text-white"
                          >
                            {prepareExpenseBreakdownData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#111827',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                          />
                          <Legend 
                            wrapperStyle={{ fontWeight: 600 }}
                            className="text-gray-900 dark:text-white"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Recent Booking Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-magnoos-blue mx-auto"></div>
                    </div>
                  ) : bookings && bookings.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-slate-800 space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            {booking.type === 'flight' ? (
                              <Plane className="w-4 h-4 text-white" />
                            ) : booking.type === 'hotel' ? (
                              <Bed className="w-4 h-4 text-white" />
                            ) : (
                              <MapPin className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} booking
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {booking.provider} • {formatCurrency(booking.cost)} • {booking.bookingReference}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">No recent booking activities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-8 dark:bg-background light:bg-transparent">
              <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Active Travel Bookings</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">Manage bookings for approved travel requests</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-magnoos-blue hover:bg-slate-800-blue">
                        <Plus className="w-4 h-4 mr-2" />
                        New Booking
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Booking</DialogTitle>
                        <DialogDescription>
                          Add a new booking for an approved travel request
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-gray-50 dark:bg-slate-800 space-y-4">
                        <div>
                          <Label htmlFor="request-select">Travel Request</Label>
                          <Select onValueChange={setSelectedRequestId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select travel request..." />
                            </SelectTrigger>
                            <SelectContent>
                              {operationsRequests
                                ?.filter(req => req.status === 'pm_approved')
                                .map((request) => (
                                <SelectItem key={request.id} value={request.id}>
                                  {request.traveler.firstName} {request.traveler.lastName} - {request.destination}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="booking-type">Booking Type</Label>
                          <Select onValueChange={(value) => setNewBooking({...newBooking, type: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select booking type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flight">Flight</SelectItem>
                              <SelectItem value="hotel">Hotel</SelectItem>
                              <SelectItem value="car_rental">Car Rental</SelectItem>
                              <SelectItem value="per_diem">Per Diem</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="provider">Provider</Label>
                          <Input
                            id="provider"
                            value={newBooking.provider}
                            onChange={(e) => setNewBooking({...newBooking, provider: e.target.value})}
                            placeholder="Airline, hotel, etc."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="reference">Booking Reference</Label>
                          <Input
                            id="reference"
                            value={newBooking.bookingReference}
                            onChange={(e) => setNewBooking({...newBooking, bookingReference: e.target.value})}
                            placeholder="Confirmation number"
                          />
                        </div>
                        
                        {newBooking.type === 'per_diem' ? (
                          <>
                            <div>
                              <Label htmlFor="per-diem-rate">Per Diem Rate ($/day)</Label>
                              <Input
                                id="per-diem-rate"
                                type="number"
                                step="0.01"
                                value={newBooking.perDiemRate}
                                onChange={(e) => {
                                  const rate = e.target.value;
                                  setNewBooking({...newBooking, perDiemRate: rate});
                                  
                                  // Auto-calculate total if we have a selected request and rate
                                  if (selectedRequestId && parseFloat(rate) > 0) {
                                    const selectedReq = operationsRequests?.find(req => req.id === selectedRequestId);
                                    if (selectedReq) {
                                      const departureDate = new Date(selectedReq.departureDate);
                                      const returnDate = new Date(selectedReq.returnDate);
                                      const timeDifference = returnDate.getTime() - departureDate.getTime();
                                      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
                                      const totalCost = parseFloat(rate) * daysDifference;
                                      setNewBooking(prev => ({...prev, cost: totalCost.toFixed(2)}));
                                    }
                                  }
                                }}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cost">
                                Total Cost ({selectedRequestId && operationsRequests ? 
                                  Math.ceil((new Date(operationsRequests.find(req => req.id === selectedRequestId)?.returnDate || 0).getTime() - 
                                           new Date(operationsRequests.find(req => req.id === selectedRequestId)?.departureDate || 0).getTime()) / (1000 * 3600 * 24)) : 0} days)
                              </Label>
                              <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                value={newBooking.cost}
                                onChange={(e) => setNewBooking({...newBooking, cost: e.target.value})}
                                placeholder="0.00"
                                readOnly={newBooking.type === 'per_diem'}
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <Label htmlFor="cost">Cost</Label>
                            <Input
                              id="cost"
                              type="number"
                              step="0.01"
                              value={newBooking.cost}
                              onChange={(e) => setNewBooking({...newBooking, cost: e.target.value})}
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setNewBooking({
                              type: "",
                              provider: "",
                              bookingReference: "",
                              cost: "",
                              perDiemRate: "",
                              details: "",
                            });
                            setSelectedRequestId(null);
                          }}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateBooking}
                            disabled={!selectedRequestId || !newBooking.type || !newBooking.cost || createBookingMutation.isPending}
                            className="bg-magnoos-blue hover:bg-slate-800-blue"
                          >
                            {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magnoos-blue mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300">Loading travel requests...</p>
                    </div>
                  ) : operationsRequests.length > 0 ? (
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
                              Total Cost
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {operationsRequests.map((request) => {
                            const totalEstimated = (
                              parseFloat(request.estimatedFlightCost || "0") +
                              parseFloat(request.estimatedHotelCost || "0") +
                              parseFloat(request.estimatedOtherCost || "0")
                            );
                            const actualCost = parseFloat(request.actualTotalCost || "0");
                            
                            return (
                              <tr key={request.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="w-8 h-8 mr-3">
                                      <AvatarImage src={request.traveler?.profileImageUrl} />
                                      <AvatarFallback className="bg-magnoos-blue text-white text-xs">
                                        {getInitials(
                                          request.traveler?.firstName, 
                                          request.traveler?.lastName
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                      {request.traveler?.firstName && request.traveler?.lastName 
                                        ? `${request.traveler.firstName} ${request.traveler.lastName}` 
                                        : request.traveler?.email || 'Unknown User'}
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {actualCost > 0 ? formatCurrency(actualCost) : formatCurrency(totalEstimated)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getTravelStatusBadge(request.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {request.status === 'pm_approved' ? (
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleCompleteRequest(request)}
                                        disabled={completeRequestMutation.isPending}
                                        className="bg-green-100 text-green-800 hover:bg-green-200"
                                      >
                                        Complete
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-magnoos-blue hover:text-magnoos-dark-blue"
                                      onClick={() => {
                                        setSelectedRequest(request);
                                        setCompletionModalOpen(true);
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">No travel requests to process</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">Approved requests will appear here for booking</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget-person" className="space-y-8 dark:bg-background light:bg-transparent">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Travel Expense Tracking by Person</h2>
                <p className="text-gray-600 dark:text-gray-300">Monitor individual travel expenses and spending patterns</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Summary Cards */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Top Spenders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userBudgetSummaries.length > 0 ? (
                        <div className="bg-gray-50 dark:bg-slate-800 space-y-3">
                          {userBudgetSummaries
                            .sort((a, b) => b.totalSpent - a.totalSpent)
                            .slice(0, 5)
                            .map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user.profileImageUrl} />
                                  <AvatarFallback className="bg-magnoos-blue text-white text-xs">
                                    {getInitials(user.firstName, user.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.firstName} {user.lastName}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatCurrency(user.totalSpent)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-300 text-center py-4">No spending data available</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-slate-800 space-y-3">
                        {userBudgetSummaries
                          .filter(user => user.totalSpent > 0)
                          .sort((a, b) => b.totalSpent - a.totalSpent)
                          .slice(0, 3)
                          .map((user) => (
                          <div key={user.id} className="p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              Latest expense: {formatCurrency(user.totalSpent)}
                            </p>
                          </div>
                        ))}
                        {userBudgetSummaries.filter(user => user.totalSpent > 0).length === 0 && (
                          <p className="text-gray-500 dark:text-gray-300 text-center py-4">No recent activity</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Budget Table */}
                <div className="lg:col-span-2">
                  <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Individual Expense Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userBudgetSummaries.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-slate-800">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Total Spent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Trips
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                              {userBudgetSummaries.map((user) => (
                                <tr key={user.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <Avatar className="w-8 h-8 mr-3">
                                        <AvatarImage src={user.profileImageUrl} />
                                        <AvatarFallback className="bg-magnoos-blue text-white text-xs">
                                          {getInitials(user.firstName, user.lastName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                        {user.firstName} {user.lastName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                    {formatCurrency(user.totalSpent)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {user.tripCount}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-300">No expense data available</p>
                          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">Expense information will appear once travel requests are processed</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget-project" className="space-y-8 dark:bg-background light:bg-transparent">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Expense Tracking</h2>
                <p className="text-gray-600 dark:text-gray-300">Monitor project-based travel expenses and spending patterns</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Project Expense Distribution Chart */}
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Project Expense Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareProjectBudgetData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => value > 0 ? `${name}: $${value.toLocaleString()}` : ''}
                          >
                            {prepareProjectBudgetData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#111827'
                            }}
                            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                          />
                          <Legend 
                            wrapperStyle={{ fontWeight: 600 }}
                            className="text-gray-900 dark:text-white"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Project Spending Chart */}
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Project Spending Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={prepareProjectSpendingData()}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-slate-600" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            className="fill-gray-700 dark:fill-gray-300"
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            className="fill-gray-700 dark:fill-gray-300"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#111827'
                            }}
                            formatter={(value: any, name: string) => {
                              if (name === 'spent') return [`$${value.toLocaleString()}`, 'Total Spent'];
                              if (name === 'trips') return [value, 'Trips'];
                              return [value, name];
                            }}
                          />
                          <Bar 
                            dataKey="spent" 
                            fill="#0032FF" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Project Budget Table */}
              <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Project Expense Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {projectBudgetSummaries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-slate-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Total Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Total Trips
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Avg Cost/Trip
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {projectBudgetSummaries.map((project, index) => (
                            <tr key={`project-${project.id}-${index}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{project.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{project.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                {formatCurrency(project.totalSpent)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {project.tripCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {formatCurrency(project.avgCostPerTrip)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">No project expense data available</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">Expense information will appear once travel requests are processed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Completion Modal with Multiple Bookings */}
        <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Complete Travel Request</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Add booking details for {selectedRequest?.traveler?.firstName} {selectedRequest?.traveler?.lastName}'s trip to {selectedRequest?.destination}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Travel Request Summary */}
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trip Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Destination:</span> {selectedRequest?.destination}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Dates:</span> {selectedRequest && new Date(selectedRequest.departureDate).toLocaleDateString()} - {selectedRequest && new Date(selectedRequest.returnDate).toLocaleDateString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Project:</span> {selectedRequest?.project?.name || 'N/A'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Purpose:</span> {selectedRequest?.purpose}
                  </div>
                </div>
              </div>

              {/* Booking Entries */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-white">Booking Details</h3>
                  <Button
                    onClick={addBookingEntry}
                    size="sm"
                    className="bg-magnoos-blue hover:bg-magnoos-dark-blue text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Booking
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {bookingEntries.map((booking, index) => (
                    <div key={index} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-white">Booking {index + 1}</h4>
                        {bookingEntries.length > 1 && (
                          <Button
                            onClick={() => removeBookingEntry(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`type-${index}`} className="text-gray-300">Type</Label>
                          <Select 
                            value={booking.type} 
                            onValueChange={(value) => updateBookingEntry(index, 'type', value)}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select booking type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="accommodation">Accommodation</SelectItem>
                              <SelectItem value="car_rental">Car Rental</SelectItem>
                              <SelectItem value="per_diem">Per Diem</SelectItem>
                              <SelectItem value="ticket">Ticket</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {booking.type === 'per_diem' ? (
                          <>
                            <div>
                              <Label htmlFor={`rate-${index}`} className="text-gray-300">Per Diem Rate ($/day)</Label>
                              <Input
                                id={`rate-${index}`}
                                type="number"
                                step="0.01"
                                value={booking.perDiemRate}
                                onChange={(e) => updateBookingEntry(index, 'perDiemRate', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`cost-${index}`} className="text-gray-300">
                                Total Cost (${selectedRequest ? Math.ceil((new Date(selectedRequest.returnDate).getTime() - new Date(selectedRequest.departureDate).getTime()) / (1000 * 3600 * 24)) : 0} days)
                              </Label>
                              <Input
                                id={`cost-${index}`}
                                type="number"
                                step="0.01"
                                value={booking.cost}
                                onChange={(e) => updateBookingEntry(index, 'cost', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="0.00"
                                readOnly={booking.type === 'per_diem'}
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <Label htmlFor={`cost-${index}`} className="text-gray-300">Cost ($)</Label>
                            <Input
                              id={`cost-${index}`}
                              type="number"
                              step="0.01"
                              value={booking.cost}
                              onChange={(e) => updateBookingEntry(index, 'cost', e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor={`provider-${index}`} className="text-gray-300">Provider</Label>
                          <Input
                            id={`provider-${index}`}
                            value={booking.provider}
                            onChange={(e) => updateBookingEntry(index, 'provider', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="e.g., Hotel Name, Airline"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`reference-${index}`} className="text-gray-300">Reference</Label>
                          <Input
                            id={`reference-${index}`}
                            value={booking.bookingReference}
                            onChange={(e) => updateBookingEntry(index, 'bookingReference', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="Booking reference/confirmation"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label htmlFor={`details-${index}`} className="text-gray-300">Details</Label>
                          <Input
                            id={`details-${index}`}
                            value={booking.details}
                            onChange={(e) => updateBookingEntry(index, 'details', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="Additional details"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Cost Summary */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Total Cost:</span>
                  <span className="text-xl font-bold text-white">
                    ${bookingEntries.reduce((sum, booking) => sum + (parseFloat(booking.cost) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={() => setCompletionModalOpen(false)}
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteWithBookings}
                  disabled={completeRequestMutation.isPending || bookingEntries.every(b => !b.type || !b.cost)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {completeRequestMutation.isPending ? "Completing..." : "Complete Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
