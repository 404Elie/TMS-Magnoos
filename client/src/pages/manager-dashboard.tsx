import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoleSwitcher from "@/components/AdminRoleSwitcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plane, Clock, Check, Flag, MapPin, Calendar, DollarSign, ChevronsUpDown } from "lucide-react";
import type { TravelRequestWithDetails, Project, User } from "@shared/schema";

const travelRequestFormSchema = z.object({
  travelerId: z.string().min(1, "Please select a traveler"),
  projectId: z.string().optional(),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  purpose: z.string().min(1, "Purpose is required"),
  customPurpose: z.string().optional(),
  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  notes: z.string().optional(),
}).refine((data) => {
  // Require project when purpose is delivery
  if (data.purpose === "delivery" && (!data.projectId || data.projectId === "")) {
    return false;
  }
  // Require custom purpose when purpose is other
  if (data.purpose === "other" && (!data.customPurpose || data.customPurpose.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please complete all required fields for the selected purpose",
  path: ["purpose"], // This will show the error on the purpose field
});

type TravelRequestForm = z.infer<typeof travelRequestFormSchema>;

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [travelerSearchOpen, setTravelerSearchOpen] = useState(false);
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [purposeValue, setPurposeValue] = useState("");
  const [showCustomPurpose, setShowCustomPurpose] = useState(false);

  const form = useForm<TravelRequestForm>({
    resolver: zodResolver(travelRequestFormSchema),
    defaultValues: {
      travelerId: "",
      projectId: "",
      origin: "",
      destination: "",
      purpose: "",
      customPurpose: "",
      departureDate: "",
      returnDate: "",
      notes: "",
    },
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalRequests: string;
    pendingRequests: string;
    approvedRequests: string;
    completedRequests: string;
  }>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Fetch travel requests
  const { data: requests, isLoading: requestsLoading } = useQuery<TravelRequestWithDetails[]>({
    queryKey: ["/api/travel-requests"],
    retry: false,
  });

  // Fetch users for selection
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/zoho/users"],
    retry: false,
  });

  // Fetch projects for selection
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/zoho/projects"],
    retry: false,
  });

  // Submit travel request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (data: TravelRequestForm) => {
      const payload = {
        ...data,
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        // Cost estimation fields are not provided by managers - operations team will handle
        estimatedFlightCost: null,
        estimatedHotelCost: null,
        estimatedOtherCost: null,
      };
      return await apiRequest("POST", "/api/travel-requests", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Travel request submitted successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setActiveTab("dashboard");
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
        description: "Failed to submit travel request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TravelRequestForm) => {
    submitRequestMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border";
    
    switch (status) {
      case "submitted":
        return (
          <span 
            className={baseClasses}
            style={{ 
              color: 'hsl(var(--magnoos-yellow))', 
              backgroundColor: 'hsl(var(--magnoos-yellow) / 0.15)',
              borderColor: 'hsl(var(--magnoos-yellow) / 0.3)'
            }}
          >
            Pending PM Approval
          </span>
        );
      case "pm_approved":
        return (
          <span 
            className={baseClasses}
            style={{ 
              color: 'hsl(var(--magnoos-lime))', 
              backgroundColor: 'hsl(var(--magnoos-lime) / 0.15)',
              borderColor: 'hsl(var(--magnoos-lime) / 0.3)'
            }}
          >
            Approved
          </span>
        );
      case "pm_rejected":
        return (
          <span 
            className={baseClasses}
            style={{ 
              color: 'hsl(var(--magnoos-coral))', 
              backgroundColor: 'hsl(var(--magnoos-coral) / 0.15)',
              borderColor: 'hsl(var(--magnoos-coral) / 0.3)'
            }}
          >
            Rejected
          </span>
        );
      case "operations_completed":
        return (
          <span 
            className={baseClasses}
            style={{ 
              color: 'hsl(var(--magnoos-teal))', 
              backgroundColor: 'hsl(var(--magnoos-teal) / 0.15)',
              borderColor: 'hsl(var(--magnoos-teal) / 0.3)'
            }}
          >
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span 
            className={baseClasses}
            style={{ 
              color: 'hsl(var(--magnoos-coral))', 
              backgroundColor: 'hsl(var(--magnoos-coral) / 0.15)',
              borderColor: 'hsl(var(--magnoos-coral) / 0.3)'
            }}
          >
            Cancelled
          </span>
        );
      default:
        return (
          <span 
            className={baseClasses}
            style={{ 
              color: 'hsl(var(--magnoos-dark-gray))', 
              backgroundColor: 'hsl(var(--magnoos-light-gray) / 0.15)',
              borderColor: 'hsl(var(--magnoos-dark-gray) / 0.3)'
            }}
          >
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <div className="min-h-screen bg-background manager-dashboard">
        <Header currentRole="manager" />
        
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 bg-background">
          <AdminRoleSwitcher />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full futuristic-tabs">
            <TabsList className="grid w-full grid-cols-2 bg-muted border border-border backdrop-blur-md pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <TabsTrigger 
                value="dashboard"
                className="custom-tab"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="submit"
                className="custom-tab"
              >
                Submit Request
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 bg-[#f9f9f9]">
              {/* Stats Cards with Beautiful Gradients */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Requests - Electric Blue to Purple Gradient */}
                <Card className="relative overflow-hidden border-none shadow-2xl gradient-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] opacity-90"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Total Requests</p>
                        <p className="text-3xl font-bold text-white mt-1 transition-all duration-300">
                          {statsLoading ? (
                            <span className="shimmer inline-block w-16 h-8 bg-white/20 rounded"></span>
                          ) : stats?.totalRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                        <Plane className="w-6 h-6 text-[#0032FF] transition-transform duration-300 hover:scale-110" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Pending Approval - Orange to Coral Gradient */}
                <Card className="relative overflow-hidden border-none shadow-2xl gradient-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6F00] to-[#FF6F61] opacity-90"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Pending Approval</p>
                        <p className="text-3xl font-bold text-white mt-1 transition-all duration-300">
                          {statsLoading ? (
                            <span className="shimmer inline-block w-16 h-8 bg-white/20 rounded"></span>
                          ) : stats?.pendingRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                        <Clock className="w-6 h-6 text-[#FF6F00] transition-transform duration-300 hover:scale-110" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Approved - Teal to Lime Gradient */}
                <Card className="relative overflow-hidden border-none shadow-2xl gradient-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1ABC3C] to-[#A6E05A] opacity-90"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Approved</p>
                        <p className="text-3xl font-bold text-white mt-1 transition-all duration-300">
                          {statsLoading ? (
                            <span className="shimmer inline-block w-16 h-8 bg-white/20 rounded"></span>
                          ) : stats?.approvedRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                        <Check className="w-6 h-6 text-[#1ABC3C] transition-transform duration-300 hover:scale-110" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Completed - Vivid Teal to Lime Green Gradient */}
                <Card className="relative overflow-hidden border-none shadow-2xl gradient-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00D9C0] to-[#A3E635] opacity-90"></div>
                  <CardContent className="relative p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Completed</p>
                        <p className="text-3xl font-bold text-white mt-1 transition-all duration-300">
                          {statsLoading ? (
                            <span className="shimmer inline-block w-16 h-8 bg-white/20 rounded"></span>
                          ) : stats?.completedRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                        <Flag className="w-6 h-6 text-[#00D9C0] transition-transform duration-300 hover:scale-110" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Requests */}
              <Card className="bg-card border-border shadow-lg dark:bg-card dark:border-border light:bg-gradient-to-br light:from-[hsl(0,0%,100%)] light:to-[hsl(175,100%,99%)] light:border-[hsl(175,100%,85%)] light:shadow-[0_4px_20px_-4px_hsl(175,100%,80%)]">
                <CardHeader>
                  <CardTitle className="text-foreground">My Travel Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderBottomColor: 'hsl(var(--magnoos-electric-blue))' }}></div>
                      <p className="text-muted-foreground">Loading requests...</p>
                    </div>
                  ) : requests && requests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Route
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Dates
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Est. Cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-background divide-y divide-border">
                          {requests.map((request) => (
                            <tr key={request.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                                  <span className="text-sm font-medium text-foreground">
                                    {request.origin} → {request.destination}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {request.project?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {new Date(request.departureDate).toLocaleDateString()} - {new Date(request.returnDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(request.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(
                                  (parseFloat(request.estimatedFlightCost || "0") +
                                   parseFloat(request.estimatedHotelCost || "0") +
                                   parseFloat(request.estimatedOtherCost || "0"))
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No travel requests yet</p>
                      <Button 
                        onClick={() => setActiveTab("submit")}
                        className="mt-4 text-white"
                        style={{ backgroundColor: 'hsl(var(--magnoos-electric-blue))', borderColor: 'hsl(var(--magnoos-electric-blue))' }}
                      >
                        Submit Your First Request
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit" className="space-y-8 bg-[#f9f9f9]">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-card border-border shadow-lg dark:bg-card dark:border-border light:bg-gradient-to-br light:from-[hsl(0,0%,100%)] light:to-[hsl(175,100%,99%)] light:border-[hsl(175,100%,85%)] light:shadow-[0_4px_20px_-4px_hsl(175,100%,80%)]">
                  <CardHeader>
                    <CardTitle className="text-foreground">Submit Travel Request</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Fill out the form below to submit a new travel request
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card space-y-6">
                        {/* Traveler Selection */}
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={form.control}
                            name="travelerId"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Traveler</FormLabel>
                                <Popover open={travelerSearchOpen} onOpenChange={setTravelerSearchOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={travelerSearchOpen}
                                        className={cn(
                                          "w-full justify-between bg-background border-border text-foreground hover:bg-muted",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? (() => {
                                              const selectedUser = users?.find((user) => user.id === field.value);
                                              if (!selectedUser) return "Select traveler...";
                                              const displayName = selectedUser.firstName && selectedUser.lastName 
                                                ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                                                : selectedUser.email || 'Unknown User';
                                              return `${displayName}${selectedUser.id === (user as any)?.id ? " (Me)" : ""}`;
                                            })()
                                          : "Select traveler..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search travelers..." className="h-9" />
                                      <CommandList>
                                        <CommandEmpty>No traveler found.</CommandEmpty>
                                        <CommandGroup>
                                          {users?.map((travelerUser) => (
                                            <CommandItem
                                              key={travelerUser.id}
                                              value={`${travelerUser.firstName || ''} ${travelerUser.lastName || ''} ${travelerUser.email || ''}`}
                                              onSelect={() => {
                                                field.onChange(travelerUser.id);
                                                setTravelerSearchOpen(false);
                                              }}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">
                                                  {travelerUser.firstName && travelerUser.lastName 
                                                    ? `${travelerUser.firstName} ${travelerUser.lastName}` 
                                                    : travelerUser.email || 'Unknown User'}
                                                  {travelerUser.id === (user as any)?.id && " (Me)"}
                                                </span>
                                                {travelerUser.firstName && travelerUser.lastName && travelerUser.email && (
                                                  <span className="text-sm text-muted-foreground">
                                                    {travelerUser.email}
                                                  </span>
                                                )}
                                              </div>
                                              <Check
                                                className={cn(
                                                  "ml-auto h-4 w-4",
                                                  field.value === travelerUser.id ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Project Selection - Only shown when purpose is "Delivery" */}
                        {purposeValue === "delivery" && (
                          <div className="grid grid-cols-1 gap-6">
                            <FormField
                              control={form.control}
                              name="projectId"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Project</FormLabel>
                                  <Popover open={projectSearchOpen} onOpenChange={setProjectSearchOpen}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={projectSearchOpen}
                                          className={cn(
                                            "w-full justify-between bg-slate-800 border-slate-600 text-white hover:bg-slate-700",
                                            !field.value && "text-gray-400"
                                          )}
                                        >
                                          {field.value
                                            ? (() => {
                                                const selectedProject = projects?.find((project) => String(project.id) === field.value);
                                                return selectedProject?.name || "Select project...";
                                              })()
                                            : "Select project..."}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search projects..." className="h-9" />
                                        <CommandList>
                                          <CommandEmpty>No project found.</CommandEmpty>
                                          <CommandGroup>
                                            {projects?.map((project) => (
                                              <CommandItem
                                                key={project.id}
                                                value={project.name}
                                                onSelect={() => {
                                                  field.onChange(String(project.id));
                                                  setProjectSearchOpen(false);
                                                }}
                                              >
                                                <div className="flex flex-col">
                                                  <span className="font-medium">
                                                    {project.name}
                                                  </span>
                                                  {project.description && (
                                                    <span className="text-sm text-muted-foreground">
                                                      {project.description}
                                                    </span>
                                                  )}
                                                </div>
                                                <Check
                                                  className={cn(
                                                    "ml-auto h-4 w-4",
                                                    field.value === String(project.id) ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        {/* Travel Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="origin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Origin</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter departure city" {...field} />
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
                                <FormLabel>Destination</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter destination city" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Purpose</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setPurposeValue(value);
                                    setShowCustomPurpose(value === "other");
                                    if (value !== "delivery") {
                                      // Clear project selection if purpose is not delivery
                                      form.setValue("projectId", "");
                                    }
                                  }} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select purpose..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="delivery">Delivery</SelectItem>
                                    <SelectItem value="sales">Sales</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Custom Purpose Input - Only shown when "Other" is selected */}
                          {showCustomPurpose && (
                            <FormField
                              control={form.control}
                              name="customPurpose"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Purpose</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Please specify the purpose..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="departureDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Departure Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="returnDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Return Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
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
                              <FormLabel>Additional Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any special requirements or additional information..."
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />



                        {/* Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                          <Button 
                            type="button" 
                            variant="outline"
                            className="text-muted-foreground border-border hover:bg-muted"
                            onClick={() => form.reset()}
                          >
                            Clear Form
                          </Button>
                          <Button 
                            type="submit" 
                            className="text-white"
                            style={{ backgroundColor: '#8A2BE2', borderColor: '#8A2BE2' }}
                            disabled={submitRequestMutation.isPending}
                          >
                            {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
