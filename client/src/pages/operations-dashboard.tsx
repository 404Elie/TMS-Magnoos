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
import type { TravelRequestWithDetails, Booking, BudgetTracking, UserWithBudget, ProjectWithBudget } from "@shared/schema";

export default function OperationsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [newBooking, setNewBooking] = useState({
    type: "",
    provider: "",
    bookingReference: "",
    cost: "",
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

  // Complete travel request mutation
  const completeRequestMutation = useMutation({
    mutationFn: async ({ requestId, totalCost }: { requestId: string; totalCost: number }) => {
      return await apiRequest("POST", `/api/travel-requests/${requestId}/complete`, { totalCost });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Travel request completed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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

  const handleCompleteRequest = (requestId: string, totalCost: number) => {
    completeRequestMutation.mutate({ requestId, totalCost });
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
    const projectRequests = requests?.filter(req => req.projectId === project.id) || [];
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

  return (
    <ProtectedRoute allowedRoles={["operations"]}>
      <div className="min-h-screen bg-magnoos-dark">
        <Header currentRole="operations" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-magnoos-dark">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full futuristic-tabs">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border border-magnoos-dark backdrop-blur-md">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
              <TabsTrigger value="budget-person">Budget by Person</TabsTrigger>
              <TabsTrigger value="budget-project">Budget by Project</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="bg-magnoos-dark space-y-8 bg-magnoos-dark"bg-magnoos-dark >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Active Bookings</p>
                        <p className="text-2xl font-bold text-magnoos-primary">
                          {statsLoading ? "..." : stats?.activeBookings || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-magnoos-primary/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-magnoos-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Monthly Spend</p>
                        <p className="text-2xl font-bold text-white">
                          {statsLoading ? "..." : formatCurrency(stats?.monthlySpend || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Budget Remaining</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {statsLoading ? "..." : formatCurrency(stats?.budgetRemaining || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                        <PiggyBank className="w-6 h-6 text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Pending Tasks</p>
                        <p className="text-2xl font-bold text-red-400">
                          {statsLoading ? "..." : stats?.pendingTasks || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <CheckSquare className="w-6 h-6 text-red-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Cost Savings</p>
                        <p className="text-2xl font-bold text-green-400">
                          {statsLoading ? "..." : formatCurrency(stats?.costSavings || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Budget Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Monthly Budget Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-magnoos-dark rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-magnoos-primary mx-auto mb-2" />
                        <p className="text-white">Monthly Budget Chart</p>
                        <p className="text-xs text-gray-400">Chart visualization would be implemented here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-magnoos-dark rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-magnoos-secondary mx-auto mb-2" />
                        <p className="text-white">Expense Breakdown Chart</p>
                        <p className="text-xs text-gray-400">Chart visualization would be implemented here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-magnoos-dark border-magnoos-dark">
                <CardHeader>
                  <CardTitle className="text-white">Recent Booking Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-magnoos-blue mx-auto"></div>
                    </div>
                  ) : bookings && bookings.length > 0 ? (
                    <div className="bg-magnoos-dark space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
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
                            <p className="font-medium text-white">
                              {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} booking
                            </p>
                            <p className="text-sm text-gray-400">
                              {booking.provider} • {formatCurrency(booking.cost)} • {booking.bookingReference}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No recent booking activities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="bg-magnoos-dark space-y-8"bg-magnoos-dark >
              <Card className="bg-magnoos-dark border-magnoos-dark">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Active Travel Bookings</CardTitle>
                    <CardDescription>Manage bookings for approved travel requests</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-magnoos-blue hover:bg-magnoos-dark-blue">
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
                      <div className="bg-magnoos-dark space-y-4">
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
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setNewBooking({
                              type: "",
                              provider: "",
                              bookingReference: "",
                              cost: "",
                              details: "",
                            });
                            setSelectedRequestId(null);
                          }}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateBooking}
                            disabled={!selectedRequestId || !newBooking.type || !newBooking.cost || createBookingMutation.isPending}
                            className="bg-magnoos-blue hover:bg-magnoos-dark-blue"
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
                      <p className="text-gray-400">Loading travel requests...</p>
                    </div>
                  ) : operationsRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Traveler
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Destination
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Dates
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Total Cost
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
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
                                      <AvatarImage src={request.traveler.profileImageUrl} />
                                      <AvatarFallback className="bg-magnoos-blue text-white text-xs">
                                        {getInitials(request.traveler.firstName, request.traveler.lastName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-white">
                                      {request.traveler.firstName} {request.traveler.lastName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                  {request.destination}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                  {request.project?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                  {new Date(request.departureDate).toLocaleDateString()} - {new Date(request.returnDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
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
                                        onClick={() => handleCompleteRequest(request.id, totalEstimated)}
                                        disabled={completeRequestMutation.isPending}
                                        className="bg-green-100 text-green-800 hover:bg-green-200"
                                      >
                                        Complete
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="ghost" className="text-magnoos-blue hover:text-magnoos-dark-blue">
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
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400">No travel requests to process</p>
                      <p className="text-sm text-gray-400 mt-2">Approved requests will appear here for booking</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget-person" className="bg-magnoos-dark space-y-8"bg-magnoos-dark >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Budget Tracking by Person</h2>
                <p className="text-gray-400">Monitor individual travel expenses and budget allocations</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Summary Cards */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="bg-magnoos-dark border-magnoos-dark">
                    <CardHeader>
                      <CardTitle className="text-white">Top Spenders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userBudgetSummaries.length > 0 ? (
                        <div className="bg-magnoos-dark space-y-3">
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
                                <span className="text-sm font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-white">
                                {formatCurrency(user.totalSpent)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-4">No spending data available</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-magnoos-dark border-magnoos-dark">
                    <CardHeader>
                      <CardTitle className="text-white">Budget Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-magnoos-dark space-y-3">
                        {userBudgetSummaries
                          .filter(user => user.utilization > 80)
                          .map((user) => (
                          <div key={user.id} className={`p-3 border rounded-lg ${
                            user.utilization > 95 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <p className={`text-sm font-medium ${
                              user.utilization > 95 ? 'text-red-800' : 'text-yellow-800'
                            }`}>
                              {user.firstName} {user.lastName}
                            </p>
                            <p className={`text-xs ${
                              user.utilization > 95 ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {Math.round(user.utilization)}% of annual budget used
                            </p>
                          </div>
                        ))}
                        {userBudgetSummaries.filter(user => user.utilization > 80).length === 0 && (
                          <p className="text-gray-400 text-center py-4">No budget alerts</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Budget Table */}
                <div className="lg:col-span-2">
                  <Card className="bg-magnoos-dark border-magnoos-dark">
                    <CardHeader>
                      <CardTitle className="text-white">Individual Budget Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userBudgetSummaries.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Annual Budget
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Spent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Remaining
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Utilization
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Trips
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
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
                                      <span className="text-sm font-medium text-white">
                                        {user.firstName} {user.lastName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {formatCurrency(user.annualBudget)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {formatCurrency(user.totalSpent)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {formatCurrency(user.remaining)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            user.utilization > 90 ? 'bg-red-600' :
                                            user.utilization > 70 ? 'bg-yellow-600' : 'bg-blue-600'
                                          }`}
                                          style={{ width: `${Math.min(user.utilization, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm text-gray-400">
                                        {Math.round(user.utilization)}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {user.tripCount}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400">No budget data available</p>
                          <p className="text-sm text-gray-400 mt-2">Budget information will appear once travel requests are processed</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget-project" className="bg-magnoos-dark space-y-8"bg-magnoos-dark >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Budget Tracking by Project</h2>
                <p className="text-gray-400">Monitor project-based travel expenses and allocations</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Project Budget Chart Placeholder */}
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Project Budget Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-magnoos-dark rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">Project Budget Chart</p>
                        <p className="text-xs text-gray-400">Chart visualization would be implemented here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Budget vs Actual Placeholder */}
                <Card className="bg-magnoos-dark border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Budget vs Actual Spending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-magnoos-dark rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">Budget vs Actual Chart</p>
                        <p className="text-xs text-gray-400">Chart visualization would be implemented here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Project Budget Table */}
              <Card className="bg-magnoos-dark border-magnoos-dark">
                <CardHeader>
                  <CardTitle className="text-white">Project Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {projectBudgetSummaries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Allocated Budget
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Remaining
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Utilization
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Total Trips
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Avg Cost/Trip
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projectBudgetSummaries.map((project) => (
                            <tr key={project.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">{project.name}</div>
                                <div className="text-sm text-gray-400">{project.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {formatCurrency(project.allocatedBudget)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {formatCurrency(project.totalSpent)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {formatCurrency(project.remaining)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        project.utilization > 90 ? 'bg-red-600' :
                                        project.utilization > 70 ? 'bg-yellow-600' : 'bg-blue-600'
                                      }`}
                                      style={{ width: `${Math.min(project.utilization, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-400">
                                    {Math.round(project.utilization)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {project.tripCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {formatCurrency(project.avgCostPerTrip)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400">No project budget data available</p>
                      <p className="text-sm text-gray-400 mt-2">Budget information will appear once travel requests are processed</p>
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
