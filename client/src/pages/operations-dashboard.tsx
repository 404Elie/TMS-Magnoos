import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation, useSearch } from "wouter";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDestinations } from "@/lib/destinationUtils";
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
  Eye,
  RefreshCw
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
import type { TravelRequestWithDetails, Booking, BudgetTracking, UserWithBudget, ProjectWithBudget, InsertEmployeeDocument } from "@shared/schema";

// Document Form Component
function DocumentForm({ documentType, selectedEmployeeId, onClose }: { documentType: 'passport' | 'visa' | null, selectedEmployeeId: string | null, onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  
  type DocumentFormData = {
    userId: string;
    documentType: 'passport' | 'visa';
    documentNumber: string;
    issuingCountry: string;
    issueDate: string;
    expiryDate: string;
    notes?: string;
  };
  
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(z.object({
      userId: z.string().min(1, "Employee is required"),
      documentType: z.enum(["passport", "visa"]),
      documentNumber: z.string().min(1, "Document number is required"),
      issuingCountry: z.string().min(1, "Issuing country is required"),
      issueDate: z.string().min(1, "Issue date is required"),
      expiryDate: z.string().min(1, "Expiry date is required"),
      notes: z.string().optional(),
    })),
    defaultValues: {
      documentType: documentType || 'passport',
      userId: selectedEmployeeId || '', // Auto-select employee if viewing specific employee
      documentNumber: '',
      issuingCountry: '',
      issueDate: '',
      expiryDate: '',
      notes: '',
    }
  });

  // Fetch users for dropdown
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/zoho/users"],
    retry: false,
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const response = await fetch('/api/employee-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${documentType === 'passport' ? 'Passport' : 'Visa'} document added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error(`Error adding ${documentType}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to add ${documentType} document`,
      });
    },
  });

  const onSubmit = (data: DocumentFormData) => {
    addDocumentMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee</FormLabel>
              <FormControl>
                <Popover open={isEmployeeDropdownOpen} onOpenChange={setIsEmployeeDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={!!selectedEmployeeId} // Disable when viewing specific employee
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? (() => {
                            const selectedUser = users?.find((user) => user.id === field.value);
                            return selectedUser 
                              ? `${selectedUser.firstName} ${selectedUser.lastName}${selectedEmployeeId ? " (auto-selected)" : ""}` 
                              : "Select employee...";
                          })()
                        : "Search and select employee..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search employees..." />
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandList>
                        {users?.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.firstName} ${user.lastName}`}
                            onSelect={() => {
                              field.onChange(user.id);
                              setIsEmployeeDropdownOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                user.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.firstName} {user.lastName}
                            <span className="ml-auto text-xs text-gray-500">
                              {user.email}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="documentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{documentType === 'passport' ? 'Passport' : 'Visa'} Number</FormLabel>
              <FormControl>
                <Input placeholder={documentType === 'passport' ? 'Enter passport number' : 'Enter visa number'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="issuingCountry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issuing Country</FormLabel>
              <FormControl>
                <Input placeholder="Enter issuing country" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={addDocumentMutation.isPending}
          >
            {addDocumentMutation.isPending ? "Adding..." : `Add ${documentType === 'passport' ? 'Passport' : 'Visa'}`}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function OperationsDashboard() {
  const [location] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Determine which tab to show based on URL or default
  const getActiveView = () => {
    const params = new URLSearchParams(search);
    return params.get('tab') || 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveView());
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequestWithDetails | null>(null);
  const [documentTypeDialogOpen, setDocumentTypeDialogOpen] = useState(false);
  const [documentFormOpen, setDocumentFormOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'passport' | 'visa' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Update activeTab when search parameters change
  useEffect(() => {
    const newActiveView = getActiveView();
    setActiveTab(newActiveView);
    
    // Handle employee parameter from URL for document filtering
    const params = new URLSearchParams(search);
    const employee = params.get('employee');
    if (employee) {
      setSelectedEmployeeId(employee);
    } else {
      setSelectedEmployeeId(null);
    }
  }, [search]);
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

  // Fetch local users for expense tracking (needed to match traveler IDs in requests)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Fetch projects for budget tracking
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/zoho/projects"],
    retry: false,
  });

  // Fetch employee documents with optional employee filter
  const { data: employeeDocuments, isLoading: documentsLoading } = useQuery<any[]>({
    queryKey: selectedEmployeeId ? ["/api/employee-documents", selectedEmployeeId] : ["/api/employee-documents"],
    queryFn: async () => {
      const url = selectedEmployeeId 
        ? `/api/employee-documents?employee=${encodeURIComponent(selectedEmployeeId)}`
        : '/api/employee-documents';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    retry: false,
  });

  // Get completed and rejected requests for this operations team
  const { data: completedAndRejectedRequests, isLoading: completedRequestsLoading } = useQuery<TravelRequestWithDetails[]>({
    queryKey: ["/api/travel-requests", "completed-rejected", (user as any)?.activeRole || (user as any)?.role],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/travel-requests?status=completed-rejected`);
      return await response.json();
    },
    enabled: !!((user as any)?.activeRole || (user as any)?.role),
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

  // Filter and sort requests that operations needs to handle
  // Priority: uncompleted bookings first, then completed bookings (newest first)
  const operationsRequests = requests?.filter(req => 
    req.status === 'pm_approved' || req.status === 'operations_completed'
  ).sort((a, b) => {
    // First sort by status: uncompleted ('pm_approved') before completed ('operations_completed')
    if (a.status === 'pm_approved' && b.status === 'operations_completed') return -1;
    if (a.status === 'operations_completed' && b.status === 'pm_approved') return 1;
    
    // Within same status, sort by departure date (newest first for completed, nearest first for pending)
    const dateA = new Date(a.departureDate).getTime();
    const dateB = new Date(b.departureDate).getTime();
    
    if (a.status === 'operations_completed') {
      return dateB - dateA; // Newest completed first
    } else {
      return dateA - dateB; // Nearest departure first for pending
    }
  }) || [];

  // Calculate user expense summaries
  // Combine both approved requests and completed/rejected requests for complete expense tracking
  const allRequestsForExpenses = [
    ...(requests || []),
    ...(completedAndRejectedRequests || [])
  ];
  
  const userExpenseSummaries = (users?.map(user => {
    // Count all requests for this user (pending and completed)
    const allUserRequests = allRequestsForExpenses.filter(req => 
      req.travelerId === user.id && 
      (req.status === 'operations_completed' || req.status === 'pm_approved')
    );
    
    // Calculate costs only from completed requests with actual costs
    const completedRequestsWithCosts = allUserRequests.filter(req => 
      req.status === 'operations_completed' && 
      req.actualTotalCost && 
      parseFloat(req.actualTotalCost) > 0
    );
    
    const totalSpent = completedRequestsWithCosts.reduce((sum, req) => {
      return sum + (parseFloat(req.actualTotalCost || "0"));
    }, 0);
    
    const tripCount = allUserRequests.length; // Count all trips (pending + completed)

    return {
      ...user,
      totalSpent,
      tripCount,
    };
  }) || [])
    .filter(user => user.totalSpent > 0) // Only show employees with actual expenses
    .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by highest cost first

  // Calculate project expense summaries
  const projectExpenseSummaries = (projects?.map(project => {
    const projectRequests = allRequestsForExpenses.filter(req => {
      const projectIdMatch = String(req.projectId) === String(project.id);
      const zohoIdMatch = String(req.projectId) === String(project.zohoProjectId);
      const isProjectMatch = projectIdMatch || zohoIdMatch;
      const hasValidCost = req.actualTotalCost && parseFloat(req.actualTotalCost) > 0;
      
      // Include completed requests with costs, or any approved/completed requests for trip counting
      return isProjectMatch && (
        (req.status === 'operations_completed' && hasValidCost) ||
        (req.status === 'pm_approved') // Count pending bookings as trips
      );
    }) || [];
    
    // Calculate costs only from completed requests with actual costs
    const completedRequests = projectRequests.filter(req => 
      req.status === 'operations_completed' && 
      req.actualTotalCost && 
      parseFloat(req.actualTotalCost) > 0
    );
    
    const totalSpent = completedRequests.reduce((sum, req) => {
      return sum + (parseFloat(req.actualTotalCost || "0"));
    }, 0);
    
    const tripCount = projectRequests.length; // Count all project-related requests
    const avgCostPerTrip = completedRequests.length > 0 ? totalSpent / completedRequests.length : 0;

    return {
      ...project,
      totalSpent,
      tripCount,
      avgCostPerTrip,
    };
  }) || [])
    .filter(project => project.totalSpent > 0) // Only show projects with actual expenses
    .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by highest cost first

  // Handle different tab views
  if (activeTab === "bookings") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
          <div className="p-8 space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Active Bookings
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Manage and track active travel bookings for approved requests
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] })}
                disabled={requestsLoading}
                data-testid="refresh-active-bookings"
                className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700"
              >
                <RefreshCw className={`w-4 h-4 ${requestsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                              {request.traveler?.firstName} {request.traveler?.lastName} - {formatDestinations(request)}
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

  if (activeTab === "documents") {
    // API now handles filtering, so we use all documents returned
    const filteredDocuments = employeeDocuments || [];

    // Get employee info for display (find the Zoho user for header)
    const selectedEmployee = selectedEmployeeId ? 
      users?.find(user => 
        user.id === selectedEmployeeId ||         // Direct Zoho ID match
        user.email === selectedEmployeeId         // Email fallback
      ) : null;
    
    // Debug logging
    if (selectedEmployeeId) {
      console.log('Selected Employee ID:', selectedEmployeeId);
      console.log('Selected Employee:', selectedEmployee);
      console.log('Documents from API:', filteredDocuments.length);
    }

    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Document Management
                  {selectedEmployee && (
                    <span className="text-blue-600"> - {selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                  )}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {selectedEmployee 
                    ? `Viewing documents for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                    : "Manage employee passports and visas"
                  }
                </p>
              </div>
              <div className="flex gap-3">
                {selectedEmployee && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedEmployeeId(null);
                      const url = new URL(window.location.href);
                      url.searchParams.delete('employee');
                      window.history.pushState({}, '', url.toString());
                    }}
                    data-testid="view-all-documents"
                  >
                    View All Documents
                  </Button>
                )}
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setDocumentTypeDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </div>
            
            {/* Documents Grid */}
            {documentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Loading documents...</p>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="grid gap-6">
                {filteredDocuments.map((document) => {
                  const isExpiringSoon = new Date(document.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const isExpired = new Date(document.expiryDate) <= new Date();
                  
                  return (
                    <Card key={document.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                              document.documentType === 'passport' ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {document.documentType === 'passport' ? 'Passport' : 'Visa'} - {document.user?.firstName} {document.user?.lastName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Document #: {document.documentNumber}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Issued by: {document.issuingCountry}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Issue Date: {new Date(document.issueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={isExpired ? "destructive" : isExpiringSoon ? "secondary" : "default"}>
                                {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Valid"}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Expires: {new Date(document.expiryDate).toLocaleDateString()}
                            </p>
                            {document.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Notes: {document.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {selectedEmployee ? `No Documents for ${selectedEmployee.firstName}` : "No Documents Found"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {selectedEmployee 
                      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} doesn't have any documents yet.`
                      : "No employee documents have been added yet."
                    }
                  </p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setDocumentTypeDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Document Type Selection Dialog */}
          <Dialog open={documentTypeDialogOpen} onOpenChange={setDocumentTypeDialogOpen}>
            <DialogContent className="max-w-md bg-white dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Choose Document Type</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300">
                  What type of document would you like to add?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setSelectedDocumentType('passport');
                    setDocumentTypeDialogOpen(false);
                    setDocumentFormOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Passport
                </Button>
                <Button 
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setSelectedDocumentType('visa');
                    setDocumentTypeDialogOpen(false);
                    setDocumentFormOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Visa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Document Form Dialog */}
          <Dialog open={documentFormOpen} onOpenChange={setDocumentFormOpen}>
            <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  Add {selectedDocumentType === 'passport' ? 'Passport' : 'Visa'} Document
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300">
                  Enter the {selectedDocumentType} details for the employee
                </DialogDescription>
              </DialogHeader>
              <DocumentForm 
                documentType={selectedDocumentType}
                selectedEmployeeId={selectedEmployeeId}
                onClose={() => setDocumentFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  if (activeTab === "expenses-person") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Expenses by Person
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track individual employee travel expenses and spending
              </p>
            </div>
            
            <div className="grid gap-4">
              {userExpenseSummaries.map(user => (
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
                          {formatCurrency(user.totalSpent)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {user.tripCount} trip{user.tripCount !== 1 ? 's' : ''}
                        </p>
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

  if (activeTab === "expenses-project") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Expenses by Project
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track project-based travel expenses and spending
              </p>
            </div>
            
            <div className="grid gap-4">
              {projectExpenseSummaries.map((project, index) => (
                <Card key={`${project.zohoProjectId || project.id}-${index}`} className="bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{project.tripCount} trip{project.tripCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(project.totalSpent)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Avg: {formatCurrency(project.avgCostPerTrip)}/trip
                        </p>
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

  // Handle requests tab - Show completed and rejected requests
  if (activeTab === "requests") {

    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-green-600" />
                Completed & Rejected Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                View completed and rejected travel requests handled by your operations team
              </p>
            </div>
            
            <div className="space-y-4">
              {completedRequestsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Loading requests...</p>
                </div>
              ) : completedAndRejectedRequests && Array.isArray(completedAndRejectedRequests) && completedAndRejectedRequests.length > 0 ? (
                completedAndRejectedRequests.map((request: TravelRequestWithDetails) => (
                  <Card key={request.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.traveler?.firstName} {request.traveler?.lastName} - {formatDestinations(request)}
                            </h3>
                            {getTravelStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {request.purpose} • {new Date(request.departureDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Project: {request.project?.name || 'No project assigned'}
                          </p>
                          {request.requester && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Created by: {request.requester.firstName} {request.requester.lastName}
                            </p>
                          )}
                          {request.pmApprover && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Approved by: {request.pmApprover.firstName} {request.pmApprover.lastName}
                            </p>
                          )}
                          {request.actualTotalCost && (
                            <p className="text-sm font-medium text-green-600">
                              Final Cost: ${Number(request.actualTotalCost).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Handled by: {(user as any)?.role === 'operations_ksa' ? 'Operations KSA' : 'Operations UAE'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {request.status === 'operations_completed' ? 'Completed' : 'Rejected'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">No Completed Requests</h3>
                    <p className="text-gray-500 dark:text-gray-300">No completed or rejected requests found for your operations team</p>
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
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
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
            
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800"
                data-testid="employee-search-input"
              />
            </div>
            
            <div className="grid gap-6">
              {users?.filter(user => 
                searchQuery === "" || 
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((user) => (
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
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => {
                            // Navigate to employee documents view with proper filtering
                            const currentUrl = new URL(window.location.href);
                            currentUrl.searchParams.set('tab', 'documents');
                            currentUrl.searchParams.set('employee', user.id);
                            window.history.pushState({}, '', currentUrl.toString());
                            // Trigger a re-render by updating the location
                            window.location.reload();
                          }}
                          data-testid={`view-documents-${user.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
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
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
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
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Employee Expenses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Track individual employee travel expenses and spending
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/operations-dashboard?tab=expenses-person">
                      View Employee Expenses
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Project Expenses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Track project-based travel expenses and spending
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/operations-dashboard?tab=expenses-project">
                      View Project Expenses
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  // Handle main expenses tab - Show both expense options
  if (activeTab === "expenses") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Expenses Overview
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Complete expense tracking for employees and projects
              </p>
            </div>
            
            {/* Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Employee Expenses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Track individual employee travel expenses and spending
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/operations-dashboard?tab=expenses-person">
                      View Employee Expenses
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Project Expenses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Track project-based travel expenses and spending
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/operations-dashboard?tab=expenses-project">
                      View Project Expenses
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
                  <h4 className="font-semibold text-gray-900 dark:text-white">Active Projects</h4>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {projects?.length || 0}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Total Employees</h4>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {users?.length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  // Default dashboard view
  if (activeTab === "dashboard") {
    return (
      <ProtectedRoute allowedRoles={["operations_ksa", "operations_uae"]}>
        <ModernLayout currentRole={(user as any)?.activeRole || (user as any)?.role}>
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Operations Dashboard - {(() => {
                const currentRole = (user as any)?.activeRole || (user as any)?.role;
                return currentRole === 'operations_ksa' ? 'KSA' : 'UAE';
              })()}
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
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
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
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <DollarSign className="w-6 h-6 text-[#7c3aed]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Completed Bookings */}
            <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#111827] opacity-95"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Completed Bookings</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : stats?.completedBookings || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <CheckSquare className="w-6 h-6 text-[#22c55e]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Completion Rate */}
            <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] opacity-95"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Completion Rate</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : `${stats?.completionRate || '95'}%`}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <CheckSquare className="w-6 h-6 text-[#0ea5e9]" />
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
                              {request.traveler?.firstName} {request.traveler?.lastName} - {formatDestinations(request)}
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
                <Button className="w-full justify-start bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" asChild>
                  <Link href="/operations-dashboard?tab=bookings">
                    <Bed className="w-4 h-4 mr-2" />
                    Manage Bookings
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" asChild>
                  <Link href="/operations-dashboard?tab=documents">
                    <FileText className="w-4 h-4 mr-2" />
                    Document Management
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" asChild>
                  <Link href="/operations-dashboard?tab=expenses-person">
                    <Users className="w-4 h-4 mr-2" />
                    Expenses by Person
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" asChild>
                  <Link href="/operations-dashboard?tab=expenses-project">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Expenses by Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        </ModernLayout>
      </ProtectedRoute>
    );
  }

  // Fallback - should not reach here
  return null;
}