import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ModernLayout from "@/components/ModernLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

const requestSchema = z.object({
  travelerId: z.string().min(1, "Please select a traveler"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  additionalDestinations: z.array(z.string()).optional(),
  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  purpose: z.enum(["delivery", "sales", "event", "other"]),
  projectId: z.string().optional(),
  customPurpose: z.string().optional(),
  notes: z.string().optional(),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function NewRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [travelerSearchOpen, setTravelerSearchOpen] = useState(false);
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [showCustomPurpose, setShowCustomPurpose] = useState(false);
  const [additionalDestinations, setAdditionalDestinations] = useState<string[]>([]);

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      travelerId: "",
      origin: "",
      destination: "",
      additionalDestinations: [],
      departureDate: "",
      returnDate: "",
      purpose: "delivery",
      projectId: "",
      customPurpose: "",
      notes: "",
    },
  });

  const purposeValue = form.watch("purpose");

  // Fetch users for traveler selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/zoho/users"],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/zoho/projects"],
  });

  // Deduplicate projects by ID to prevent duplicate keys in dropdown
  const uniqueProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    return (projects as any[]).filter((project: any, index: number, self: any[]) => 
      index === self.findIndex((p: any) => String(p.id) === String(project.id))
    );
  }, [projects]);

  const submitRequestMutation = useMutation({
    mutationFn: async (data: RequestForm) => {
      return await apiRequest("POST", "/api/travel-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Travel request submitted successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Redirect to dashboard based on user role
      const effectiveRole = (user as any)?.activeRole || (user as any)?.role;
      if (effectiveRole === 'manager') {
        setLocation('/pm-dashboard');
      } else if (effectiveRole === 'pm') {
        setLocation('/manager/dashboard');
      } else {
        setLocation('/');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit travel request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestForm) => {
    submitRequestMutation.mutate(data);
  };

  return (
    <ModernLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <PlusCircle className="w-8 h-8 text-blue-600" />
              Submit New Travel Request
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create a new travel request for team members
            </p>
          </div>

          {/* Form */}
          <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Travel Request Details</CardTitle>
              <CardDescription>
                Fill out all required information for the travel request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Traveler Selection */}
                  <FormField
                    control={form.control}
                    name="travelerId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Traveler *</FormLabel>
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
                                      const selectedUser = (users as any[])?.find((user: any) => user.id === field.value);
                                      if (!selectedUser) return "Select traveler...";
                                      return `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email || 'Unknown User';
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
                                  {(users as any[])?.map((travelerUser: any) => (
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
                                          {`${travelerUser.firstName || ''} ${travelerUser.lastName || ''}`.trim() || travelerUser.email || 'Unknown User'}
                                        </span>
                                        {travelerUser.email && (
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

                  {/* Travel Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origin *</FormLabel>
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
                          <FormLabel>Destination *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter destination city" {...field} data-testid="input-destination" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Destinations */}
                  {additionalDestinations.length > 0 && (
                    <div className="space-y-4">
                      <FormLabel>Additional Destinations</FormLabel>
                      {additionalDestinations.map((_, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Destination ${index + 2}`}
                            value={additionalDestinations[index]}
                            onChange={(e) => {
                              const newDestinations = [...additionalDestinations];
                              newDestinations[index] = e.target.value;
                              setAdditionalDestinations(newDestinations);
                              form.setValue('additionalDestinations', newDestinations);
                            }}
                            data-testid={`input-additional-destination-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newDestinations = additionalDestinations.filter((_, i) => i !== index);
                              setAdditionalDestinations(newDestinations);
                              form.setValue('additionalDestinations', newDestinations);
                            }}
                            data-testid={`button-remove-destination-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Destination Button */}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newDestinations = [...additionalDestinations, ''];
                        setAdditionalDestinations(newDestinations);
                        form.setValue('additionalDestinations', newDestinations);
                      }}
                      className="w-full md:w-auto"
                      data-testid="button-add-destination"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Destination
                    </Button>
                  </div>

                  {/* Date Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="departureDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departure Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={new Date().toISOString().split('T')[0]}
                              {...field} 
                            />
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
                          <FormLabel>Return Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={form.watch("departureDate") || new Date().toISOString().split('T')[0]}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Purpose */}
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setShowCustomPurpose(value === "other");
                            if (value !== "delivery") {
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

                  {/* Custom Purpose */}
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

                  {/* Project Selection - Only for Delivery */}
                  {purposeValue === "delivery" && (
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
                                        const selectedProject = (projects as any[])?.find((project: any) => String(project.id) === field.value);
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
                                    {uniqueProjects.map((project: any) => (
                                      <CommandItem
                                        key={project.id}
                                        value={String(project.id)}
                                        keywords={[project.name, project.description || '']}
                                        onSelect={() => {
                                          field.onChange(String(project.id));
                                          setProjectSearchOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{project.name}</span>
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
                  )}


                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional information or special requests..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Clear Form
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitRequestMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernLayout>
  );
}