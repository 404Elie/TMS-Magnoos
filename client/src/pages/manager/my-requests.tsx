import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import ModernLayout from "@/components/ModernLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, User, FileText, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import type { User as UserType } from "@shared/schema";

export default function MyRequests() {
  const { user } = useAuth();
  const typedUser = user as UserType | undefined;

  // Fetch user's own requests
  const { data: requests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/travel-requests", { userId: typedUser?.id }],
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border";
    
    switch (status) {
      case "submitted":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Pending Approval
          </Badge>
        );
      case "pm_approved":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            Booking in Progress
          </Badge>
        );
      case "pm_rejected":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            Rejected
          </Badge>
        );
      case "operations_completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  const getTotalEstimatedCost = (request: any) => {
    return (
      parseFloat(request.estimatedFlightCost || "0") +
      parseFloat(request.estimatedHotelCost || "0") +
      parseFloat(request.estimatedOtherCost || "0")
    );
  };

  // Separate requests by status
  const pendingRequests = requests?.filter((r: any) => r.status === 'submitted') || [];
  const approvedRequests = requests?.filter((r: any) => r.status === 'pm_approved') || [];
  const completedRequests = requests?.filter((r: any) => r.status === 'operations_completed') || [];
  const rejectedRequests = requests?.filter((r: any) => r.status === 'pm_rejected') || [];

  return (
    <ModernLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              My Travel Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track all your travel requests and their current status
            </p>
          </div>
          <Link href="/manager/new-request">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#8b5cf6] to-[#6d28d9] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Pending</p>
                  <p className="text-3xl font-bold text-white mt-1">{pendingRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-[#7c3aed]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-xl gradient-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#1d4ed8] opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">In Progress</p>
                  <p className="text-3xl font-bold text-white mt-1">{approvedRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <MapPin className="w-6 h-6 text-[#2563eb]" />
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
                  <p className="text-3xl font-bold text-white mt-1">{completedRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <FileText className="w-6 h-6 text-[#0ea5e9]" />
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
                  <p className="text-sm font-medium text-white/90">Rejected</p>
                  <p className="text-3xl font-bold text-white mt-1">{rejectedRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <User className="w-6 h-6 text-[#ef4444]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Requests */}
        <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle>All Travel Requests</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${requests?.length || 0} total request(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading requests...</p>
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Est. Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-border">
                    {requests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.origin} → {request.destination}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span className="capitalize">
                            {request.purpose === 'delivery' && request.project?.name ? 
                              request.project.name : 
                              request.purpose === 'other' && request.customPurpose ? 
                                request.customPurpose : 
                                request.purpose
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(request.departureDate).toLocaleDateString()} - {new Date(request.returnDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(getTotalEstimatedCost(request))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No travel requests found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You haven't submitted any travel requests yet
                </p>
                <Link href="/manager/new-request">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
}