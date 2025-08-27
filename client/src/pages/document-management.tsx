import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, AlertTriangle, Calendar, Edit, Trash2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmployeeDocument {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function DocumentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EmployeeDocument | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [formData, setFormData] = useState({
    userId: "",
    documentType: "",
    documentNumber: "",
    issuingCountry: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<EmployeeDocument[]>({
    queryKey: ["/api/employee-documents"],
  });

  // Fetch users for dropdown
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Create/Update document mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingDocument) {
        return await apiRequest("PUT", `/api/employee-documents/${editingDocument.id}`, data);
      } else {
        return await apiRequest("POST", "/api/employee-documents", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents"] });
      toast({
        title: "Success",
        description: editingDocument ? "Document updated successfully" : "Document created successfully",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save document",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/employee-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      userId: "",
      documentType: "",
      documentNumber: "",
      issuingCountry: "",
      issueDate: "",
      expiryDate: "",
      notes: "",
    });
    setEditingDocument(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (document: EmployeeDocument) => {
    setEditingDocument(document);
    setFormData({
      userId: document.userId,
      documentType: document.documentType,
      documentNumber: document.documentNumber,
      issuingCountry: document.issuingCountry,
      issueDate: document.issueDate.split('T')[0],
      expiryDate: document.expiryDate.split('T')[0],
      notes: document.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.userId || !formData.documentType || !formData.documentNumber || !formData.issuingCountry || !formData.issueDate || !formData.expiryDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    saveDocumentMutation.mutate(formData);
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "destructive", text: "Expired" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring-soon", color: "destructive", text: `Expires in ${daysUntilExpiry} days` };
    } else if (daysUntilExpiry <= 90) {
      return { status: "warning", color: "secondary", text: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: "valid", color: "default", text: `Valid for ${daysUntilExpiry} days` };
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "passport":
        return "🛂";
      case "visa":
        return "📋";
      case "emirates_id":
        return "🆔";
      case "iqama":
        return "📄";
      default:
        return "📄";
    }
  };

  const expiringDocuments = documents.filter(doc => {
    const daysUntilExpiry = differenceInDays(parseISO(doc.expiryDate), new Date());
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  });

  const expiredDocuments = documents.filter(doc => {
    const daysUntilExpiry = differenceInDays(parseISO(doc.expiryDate), new Date());
    return daysUntilExpiry < 0;
  });

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-white via-teal-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Visa & Passport Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track employee documents and expiry dates
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-electric-blue to-purple hover:from-electric-blue/90 hover:to-purple/90 text-white"
              data-testid="button-add-document"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? "Edit Document" : "Add New Document"}
              </DialogTitle>
              <DialogDescription>
                {editingDocument ? "Update document information" : "Add a new visa or passport document"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user">Employee *</Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="emirates_id">Emirates ID</SelectItem>
                    <SelectItem value="iqama">Iqama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="documentNumber">Document Number *</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Enter document number"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="issuingCountry">Issuing Country *</Label>
                <Input
                  id="issuingCountry"
                  value={formData.issuingCountry}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuingCountry: e.target.value }))}
                  placeholder="Enter issuing country"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issueDate">Start Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">End Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => {
                      const expiryDate = new Date(e.target.value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (expiryDate <= today) {
                        toast({
                          title: "Invalid Date",
                          description: "Cannot add expired passport - end date must be in the future",
                          variant: "destructive",
                        });
                        return;
                      }
                      setFormData(prev => ({ ...prev, expiryDate: e.target.value }));
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saveDocumentMutation.isPending}
                className="bg-gradient-to-r from-electric-blue to-purple hover:from-electric-blue/90 hover:to-purple/90 text-white"
              >
                {saveDocumentMutation.isPending ? "Saving..." : "Save Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Cards */}
      {(expiredDocuments.length > 0 || expiringDocuments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredDocuments.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-5 w-5" />
                  Expired Documents ({expiredDocuments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiredDocuments.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="text-sm text-red-600 dark:text-red-400">
                      {getDocumentTypeIcon(doc.documentType)} {doc.user?.firstName} {doc.user?.lastName} - {doc.documentType}
                    </div>
                  ))}
                  {expiredDocuments.length > 3 && (
                    <div className="text-sm text-red-500 dark:text-red-400">
                      + {expiredDocuments.length - 3} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiringDocuments.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <Calendar className="h-5 w-5" />
                  Expiring Soon ({expiringDocuments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringDocuments.slice(0, 3).map((doc) => {
                    const daysUntilExpiry = differenceInDays(parseISO(doc.expiryDate), new Date());
                    return (
                      <div key={doc.id} className="text-sm text-yellow-600 dark:text-yellow-400">
                        {getDocumentTypeIcon(doc.documentType)} {doc.user?.firstName} {doc.user?.lastName} - {daysUntilExpiry} days
                      </div>
                    );
                  })}
                  {expiringDocuments.length > 3 && (
                    <div className="text-sm text-yellow-500 dark:text-yellow-400">
                      + {expiringDocuments.length - 3} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Documents Table */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-teal-200 dark:border-teal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents found. Add the first document to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Issuing Country</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => {
                  const expiryStatus = getExpiryStatus(document.expiryDate);
                  return (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="font-medium">
                          {document.user?.firstName} {document.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {document.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getDocumentTypeIcon(document.documentType)}</span>
                          <span className="capitalize">{document.documentType.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{document.documentNumber}</TableCell>
                      <TableCell>{document.issuingCountry}</TableCell>
                      <TableCell>{format(parseISO(document.issueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(parseISO(document.expiryDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={expiryStatus.color as any}>
                          {expiryStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(document)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDocumentMutation.mutate(document.id)}
                            disabled={deleteDocumentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}