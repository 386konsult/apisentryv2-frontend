import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Eye,
  Shield,
  Clock,
  Activity,
  Download,
  Filter,
  X,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { usePlatform } from "@/contexts/PlatformContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// =============================================================================
// Types
// =============================================================================
export interface IncidentFormData {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Contained" | "Resolved" | "Closed" | "False Positive";
  category: string;
  impactedEndpoints: (string | { id?: string; path?: string; name?: string; method?: string })[];
  sourceIPs: string;
  associatedAlertIds: string[];
  summary: string;
  assignedTo: string;
  containmentActions: string[];
  nextStep: string;
  customerDataExposure: "yes" | "no" | "unknown";
  dataClass: string;
  requiresCustomerNotification: "yes" | "no" | "unknown";
  regulatoryImpact: string;
  responseNote?: string;
  actionsTaken?: string;
  lessonsLearned?: string;
}

interface Incident extends IncidentFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

type IncidentEndpoint = IncidentFormData["impactedEndpoints"][number];

const getEndpointDisplay = (endpoint: IncidentEndpoint) => {
  if (typeof endpoint === "string") return endpoint;
  if (!endpoint) return "Unknown endpoint";
  return (
    endpoint.path ||
    endpoint.name ||
    `${endpoint.method || ""} ${endpoint.path || ""}`.trim() ||
    "Unknown endpoint"
  );
};

const getEndpointKey = (endpoint: IncidentEndpoint, index: number) => {
  if (typeof endpoint === "string") return `${endpoint}-${index}`;
  return endpoint?.id || endpoint?.path || endpoint?.name || `endpoint-${index}`;
};

// =============================================================================
// CreateIncidentModal (frosted redesign)
// =============================================================================
interface CreateIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IncidentFormData) => void;
}

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<IncidentFormData>({
    title: "",
    severity: "Medium",
    status: "Open",
    category: "",
    impactedEndpoints: [],
    sourceIPs: "",
    associatedAlertIds: [],
    summary: "",
    assignedTo: "",
    containmentActions: [],
    nextStep: "",
    customerDataExposure: "unknown",
    dataClass: "",
    requiresCustomerNotification: "no",
    regulatoryImpact: "None",
  });

  const addContainmentAction = () => {
    setFormData((prev) => ({
      ...prev,
      containmentActions: [...prev.containmentActions, ""],
    }));
  };

  const updateContainmentAction = (index: number, value: string) => {
    const updated = [...formData.containmentActions];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, containmentActions: updated }));
  };

  const removeContainmentAction = (index: number) => {
    const updated = formData.containmentActions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, containmentActions: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-0 shadow-2xl" style={{ willChange: 'auto' }}>
  <motion.div
    initial={{ opacity: 0, y: -8, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.96 }}
    transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.7 }}
    style={{ willChange: 'auto' }}
  >
          <DialogHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-transparent px-6 py-5 dark:border-slate-700/60 dark:from-slate-800/30">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Create New Incident
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Capture incident context, affected endpoints, and compliance details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Incident Overview */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Incident Overview
              </h3>
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, severity: val })
                    }
                  >
                    <SelectTrigger className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50">
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
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <SelectTrigger className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50">
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
            </div>

            {/* Category */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-2">
              <Label htmlFor="category">Category / Attack Type</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., SQL Injection, Credential Stuffing"
                className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
              />
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-2">
              <Label htmlFor="summary">Summary of Activity *</Label>
              <Textarea
                id="summary"
                rows={4}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                required
                placeholder="Describe the incident..."
                className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
              />
            </div>

            {/* Scope */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Scope And Indicators
              </h3>
              <div className="space-y-2">
                <Label htmlFor="impactedEndpoints">Impacted Endpoint(s)</Label>
                <Input
                  id="impactedEndpoints"
                  value={formData.impactedEndpoints.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impactedEndpoints: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="/api/login, /api/users"
                  className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceIPs">Source IPs / Actor Fingerprint</Label>
                <Input
                  id="sourceIPs"
                  value={formData.sourceIPs}
                  onChange={(e) => setFormData({ ...formData, sourceIPs: e.target.value })}
                  placeholder="e.g., 44.22.11.5, 192.168.1.100"
                  className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                />
              </div>
            </div>

            {/* Ownership */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ownership
              </h3>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Team member name or email"
                  className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextStep">Next Step / Owner Note</Label>
                <Textarea
                  id="nextStep"
                  rows={2}
                  value={formData.nextStep}
                  onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                  placeholder="Describe the next action..."
                  className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                />
              </div>
            </div>

            {/* Compliance */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Data Exposure Suspected?</Label>
                  <Select
                    value={formData.customerDataExposure}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, customerDataExposure: val })
                    }
                  >
                    <SelectTrigger className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Class (if applicable)</Label>
                  <Input
                    value={formData.dataClass}
                    onChange={(e) => setFormData({ ...formData, dataClass: e.target.value })}
                    placeholder="e.g., PII, Health, Financial"
                    className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Requires Customer Notification?</Label>
                  <Select
                    value={formData.requiresCustomerNotification}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, requiresCustomerNotification: val })
                    }
                  >
                    <SelectTrigger className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Regulatory Impact</Label>
                  <Input
                    value={formData.regulatoryImpact}
                    onChange={(e) => setFormData({ ...formData, regulatoryImpact: e.target.value })}
                    placeholder="GDPR, CCPA, HIPAA, etc."
                    className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
              </div>
            </div>

            {/* Containment Actions */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Containment Actions
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContainmentAction}
                  className="rounded-full border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  + Add Action
                </Button>
              </div>
              <AnimatePresence>
                {formData.containmentActions.map((action, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 items-start"
                  >
                    <Input
                      value={action}
                      onChange={(e) => updateContainmentAction(idx, e.target.value)}
                      placeholder={`Action ${idx + 1}`}
                      className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContainmentAction(idx)}
                      className="h-10 w-10 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-200/60 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                Create Incident
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// UpdateIncidentModal (frosted redesign)
// =============================================================================
interface UpdateIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IncidentFormData) => void;
  incident: Incident;
}

