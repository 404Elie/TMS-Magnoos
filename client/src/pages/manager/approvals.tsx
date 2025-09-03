import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ModernLayout from "@/components/ModernLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckSquare, Clock, MapPin, Calendar, DollarSign, User, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Approvals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState("");
  const [operationsTeam, setOperationsTeam] = useState<'operations_ksa' | 'operations_uae' | ''>('');

  // Fetch pending approval requests
  const { data: pendingRequests, isLoading } = useQuery({
    queryKey: ["/api/travel-requests", { needsApproval: true }],
  });

  // Ensure pendingRequests is always an array
  const requestsArray = Array.isArray(pendingRequests) ? pendingRequests : [];

  const approveMutation = useMutation({
    mutationFn: async (data: { requestId: string; action: 'approve' | 'reject'; comments?: string; assignedOperationsTeam?: string }) => {
      return await apiRequest("PATCH", `/api/travel-requests/${data.requestId}/${data.action}`, {
        comments: data.comments,
        assignedOperationsTeam: data.assignedOperationsTeam,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Request ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
      setSelectedRequest(null);
      setActionType(null);
      setComments("");
      setOperationsTeam('');
      // Invalidate all travel request queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/travel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      // Force refetch of pending approvals specifically
      queryClient.refetchQueries({ queryKey: ["/api/travel-requests", { needsApproval: true }] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const handleAction = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;

    approveMutation.mutate({
      requestId: selectedRequest.id,
      action: actionType,
      comments: comments || undefined,
      assignedOperationsTeam: actionType === 'approve' ? operationsTeam || undefined : undefined,
    });
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

  return (
    <ModernLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-blue-600" />
            Travel Request Approvals
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Review and approve pending travel requests from your team
          </p>
        </div>

        {/* Pending Requests */}
        <Card className="bg-transparent border-border/20 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${requestsArray.length || 0} request(s) awaiting your approval`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading requests...</p>
              </div>
            ) : requestsArray.length > 0 ? (
              <div className="space-y-6">
                {requestsArray.map((request: any) => (
                  <div key={request.id} className="border border-border/30 rounded-lg p-6 bg-background/50">
                    {/* Request Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.traveler?.firstName} {request.traveler?.lastName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {request.traveler?.email}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Pending Approval
                      </Badge>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Route</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.origin} → {request.destination}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Dates</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(request.departureDate).toLocaleDateString()} - {new Date(request.returnDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Estimated Cost</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(getTotalEstimatedCost(request))}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Purpose</p>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {request.purpose === 'delivery' && request.project?.name ? 
                              request.project.name : 
                              request.purpose === 'other' && request.customPurpose ? 
                                request.customPurpose : 
                                request.purpose
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {request.notes && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Notes:</p>
                        <p className="text-gray-900 dark:text-white">{request.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => handleAction(request, 'reject')}
                      >
                        Reject
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAction(request, 'approve')}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No pending approvals
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  All travel requests have been processed
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
          setComments("");
          setOperationsTeam('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve' : 'Reject'} Travel Request
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? 'This request will be sent to the operations team for booking'
                  : 'This request will be rejected and returned to the requester'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Operations Team Selection for Approvals */}
              {actionType === 'approve' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Assign to Operations Team
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="operationsTeam"
                        value="operations_ksa"
                        checked={operationsTeam === 'operations_ksa'}
                        onChange={(e) => setOperationsTeam(e.target.value as 'operations_ksa')}
                        className="text-blue-600"
                      />
                      <span className="text-gray-900 dark:text-white">Operations KSA</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="operationsTeam"
                        value="operations_uae"
                        checked={operationsTeam === 'operations_uae'}
                        onChange={(e) => setOperationsTeam(e.target.value as 'operations_uae')}
                        className="text-blue-600"
                      />
                      <span className="text-gray-900 dark:text-white">Operations UAE</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Comments (Optional)
                </label>
                <Textarea
                  placeholder={actionType === 'approve' ? 
                    "Add any special instructions for the operations team..." : 
                    "Provide reason for rejection..."
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionType(null);
                    setComments("");
                    setOperationsTeam('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAction}
                  disabled={approveMutation.isPending || (actionType === 'approve' && !operationsTeam)}
                  className={actionType === 'approve' ? 
                    "bg-green-600 hover:bg-green-700 text-white" : 
                    "bg-red-600 hover:bg-red-700 text-white"
                  }
                >
                  {approveMutation.isPending ? "Processing..." : 
                    actionType === 'approve' ? 'Approve Request' : 'Reject Request'
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModernLayout>
  );
}