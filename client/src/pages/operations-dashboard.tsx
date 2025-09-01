import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import ModernLayout from "@/components/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  Plus,
  X,
  FileText,
  Search,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Eye
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
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Determine which tab to show based on URL or default
  const getActiveView = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveView());
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

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
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

  // Fetch users for budget tracking
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/zoho/users"],
    retry: false,
  });

  // Fetch projects for budget tracking
  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/zoho/projects"],
    retry: false,
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

  const getTravelStatusBadge = (status: string) => {
    switch (status) {
      case "pm_approved":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Booking in Progress</Badge>;
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

  // Handle different tab views
  if (activeTab === "bookings") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole="operations">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Active Bookings
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage and track active travel bookings for approved requests
              </p>
            </div>
            
            <div className="grid gap-6">
              {requestsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Loading bookings...</p>
                </div>
              ) : operationsRequests && operationsRequests.length > 0 ? (
                operationsRequests.map((request) => (
                  <Card key={request.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.traveler?.firstName} {request.traveler?.lastName} - {request.destination}
                            </h3>
                            {getTravelStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {request.purpose} • Departure: {new Date(request.departureDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteRequest(request)}
                            disabled={request.status === 'operations_completed'}
                            data-testid={`complete-request-${request.id}`}
                          >
                            {request.status === 'operations_completed' ? 'Completed' : 'Complete Booking'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-300">No approved requests waiting for bookings</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  if (activeTab === "documents") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole="operations">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Document Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage employee passports and visas
              </p>
            </div>
            
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Document Management</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Manage employee passports and visas for travel requirements
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </CardContent>
            </Card>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  if (activeTab === "budget-person") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole="operations">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Budget by Person
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track individual employee travel spending and budget utilization
              </p>
            </div>
            
            <div className="grid gap-4">
              {userBudgetSummaries.map(user => (
                <Card key={user.id} className="bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(user.totalSpent)} / {formatCurrency(user.annualBudget)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {user.utilization.toFixed(1)}% utilized
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={user.utilization} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  if (activeTab === "budget-project") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole="operations">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Budget by Project
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track project-based travel spending and budget allocation
              </p>
            </div>
            
            <div className="grid gap-4">
              {projectBudgetSummaries.map(project => (
                <Card key={project.id} className="bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{project.tripCount} trips</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(project.totalSpent)} / {formatCurrency(project.allocatedBudget)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {project.utilization.toFixed(1)}% utilized
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={project.utilization} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  // Handle requests tab
  if (activeTab === "requests") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole="operations">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-blue-600" />
                Travel Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                View and manage approved travel requests that need operations handling
              </p>
            </div>
            
            <div className="space-y-4">
              {requestsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Loading requests...</p>
                </div>
              ) : operationsRequests && operationsRequests.length > 0 ? (
                operationsRequests.map((request) => (
                  <Card key={request.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.traveler?.firstName} {request.traveler?.lastName} - {request.destination}
                            </h3>
                            {getTravelStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {request.purpose} • {new Date(request.departureDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Project: {request.project?.name || 'No project assigned'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ${(Number(request.estimatedFlightCost || 0) + Number(request.estimatedHotelCost || 0) + Number(request.estimatedOtherCost || 0)).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-300">No requests assigned to operations</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  // Handle employees tab
  if (activeTab === "employees") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole="operations">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Employee Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage employee travel documents, profiles, and travel history
              </p>
            </div>
            
            <div className="grid gap-6">
              {users?.map((user) => (
                <Card key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Role: {user.role}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Budget: ${user.annualTravelBudget || '15,000'}
                        </p>
                        <Button size="sm" variant="outline" className="mt-2">
                          View Documents
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  // Handle budget tab (general budget overview)
  if (activeTab === "budget") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole="operations">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-blue-600" />
                Budget Overview
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Complete budget tracking for employees and projects
              </p>
            </div>
            
            {/* Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Employee Budgets</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Track individual employee travel spending and budget utilization
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/operations-dashboard?tab=budget-person">
                      View Employee Budgets
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Project Budgets</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Track project-based travel spending and budget allocation
                  </p>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/operations-dashboard?tab=budget-project">
                      View Project Budgets
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Total Monthly Spend</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatCurrency(stats?.monthlySpend || 0)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Budget Remaining</h4>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(stats?.budgetRemaining || 0)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Active Projects</h4>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {projects?.length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
      <ModernLayout currentRole="operations">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Operations Dashboard - {(user as any)?.activeRole === 'operations_ksa' ? 'KSA' : 'UAE'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage travel bookings, track expenses, and handle document processing for approved requests
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Active Bookings */}
            <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] opacity-95"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Active Bookings</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : stats?.activeBookings || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#2563eb]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly Spend */}
            <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#8b5cf6] to-[#6d28d9] opacity-95"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Monthly Spend</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : formatCurrency(stats?.monthlySpend || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#7c3aed]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Pending Tasks */}
            <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#dc2626] via-[#ef4444] to-[#b91c1c] opacity-95"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Pending Tasks</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : stats?.pendingTasks || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-[#dc2626]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Completion Rate */}
            <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#111827] opacity-95"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Completion Rate</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : `${stats?.completionRate || '95'}%`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-[#10b981]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recent Approved Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : operationsRequests && operationsRequests.length > 0 ? (
                  <div className="space-y-3">
                    {operationsRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {request.traveler?.firstName} {request.traveler?.lastName} - {request.destination}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {request.purpose} • Departure: {new Date(request.departureDate).toLocaleDateString()}
                            </p>
                          </div>
                          {getTravelStatusBadge(request.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-300">No approved requests waiting for bookings</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/operations-dashboard?tab=bookings">
                    <Bed className="w-4 h-4 mr-2" />
                    Manage Bookings
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700" asChild>
                  <Link href="/operations-dashboard?tab=documents">
                    <FileText className="w-4 h-4 mr-2" />
                    Document Management
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/operations-dashboard?tab=budget-person">
                    <Users className="w-4 h-4 mr-2" />
                    Budget by Person
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700" asChild>
                  <Link href="/operations-dashboard?tab=budget-project">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Budget by Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Complete Request Modal */}
        <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
          <DialogContent className="max-w-4xl bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Complete Travel Request</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Add booking details to complete the travel request for {selectedRequest?.traveler?.firstName} {selectedRequest?.traveler?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {bookingEntries.map((booking, index) => (
                <Card key={index} className="bg-gray-50 dark:bg-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Booking #{index + 1}</h4>
                      {bookingEntries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBookingEntry(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-900 dark:text-white">Type</Label>
                        <Select
                          value={booking.type}
                          onValueChange={(value) => updateBookingEntry(index, 'type', value)}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Select booking type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800">
                            <SelectItem value="flight">Flight</SelectItem>
                            <SelectItem value="hotel">Hotel</SelectItem>
                            <SelectItem value="car_rental">Car Rental</SelectItem>
                            <SelectItem value="per_diem">Per Diem</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-900 dark:text-white">Provider</Label>
                        <Input
                          value={booking.provider}
                          onChange={(e) => updateBookingEntry(index, 'provider', e.target.value)}
                          placeholder="e.g., Emirates, Hilton"
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-900 dark:text-white">Booking Reference</Label>
                        <Input
                          value={booking.bookingReference}
                          onChange={(e) => updateBookingEntry(index, 'bookingReference', e.target.value)}
                          placeholder="Confirmation number"
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-900 dark:text-white">Cost ($)</Label>
                        <Input
                          type="number"
                          value={booking.cost}
                          onChange={(e) => updateBookingEntry(index, 'cost', e.target.value)}
                          placeholder="0.00"
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      {booking.type === 'per_diem' && (
                        <div>
                          <Label className="text-gray-900 dark:text-white">Per Diem Rate ($/day)</Label>
                          <Input
                            type="number"
                            value={booking.perDiemRate}
                            onChange={(e) => updateBookingEntry(index, 'perDiemRate', e.target.value)}
                            placeholder="Daily allowance"
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <Label className="text-gray-900 dark:text-white">Details</Label>
                        <Textarea
                          value={booking.details}
                          onChange={(e) => updateBookingEntry(index, 'details', e.target.value)}
                          placeholder="Additional booking details..."
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={addBookingEntry} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Booking
                </Button>
                <Button 
                  onClick={handleCompleteWithBookings}
                  disabled={completeRequestMutation.isPending || !bookingEntries.some(b => b.type && b.cost)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {completeRequestMutation.isPending ? "Completing..." : "Complete Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </ModernLayout>
    </ProtectedRoute>
  );
}