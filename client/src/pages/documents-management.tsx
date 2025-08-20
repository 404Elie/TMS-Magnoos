import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { FileText, AlertTriangle, CheckCircle2, Clock, Plus, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import type { DocumentTracking, User } from "@shared/schema";

// Document form schema
const documentSchema = z.object({
  userId: z.string().min(1, "User is required"),
  documentType: z.enum(["passport", "visa"]),
  documentNumber: z.string().min(1, "Document number is required"),
  countryCode: z.string().min(2, "Country code is required"),
  issuedDate: z.string().min(1, "Issued date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  notes: z.string().optional(),
});

type DocumentForm = z.infer<typeof documentSchema>;

export default function DocumentsManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentTracking | null>(null);
  const { toast } = useToast();

  const form = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      documentType: "passport",
      notes: "",
    },
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<DocumentTracking[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch users for the dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Add document mutation
  const addDocumentMutation = useMutation({
    mutationFn: async (data: DocumentForm) => {
      const response = await apiRequest("POST", "/api/documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Document added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDocumentStatus = (document: DocumentTracking) => {
    const today = new Date();
    const expiryDate = new Date(document.expiryDate);
    const daysUntilExpiry = differenceInDays(expiryDate, today);

    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 30) return "expiring_soon";
    return "active";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "expired": return "destructive";
      case "expiring_soon": return "outline";
      case "active": return "default";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "expired": return <AlertTriangle className="w-4 h-4" />;
      case "expiring_soon": return <Clock className="w-4 h-4" />;
      case "active": return <CheckCircle2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const onSubmit = (data: DocumentForm) => {
    addDocumentMutation.mutate(data);
  };

  if (documentsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-lg">Loading documents...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents Management</h1>
            <p className="text-muted-foreground">Track passports and visas for all employees</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-document">
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
                <DialogDescription>
                  Add a passport or visa record for tracking expiration dates.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="userId">Employee</Label>
                    <Select onValueChange={(value) => form.setValue("userId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select onValueChange={(value: "passport" | "visa") => form.setValue("documentType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="visa">Visa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="documentNumber">Document Number</Label>
                      <Input {...form.register("documentNumber")} placeholder="Enter document number" />
                    </div>
                    <div>
                      <Label htmlFor="countryCode">Country Code</Label>
                      <Input {...form.register("countryCode")} placeholder="e.g., US, SA" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="issuedDate">Issued Date</Label>
                      <Input {...form.register("issuedDate")} type="date" />
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input {...form.register("expiryDate")} type="date" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea {...form.register("notes")} placeholder="Additional notes..." />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addDocumentMutation.isPending}>
                    {addDocumentMutation.isPending ? "Adding..." : "Add Document"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
            <CardDescription>
              Track passports and visas with expiration alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Document Number</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No documents found. Add the first document to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((document) => {
                      const user = users.find(u => u.id === document.userId);
                      const status = getDocumentStatus(document);
                      const expiryDate = new Date(document.expiryDate);
                      const daysUntilExpiry = differenceInDays(expiryDate, new Date());
                      
                      return (
                        <TableRow key={document.id}>
                          <TableCell className="font-medium">
                            {user ? `${user.firstName} ${user.lastName}` : "Unknown User"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {document.documentType === "passport" ? "Passport" : "Visa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {document.documentNumber}
                          </TableCell>
                          <TableCell className="uppercase">
                            {document.countryCode}
                          </TableCell>
                          <TableCell>
                            {format(expiryDate, "MMM dd, yyyy")}
                            {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                              <div className="text-xs text-orange-600 mt-1">
                                {daysUntilExpiry} days left
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(status)}
                              {status === "expired" ? "Expired" : 
                               status === "expiring_soon" ? "Expiring Soon" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedDocument(document)}
                              data-testid={`button-view-${document.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Document Dialog */}
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Document Details</DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <p className="text-sm font-medium">
                      {users.find(u => u.id === selectedDocument.userId)?.firstName} {users.find(u => u.id === selectedDocument.userId)?.lastName || "Unknown User"}
                    </p>
                  </div>
                  <div>
                    <Label>Document Type</Label>
                    <p className="text-sm font-medium capitalize">{selectedDocument.documentType}</p>
                  </div>
                  <div>
                    <Label>Document Number</Label>
                    <p className="text-sm font-mono">{selectedDocument.documentNumber}</p>
                  </div>
                  <div>
                    <Label>Country</Label>
                    <p className="text-sm font-medium uppercase">{selectedDocument.countryCode}</p>
                  </div>
                  <div>
                    <Label>Issued Date</Label>
                    <p className="text-sm">{format(new Date(selectedDocument.issuedDate), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <p className="text-sm">{format(new Date(selectedDocument.expiryDate), "MMM dd, yyyy")}</p>
                  </div>
                </div>
                {selectedDocument.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm">{selectedDocument.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setSelectedDocument(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}