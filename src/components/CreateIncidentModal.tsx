import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export interface IncidentFormData {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Contained" | "Resolved" | "Closed" | "False Positive";
  category: string;
  impactedEndpoints: string[];
  sourceIPs: string;
  associatedAlertIds: string[];
  summary: string;
  assignedTo: string;
  containmentActions: string[];
  nextStep: string;
  customerDataExposure: "yes" | "no" | "unknown";
  dataClass: string;
  requiresCustomerNotification: "yes" | "no" | "under review";
  regulatoryImpact: string;
}

interface CreateIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IncidentFormData) => void;
  selectedAlertIds?: string[];
  alerts?: any[];
}

const ATTACK_CATEGORIES = [
  "SQL Injection",
  "Credential Stuffing",
  "Brute Force",
  "LFI/RFI",
  "Exfiltration",
  "Anomalous Traffic",
  "Policy Violation",
];

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  selectedAlertIds = [],
  alerts = [],
}) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<IncidentFormData>({
    title: "",
    severity: "Medium",
    status: "Open",
    category: "",
    impactedEndpoints: [],
    sourceIPs: "",
    associatedAlertIds: selectedAlertIds,
    summary: "",
    assignedTo: "",
    containmentActions: [],
    nextStep: "",
    customerDataExposure: "unknown",
    dataClass: "",
    requiresCustomerNotification: "no",
    regulatoryImpact: "None",
  });
  const [newEndpoint, setNewEndpoint] = useState("");
  const [newContainmentAction, setNewContainmentAction] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await apiService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        associatedAlertIds: selectedAlertIds,
      }));
    }
  }, [open, selectedAlertIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter an incident title.",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
  };

  const addEndpoint = () => {
    if (newEndpoint.trim() && !formData.impactedEndpoints.includes(newEndpoint.trim())) {
      setFormData((prev) => ({
        ...prev,
        impactedEndpoints: [...prev.impactedEndpoints, newEndpoint.trim()],
      }));
      setNewEndpoint("");
    }
  };

  const removeEndpoint = (endpoint: string) => {
    setFormData((prev) => ({
      ...prev,
      impactedEndpoints: prev.impactedEndpoints.filter((e) => e !== endpoint),
    }));
  };

  const addContainmentAction = () => {
    if (newContainmentAction.trim() && !formData.containmentActions.includes(newContainmentAction.trim())) {
      setFormData((prev) => ({
        ...prev,
        containmentActions: [...prev.containmentActions, newContainmentAction.trim()],
      }));
      setNewContainmentAction("");
    }
  };

  const removeContainmentAction = (action: string) => {
    setFormData((prev) => ({
      ...prev,
      containmentActions: prev.containmentActions.filter((a) => a !== action),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Incident</DialogTitle>
          <DialogDescription>
            Create a new security incident with detailed information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Incident Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder='e.g., "SQL Injection Attempts on /login from 44.22.11.5"'
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Severity and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">
                Incident Severity <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, severity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">
                Incident Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Contained">Contained</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="False Positive">False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category / Attack Type</Label>
            <Select
              value={formData.category || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ATTACK_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Impacted Endpoints */}
          <div className="space-y-2">
            <Label>Impacted Endpoint(s) (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., /api/login"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEndpoint();
                  }
                }}
              />
              <Button type="button" onClick={addEndpoint} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {formData.impactedEndpoints.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.impactedEndpoints.map((endpoint) => (
                  <Badge key={endpoint} variant="secondary" className="flex items-center gap-1">
                    {endpoint}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeEndpoint(endpoint)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Source IPs */}
          <div className="space-y-2">
            <Label htmlFor="sourceIPs">Source IP(s) / Actor Fingerprint (Optional)</Label>
            <Textarea
              id="sourceIPs"
              placeholder="Single IP, list of IPs, ASN, country, user-agent fingerprint, etc."
              value={formData.sourceIPs}
              onChange={(e) => setFormData((prev) => ({ ...prev, sourceIPs: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Associated Alert IDs */}
          {formData.associatedAlertIds.length > 0 && (
            <div className="space-y-2">
              <Label>Associated Alert IDs</Label>
              <div className="p-3 bg-muted rounded-md space-y-2">
                {formData.associatedAlertIds.map((alertId) => {
                  const alert = alerts.find((a) => a.id === alertId);
                  return (
                    <div key={alertId} className="text-sm">
                      <Badge variant="outline" className="mr-2">
                        {alertId}
                      </Badge>
                      {alert?.name && (
                        <span className="text-muted-foreground">{alert.name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">
              Summary of Activity or Activity Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="summary"
              placeholder='e.g., "245 failed login attempts from 44.22.11.5 against POST /login across 6 minutes. Pattern matches credential stuffing rule."'
              value={formData.summary}
              onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              rows={4}
              required
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select
              value={formData.assignedTo || "unassigned"}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, assignedTo: value === "unassigned" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Containment Actions */}
          {formData.status === "Contained" && (
            <div className="space-y-2">
              <Label>Containment Actions</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Blocked IP at WAF"
                  value={newContainmentAction}
                  onChange={(e) => setNewContainmentAction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addContainmentAction();
                    }
                  }}
                />
                <Button type="button" onClick={addContainmentAction} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {formData.containmentActions.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.containmentActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <span className="text-sm">{action}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContainmentAction(action)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Next Step */}
          <div className="space-y-2">
            <Label htmlFor="nextStep">Next Step / Owner Note</Label>
            <Textarea
              id="nextStep"
              placeholder="Enter next steps or owner notes..."
              value={formData.nextStep}
              onChange={(e) => setFormData((prev) => ({ ...prev, nextStep: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Compliance Section */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold">Compliance (Optional)</h3>

            <div className="space-y-2">
              <Label>Customer Data Exposure Suspected?</Label>
              <Select
                value={formData.customerDataExposure}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, customerDataExposure: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.customerDataExposure === "yes" && (
              <div className="space-y-2">
                <Label htmlFor="dataClass">What data class?</Label>
                <Select
                  value={formData.dataClass}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, dataClass: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PII">PII</SelectItem>
                    <SelectItem value="credentials">Credentials</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Requires Customer Notification?</Label>
              <Select
                value={formData.requiresCustomerNotification}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, requiresCustomerNotification: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="under review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Regulatory Impact</Label>
              <Select
                value={formData.regulatoryImpact}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, regulatoryImpact: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="SOC 2">SOC 2</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="PCI">PCI</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Incident</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIncidentModal;

