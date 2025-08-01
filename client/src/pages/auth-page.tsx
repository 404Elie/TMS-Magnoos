import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, ArrowRight, Building, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["manager", "pm", "operations"], {
    required_error: "Please select a role",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  if (user) {
    return <Redirect to="/" />;
  }

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "manager",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...submitData } = data;
      const response = await apiRequest("POST", "/api/register", submitData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: 'linear-gradient(135deg, #0032FF, #8A2BE2)'
      }}
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="w-12 h-12 magnoos-gradient rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Magnoos Travel</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Connect Great Minds
              <span className="text-magnoos-secondary block">Through Travel</span>
            </h2>
            <p className="text-lg text-gray-200 max-w-lg">
              Manage travel requests, approvals, and bookings all in one place. 
              Built specifically for enterprise teams with role-based workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-200">Easy Requests</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-200">Quick Approvals</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-200">Smart Budgets</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full max-w-md mx-auto">
          <Card 
            className="auth-page shadow-2xl border-2 backdrop-blur-lg"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
              borderColor: '#FF6F00',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            }}
          >
            <CardHeader className="text-center pb-4">
              <CardTitle 
                className="text-2xl font-bold"
                style={{ color: '#000037' }}
              >
                Welcome
              </CardTitle>
              <CardDescription style={{ color: '#464646' }}>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList 
                  className="grid w-full grid-cols-2 p-1 rounded-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(255, 111, 0, 0.1), rgba(255, 111, 0, 0.05))',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid #FF6F00'
                  }}
                >
                  <TabsTrigger 
                    value="login" 
                    className="transition-all font-medium rounded-md"
                    style={{
                      color: activeTab === 'login' ? 'white' : '#000037',
                      background: activeTab === 'login' 
                        ? 'linear-gradient(135deg, #FF6F00, #ff8533)' 
                        : 'transparent',
                      boxShadow: activeTab === 'login' 
                        ? '0 4px 12px rgba(255, 111, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                        : 'none',
                      textShadow: activeTab === 'login' ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                      border: activeTab === 'login' ? '2px solid #FF6F00' : '2px solid transparent'
                    }}
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="transition-all font-medium rounded-md"
                    style={{
                      color: activeTab === 'register' ? 'white' : '#000037',
                      background: activeTab === 'register' 
                        ? 'linear-gradient(135deg, #FF6F00, #ff8533)' 
                        : 'transparent',
                      boxShadow: activeTab === 'register' 
                        ? '0 4px 12px rgba(255, 111, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                        : 'none',
                      textShadow: activeTab === 'register' ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                      border: activeTab === 'register' ? '2px solid #FF6F00' : '2px solid transparent'
                    }}
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                type="email"
                                className="text-black"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Enter your password" 
                                  type={showLoginPassword ? "text" : "password"}
                                  className="text-black pr-10"
                                  {...field} 
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                                >
                                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full text-white border-0"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 mt-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="First name" className="text-black" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Last name" className="text-black" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                type="email"
                                className="text-black"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Create a password" 
                                  type={showRegisterPassword ? "text" : "password"}
                                  className="text-black pr-10"
                                  {...field} 
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                >
                                  {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Confirm your password" 
                                  type={showConfirmPassword ? "text" : "password"}
                                  className="text-black pr-10"
                                  {...field} 
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="manager">Manager - Submit Travel Requests</SelectItem>
                                <SelectItem value="pm">Project Manager - Approve Requests</SelectItem>
                                <SelectItem value="operations">Operations - Handle Bookings</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full text-white border-0"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}