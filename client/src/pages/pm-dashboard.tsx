import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ModernLayout from "@/components/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, TrendingUp, ChevronsUpDown, Plane, CalendarIcon, PlusCircle } from "lucide-react";
import type { TravelRequestWithDetails, User } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertTravelRequestSchema } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { formatDestinations } from "@/lib/destinationUtils";

// Travel Request Form Component
function TravelRequestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form validation schema
  const formSchema = insertTravelRequestSchema.pick({
    travelerId: true,
    projectId: true,
    origin: true,
    destination: true,
    purpose: true,
    customPurpose: true,
    notes: true,
  }).extend({
    projectId: z.string().optional(),
    customPurpose: z.string().optional(),
    departureDate: z.string().min(1, "Start date is required"),
    returnDate: z.string().min(1, "End date is required"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelerId: "",
      projectId: "",
      origin: "",
      destination: "",
      departureDate: "",
      returnDate: "",
      purpose: "",
      customPurpose: "",
      notes: "",
    },
  });

  // Watch purpose field to conditionally show project and custom purpose fields
  const selectedPurpose = form.watch("purpose");
  
  // State for controlling employee dropdown
  const [employeeOpen, setEmployeeOpen] = useState(false);

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/zoho/projects"],
    retry: false,
  });

  // Fetch employees for dropdown
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/zoho/users"],
    retry: false,
  });

  // Departure date
  const [departureDate, setDepartureDate] = useState<Date>();
  const [departureDateOpen, setDepartureDateOpen] = useState(false);

  // Return date  
  const [returnDate, setReturnDate] = useState<Date>();
  const [returnDateOpen, setReturnDateOpen] = useState(false);

  // Project combobox state
  const [projectOpen, setProjectOpen] = useState(false);

  // Submit mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/travel-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Travel request submitted successfully!",
      });
      form.reset();
      setDepartureDate(undefined);
      setReturnDate(undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit travel request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      departureDate: departureDate?.toISOString(),
      returnDate: returnDate?.toISOString(),
    };
    createRequestMutation.mutate(submitData);
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">New Travel Request</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Submit a new travel request for approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="travelerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-gray-900 dark:text-white">Traveler *</FormLabel>
                  <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between text-gray-900 dark:text-white bg-white dark:bg-gray-800",
                            !field.value && "text-gray-500 dark:text-gray-400"
                          )}
                        >
                          {field.value
                            ? employees.find((employee) => employee.id === field.value)?.firstName + " " + employees.find((employee) => employee.id === field.value)?.lastName
                            : "Select traveler..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 bg-white dark:bg-gray-800">
                      <Command>
                        <CommandInput placeholder="Search employees..." className="text-gray-900 dark:text-white" />
                        <CommandEmpty className="text-gray-600 dark:text-gray-300">No employee found.</CommandEmpty>
                        <CommandGroup>
                          {employees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={employee.id}
                              onSelect={(currentValue) => {
                                form.setValue("travelerId", currentValue === field.value ? "" : currentValue);
                                setEmployeeOpen(false);
                              }}
                              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {employee.firstName} {employee.lastName} - {employee.email}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Purpose *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Select travel purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      <SelectItem value="Client Meeting" className="text-gray-900 dark:text-white">Client Meeting</SelectItem>
                      <SelectItem value="Sales Activities" className="text-gray-900 dark:text-white">Sales Activities</SelectItem>
                      <SelectItem value="Training" className="text-gray-900 dark:text-white">Training</SelectItem>
                      <SelectItem value="Project Management" className="text-gray-900 dark:text-white">Project Management</SelectItem>
                      <SelectItem value="Other" className="text-gray-900 dark:text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Selection - Show if purpose involves client work */}
            {(selectedPurpose === "Client Meeting" || selectedPurpose === "Project Management") && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-900 dark:text-white">Project</FormLabel>
                    <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between text-gray-900 dark:text-white bg-white dark:bg-gray-800",
                              !field.value && "text-gray-500 dark:text-gray-400"
                            )}
                          >
                            {field.value
                              ? projects.find((project) => String(project.id) === field.value)?.name
                              : "Select project..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 bg-white dark:bg-gray-800">
                        <Command>
                          <CommandInput placeholder="Search projects..." className="text-gray-900 dark:text-white" />
                          <CommandEmpty className="text-gray-600 dark:text-gray-300">No project found.</CommandEmpty>
                          <CommandGroup>
                            {projects.map((project) => (
                              <CommandItem
                                key={project.id}
                                value={String(project.id)}
                                onSelect={(currentValue) => {
                                  form.setValue("projectId", currentValue === field.value ? "" : currentValue);
                                  setProjectOpen(false);
                                }}
                                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {project.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Custom Purpose - Show if purpose is "Other" */}
            {selectedPurpose === "Other" && (
              <FormField
                control={form.control}
                name="customPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-white">Custom Purpose *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe the purpose of your travel"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Travel Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-white">Origin *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Riyadh, KSA"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-white">Destination *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Dubai, UAE"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-900 dark:text-white">Departure Date *</FormLabel>
                    <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                              !departureDate && "text-gray-500 dark:text-gray-400"
                            )}
                          >
                            {departureDate ? (
                              format(departureDate, "PPP")
                            ) : (
                              <span>Pick departure date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800" align="start">
                        <Calendar
                          mode="single"
                          selected={departureDate}
                          onSelect={(date) => {
                            setDepartureDate(date);
                            form.setValue("departureDate", date?.toISOString() || "");
                            setDepartureDateOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-900 dark:text-white">Return Date *</FormLabel>
                    <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                              !returnDate && "text-gray-500 dark:text-gray-400"
                            )}
                          >
                            {returnDate ? (
                              format(returnDate, "PPP")
                            ) : (
                              <span>Pick return date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800" align="start">
                        <Calendar
                          mode="single"
                          selected={returnDate}
                          onSelect={(date) => {
                            setReturnDate(date);
                            form.setValue("returnDate", date?.toISOString() || "");
                            setReturnDateOpen(false);
                          }}
                          disabled={(date) => date < (departureDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements or additional information..."
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Travel Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function PMDashboard() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  
  // Determine which tab to show based on URL
  const getActiveView = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveView());
  
  useEffect(() => {
    setActiveTab(getActiveView());
  }, [location]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Fetch travel requests (only user's own requests for PM role)
  const { data: allRequests, isLoading: requestsLoading } = useQuery<TravelRequestWithDetails[]>({
    queryKey: ["/api/travel-requests"],
    retry: false,
  });

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pending Approval</Badge>;
      case "pm_approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "pm_rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case "operations_completed":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Project analytics
  const projectAnalytics = allRequests?.reduce((acc, request) => {
    const projectName = request.project?.name || 'Unassigned';
    if (!acc[projectName]) {
      acc[projectName] = { total: 0, approved: 0, pending: 0, completed: 0 };
    }
    acc[projectName].total++;
    if (request.status === 'pm_approved') acc[projectName].approved++;
    if (request.status === 'submitted') acc[projectName].pending++;
    if (request.status === 'operations_completed') acc[projectName].completed++;
    return acc;
  }, {} as Record<string, any>) || {};

  // Show new request form when tab=new-request
  if (activeTab === 'new-request') {
    return (
      <ProtectedRoute allowedRoles={["manager"]}>
        <ModernLayout currentRole="manager">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <PlusCircle className="w-8 h-8 text-blue-600" />
                Submit New Travel Request
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Complete the form below to submit a new travel request for approval
              </p>
            </div>
            <div className="max-w-4xl">
              <TravelRequestForm />
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }
  
  // Show my requests when tab=my-requests
  if (activeTab === 'my-requests') {
    return (
      <ProtectedRoute allowedRoles={["manager"]}>
        <ModernLayout currentRole="manager">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
                My Travel Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                View and track the status of your submitted travel requests
              </p>
            </div>
            
            {/* My Requests List */}
            <div className="space-y-4">
              {requestsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Loading your requests...</p>
                </div>
              ) : allRequests && allRequests.length > 0 ? (
                allRequests.map((request) => (
                  <Card key={request.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.traveler?.firstName} {request.traveler?.lastName} - {formatDestinations(request)}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {request.purpose} • {format(new Date(request.departureDate), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Project: {request.project?.name || 'No project assigned'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ${(Number(request.estimatedFlightCost || 0) + Number(request.estimatedHotelCost || 0) + Number(request.estimatedOtherCost || 0)).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total Estimated
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">No requests found</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      You haven't submitted any travel requests yet.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Submit Your First Request
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ModernLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <ModernLayout currentRole="manager">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Project Manager Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Overview of your travel requests and project activities
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] opacity-95"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">My Requests</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : allRequests?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Plane className="w-6 h-6 text-[#2563eb]" />
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
                    <p className="text-sm font-medium text-white/90">Pending</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : allRequests?.filter(r => r.status === 'submitted').length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-[#7c3aed]" />
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
                    <p className="text-sm font-medium text-white/90">Approved</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : allRequests?.filter(r => r.status === 'pm_approved').length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Check className="w-6 h-6 text-[#16a34a]" />
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
                    <p className="text-sm font-medium text-white/90">Completed</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {statsLoading ? "..." : allRequests?.filter(r => r.status === 'operations_completed').length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Check className="w-6 h-6 text-[#0ea5e9]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : allRequests && allRequests.length > 0 ? (
                  <div className="space-y-3">
                    {allRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {request.traveler?.firstName} {request.traveler?.lastName} - {formatDestinations(request)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {request.purpose} • {format(new Date(request.departureDate), 'MMM dd')}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-300 mb-3">No travel requests yet</p>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setLocation('/pm-new-request')}
                      data-testid="button-submit-first-request"
                    >
                      Submit First Request
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Project Travel Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(projectAnalytics).slice(0, 3).map(([projectName, data]) => (
                    <div key={projectName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{projectName}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{data.total} trips</span>
                    </div>
                  ))}
                  {Object.keys(projectAnalytics).length === 0 && (
                    <p className="text-gray-500 dark:text-gray-300 text-center py-4 text-sm">No travel data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ModernLayout>
    </ProtectedRoute>
  );
}