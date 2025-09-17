import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
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
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    zohoUserId?: string | number;
  };
}

export default function DocumentManagement() {
  console.log('🔄 DocumentManagement component mounted');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearch();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EmployeeDocument | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
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

  // Fetch users for dropdown (aligned with operations dashboard)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/zoho/users"],
  });

  // Auto-select employee from URL parameter and set filtering
  useEffect(() => {
    if (searchParams) {
      const urlParams = new URLSearchParams(searchParams);
      const employeeId = urlParams.get('employee');
      
      // Set selected employee for filtering (when "View Documents" is clicked)
      setSelectedEmployeeId(employeeId);
      
      if (employeeId && users.length > 0 && !formData.userId && !editingDocument) {
        // Check if the employee exists in the users list
        const employee = users.find((user: any) => user.id === employeeId);
        if (employee) {
          setFormData(prev => ({ ...prev, userId: employeeId }));
          toast({
            title: "Employee Selected",
            description: `Viewing documents for ${employee.firstName} ${employee.lastName}`,
          });
        }
      }
    } else {
      // No URL parameters - show all documents
      setSelectedEmployeeId(null);
    }
  }, [searchParams, users, formData.userId, editingDocument, toast]);

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

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('🚀 handleSave called with form data:', formData);
    
    if (!formData.userId || !formData.documentType || !formData.documentNumber || !formData.issuingCountry || !formData.issueDate || !formData.expiryDate) {
      console.log('❌ Missing required fields');
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // FIXED: Timezone-safe date validation using string comparison
    const toLocalISO = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const todayStr = toLocalISO(new Date());
    
    // Validate dates - CRITICAL VALIDATION BEFORE SAVE
    const issueDate = new Date(formData.issueDate);
    const expiryDate = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔍 Date validation check:', {
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
      issueDateParsed: issueDate,
      expiryDateParsed: expiryDate,
      today: today,
      isExpiryPast: expiryDate <= today,
      isExpiryBeforeIssue: expiryDate <= issueDate,
      timeDiff: expiryDate.getTime() - issueDate.getTime()
    });

    // Check if expiry date is in the past (string comparison)
    if (formData.expiryDate <= todayStr) {
      console.log('❌ VALIDATION FAILED: Expiry date is in the past');
      toast({
        title: "Validation Error",
        description: "Expiry date cannot be in the past. Please select a future date.",
        variant: "destructive",
      });
      return;
    }

    // Check if expiry date is before or same as issue date (string comparison)
    if (formData.issueDate && formData.expiryDate <= formData.issueDate) {
      console.log('❌ VALIDATION FAILED: Expiry date is before or same as issue date');
      toast({
        title: "Validation Error",
        description: "Expiry date must be after the issue date. Please adjust the dates.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Validation passed, calling mutation');
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

  // Filter documents by selected employee if one is selected
  // Handle both Zoho user IDs and local user IDs for filtering
  const filteredDocuments = selectedEmployeeId 
    ? documents.filter(doc => {
        // Check both local user ID and Zoho user ID for matches
        return doc.userId === selectedEmployeeId || 
               (doc.user?.zohoUserId && doc.user.zohoUserId.toString() === selectedEmployeeId);
      })
    : documents;

  const selectedEmployee = selectedEmployeeId && users.length > 0 
    ? users.find((user: any) => user.id === selectedEmployeeId || user.id.toString() === selectedEmployeeId)
    : null;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-white via-teal-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} - Documents` : 'Visa & Passport Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {selectedEmployee 
              ? `Viewing documents for ${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.email})`
              : 'Track employee documents and expiry dates'
            }
          </p>
          {selectedEmployee && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setSelectedEmployeeId(null);
                window.history.pushState({}, '', '/operations-dashboard?tab=documents');
              }}
            >
              ← Back to All Documents
            </Button>
          )}
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => console.log('🔴 Add Document button clicked')}
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
            
            <form onSubmit={(e) => {
              console.log('🚪 Form onSubmit triggered!', e);
              handleSave(e);
            }} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user">Employee *</Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger data-testid="select-employee">
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
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => {
                      const issueDate = new Date(e.target.value);
                      const expiryDate = new Date(formData.expiryDate);
                      
                      // If expiry date is already set and is before new issue date, clear it
                      if (formData.expiryDate && expiryDate <= issueDate) {
                        setFormData(prev => ({ ...prev, issueDate: e.target.value, expiryDate: "" }));
                        toast({
                          title: "Date Updated",
                          description: "Expiry date cleared - please select a date after the issue date",
                        });
                      } else {
                        setFormData(prev => ({ ...prev, issueDate: e.target.value }));
                      }
                    }}
                    data-testid="input-issue-date"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    min={formData.issueDate ? (() => {
                      const toLocalISO = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
                      return toLocalISO(new Date(new Date(formData.issueDate).getTime() + 24 * 60 * 60 * 1000));
                    })() : undefined}
                    onChange={(e) => {
                      // Always update the form state first
                      setFormData(prev => ({ ...prev, expiryDate: e.target.value }));
                      
                      // Show warnings but don't prevent state updates
                      const expiryDate = new Date(e.target.value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (expiryDate <= today) {
                        toast({
                          title: "Warning",
                          description: "Expiry date appears to be in the past",
                          variant: "destructive",
                        });
                      }
                      
                      if (formData.issueDate) {
                        const issueDate = new Date(formData.issueDate);
                        if (expiryDate <= issueDate) {
                          toast({
                            title: "Warning",
                            description: "Expiry date should be after issue date",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    data-testid="input-expiry-date"
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
            

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={saveDocumentMutation.isPending}
                className="bg-gradient-to-r from-electric-blue to-purple hover:from-electric-blue/90 hover:to-purple/90 text-white"
                data-testid="button-save-document"
              >
                {saveDocumentMutation.isPending ? "Saving..." : "Save Document"}
              </Button>
            </DialogFooter>
            </form>
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
            {selectedEmployee 
              ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}'s Documents (${filteredDocuments.length})`
              : `All Documents (${documents.length})`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedEmployee 
                ? `No documents found for ${selectedEmployee.firstName} ${selectedEmployee.lastName}.`
                : 'No documents found. Add the first document to get started.'
              }
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
                {filteredDocuments.map((document) => {
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