const UpdateIncidentModal: React.FC<UpdateIncidentModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  incident,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<IncidentFormData>({
    title: incident.title,
    severity: incident.severity as any,
    status: incident.status as any,
    category: incident.category,
    impactedEndpoints: Array.isArray(incident.impactedEndpoints) ? [...incident.impactedEndpoints] : [],
    sourceIPs: incident.sourceIPs,
    associatedAlertIds: Array.isArray(incident.associatedAlertIds) ? [...incident.associatedAlertIds] : [],
    summary: incident.summary,
    assignedTo: incident.assignedTo,
    containmentActions: Array.isArray(incident.containmentActions) ? [...incident.containmentActions] : [],
    nextStep: incident.nextStep,
    customerDataExposure: incident.customerDataExposure as any,
    dataClass: incident.dataClass,
    requiresCustomerNotification: incident.requiresCustomerNotification as any,
    regulatoryImpact: incident.regulatoryImpact,
  });
  const [responseNote, setResponseNote] = useState(incident.responseNote || "");
  const [actionsTaken, setActionsTaken] = useState(incident.actionsTaken || "");
  const [lessonsLearned, setLessonsLearned] = useState(incident.lessonsLearned || "");

  useEffect(() => {
    if (!open) return;
    setFormData({
      title: incident.title,
      severity: incident.severity as any,
      status: incident.status as any,
      category: incident.category,
      impactedEndpoints: Array.isArray(incident.impactedEndpoints) ? [...incident.impactedEndpoints] : [],
      sourceIPs: incident.sourceIPs,
      associatedAlertIds: Array.isArray(incident.associatedAlertIds) ? [...incident.associatedAlertIds] : [],
      summary: incident.summary,
      assignedTo: incident.assignedTo,
      containmentActions: Array.isArray(incident.containmentActions) ? [...incident.containmentActions] : [],
      nextStep: incident.nextStep,
      customerDataExposure: incident.customerDataExposure as any,
      dataClass: incident.dataClass,
      requiresCustomerNotification: incident.requiresCustomerNotification as any,
      regulatoryImpact: incident.regulatoryImpact,
    });
    setResponseNote(incident.responseNote || "");
    setActionsTaken(incident.actionsTaken || "");
    setLessonsLearned(incident.lessonsLearned || "");
  }, [incident, open]);

  const addContainmentAction = () => {
    setFormData((prev) => ({
      ...prev,
      containmentActions: [...prev.containmentActions, ""],
    }));
  };

  const updateContainmentAction = (index: number, value: string) => {
    const updated = [...formData.containmentActions];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, containmentActions: updated }));
  };

  const removeContainmentAction = (index: number) => {
    const updated = formData.containmentActions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, containmentActions: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status === "Closed") {
      if (!responseNote || !actionsTaken || !lessonsLearned) {
        toast({
          title: "Missing required fields",
          description: "Please fill in Response Note, Actions Taken, and Lessons Learned when closing an incident.",
          variant: "destructive",
        });
        return;
      }
      onSubmit({ ...formData, responseNote, actionsTaken, lessonsLearned });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-0 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <DialogHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-transparent px-6 py-5 dark:border-slate-700/60 dark:from-slate-800/30">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Update Incident
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Edit incident details and closure information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Incident Overview
              </h3>
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(val: any) => setFormData({ ...formData, severity: val })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50">
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
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50">
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
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-2">
              <Label htmlFor="summary">Summary of Activity *</Label>
              <Textarea
                id="summary"
                rows={4}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                required
                className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Containment Actions
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContainmentAction}
                  className="rounded-full border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  + Add Action
                </Button>
              </div>
              <AnimatePresence>
                {formData.containmentActions.map((action, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 items-start"
                  >
                    <Input
                      value={action}
                      onChange={(e) => updateContainmentAction(idx, e.target.value)}
                      placeholder={`Action ${idx + 1}`}
                      className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContainmentAction(idx)}
                      className="h-10 w-10 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {formData.status === "Closed" && (
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 dark:bg-emerald-500/10 backdrop-blur-sm p-5 space-y-4">
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
                    Closure Details
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Required when closing an incident.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responseNote">Response Note *</Label>
                  <Textarea
                    id="responseNote"
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    rows={3}
                    required
                    className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionsTaken">Actions Taken *</Label>
                  <Textarea
                    id="actionsTaken"
                    value={actionsTaken}
                    onChange={(e) => setActionsTaken(e.target.value)}
                    rows={4}
                    required
                    className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessonsLearned">Lessons Learned *</Label>
                  <Textarea
                    id="lessonsLearned"
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    rows={4}
                    required
                    className="rounded-xl border-slate-200/60 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-200/60 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                Update Incident
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// ViewIncidentDialog (frosted redesign)
// =============================================================================
interface ViewIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: Incident;
}

const ViewIncidentDialog: React.FC<ViewIncidentDialogProps> = ({
  open,
  onOpenChange,
  incident,
}) => {
  const severityClass = (() => {
    switch (incident.severity) {
      case "Critical": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800";
    }
  })();
  const statusClass = (() => {
    switch (incident.status) {
      case "Open": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "In Progress": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Contained": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Resolved": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Closed": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "False Positive": return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
      default: return "bg-gray-100 text-gray-800";
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-0 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <DialogHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-transparent px-6 py-5 dark:border-slate-700/60 dark:from-slate-800/30">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              {incident.title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Complete incident details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            <div className="flex flex-wrap gap-2">
              <Badge className={severityClass}>{incident.severity}</Badge>
              <Badge className={statusClass}>{incident.status}</Badge>
              {incident.category && (
                <Badge variant="outline" className="rounded-full border-slate-200/60 bg-white/30 dark:bg-slate-800/30">
                  {incident.category}
                </Badge>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4">
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {new Date(incident.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4">
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {new Date(incident.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5">
              <Label className="text-xs font-medium text-muted-foreground">Summary</Label>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{incident.summary}</p>
            </div>

            {incident.impactedEndpoints.length > 0 && (
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5">
                <Label className="text-xs font-medium text-muted-foreground">Impacted Endpoints</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {incident.impactedEndpoints.map((ep, idx) => (
                    <Badge key={getEndpointKey(ep, idx)} variant="secondary" className="rounded-full bg-slate-100 dark:bg-slate-700">
                      {getEndpointDisplay(ep)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {incident.sourceIPs && (
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5">
                <Label className="text-xs font-medium text-muted-foreground">Source IPs</Label>
                <p className="mt-3 font-mono text-sm text-slate-700 dark:text-slate-300">{incident.sourceIPs}</p>
              </div>
            )}

            {incident.status === "Closed" && (
              <>
                {incident.responseNote && (
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 dark:bg-emerald-500/10 backdrop-blur-sm p-5">
                    <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Response Note</Label>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{incident.responseNote}</p>
                  </div>
                )}
                {incident.actionsTaken && (
                  <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5">
                    <Label className="text-xs font-medium text-muted-foreground">Actions Taken</Label>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{incident.actionsTaken}</p>
                  </div>
                )}
                {incident.lessonsLearned && (
                  <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5">
                    <Label className="text-xs font-medium text-muted-foreground">Lessons Learned</Label>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{incident.lessonsLearned}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// Main Incidents Component
// =============================================================================
const Incidents = () => {
  const { selectedPlatformId } = usePlatform();
  const [platform, setPlatform] = useState<any>(null);
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeQueueOnly, setActiveQueueOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Fetch platform details
  useEffect(() => {
    if (!selectedPlatformId) {
      setPlatform(null);
      return;
    }
    let mounted = true;
    apiService
      .getPlatformDetails(selectedPlatformId)
      .then((data) => {
        if (mounted) setPlatform(data);
      })
      .catch(() => {
        if (mounted) setPlatform(null);
      });
    return () => {
      mounted = false;
    };
  }, [selectedPlatformId]);

  const fetchIncidents = React.useCallback(async () => {
    setLoading(true);
    try {
      const platformId = selectedPlatformId || localStorage.getItem("selected_platform_id");
      const data = await apiService.getIncidents(platformId || undefined);
      const normalized = (data || []).map((it: any) => ({
        id: it.id,
        title: it.title,
        severity: it.severity,
        status: it.status,
        category: it.category,
        impactedEndpoints: it.impacted_endpoints || it.impactedEndpoints || [],
        sourceIPs: it.source_ips || it.sourceIPs || "",
        associatedAlertIds: it.associated_alert_ids || it.associatedAlertIds || [],
        summary: it.summary || "",
        assignedTo: it.assigned_to || it.assignedTo || "",
        containmentActions: it.containment_actions || it.containmentActions || [],
        nextStep: it.next_step || it.nextStep || "",
        customerDataExposure: it.customer_data_exposure || it.customerDataExposure || "unknown",
        dataClass: it.data_class || it.dataClass || "",
        requiresCustomerNotification:
          it.requires_customer_notification || it.requiresCustomerNotification || "no",
        regulatoryImpact: it.regulatory_impact || it.regulatoryImpact || "None",
        createdAt: it.created_at || it.createdAt || new Date().toISOString(),
        updatedAt: it.updated_at || it.updatedAt || new Date().toISOString(),
        responseNote: it.response_note || it.responseNote,
        actionsTaken: it.actions_taken || it.actionsTaken,
        lessonsLearned: it.lessons_learned || it.lessonsLearned,
      }));
      setIncidents(normalized);
    } catch (error: any) {
      console.error("Incidents: error fetching incidents", error);
      toast({
        title: "Error loading incidents",
        description: error?.message || "Could not fetch incidents",
        variant: "destructive",
      });
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatformId, toast]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const filteredIncidents = incidents.filter((incident) => {
    if (activeQueueOnly) {
      const activeStatuses = ["Open", "In Progress", "Contained", "Resolved"];
      if (!activeStatuses.includes(incident.status)) return false;
    }
    const title = (incident.title || "").toLowerCase();
    const summary = (incident.summary || "").toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = title.includes(q) || summary.includes(q);
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleCreateIncident = async (data: IncidentFormData) => {
    try {
      setLoading(true);
      const platformId = platform?.id || localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      const modalIds = Array.isArray(data.associatedAlertIds) ? [...data.associatedAlertIds] : [];
      const associated_alerts = modalIds.map((id) => ({
        alert_id: id,
        incident_type: (data as any).incident_type || "rate_anomaly",
      }));
      const payload: Record<string, any> = {
        platform_uuid: platformId,
        title: data.title,
        severity: data.severity,
        status: data.status,
        category: data.category,
        impacted_endpoints: data.impactedEndpoints,
        source_ips: data.sourceIPs,
        associated_alerts,
        associated_alert_ids: modalIds,
        summary: data.summary,
        assigned_to: data.assignedTo,
        containment_actions: data.containmentActions,
        next_step: data.nextStep,
        customer_data_exposure: data.customerDataExposure,
        data_class: data.dataClass,
        requires_customer_notification: data.requiresCustomerNotification,
        regulatory_impact: data.regulatoryImpact,
      };
      await apiService.createIncident(payload);
      await fetchIncidents();
      setShowCreateModal(false);
      toast({
        title: "Incident Created",
        description: "New incident has been created successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Incidents: error creating incident", error);
      toast({
        title: "Error creating incident",
        description: error?.message || "Failed to create incident.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncident = async (data: IncidentFormData) => {
    if (!selectedIncident) return;
    try {
      setLoading(true);
      const payload: Record<string, any> = {
        title: data.title,
        severity: data.severity,
        status: data.status,
        category: data.category,
        impacted_endpoints: data.impactedEndpoints,
        source_ips: data.sourceIPs,
        associated_alert_ids: data.associatedAlertIds,
        summary: data.summary,
        assigned_to: data.assignedTo,
        containment_actions: data.containmentActions,
        next_step: data.nextStep,
        customer_data_exposure: data.customerDataExposure,
        data_class: data.dataClass,
        requires_customer_notification: data.requiresCustomerNotification,
        regulatory_impact: data.regulatoryImpact,
      };
      if (Array.isArray(data.associatedAlertIds) && data.associatedAlertIds.length > 0) {
        payload.associated_alerts = data.associatedAlertIds.map((id: string) => ({
          alert_id: id,
          incident_type: (data as any).incident_type || "rate_anomaly",
        }));
      }
      if (data.status === "Closed") {
        payload.response_note = data.responseNote;
        payload.actions_taken = data.actionsTaken;
        payload.lessons_learned = data.lessonsLearned;
      }
      await apiService.updateIncident(selectedIncident.id, payload);
      await fetchIncidents();
      setShowUpdateModal(false);
      setSelectedIncident(null);
      toast({
        title: "Incident Updated",
        description: "Incident has been updated successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Incidents: error updating incident", error);
      toast({
        title: "Error updating incident",
        description: error?.message || "Failed to update incident.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = (incident: Incident) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 20;

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 50, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SECURITY INCIDENT REPORT", pageWidth / 2, 30, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Incident ID: ${incident.id}`, pageWidth / 2, 42, { align: "center" });

    yPos = 60;
    doc.setTextColor(30, 41, 59);
    const addSectionHeader = (title: string, y: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(title, margin, y + 3);
      return y + 8;
    };
    const addSpacing = (y: number, spacing: number = 5) => y + spacing;

    yPos = addSectionHeader("INCIDENT OVERVIEW", yPos);
    yPos = addSpacing(yPos, 3);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const overviewData = [
      ["Title:", incident.title],
      ["Severity:", incident.severity],
      ["Status:", incident.status],
      ["Category:", incident.category || "N/A"],
      ["Created:", new Date(incident.createdAt).toLocaleString()],
      ["Updated:", new Date(incident.updatedAt).toLocaleString()],
    ];
    overviewData.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text(label, margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const valueLines = doc.splitTextToSize(String(value), pageWidth - margin - 60);
      doc.text(valueLines, margin + 45, yPos);
      yPos += valueLines.length * 5 + 3;
    });

    yPos = addSpacing(yPos, 8);
    const createdAt = new Date(incident.createdAt);
    const updatedAt = new Date(incident.updatedAt);
    const resolvedAt = incident.status === "Closed" ? updatedAt : null;
    const timeToResolution = resolvedAt
      ? Math.round((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
      : null;

    yPos = addSectionHeader("RESOLUTION TIMELINE", yPos);
    yPos = addSpacing(yPos, 3);
    const chartWidth = pageWidth - 2 * margin;
    const chartHeight = 30;
    const chartX = margin;
    const chartY = yPos;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(2);
    doc.line(chartX + 10, chartY + chartHeight / 2, chartX + chartWidth - 10, chartY + chartHeight / 2);
    doc.setFillColor(59, 130, 246);
    doc.circle(chartX + 15, chartY + chartHeight / 2, 3, "F");
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text("Created", chartX + 15, chartY - 2, { align: "center" });
    doc.setFontSize(6);
    doc.text(createdAt.toLocaleDateString(), chartX + 15, chartY - 7, { align: "center" });
    if (resolvedAt) {
      doc.setFillColor(16, 185, 129);
      doc.circle(chartX + chartWidth - 15, chartY + chartHeight / 2, 3, "F");
      doc.setFontSize(7);
      doc.text("Resolved", chartX + chartWidth - 15, chartY - 2, { align: "center" });
      doc.setFontSize(6);
      doc.text(resolvedAt.toLocaleDateString(), chartX + chartWidth - 15, chartY - 7, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const durationText = timeToResolution ? `${timeToResolution} hours` : "N/A";
      doc.text(`Duration: ${durationText}`, chartX + chartWidth / 2, chartY + chartHeight / 2 + 2, {
        align: "center",
      });
    } else {
      doc.setFillColor(251, 146, 60);
      doc.circle(chartX + chartWidth - 15, chartY + chartHeight / 2, 3, "F");
      doc.setFontSize(7);
      doc.text("Updated", chartX + chartWidth - 15, chartY - 2, { align: "center" });
      doc.setFontSize(6);
      doc.text(updatedAt.toLocaleDateString(), chartX + chartWidth - 15, chartY - 7, { align: "center" });
    }
    yPos = addSpacing(yPos, chartHeight + 12);

    yPos = addSectionHeader("SEVERITY ANALYSIS", yPos);
    yPos = addSpacing(yPos, 3);
    const severityColors: Record<string, [number, number, number]> = {
      Critical: [239, 68, 68],
      High: [251, 146, 60],
      Medium: [250, 204, 21],
      Low: [34, 197, 94],
    };
    const severityValue = severityColors[incident.severity] || [148, 163, 184];
    const barHeight = 15;
    const barWidth = pageWidth - 2 * margin - 80;
    const maxWidth = barWidth;
    const severityWidths: Record<string, number> = {
      Critical: maxWidth,
      High: maxWidth * 0.75,
      Medium: maxWidth * 0.5,
      Low: maxWidth * 0.25,
    };
    const barX = margin + 70;
    const barY = yPos;
    const currentWidth = severityWidths[incident.severity] || maxWidth * 0.5;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barX, barY, maxWidth, barHeight, 2, 2, "F");
    doc.setFillColor(severityValue[0], severityValue[1], severityValue[2]);
    doc.roundedRect(barX, barY, currentWidth, barHeight, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Severity:", margin, barY + barHeight / 2 + 3);
    doc.setFontSize(10);
    doc.setTextColor(severityValue[0], severityValue[1], severityValue[2]);
    doc.text(incident.severity, barX + currentWidth + 5, barY + barHeight / 2 + 3);
    yPos = addSpacing(yPos, barHeight + 10);

    if (incident.summary) {
      yPos = addSectionHeader("SUMMARY", yPos);
      yPos = addSpacing(yPos, 3);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const summaryLines = doc.splitTextToSize(incident.summary, pageWidth - 2 * margin);
      doc.text(summaryLines, margin, yPos);
      yPos += summaryLines.length * 6 + 8;
    }

    if (incident.impactedEndpoints && incident.impactedEndpoints.length > 0) {
      yPos = addSectionHeader("IMPACTED ENDPOINTS", yPos);
      yPos = addSpacing(yPos, 3);
      autoTable(doc, {
        startY: yPos,
        head: [["Endpoint"]],
        body: incident.impactedEndpoints.map((ep) => [getEndpointDisplay(ep)]),
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [71, 85, 105], fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: margin, right: margin, top: 0 },
        styles: { cellPadding: 5 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    if (incident.sourceIPs) {
      yPos = addSectionHeader("SOURCE IPs / ACTOR FINGERPRINT", yPos);
      yPos = addSpacing(yPos, 3);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const sourceLines = doc.splitTextToSize(incident.sourceIPs, pageWidth - 2 * margin);
      doc.text(sourceLines, margin, yPos);
      yPos += sourceLines.length * 6 + 8;
    }

    if (incident.containmentActions && incident.containmentActions.length > 0) {
      yPos = addSectionHeader("CONTAINMENT ACTIONS", yPos);
      yPos = addSpacing(yPos, 3);
      autoTable(doc, {
        startY: yPos,
        head: [["#", "Action"]],
        body: incident.containmentActions.map((action, idx) => [idx + 1, action]),
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [71, 85, 105], fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: margin, right: margin, top: 0 },
        styles: { cellPadding: 5 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    if (incident.customerDataExposure !== "unknown" || incident.regulatoryImpact !== "None") {
      yPos = addSectionHeader("COMPLIANCE INFORMATION", yPos);
      yPos = addSpacing(yPos, 3);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const complianceData = [
        ["Customer Data Exposure:", incident.customerDataExposure],
        ["Data Class:", incident.dataClass || "N/A"],
        ["Customer Notification Required:", incident.requiresCustomerNotification],
        ["Regulatory Impact:", incident.regulatoryImpact],
      ];
      complianceData.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text(label, margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(String(value), margin + 70, yPos);
        yPos += 8;
      });
      yPos = addSpacing(yPos, 5);
    }

    if (incident.status === "Closed") {
      if (incident.responseNote) {
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
        yPos = addSectionHeader("RESPONSE NOTE", yPos);
        yPos = addSpacing(yPos, 3);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const responseLines = doc.splitTextToSize(incident.responseNote, pageWidth - 2 * margin);
        doc.text(responseLines, margin, yPos);
        yPos += responseLines.length * 6 + 8;
      }
      if (incident.actionsTaken) {
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
        yPos = addSectionHeader("ACTIONS TAKEN", yPos);
        yPos = addSpacing(yPos, 3);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const actionsLines = doc.splitTextToSize(incident.actionsTaken, pageWidth - 2 * margin);
        doc.text(actionsLines, margin, yPos);
        yPos += actionsLines.length * 6 + 8;
      }
      if (incident.lessonsLearned) {
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
        yPos = addSectionHeader("LESSONS LEARNED", yPos);
        yPos = addSpacing(yPos, 3);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const lessonsLines = doc.splitTextToSize(incident.lessonsLearned, pageWidth - 2 * margin);
        doc.text(lessonsLines, margin, yPos);
      }
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 8, {
        align: "right",
      });
    }
    doc.save(`incident-report-${incident.id}.pdf`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "In Progress": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Contained": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Resolved": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Closed": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "False Positive": return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return (
      new Date(dateString).toLocaleDateString() +
      " " +
      new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleViewDetails = (incident: Incident) => {
    setShowUpdateModal(false);
    setSelectedIncident(incident);
  };

  const handleEdit = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowUpdateModal(true);
  };

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((i) => i.status === "Open").length;
  const criticalIncidents = incidents.filter((i) => i.severity === "Critical").length;
  const closedIncidents = incidents.filter((i) => i.status === "Closed").length;

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        {/* Header – gradient banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  Incident Response
                </span>
                {platform && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                    {platform.name || selectedPlatformId}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Security Incidents</h1>
              <p className="text-sm text-blue-100 mt-1">
                Manage, investigate, and document incident response activity across your protected APIs.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={activeQueueOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveQueueOnly(!activeQueueOnly)}
                className={`rounded-full ${
                  activeQueueOnly
                    ? "bg-white text-blue-600 hover:bg-white/90"
                    : "border-white/50 bg-white/15 text-white hover:!bg-white/25 hover:!text-white"
                }`}
              >
                <Activity className="mr-2 h-4 w-4" />
                {activeQueueOnly ? "Active Queue (ON)" : "Active Queue"}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="rounded-full bg-white text-blue-600 font-medium hover:bg-white/90 shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Incident
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Frosted Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">Total Incidents</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalIncidents}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">All incidents</p>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700" style={{ width: totalIncidents > 0 ? "100%" : "0%" }} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10">
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">Open</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{openIncidents}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Requires attention</p>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700" style={{ width: totalIncidents > 0 ? `${(openIncidents / totalIncidents) * 100}%` : "0%" }} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">Critical</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{criticalIncidents}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">High priority</p>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-700" style={{ width: totalIncidents > 0 ? `${(criticalIncidents / totalIncidents) * 100}%` : "0%" }} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">Closed</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{closedIncidents}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Resolved</p>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700" style={{ width: totalIncidents > 0 ? `${(closedIncidents / totalIncidents) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>

        {/* Frosted Filters Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Narrow down incidents by title, status, and severity.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-slate-200/70 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Contained">Contained</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="False Positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Frosted Incident Table Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200/60 px-6 py-4 bg-white/30 dark:bg-slate-800/30">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Incident Queue
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                {filteredIncidents.length}
              </span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">List of all security incidents</p>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <AlertTriangle className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No incidents found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto max-h-[620px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                      <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[280px]">Title</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">Severity</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[160px]">Created</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[90px]">Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                      {filteredIncidents.map((incident, index) => (
                        <tr
                          key={incident.id ?? `incident-${index}`}
                          className="border-b border-slate-200/40 transition-colors hover:bg-blue-50/40 dark:border-slate-800/40 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[280px]" title={incident.title}>
                                {incident.title}
                              </div>
                              {incident.summary && (
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]" title={incident.summary}>
                                  {incident.summary.substring(0, 80)}...
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Badge className={`${getSeverityColor(incident.severity)} text-xs font-medium`}>{incident.severity}</Badge>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Badge className={`${getStatusColor(incident.status)} text-xs font-medium`}>{incident.status}</Badge>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className="text-sm text-slate-700 dark:text-slate-300">{incident.category || "-"}</span>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className="text-sm whitespace-nowrap text-slate-600 dark:text-slate-400">{formatDate(incident.createdAt)}</span>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-slate-200/60">
                                <DropdownMenuItem onClick={() => handleViewDetails(incident)}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(incident)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                {incident.status === "Closed" && (
                                  <DropdownMenuItem onClick={() => generatePDFReport(incident)}>
                                    <Download className="h-4 w-4 mr-2" /> Download PDF
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden p-4 space-y-3">
                  {filteredIncidents.map((incident, index) => (
                    <div
                      key={incident.id ?? `incident-mobile-${index}`}
                      className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{incident.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(incident.createdAt)}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-slate-200/60">
                            <DropdownMenuItem onClick={() => handleViewDetails(incident)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(incident)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {incident.status === "Closed" && (
                              <DropdownMenuItem onClick={() => generatePDFReport(incident)}>
                                <Download className="h-4 w-4 mr-2" /> Download PDF
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {incident.summary && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{incident.summary.substring(0, 100)}...</p>}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                        <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                        <Badge variant="outline">{incident.category || "-"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        <CreateIncidentModal open={showCreateModal} onOpenChange={setShowCreateModal} onSubmit={handleCreateIncident} />

        {selectedIncident && (
          <UpdateIncidentModal
            open={showUpdateModal}
            onOpenChange={(open) => {
              setShowUpdateModal(open);
              if (!open) setSelectedIncident(null);
            }}
            onSubmit={handleUpdateIncident}
            incident={selectedIncident}
          />
        )}

        {selectedIncident && !showUpdateModal && (
          <ViewIncidentDialog
            open={!!selectedIncident && !showUpdateModal}
            onOpenChange={(open) => {
              if (!open) setSelectedIncident(null);
            }}
            incident={selectedIncident}
          />
        )}
      </div>
    </div>
  );
};

export default Incidents;