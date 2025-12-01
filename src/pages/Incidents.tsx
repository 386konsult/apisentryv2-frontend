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
  FileText,
  Shield,
  Clock,
  User,
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

// Sample incident data
const generateSampleIncidents = (): Incident[] => {
  const now = new Date();
  return [
    {
      id: "inc-001",
      title: "SQL Injection Attempts on /login from 44.22.11.5",
      severity: "High",
      status: "Open",
      category: "SQL Injection",
      impactedEndpoints: ["/api/login", "/api/auth"],
      sourceIPs: "44.22.11.5, 192.168.1.100",
      associatedAlertIds: ["alert-001", "alert-002"],
      summary: "245 failed login attempts from 44.22.11.5 against POST /login across 6 minutes. Pattern matches credential stuffing rule.",
      assignedTo: "",
      containmentActions: [],
      nextStep: "Monitor IP and block if pattern continues",
      customerDataExposure: "no",
      dataClass: "",
      requiresCustomerNotification: "no",
      regulatoryImpact: "None",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "inc-002",
      title: "Brute Force Attack on Payment Endpoint",
      severity: "Critical",
      status: "Contained",
      category: "Brute Force",
      impactedEndpoints: ["/billing/checkout", "/api/payments"],
      sourceIPs: "203.0.113.45, AS12345",
      associatedAlertIds: ["alert-003"],
      summary: "Massive brute force attack targeting payment endpoints. Over 1000 requests in 15 minutes.",
      assignedTo: "",
      containmentActions: [
        "Blocked IP at WAF",
        "Rate-limited endpoint",
        "Notified customer",
      ],
      nextStep: "Review payment logs and verify no successful breaches",
      customerDataExposure: "yes",
      dataClass: "payments",
      requiresCustomerNotification: "under review",
      regulatoryImpact: "PCI",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "inc-003",
      title: "Anomalous Traffic Pattern Detected",
      severity: "Medium",
      status: "In Progress",
      category: "Anomalous Traffic",
      impactedEndpoints: ["/api/v1/users", "/api/v1/data"],
      sourceIPs: "198.51.100.12",
      associatedAlertIds: ["alert-004"],
      summary: "Unusual traffic spike from single IP. Requests pattern suggests automated scraping.",
      assignedTo: "",
      containmentActions: [],
      nextStep: "Investigate source and intent",
      customerDataExposure: "unknown",
      dataClass: "",
      requiresCustomerNotification: "no",
      regulatoryImpact: "None",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "inc-004",
      title: "Credential Stuffing Attack",
      severity: "High",
      status: "Closed",
      category: "Credential Stuffing",
      impactedEndpoints: ["/api/login"],
      sourceIPs: "44.22.11.5, 203.0.113.45",
      associatedAlertIds: ["alert-005"],
      summary: "Credential stuffing attack detected. Attack blocked successfully with no data breach.",
      assignedTo: "",
      containmentActions: [
        "Blocked IP at WAF",
        "Rotated credentials",
        "Enabled additional authentication",
      ],
      nextStep: "Monitor for similar patterns",
      customerDataExposure: "no",
      dataClass: "",
      requiresCustomerNotification: "no",
      regulatoryImpact: "None",
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      responseNote: "Incident was successfully contained. All affected accounts have been notified and passwords reset.",
      actionsTaken: "1. Blocked attacker IPs at WAF level\n2. Implemented rate limiting on login endpoint\n3. Added CAPTCHA verification\n4. Notified affected users to change passwords",
      lessonsLearned: "1. Need faster detection of credential stuffing patterns\n2. Consider implementing account lockout after failed attempts\n3. Add geolocation-based blocking for known attack sources",
    },
  ];
};

