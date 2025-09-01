import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ModernLayout from "@/components/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronsUpDown } from "lucide-react";
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
                        placeholder="Describe your travel purpose" 
                        {...field} 
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Origin */}
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">Origin *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Where are you traveling from?" 
                      {...field} 
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  <FormLabel className="text-gray-900 dark:text-white">Destination *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Where are you traveling to?" 
                      {...field} 
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departure Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Departure Date *</label>
                <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                        !departureDate && "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {departureDate ? format(departureDate, "PPP") : "Pick a date"}
                    </Button>
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
              </div>

              {/* Return Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Return Date *</label>
                <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                        !returnDate && "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {returnDate ? format(returnDate, "PPP") : "Pick a date"}
                    </Button>
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
              </div>
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
                      placeholder="Any additional information or special requirements"
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

export default function PMNewRequest() {
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