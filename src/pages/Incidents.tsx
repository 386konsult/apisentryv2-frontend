import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import CreateIncidentModal, { IncidentFormData } from "@/components/CreateIncidentModal";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { usePlatform } from "@/contexts/PlatformContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Incident extends IncidentFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  responseNote?: string;
  actionsTaken?: string;
  lessonsLearned?: string;
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

const Incidents = () => {
  const { selectedPlatformId } = usePlatform();
  const [platform, setPlatform] = useState<any>(null);
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

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
        customerDataExposure: it.customer_data_exposure || it.customerDataExposure || "no",
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

  const handleUpdateIncident = async (data: any) => {
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
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        bodyStyles: {
          textColor: [71, 85, 105],
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
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
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        bodyStyles: {
          textColor: [71, 85, 105],
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
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
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }
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
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }
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
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }
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
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "In Progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Contained":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "False Positive":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
      default:
        return "bg-gray-100 text-gray-800";
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

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-5 pb-6 shadow-lg">
  <div className="relative z-10">
    {/* Top tags */}
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="px-3 py-1 rounded-full border border-white/40 text-white text-xs font-medium bg-white/10">
        Incident Response
      </span>
      {platform && (
        <span className="px-3 py-1 rounded-full border border-white/40 text-white text-xs font-medium bg-white/10">
          {platform.name || selectedPlatformId}
        </span>
      )}
    </div>

    {/* Bottom: title + buttons */}
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          Security Incidents
        </h1>
        <p className="mt-1 text-sm text-blue-100 max-w-xl">
          Manage, investigate, and document incident response activity across your protected APIs.
        </p>
      </div>

      <div className="flex flex-row gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-xs h-9 font-medium"
        >
          <Activity className="h-3.5 w-3.5 mr-1.5" />
          Active Queue
        </Button>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-white text-blue-700 hover:bg-white/90 shadow-md rounded-full px-4 text-xs font-semibold h-9"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Create Incident
        </Button>
      </div>
    </div>
  </div>
</div>



      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-blue-50 p-3 w-fit dark:bg-blue-500/10">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{incidents.length}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">All incidents</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-orange-50 p-3 w-fit dark:bg-orange-500/10">
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {incidents.filter((i) => i.status === "Open").length}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-red-50 p-3 w-fit dark:bg-red-500/10">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {incidents.filter((i) => i.severity === "Critical").length}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">High priority</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-emerald-50 p-3 w-fit dark:bg-emerald-500/10">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {incidents.filter((i) => i.status === "Closed").length}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Narrow down incidents by title, status, and severity.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_220px_220px]">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
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
                <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
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
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
        <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            Incident Queue
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {filteredIncidents.length}
            </span>
          </CardTitle>
          <CardDescription>List of all security incidents</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4 h-14 w-14">
                <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Loading incidents...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <AlertTriangle className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No incidents found</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto max-h-[620px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[280px]">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">
                        Severity
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[160px]">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[90px]">
                        Actions
                      </th>
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
                            <div
                              className="font-semibold text-slate-900 dark:text-white truncate max-w-[280px]"
                              title={incident.title}
                            >
                              {incident.title}
                            </div>
                            {incident.summary && (
                              <div
                                className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]"
                                title={incident.summary}
                              >
                                {incident.summary.substring(0, 80)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Badge className={`${getSeverityColor(incident.severity)} text-xs font-medium`}>
                            {incident.severity}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Badge className={`${getStatusColor(incident.status)} text-xs font-medium`}>
                            {incident.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {incident.category || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="text-sm whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {formatDate(incident.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="rounded-lg">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(incident)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(incident)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {incident.status === "Closed" && (
                                <DropdownMenuItem onClick={() => generatePDFReport(incident)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
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

              <div className="lg:hidden p-4 space-y-3">
                {filteredIncidents.map((incident, index) => (
                  <div
                    key={incident.id ?? `incident-mobile-${index}`}
                    className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">{incident.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(incident.createdAt)}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(incident)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(incident)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {incident.status === "Closed" && (
                            <DropdownMenuItem onClick={() => generatePDFReport(incident)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {incident.summary && (
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                        {incident.summary}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge className={`${getSeverityColor(incident.severity)} text-xs`}>
                        {incident.severity}
                      </Badge>
                      <Badge className={`${getStatusColor(incident.status)} text-xs`}>
                        {incident.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {incident.category || "-"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreateIncidentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateIncident}
      />

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

      {selectedIncident && (
        <ViewIncidentDialog
          open={!!selectedIncident && !showUpdateModal}
          onOpenChange={(open) => {
            if (!open) setSelectedIncident(null);
          }}
          incident={selectedIncident}
        />
      )}
    </div>
  );
};

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
    customerDataExposure: incident.customerDataExposure,
    dataClass: incident.dataClass,
    requiresCustomerNotification: incident.requiresCustomerNotification,
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
      customerDataExposure: incident.customerDataExposure,
      dataClass: incident.dataClass,
      requiresCustomerNotification: incident.requiresCustomerNotification,
      regulatoryImpact: incident.regulatoryImpact,
    });
    setResponseNote(incident.responseNote || "");
    setActionsTaken(incident.actionsTaken || "");
    setLessonsLearned(incident.lessonsLearned || "");
  }, [incident, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.status === "Closed") {
      if (!responseNote || !actionsTaken || !lessonsLearned) {
        toast({
          title: "Missing required fields",
          description:
            "Please fill in Response Note, Actions Taken, and Lessons Learned when closing an incident.",
          variant: "destructive",
        });
        return;
      }

      const closedData: any = {
        ...formData,
        responseNote,
        actionsTaken,
        lessonsLearned,
      };
      onSubmit(closedData);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl dark:border-slate-800/60 dark:bg-slate-900">
        <DialogHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-transparent px-6 py-5 dark:border-slate-800/60 dark:from-slate-800/30">
          <DialogTitle className="text-xl">Update Incident</DialogTitle>
          <DialogDescription>Update incident details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, severity: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
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
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
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

          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                rows={4}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          {formData.status === "Closed" && (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Closure Details</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  These fields are required when closing an incident.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="responseNote">Response Note *</Label>
                  <Textarea
                    id="responseNote"
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    rows={3}
                    required
                    placeholder="Enter response note..."
                    className="rounded-xl"
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
                    placeholder="List all actions taken to resolve the incident..."
                    className="rounded-xl"
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
                    placeholder="What did we learn from this incident? How can we prevent similar incidents in the future?"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-4 dark:border-slate-800/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl">
              Update Incident
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  })();

  const statusClass = (() => {
    switch (incident.status) {
      case "Open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "In Progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Contained":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "False Positive":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl dark:border-slate-800/60 dark:bg-slate-900">
        <DialogHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-transparent px-6 py-5 dark:border-slate-800/60 dark:from-slate-800/30">
          <DialogTitle className="text-xl text-slate-900 dark:text-white">{incident.title}</DialogTitle>
          <DialogDescription>Complete incident details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge className={severityClass}>{incident.severity}</Badge>
            <Badge className={statusClass}>{incident.status}</Badge>
            {incident.category && <Badge variant="outline">{incident.category}</Badge>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                {new Date(incident.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
              <Label className="text-xs text-muted-foreground">Updated</Label>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                {new Date(incident.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
            <Label className="text-xs text-muted-foreground">Summary</Label>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{incident.summary}</p>
          </div>

          {incident.impactedEndpoints.length > 0 && (
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
              <Label className="text-xs text-muted-foreground">Impacted Endpoints</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {incident.impactedEndpoints.map((ep, i) => (
                  <Badge key={getEndpointKey(ep, i)} variant="secondary" className="rounded-full">
                    {getEndpointDisplay(ep)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {incident.sourceIPs && (
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
              <Label className="text-xs text-muted-foreground">Source IPs</Label>
              <p className="mt-3 font-mono text-sm text-slate-700 dark:text-slate-300">{incident.sourceIPs}</p>
            </div>
          )}

          {incident.status === "Closed" && (
            <>
              {incident.responseNote && (
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <Label className="text-xs text-muted-foreground">Response Note</Label>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {incident.responseNote}
                  </p>
                </div>
              )}

              {incident.actionsTaken && (
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                  <Label className="text-xs text-muted-foreground">Actions Taken</Label>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {incident.actionsTaken}
                  </p>
                </div>
              )}

              {incident.lessonsLearned && (
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                  <Label className="text-xs text-muted-foreground">Lessons Learned</Label>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {incident.lessonsLearned}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Incidents;
