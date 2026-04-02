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
import {
  X,
  Plus,
  AlertTriangle,
  Shield,
  FileText,
  User,
  Clock,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export type IncidentEndpoint =
  | string
  | {
      id?: string;
      path?: string;
      name?: string;
      method?: string;
    };

export interface IncidentFormData {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Contained" | "Resolved" | "Closed" | "False Positive";
  category: string;
  impactedEndpoints: IncidentEndpoint[];
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

const createInitialFormData = (selectedAlertIds: string[] = []): IncidentFormData => ({
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

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  selectedAlertIds = [],
  alerts = [],
}) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<IncidentFormData>(() =>
    createInitialFormData(selectedAlertIds)
  );
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
    if (!open) return;

    setFormData(createInitialFormData(selectedAlertIds));
    setNewEndpoint("");
    setNewContainmentAction("");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setFormData((prev) => ({
      ...prev,
      associatedAlertIds: selectedAlertIds,
    }));
  }, [selectedAlertIds, open]);

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
    if (
      newContainmentAction.trim() &&
      !formData.containmentActions.includes(newContainmentAction.trim())
    ) {
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

  const inputClassName =
    "rounded-xl border-slate-200/70 bg-white/90 shadow-sm placeholder:text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/80";
  const sectionClassName =
    "rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl dark:border-slate-800/60 dark:bg-slate-900">
        <DialogHeader className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-6 text-left dark:border-slate-800/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_32%)]" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                Incident Workflow
              </Badge>
              {formData.associatedAlertIds.length > 0 && (
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  {formData.associatedAlertIds.length} linked alert
                  {formData.associatedAlertIds.length === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            <DialogTitle className="mt-4 text-2xl font-bold text-white">
              Create New Incident
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl text-blue-100">
              Capture incident context, affected endpoints, response ownership, and compliance details in one structured report.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div className={sectionClassName}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Incident Overview
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Describe the event and define its current severity and state.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
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
                      className={inputClassName}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectTrigger className={inputClassName}>
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
                        <SelectTrigger className={inputClassName}>
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

                  <div className="space-y-2">
                    <Label htmlFor="category">Category / Attack Type</Label>
                    <Select
                      value={formData.category || undefined}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className={inputClassName}>
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

                  <div className="space-y-2">
                    <Label htmlFor="summary">
                      Summary of Activity or Activity Notes <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="summary"
                      placeholder='e.g., "245 failed login attempts from 44.22.11.5 against POST /login across 6 minutes. Pattern matches credential stuffing rule."'
                      value={formData.summary}
                      onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                      rows={5}
                      required
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>

              <div className={sectionClassName}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Scope And Indicators
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Track affected endpoints, source indicators, and linked alert records.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Impacted Endpoint(s) (Optional)</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        className={inputClassName}
                      />
                      <Button type="button" onClick={addEndpoint} variant="outline" className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {formData.impactedEndpoints.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.impactedEndpoints.map((endpoint, index) => {
                          if (typeof endpoint !== "string") return null;

                          return (
                            <Badge
                              key={`${endpoint}-${index}`}
                              variant="secondary"
                              className="flex items-center gap-2 rounded-full px-3 py-1"
                            >
                              {endpoint}
                              <X
                                className="h-3.5 w-3.5 cursor-pointer"
                                onClick={() => removeEndpoint(endpoint)}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sourceIPs">Source IP(s) / Actor Fingerprint (Optional)</Label>
                    <Textarea
                      id="sourceIPs"
                      placeholder="Single IP, list of IPs, ASN, country, user-agent fingerprint, etc."
                      value={formData.sourceIPs}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sourceIPs: e.target.value }))}
                      rows={3}
                      className={inputClassName}
                    />
                  </div>

                  {formData.associatedAlertIds.length > 0 && (
                    <div className="space-y-2">
                      <Label>Associated Alert IDs</Label>
                      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <div className="space-y-2">
                          {formData.associatedAlertIds.map((alertId) => {
                            const alert = alerts.find((a) => a.id === alertId);
                            return (
                              <div
                                key={alertId}
                                className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-slate-50/70 px-3 py-3 dark:border-slate-700/60 dark:bg-slate-800/40"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{alertId}</Badge>
                                  {alert?.name && (
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                      {alert.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {formData.status === "Contained" && (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-500/20">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Containment Actions
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Record the defensive measures already taken for this incident.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        className={inputClassName}
                      />
                      <Button type="button" onClick={addContainmentAction} variant="outline" className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {formData.containmentActions.length > 0 && (
                      <div className="space-y-2">
                        {formData.containmentActions.map((action, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white/80 px-3 py-3 dark:border-amber-500/20 dark:bg-slate-900/50"
                          >
                            <span className="text-sm text-slate-700 dark:text-slate-300">{action}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContainmentAction(action)}
                              className="rounded-lg"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className={sectionClassName}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                    <User className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Ownership
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Assign follow-up responsibility and record the next step.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Select
                      value={formData.assignedTo || "unassigned"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          assignedTo: value === "unassigned" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className={inputClassName}>
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

                  <div className="space-y-2">
                    <Label htmlFor="nextStep">Next Step / Owner Note</Label>
                    <Textarea
                      id="nextStep"
                      placeholder="Enter next steps or owner notes..."
                      value={formData.nextStep}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nextStep: e.target.value }))}
                      rows={4}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>

              <div className={sectionClassName}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-500/10">
                    <FileText className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Compliance
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Capture breach exposure and notification considerations.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Customer Data Exposure Suspected?</Label>
                    <Select
                      value={formData.customerDataExposure}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, customerDataExposure: value }))
                      }
                    >
                      <SelectTrigger className={inputClassName}>
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
                        <SelectTrigger className={inputClassName}>
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
                        setFormData((prev) => ({
                          ...prev,
                          requiresCustomerNotification: value,
                        }))
                      }
                    >
                      <SelectTrigger className={inputClassName}>
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
                      <SelectTrigger className={inputClassName}>
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
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-slate-950 p-5 text-white dark:border-slate-700/60">
                <p className="text-xs uppercase tracking-wide text-slate-300">Quick Summary</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">Severity</span>
                    <span className="font-semibold">{formData.severity}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">Status</span>
                    <span className="font-semibold">{formData.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">Endpoints</span>
                    <span className="font-semibold">{formData.impactedEndpoints.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">Linked Alerts</span>
                    <span className="font-semibold">{formData.associatedAlertIds.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-5 dark:border-slate-800/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              Create Incident
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIncidentModal;
