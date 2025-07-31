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
        departureDate: new Date(data.departureDate).toISOString(),
        returnDate: new Date(data.returnDate).toISOString(),
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
    switch (status) {
      case "submitted":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending PM Approval</Badge>;
      case "pm_approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "pm_rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "operations_completed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <div className="min-h-screen bg-magnoos-dark">
        <Header currentRole="manager" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-magnoos-dark">
          <AdminRoleSwitcher />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full futuristic-tabs">
            <TabsList className="grid w-full grid-cols-2 bg-transparent border border-magnoos-primary/20 backdrop-blur-md">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="submit">Submit Request</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-magnoos-dark border-magnoos-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Requests</p>
                        <p className="text-2xl font-bold text-white">
                          {statsLoading ? "..." : stats?.totalRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Plane className="w-6 h-6 text-magnoos-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Pending Approval</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {statsLoading ? "..." : stats?.pendingRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Approved</p>
                        <p className="text-2xl font-bold text-green-600">
                          {statsLoading ? "..." : stats?.approvedRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-magnoos-dark border-magnoos-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Completed</p>
                        <p className="text-2xl font-bold text-magnoos-blue">
                          {statsLoading ? "..." : stats?.completedRequests || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Flag className="w-6 h-6 text-magnoos-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Requests */}
              <Card className="bg-magnoos-dark border-magnoos-primary/20">
                <CardHeader>
                  <CardTitle className="text-white">My Travel Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magnoos-blue mx-auto mb-4"></div>
                      <p className="text-gray-400">Loading requests...</p>
                    </div>
                  ) : requests && requests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Route
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Dates
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Est. Cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {requests.map((request) => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm font-medium text-white">
                                    {request.origin} → {request.destination}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {request.project?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {new Date(request.departureDate).toLocaleDateString()} - {new Date(request.returnDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(request.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
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
                      <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400">No travel requests yet</p>
                      <Button 
                        onClick={() => setActiveTab("submit")}
                        className="mt-4 bg-magnoos-blue hover:bg-magnoos-dark-blue"
                      >
                        Submit Your First Request
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit" className="space-y-8">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-magnoos-dark border-magnoos-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Submit Travel Request</CardTitle>
                    <CardDescription>
                      Fill out the form below to submit a new travel request
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                          "w-full justify-between",
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
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value
                                            ? (() => {
                                                const selectedProject = projects?.find((project) => project.id === field.value);
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
                                                  field.onChange(project.id);
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
                                                    field.value === project.id ? "opacity-100" : "opacity-0"
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
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => form.reset()}
                          >
                            Clear Form
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-magnoos-blue hover:bg-magnoos-dark-blue"
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
