import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Check, TrendingUp, ChevronsUpDown } from "lucide-react";
import type { TravelRequestWithDetails } from "@shared/schema";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
    departureDate: true,
    returnDate: true,
    purpose: true,
    customPurpose: true,
    notes: true,
  }).extend({
    projectId: z.string().optional(),
    customPurpose: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelerId: "",
      projectId: "",
      origin: "",
      destination: "",
      departureDate: new Date(),
      returnDate: new Date(),
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
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/zoho/projects"],
    retry: false,
  });

  // Fetch Zoho users for employee dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/zoho/users"],
    retry: false,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/travel-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Travel request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    submitMutation.mutate(data);
  };

  return (
    <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Submit Travel Request</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Fill out the details for your travel request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Selection */}
              <FormField
                control={form.control}
                name="travelerId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-gray-900 dark:text-white">Employee *</FormLabel>
                    <FormControl>
                      <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeeOpen}
                            className="w-full justify-between bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                          >
                            {field.value
                              ? (() => {
                                  const selectedEmp = employees?.find((emp: any) => emp.id === field.value);
                                  return selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName} (${selectedEmp.email})` : "Select employee...";
                                })()
                              : "Select employee..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-white dark:bg-slate-700">
                          <Command>
                            <CommandInput placeholder="Search employees..." className="h-9" />
                            <CommandEmpty>No employee found.</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-y-auto">
                              {employees?.map((emp: any) => (
                                <CommandItem
                                  key={emp.id}
                                  value={`${emp.firstName} ${emp.lastName} ${emp.email}`}
                                  onSelect={() => {
                                    field.onChange(emp.id);
                                    setEmployeeOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === emp.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {emp.firstName} {emp.lastName} ({emp.email})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              {/* Origin */}
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-white">Traveling From (Origin) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter departure location"
                        className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Destination */}
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-white">Traveling To (Destination) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter destination"
                        className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Date */}
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-white">Start Date *</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-white">End Date *</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
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
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-700">
                          <SelectItem value="delivery">Delivery</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Selection - Only show when purpose is "delivery" */}
              {selectedPurpose === "delivery" && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Project *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-700">
                            {projects?.map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Custom Purpose - Only show when purpose is "other" */}
              {selectedPurpose === "other" && (
                <FormField
                  control={form.control}
                  name="customPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Specify Purpose *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Please specify the purpose of travel"
                          className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}




            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional information or special requests..."
                      rows={4}
                      className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="hover:bg-magnoos-primary/90 text-white min-w-[120px] bg-[#8e2fe6]"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function PMDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case "pm_approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "pm_rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "operations_completed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate project analytics
  const projectAnalytics = allRequests?.reduce((acc, request) => {
    const projectName = request.project?.name || 'Unknown';
    if (!acc[projectName]) {
      acc[projectName] = {
        total: 0,
        approved: 0,
        pending: 0,
        completed: 0,
      };
    }
    acc[projectName].total++;
    if (request.status === 'pm_approved') acc[projectName].approved++;
    if (request.status === 'submitted') acc[projectName].pending++;
    if (request.status === 'operations_completed') acc[projectName].completed++;
    return acc;
  }, {} as Record<string, any>) || {};

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <div className="min-h-screen dark:bg-magnoos-dark light:bg-transparent pm-dashboard">
        <Header currentRole="manager" />
        
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 dark:bg-magnoos-dark light:bg-transparent">
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

            <TabsContent value="dashboard" className="space-y-8 dark:bg-magnoos-dark light:bg-transparent">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] border-[#0032FF] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">My Requests</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : allRequests?.length || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <Clock className="w-7 h-7 text-[#0032FF]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] border-[#0032FF] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">Approved</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : allRequests?.filter(r => r.status === 'pm_approved').length || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <Check className="w-7 h-7 text-[#0032FF]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] border-[#0032FF] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">Pending</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : allRequests?.filter(r => r.status === 'submitted').length || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <TrendingUp className="w-7 h-7 text-[#0032FF]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[#0032FF] to-[#8A2BE2] border-[#0032FF] shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">Completed</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? "..." : allRequests?.filter(r => r.status === 'operations_completed').length || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                        <Check className="w-7 h-7 text-[#0032FF]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">My Recent Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-magnoos-blue mx-auto"></div>
                      </div>
                    ) : allRequests && allRequests.length > 0 ? (
                      <div className="bg-gray-50 dark:bg-magnoos-dark space-y-3">
                        {allRequests.slice(0, 3).map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-[#464646]">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {request.destination}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {request.project?.name} • {getStatusBadge(request.status)}
                              </p>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => setActiveTab("submit")}
                              className="text-magnoos-blue hover:text-magnoos-dark-blue"
                              variant="ghost"
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-300 mb-3">No travel requests yet</p>
                        <Button onClick={() => setActiveTab("submit")} size="sm">
                          Submit First Request
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-magnoos-dark border-gray-200 dark:border-magnoos-dark">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Project Travel Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-magnoos-dark space-y-3">
                      {Object.entries(projectAnalytics).slice(0, 3).map(([projectName, data]) => (
                        <div key={projectName} className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">{projectName}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{data.total} trips</span>
                        </div>
                      ))}
                      {Object.keys(projectAnalytics).length === 0 && (
                        <p className="text-gray-500 dark:text-gray-300 text-center py-4">No travel data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submit" className="space-y-8 dark:bg-magnoos-dark light:bg-transparent">
              <TravelRequestForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}