const Incidents = () => {
  // get selected platform id from context
  const { selectedPlatformId } = usePlatform();
  const [platform, setPlatform] = useState<any>(null);
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]); // start empty, load from API
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await apiService.getUsers();
        setUsers(usersData);
      } catch (error) {
        // log error for debugging
        console.error("Incidents: error fetching users", error);
      }
    };
    fetchUsers();
  }, []);

  // fetch platform details (name, etc.) when selectedPlatformId changes
  useEffect(() => {
    if (!selectedPlatformId) {
      setPlatform(null);
      return;
    }
    let mounted = true;
    apiService.getPlatformDetails(selectedPlatformId)
      .then(data => { if (mounted) setPlatform(data); })
      .catch(() => { if (mounted) setPlatform(null); });
    return () => { mounted = false; };
  }, [selectedPlatformId]);

  // extract fetchIncidents so we can call it after create/update
  const fetchIncidents = React.useCallback(async () => {
    setLoading(true);
    try {
      const platformId = selectedPlatformId || localStorage.getItem("selected_platform_id");
      const data = await apiService.getIncidents(platformId || undefined);
      // Normalize server response to Incident[]
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
        requiresCustomerNotification: it.requires_customer_notification || it.requiresCustomerNotification || "no",
        regulatoryImpact: it.regulatory_impact || it.regulatoryImpact || "None",
        createdAt: it.created_at || it.createdAt || new Date().toISOString(),
        updatedAt: it.updated_at || it.updatedAt || new Date().toISOString(),
        responseNote: it.response_note || it.responseNote,
        actionsTaken: it.actions_taken || it.actionsTaken,
        lessonsLearned: it.lessons_learned || it.lessonsLearned,
      }));
      setIncidents(normalized);
    } catch (error: any) {
      // log error for debugging
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

  // call fetchIncidents when platform changes (or on mount)
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Guard title/summary access to avoid undefined.toLowerCase errors
  const filteredIncidents = incidents.filter((incident) => {
    const title = (incident.title || '').toLowerCase();
    const summary = (incident.summary || '').toLowerCase();
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

			// Build structured associated_alerts: [{ alert_id, incident_type }]
			const modalIds = Array.isArray(data.associatedAlertIds) ? [...data.associatedAlertIds] : [];
			const associated_alerts = modalIds.map((id) => ({
				alert_id: id,
				incident_type: (data as any).incident_type || "rate_anomaly",
			}));

			// map UI keys to backend expected snake_case payload
			const payload: Record<string, any> = {
				platform_uuid: platformId,
				title: data.title,
				severity: data.severity,
				status: data.status,
				category: data.category,
				impacted_endpoints: data.impactedEndpoints,
				source_ips: data.sourceIPs,
				// structured associations
				associated_alerts,
				// keep array of ids as well (optional)
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

			// Refresh from server to ensure consistent data (prevents blank UI / stale state)
			await fetchIncidents();

			setShowCreateModal(false);
			toast({
				title: "Incident Created",
				description: "New incident has been created successfully.",
				variant: "default",
			});
		} catch (error: any) {
			// log error for debugging
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
			// Build payload for update (snake_case)
			const payload: Record<string, any> = {
				title: data.title,
				severity: data.severity,
				status: data.status,
				category: data.category,
				impacted_endpoints: data.impactedEndpoints,
				source_ips: data.sourceIPs,
				// keep id list for backward compatibility
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

			// Build and include structured associated_alerts if provided
			if (Array.isArray(data.associatedAlertIds) && data.associatedAlertIds.length > 0) {
				payload.associated_alerts = data.associatedAlertIds.map((id: string) => ({
					alert_id: id,
					incident_type: (data as any).incident_type || "rate_anomaly",
				}));
			}

			// If closing, include closure fields
			if (data.status === "Closed") {
				payload.response_note = data.responseNote;
				payload.actions_taken = data.actionsTaken;
				payload.lessons_learned = data.lessonsLearned;
			}

			await apiService.updateIncident(selectedIncident.id, payload);

			// Refresh from server to show authoritative updated record and avoid blank UI
			await fetchIncidents();

			setShowUpdateModal(false);
			setSelectedIncident(null);
			toast({
				title: "Incident Updated",
			 description: "Incident has been updated successfully.",
				variant: "default",
			});
		} catch (error: any) {
			// log error for debugging
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

    // Header with professional dark blue
    doc.setFillColor(30, 41, 59); // Dark slate blue
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

    // Helper function for section headers
    const addSectionHeader = (title: string, y: number) => {
      doc.setFillColor(241, 245, 249); // Light gray background
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(title, margin, y + 3);
      return y + 8;
    };

    // Helper function to add spacing
    const addSpacing = (y: number, spacing: number = 5) => y + spacing;

    // Incident Overview
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

    // Calculate timeline
    const createdAt = new Date(incident.createdAt);
    const updatedAt = new Date(incident.updatedAt);
    const resolvedAt = incident.status === "Closed" ? updatedAt : null;
    const timeToResolution = resolvedAt ? Math.round((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) : null;
    
    // Timeline Chart
    yPos = addSectionHeader("RESOLUTION TIMELINE", yPos);
    yPos = addSpacing(yPos, 3);
    
    // Draw timeline chart
    const chartWidth = pageWidth - 2 * margin;
    const chartHeight = 30;
    const chartX = margin;
    const chartY = yPos;

    // Background
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, "F");

    // Timeline line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(2);
    doc.line(chartX + 10, chartY + chartHeight / 2, chartX + chartWidth - 10, chartY + chartHeight / 2);

    // Created point
    doc.setFillColor(59, 130, 246);
    doc.circle(chartX + 15, chartY + chartHeight / 2, 3, "F");
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text("Created", chartX + 15, chartY - 2, { align: "center" });
    doc.setFontSize(6);
    doc.text(createdAt.toLocaleDateString(), chartX + 15, chartY - 7, { align: "center" });

    // Updated/Resolved point
    if (resolvedAt) {
      doc.setFillColor(16, 185, 129);
      doc.circle(chartX + chartWidth - 15, chartY + chartHeight / 2, 3, "F");
      doc.setFontSize(7);
      doc.text("Resolved", chartX + chartWidth - 15, chartY - 2, { align: "center" });
      doc.setFontSize(6);
      doc.text(resolvedAt.toLocaleDateString(), chartX + chartWidth - 15, chartY - 7, { align: "center" });
      
      // Duration text
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const durationText = timeToResolution ? `${timeToResolution} hours` : "N/A";
      doc.text(`Duration: ${durationText}`, chartX + chartWidth / 2, chartY + chartHeight / 2 + 2, { align: "center" });
    } else {
      doc.setFillColor(251, 146, 60);
      doc.circle(chartX + chartWidth - 15, chartY + chartHeight / 2, 3, "F");
      doc.setFontSize(7);
      doc.text("Updated", chartX + chartWidth - 15, chartY - 2, { align: "center" });
      doc.setFontSize(6);
      doc.text(updatedAt.toLocaleDateString(), chartX + chartWidth - 15, chartY - 7, { align: "center" });
    }

    yPos = addSpacing(yPos, chartHeight + 12);

    // Severity Chart
    yPos = addSectionHeader("SEVERITY ANALYSIS", yPos);
    yPos = addSpacing(yPos, 3);

    const severityColors: Record<string, [number, number, number]> = {
      Critical: [239, 68, 68],    // Red
      High: [251, 146, 60],       // Orange
      Medium: [250, 204, 21],     // Yellow
      Low: [34, 197, 94],         // Green
    };

    const severityValue = severityColors[incident.severity] || [148, 163, 184];
    const barHeight = 15;
    const barWidth = (pageWidth - 2 * margin - 80);
    const maxWidth = barWidth;
    const severityWidths: Record<string, number> = {
      Critical: maxWidth,
      High: maxWidth * 0.75,
      Medium: maxWidth * 0.5,
      Low: maxWidth * 0.25,
    };

    // Draw severity bar
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

    // Summary
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

    // Impacted Endpoints
    if (incident.impactedEndpoints && incident.impactedEndpoints.length > 0) {
      yPos = addSectionHeader("IMPACTED ENDPOINTS", yPos);
      yPos = addSpacing(yPos, 3);
      autoTable(doc, {
        startY: yPos,
        head: [["Endpoint"]],
        body: incident.impactedEndpoints.map((ep) => {
          // Handle both string and object formats
          const endpointDisplay = typeof ep === 'string' 
            ? ep 
            : (ep?.path || ep?.name || `${ep?.method || ''} ${ep?.path || ''}`).trim();
          return [endpointDisplay];
        }),
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

    // Source IPs
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

    // Containment Actions
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

    // Compliance Information
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

    // If Closed, add response sections
    if (incident.status === "Closed") {
      // Response Note
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

      // Actions Taken
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

      // Lessons Learned
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

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    }

    // Save PDF
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
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident);
    // Show details in a dialog
  };

  const handleEdit = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowUpdateModal(true);
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
            Security Incidents
            {platform && (
              <span className="text-base sm:text-lg font-normal text-muted-foreground ml-2 break-words">
                • {platform.name || selectedPlatformId}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground break-words">
            Manage and track security incidents
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Incident
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">All incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter((i) => i.status === "Open").length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {incidents.filter((i) => i.severity === "Critical").length}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter((i) => i.status === "Closed").length}
            </div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm w-full min-w-0">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
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
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
          <CardDescription>List of all security incidents</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No incidents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: "600px" }}>
              <table className="w-full text-sm border-0">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[250px]">Title</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Severity</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Status</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Category</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[150px]">Created</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((incident, _idx) => (
                    <tr key={incident.id ?? `incident-${_idx}`} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[240px]" title={incident.title}>
                            {incident.title}
                          </div>
                          {incident.summary && (
                            <div className="text-xs text-muted-foreground truncate max-w-[240px]" title={incident.summary}>
                              {incident.summary.substring(0, 60)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={`${getSeverityColor(incident.severity)} text-xs`}>
                          {incident.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={`${getStatusColor(incident.status)} text-xs`}>
                          {incident.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs">{incident.category || "-"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs whitespace-nowrap">{formatDate(incident.createdAt)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
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
                              <DropdownMenuItem
                                onClick={() => generatePDFReport(incident)}
                              >
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
          )}
        </CardContent>
      </Card>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateIncident}
      />

      {/* Update Incident Modal */}
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

      {/* View Details Dialog */}
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

// Update Incident Modal Component
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
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<IncidentFormData>({
    title: incident.title,
    severity: incident.severity as any,
    status: incident.status as any,
    category: incident.category,
    impactedEndpoints: incident.impactedEndpoints,
    sourceIPs: incident.sourceIPs,
    associatedAlertIds: incident.associatedAlertIds,
    summary: incident.summary,
    assignedTo: incident.assignedTo,
    containmentActions: incident.containmentActions,
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
      // Store the additional fields for closed incidents
      const closedData: any = {
        ...formData,
        responseNote,
        actionsTaken,
        lessonsLearned,
      };
      onSubmit(closedData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Incident</DialogTitle>
          <DialogDescription>Update incident details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Include all form fields similar to CreateIncidentModal */}
          <div className="space-y-2">
            <Label htmlFor="title">Incident Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity *</Label>
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
              <Label>Status *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              rows={4}
              required
            />
          </div>

          {/* Show additional fields when status is Closed */}
          {formData.status === "Closed" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="responseNote">Response Note *</Label>
                <Textarea
                  id="responseNote"
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  rows={3}
                  required
                  placeholder="Enter response note..."
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
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Incident</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// View Details Dialog Component
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{incident.title}</DialogTitle>
          <DialogDescription>Complete incident details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Severity</Label>
              <Badge className="mt-1">{incident.severity}</Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge className="mt-1">{incident.status}</Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <p className="text-sm mt-1">{incident.category || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm mt-1">{new Date(incident.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Summary</Label>
            <p className="text-sm mt-1">{incident.summary}</p>
          </div>
          {incident.impactedEndpoints.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Impacted Endpoints</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {incident.impactedEndpoints.map((ep, i) => {
                  // Handle both string and object formats
                  const endpointDisplay = typeof ep === 'string' 
                    ? ep 
                    : (ep?.path || ep?.name || `${ep?.method || ''} ${ep?.path || ''}`).trim();
                  const endpointKey = typeof ep === 'string' 
                    ? `${ep}-${i}` 
                    : (ep?.path || ep?.name || `endpoint-${i}`);
                  
                  return (
                    <Badge key={endpointKey} variant="secondary">
                      {endpointDisplay}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          {incident.sourceIPs && (
            <div>
              <Label className="text-xs text-muted-foreground">Source IPs</Label>
              <p className="text-sm mt-1 font-mono">{incident.sourceIPs}</p>
            </div>
          )}
          {incident.status === "Closed" && (
            <>
              {incident.responseNote && (
                <div>
                  <Label className="text-xs text-muted-foreground">Response Note</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{incident.responseNote}</p>
                </div>
              )}
              {incident.actionsTaken && (
                <div>
                  <Label className="text-xs text-muted-foreground">Actions Taken</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{incident.actionsTaken}</p>
                </div>
              )}
              {incident.lessonsLearned && (
                <div>
                  <Label className="text-xs text-muted-foreground">Lessons Learned</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{incident.lessonsLearned}</p>
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

