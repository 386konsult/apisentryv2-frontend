import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AlertTriangle,
  Bell,
  Plus,
  Filter,
  Search,
  Shield,
  Clock,
  MapPin,
  Users,
  Eye,
  MoreHorizontal,
  Zap,
  Activity,
  Globe,
  User,
  Settings,
  MessageSquare,
  Mail,
  Webhook,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import CreateIncidentModal, { IncidentFormData } from '@/components/CreateIncidentModal';
import apiService from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ALERT_TYPES: Record<string, { name: string; icon: any; color?: string }> = {
  rate_anomaly: { name: 'Rate Anomaly', icon: Zap, color: 'text-yellow-500' },
  response_anomaly: { name: 'Response Anomaly', icon: Activity, color: 'text-indigo-500' },
  response_failure: { name: 'Response Failure', icon: AlertTriangle, color: 'text-red-500' },
  invalid_authorization: { name: 'Invalid Auth', icon: Shield, color: 'text-rose-500' },
  brute_force: { name: 'Brute Force', icon: User, color: 'text-pink-500' },
  signature_attack: { name: 'Signature Attack', icon: AlertCircle, color: 'text-purple-500' },
  custom_rules: { name: 'Custom Rules', icon: Settings, color: 'text-gray-500' },
};

const NOTIFICATION_ICONS: Record<string, any> = {
  email: Mail,
  slack: MessageSquare,
  webhook: Webhook,
  sms: MessageSquare,
};

const SecurityAlerts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [triggerIPFilter, setTriggerIPFilter] = useState('');
  const [triggerEndpointFilter, setTriggerEndpointFilter] = useState('');
  const [triggerDateStart, setTriggerDateStart] = useState('');
  const [triggerDateEnd, setTriggerDateEnd] = useState('');
  const [triggerAlertTypeFilter, setTriggerAlertTypeFilter] = useState('all');
  const [triggerSeverityFilter, setTriggerSeverityFilter] = useState('all');
  const [triggerMethodFilter, setTriggerMethodFilter] = useState('all');
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [showAddTriggersToIncident, setShowAddTriggersToIncident] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<any>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAlertForUpdate, setSelectedAlertForUpdate] = useState<any>(null);
  const [selectedAlertForDelete, setSelectedAlertForDelete] = useState<string | null>(null);
  const [selectedAlertForView, setSelectedAlertForView] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState({
    notification_channels: [] as string[],
    slack_webhook: '',
    teams_webhook: '',
    email: '',
    webhook_url: '',
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const platformId = localStorage.getItem('selected_platform_id');
      const apiAlerts = await apiService.getAlerts(platformId || undefined);
      if (platformId) {
        apiService.getPlatformDetails(platformId).then(setPlatform).catch(() => {});
      }
      const mappedAlerts = apiAlerts.map((alert: any) => ({
        id: alert.id,
        platform: alert.platform,
        alert_type: alert.alert_type,
        severity: alert.severity,
        name: alert.name,
        description: alert.description,
        status: alert.status,
        created_at: alert.created_at,
        last_triggered: alert.last_triggered,
        trigger_count: alert.trigger_count,
        configuration: alert.configuration,
        notification_channels: alert.notification_channels || [],
        acknowledged: alert.acknowledged,
        incident_id: alert.incident_id,
        type: alert.alert_type,
        lastTriggered: alert.last_triggered,
        triggerCount: alert.trigger_count,
        notifications: alert.notification_channels || [],
        incidentId: alert.incident_id,
      }));
      setAlerts(mappedAlerts);
      try {
        const triggersRes = await apiService.getAlertTriggers(platformId || undefined, { page: '1', page_size: '100' });
        let triggersArray: any[] = [];
        if (Array.isArray(triggersRes)) triggersArray = triggersRes;
        else if (triggersRes && Array.isArray((triggersRes as any).triggers)) triggersArray = (triggersRes as any).triggers;
        else if (triggersRes && Array.isArray((triggersRes as any).results)) triggersArray = (triggersRes as any).results;
        setTriggers(triggersArray);
      } catch { setTriggers([]); }
    } catch (error) {
      setAlerts([]);
      setTriggers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); fetchIncidents(); }, []);

  const fetchIncidents = async () => {
    try {
      const platformId = localStorage.getItem('selected_platform_id');
      const data = await apiService.getIncidents(platformId || undefined);
      setIncidents(Array.isArray(data) ? data : []);
    } catch (error) { setIncidents([]); }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) || alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    return matchesSearch && matchesStatus && matchesSeverity && matchesType;
  });

  const filteredTriggers = useMemo(() => triggers.filter(trigger => {
    const triggerIP = trigger.client_ip || trigger.ip || '';
    const matchesIP = !triggerIPFilter || triggerIP.toLowerCase().includes(triggerIPFilter.toLowerCase());
    const triggerEndpoint = trigger.url || trigger.endpoint || trigger.path || trigger.endpoint_path || '';
    const matchesEndpoint = !triggerEndpointFilter || triggerEndpoint.toLowerCase().includes(triggerEndpointFilter.toLowerCase());
    const triggerTime = trigger.occurred_at || trigger.timestamp || trigger.created_at;
    let matchesDateRange = true;
    if (triggerTime && (triggerDateStart || triggerDateEnd)) {
      try {
        const triggerDate = new Date(triggerTime);
        if (triggerDateStart) { const startDate = new Date(triggerDateStart); startDate.setHours(0,0,0,0); if (triggerDate < startDate) matchesDateRange = false; }
        if (triggerDateEnd && matchesDateRange) { const endDate = new Date(triggerDateEnd); endDate.setHours(23,59,59,999); if (triggerDate > endDate) matchesDateRange = false; }
      } catch { }
    } else if (triggerDateStart || triggerDateEnd) { matchesDateRange = false; }
    const relatedAlert = alerts.find(a => a.alert_type === trigger.alert_type || a.id === trigger.alert_id || a.id === trigger.alert);
    const alertType = trigger.alert_type || relatedAlert?.alert_type || relatedAlert?.type || '';
    const matchesAlertType = triggerAlertTypeFilter === 'all' || alertType === triggerAlertTypeFilter;
    const threatLevel = trigger.threat_level || trigger.severity || relatedAlert?.severity || 'medium';
    const matchesSeverity = triggerSeverityFilter === 'all' || threatLevel === triggerSeverityFilter;
    const method = trigger.method || '';
    const matchesMethod = triggerMethodFilter === 'all' || method.toLowerCase() === triggerMethodFilter.toLowerCase();
    return matchesIP && matchesEndpoint && matchesDateRange && matchesAlertType && matchesSeverity && matchesMethod;
  }), [triggers, alerts, triggerIPFilter, triggerEndpointFilter, triggerDateStart, triggerDateEnd, triggerAlertTypeFilter, triggerSeverityFilter, triggerMethodFilter]);

  useEffect(() => {
    const filteredTriggerIds = new Set(filteredTriggers.map(t => t.id));
    setSelectedTriggers(prev => prev.filter(id => filteredTriggerIds.has(id)));
  }, [filteredTriggers]);

  const handleAlertSelect = (alertId: string) => { setSelectedAlerts(prev => prev.includes(alertId) ? prev.filter(id => id !== alertId) : [...prev, alertId]); };
  const handleSelectAll = () => { if (selectedAlerts.length === filteredAlerts.length) { setSelectedAlerts([]); } else { setSelectedAlerts(filteredAlerts.map(alert => alert.id)); } };
  const handleTriggerSelect = (triggerId: string) => { setSelectedTriggers(prev => prev.includes(triggerId) ? prev.filter(id => id !== triggerId) : [...prev, triggerId]); };
  const handleSelectAllTriggers = () => { if (selectedTriggers.length === filteredTriggers.length) { setSelectedTriggers([]); } else { setSelectedTriggers(filteredTriggers.map(trigger => trigger.id)); } };
  const clearTriggerFilters = () => { setTriggerIPFilter(''); setTriggerEndpointFilter(''); setTriggerDateStart(''); setTriggerDateEnd(''); setTriggerAlertTypeFilter('all'); setTriggerSeverityFilter('all'); setTriggerMethodFilter('all'); };

  const handleAddTriggersToIncident = async (incidentId: string | null) => {
    if (!selectedTriggers.length) { toast({ title: "No triggers selected", description: "Please select at least one trigger to add as evidence.", variant: "destructive" }); return; }
    try {
      setLoading(true);
      const platformId = platform?.id || localStorage.getItem('selected_platform_id');
      if (!platformId) throw new Error('No platform selected');
      if (incidentId) {
        const incident = incidents.find(inc => inc.id === incidentId);
        if (!incident) throw new Error('Incident not found');
        const existingTriggerIds = incident.trigger_ids || incident.evidence?.trigger_ids || [];
        const updatedTriggerIds = Array.from(new Set([...existingTriggerIds, ...selectedTriggers]));
        const updatePayload: Record<string, any> = { title: incident.title, severity: incident.severity, status: incident.status, category: incident.category || '', impacted_endpoints: incident.impacted_endpoints || incident.impactedEndpoints || [], source_ips: incident.source_ips || incident.sourceIPs || '', associated_alert_ids: incident.associated_alert_ids || incident.associatedAlertIds || [], summary: incident.summary || '', assigned_to: incident.assigned_to || incident.assignedTo || '', containment_actions: incident.containment_actions || incident.containmentActions || [], next_step: incident.next_step || incident.nextStep || '', customer_data_exposure: incident.customer_data_exposure || incident.customerDataExposure || 'no', data_class: incident.data_class || incident.dataClass || '', requires_customer_notification: incident.requires_customer_notification || incident.requiresCustomerNotification || 'no', regulatory_impact: incident.regulatory_impact || incident.regulatoryImpact || 'None', trigger_ids: updatedTriggerIds, evidence: { ...(incident.evidence || {}), trigger_ids: updatedTriggerIds } };
        await apiService.updateIncident(incidentId, updatePayload);
        toast({ title: "Triggers Added", description: `${selectedTriggers.length} trigger(s) added as evidence to incident.`, variant: "default" });
      } else { setShowCreateIncident(true); }
      setSelectedTriggers([]); setShowAddTriggersToIncident(false); await fetchIncidents();
    } catch (error: any) { toast({ title: "Error adding triggers", description: error?.message || "Failed to add triggers to incident.", variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleCreateIncident = async (data: IncidentFormData) => {
    try {
      setLoading(true);
      const platformId = platform?.id || localStorage.getItem('selected_platform_id');
      if (!platformId) throw new Error('No platform selected');
      const fromModal = Array.isArray(data.associatedAlertIds) ? [...data.associatedAlertIds] : [];
      const combinedIds = Array.from(new Set([...(selectedAlerts || []), ...fromModal]));
      const associated_alerts = combinedIds.map((id) => { const found = alerts.find(a => a.id === id); const incident_type = found?.alert_type || (data as any).incident_type || 'rate_anomaly'; return { alert_id: id, incident_type }; });
      const triggerIds = selectedTriggers.length > 0 ? selectedTriggers : [];
      const payload: Record<string, any> = { platform_uuid: platformId, title: data.title, severity: data.severity, status: data.status, category: data.category, impacted_endpoints: data.impactedEndpoints, source_ips: data.sourceIPs, associated_alerts, associated_alert_ids: combinedIds, summary: data.summary, assigned_to: data.assignedTo, containment_actions: data.containmentActions, next_step: data.nextStep, customer_data_exposure: data.customerDataExposure, data_class: data.dataClass, requires_customer_notification: data.requiresCustomerNotification, regulatory_impact: data.regulatoryImpact, trigger_ids: triggerIds, evidence: { trigger_ids: triggerIds } };
      await apiService.createIncident(payload);
      await fetchAlerts(); await fetchIncidents();
      toast({ title: "Incident Created", description: `New incident has been created successfully${triggerIds.length > 0 ? ` with ${triggerIds.length} trigger(s) as evidence` : ''}.`, variant: "default" });
      setSelectedAlerts([]); setSelectedTriggers([]); setShowCreateIncident(false);
    } catch (error: any) { toast({ title: "Error creating incident", description: error?.message || "Failed to create incident.", variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleAlertStatusChange = async (alertId: string, newStatus: string) => {
    try { await apiService.updateAlertStatus(alertId, newStatus); setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, status: newStatus } : alert)); } catch (error) {}
  };

  const handleUpdateClick = (alert: any) => {
    setSelectedAlertForUpdate(alert);
    const notificationSettings = alert.notification_settings || alert.configuration?.notification_settings || {};
    setUpdateFormData({ notification_channels: alert.notification_channels || [], slack_webhook: notificationSettings.slack_webhook || '', teams_webhook: notificationSettings.teams_webhook || '', email: notificationSettings.email || '', webhook_url: notificationSettings.webhook_url || '' });
    setUpdateDialogOpen(true);
  };

  const handleDeleteClick = (alertId: string) => { setSelectedAlertForDelete(alertId); setDeleteDialogOpen(true); };

  const handleUpdateSubmit = async () => {
    if (!selectedAlertForUpdate) return;
    try {
      setLoading(true);
      const updateData = { notification_channels: updateFormData.notification_channels, slack_webhook: updateFormData.slack_webhook || undefined, teams_webhook: updateFormData.teams_webhook || undefined, email: updateFormData.email || undefined, webhook_url: updateFormData.webhook_url || undefined, notification_settings: { slack_webhook: updateFormData.slack_webhook, teams_webhook: updateFormData.teams_webhook, email: updateFormData.email, webhook_url: updateFormData.webhook_url } };
      await apiService.updateAlert(selectedAlertForUpdate.id, updateData);
      toast({ title: "Alert Updated", description: "Alert notification settings have been updated successfully.", variant: "default" });
      setUpdateDialogOpen(false); setSelectedAlertForUpdate(null); await fetchAlerts();
    } catch (error: any) { toast({ title: "Error updating alert", description: error?.message || "Failed to update alert.", variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAlertForDelete) return;
    try {
      setLoading(true);
      await apiService.deleteAlert(selectedAlertForDelete);
      toast({ title: "Alert Deleted", description: "Alert has been deleted successfully.", variant: "default" });
      setDeleteDialogOpen(false); setSelectedAlertForDelete(null); await fetchAlerts();
    } catch (error: any) { toast({ title: "Error deleting alert", description: error?.message || "Failed to delete alert.", variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleNotificationChannelToggle = (channel: string) => { setUpdateFormData(prev => ({ ...prev, notification_channels: prev.notification_channels.includes(channel) ? prev.notification_channels.filter(c => c !== channel) : [...prev.notification_channels, channel] })); };
  const handleViewClick = (alert: any) => { setSelectedAlertForView(alert); setViewDialogOpen(true); };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3.5 w-3.5 text-emerald-500" />;
      case 'paused': return <Pause className="h-3.5 w-3.5 text-amber-500" />;
      case 'resolved': return <CheckCircle className="h-3.5 w-3.5 text-blue-500" />;
      default: return <AlertCircle className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high': return { cls: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400', dot: 'bg-red-500' };
      case 'medium': return { cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', dot: 'bg-amber-500' };
      case 'low': return { cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-500' };
      default: return { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' };
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      POST: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      PUT: 'bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
      PATCH: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
      DELETE: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    };
    return colors[method] || 'bg-slate-100 text-slate-700';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    let cleaned = dateString.trim();
    if (cleaned.endsWith('+00:00Z')) cleaned = cleaned.slice(0, -7) + 'Z';
    else if (cleaned.endsWith('-00:00Z')) cleaned = cleaned.slice(0, -7) + 'Z';
    else if (cleaned.endsWith('+00:00')) cleaned = cleaned.slice(0, -6) + 'Z';
    else if (cleaned.endsWith('-00:00')) cleaned = cleaned.slice(0, -6) + 'Z';
    else if (cleaned.match(/[+-]\d{2}:\d{2}Z$/)) cleaned = cleaned.slice(0, -6) + 'Z';
    try {
      const date = new Date(cleaned);
      if (isNaN(date.getTime())) { const fallbackDate = new Date(dateString); if (isNaN(fallbackDate.getTime())) return '-'; return fallbackDate.toLocaleDateString() + ' ' + fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return '-'; }
  };

  const statsData = [
    { label: 'Active Alerts', value: alerts.filter(a => a.status === 'active').length, icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', sub: 'Currently monitoring' },
    { label: 'High Severity', value: alerts.filter(a => a.severity === 'high').length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', sub: 'Require immediate attention', valueColor: 'text-red-600 dark:text-red-400' },
    { label: 'Recent Triggers', value: triggers.length, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', sub: 'Alert trigger events' },
    { label: 'Total Triggers', value: alerts.reduce((sum, alert) => sum + alert.triggerCount, 0), icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', sub: 'All time triggers' },
  ];

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
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  Security Alerts
                </span>
                {platform && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                    {platform.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">
                Security Alerts
              </h1>
              <p className="text-sm text-blue-100 max-w-xl">
                Monitor and manage security alerts and incidents
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/create-alert')}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
              <Button
                size="sm"
                disabled={selectedAlerts.length === 0}
                onClick={() => setShowCreateIncident(true)}
                className="rounded-full bg-white px-5 py-2 text-blue-600 font-medium hover:bg-white/90 disabled:bg-white/70 disabled:text-blue-400"
              >
                <Users className="mr-2 h-4 w-4" />
                Incident ({selectedAlerts.length})
              </Button>
              <CreateIncidentModal
                open={showCreateIncident}
                onOpenChange={(open) => {
                  setShowCreateIncident(open);
                  if (!open && showAddTriggersToIncident) setShowAddTriggersToIncident(false);
                }}
                onSubmit={handleCreateIncident}
                selectedAlertIds={selectedAlerts}
                alerts={alerts}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards (4 cards) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-4">
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold ${stat.valueColor || 'text-slate-900 dark:text-white'}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {stat.sub}
                </p>
                <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                    style={{
                      width: `${
                        stat.value > 0
                          ? Math.min(
                              100,
                              (stat.value /
                                Math.max(
                                  ...statsData.map((s) => s.value),
                                  1
                                )) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Refine your security alerts</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[140px] rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px] rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(ALERT_TYPES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alerts Table Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Security Alerts</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage and monitor your security alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-xs text-slate-600 dark:text-slate-400">Select All</Label>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200/70 dark:border-slate-800/70 z-10">
                <tr>
                  <th className="px-4 py-3 text-left w-10"></th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Alert</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Severity</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Triggers</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Last Triggered</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Notifications</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Incident</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-5 rounded-full bg-blue-50 dark:bg-blue-500/10 mb-4">
                          <Bell className="h-10 w-10 text-blue-400" />
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No alerts found</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or create a new alert</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAlerts.map((alert) => {
                  const alertType = ALERT_TYPES[alert.type as keyof typeof ALERT_TYPES];
                  const sevCfg = getSeverityConfig(alert.severity);
                  return (
                    <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-4 py-3">
                        <Checkbox checked={selectedAlerts.includes(alert.id)} onCheckedChange={() => handleAlertSelect(alert.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]" title={alert.name}>{alert.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]" title={alert.description}>{alert.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {alertType && <alertType.icon className={`h-3.5 w-3.5 ${alertType.color} flex-shrink-0`} />}
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{alertType?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(alert.status)}
                          <span className="text-xs capitalize text-slate-600 dark:text-slate-400">{alert.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sevCfg.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sevCfg.dot}`} />
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{alert.triggerCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {alert.lastTriggered ? formatDate(alert.lastTriggered) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {alert.notifications.slice(0, 3).map((notif: string) => {
                            const Icon = NOTIFICATION_ICONS[notif as keyof typeof NOTIFICATION_ICONS];
                            return Icon ? <Icon key={notif} className="h-3.5 w-3.5 text-slate-400" /> : null;
                          })}
                          {alert.notifications.length > 3 && <span className="text-xs text-slate-400">+{alert.notifications.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {alert.incidentId || alert.incident_id ? (
                          <Badge variant="outline" className="text-xs font-mono rounded-lg truncate max-w-[80px]">{alert.incidentId || alert.incident_id}</Badge>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewClick(alert)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateClick(alert)}><Edit className="h-4 w-4 mr-2" />Update</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClick(alert.id)} className="text-red-600 focus:text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Triggers Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Alert Triggers
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Trigger events for all security alerts ({filteredTriggers.length} of {triggers.length})
              </p>
            </div>
            {selectedTriggers.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setShowAddTriggersToIncident(true)}
                className="gap-2 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Plus className="h-4 w-4" />
                Add to Incident ({selectedTriggers.length})
              </Button>
            )}
          </div>

          {/* Trigger Filters */}
          <div className="px-6 py-4 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" /> Filter Triggers
              </Label>
              {(triggerIPFilter || triggerEndpointFilter || triggerDateStart || triggerDateEnd || triggerAlertTypeFilter !== 'all' || triggerSeverityFilter !== 'all' || triggerMethodFilter !== 'all') && (
                <button onClick={clearTriggerFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Clear Filters</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Filter by IP..." value={triggerIPFilter} onChange={(e) => setTriggerIPFilter(e.target.value)} className="pl-8 h-8 text-xs rounded-lg border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800/50" />
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Filter by endpoint..." value={triggerEndpointFilter} onChange={(e) => setTriggerEndpointFilter(e.target.value)} className="pl-8 h-8 text-xs rounded-lg border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800/50" />
              </div>
              <Select value={triggerAlertTypeFilter} onValueChange={setTriggerAlertTypeFilter}>
                <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(ALERT_TYPES).map(([key, val]) => <SelectItem key={key} value={key}>{val.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={triggerSeverityFilter} onValueChange={setTriggerSeverityFilter}>
                <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="All Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={triggerMethodFilter} onValueChange={setTriggerMethodFilter}>
                <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="All Methods" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={triggerDateStart} onChange={(e) => setTriggerDateStart(e.target.value)} className="h-8 text-xs rounded-lg border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800/50" placeholder="Start date" />
              <Input type="date" value={triggerDateEnd} onChange={(e) => setTriggerDateEnd(e.target.value)} min={triggerDateStart || undefined} className="h-8 text-xs rounded-lg border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800/50" placeholder="End date" />
            </div>
          </div>

          {triggers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-5 rounded-full bg-amber-50 dark:bg-amber-500/10 mb-4">
                <Zap className="h-10 w-10 text-amber-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No triggers yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Trigger events will appear here when alerts fire</p>
            </div>
          ) : filteredTriggers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-5 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Filter className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No triggers match filters</p>
              <Button variant="outline" size="sm" onClick={clearTriggerFilters} className="mt-4 text-xs">Clear Filters</Button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200/70 dark:border-slate-800/70 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <Checkbox checked={selectedTriggers.length === filteredTriggers.length && filteredTriggers.length > 0} onCheckedChange={handleSelectAllTriggers} />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Timestamp</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Alert</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Severity</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Client IP</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Endpoint</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Method</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {filteredTriggers.map((trigger) => {
                    const relatedAlert = alerts.find(a => a.alert_type === trigger.alert_type || a.id === trigger.alert_id || a.id === trigger.alert);
                    const triggerTime = trigger.occurred_at || trigger.timestamp || trigger.created_at;
                    const threatLevel = trigger.threat_level || trigger.severity || relatedAlert?.severity || 'medium';
                    const sevCfg = getSeverityConfig(threatLevel);
                    return (
                      <tr key={trigger.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-4 py-3"><Checkbox checked={selectedTriggers.includes(trigger.id)} onCheckedChange={() => handleTriggerSelect(trigger.id)} /></td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{triggerTime ? formatDate(triggerTime) : '-'}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white text-xs truncate max-w-[180px]">{relatedAlert?.name || trigger.alert_name || trigger.alert_type || 'Unknown Alert'}</div>
                          {(trigger.evidence || relatedAlert?.description) && <div className="text-xs text-slate-400 truncate max-w-[180px]">{trigger.evidence || relatedAlert?.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sevCfg.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sevCfg.dot}`} />{threatLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{trigger.client_ip || trigger.ip || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{trigger.url || trigger.endpoint || trigger.path || trigger.endpoint_path || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {trigger.method ? (
                            <Badge className={`${getMethodColor(trigger.method)} rounded-lg text-xs font-semibold`}>{trigger.method}</Badge>
                          ) : <span className="text-slate-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-3.5 w-3.5" />View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
                              <DialogHeader>
                                <DialogTitle>Trigger Details</DialogTitle>
                                <DialogDescription>Complete information about this trigger event</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70"><Label className="text-xs text-slate-500">Timestamp</Label><p className="text-sm font-mono mt-1">{trigger.occurred_at ? formatDate(trigger.occurred_at) : trigger.timestamp ? formatDate(trigger.timestamp) : trigger.created_at ? formatDate(trigger.created_at) : '-'}</p></div>
                                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70"><Label className="text-xs text-slate-500">Alert Type</Label><p className="text-sm font-medium mt-1">{trigger.alert_type || relatedAlert?.name || trigger.alert_name || 'Unknown'}</p></div>
                                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70"><Label className="text-xs text-slate-500">Threat Level</Label><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getSeverityConfig(trigger.threat_level || trigger.severity || relatedAlert?.severity || 'medium').cls}`}>{trigger.threat_level || trigger.severity || relatedAlert?.severity || 'medium'}</span></div>
                                  {trigger.status_code && <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70"><Label className="text-xs text-slate-500">Status Code</Label><p className="text-sm mt-1">{trigger.status_code}</p></div>}
                                </div>
                                {trigger.client_ip || trigger.ip ? <div><Label className="text-xs font-semibold text-slate-500">Client IP</Label><p className="text-sm font-mono mt-1">{trigger.client_ip || trigger.ip}</p></div> : null}
                                {trigger.url || trigger.endpoint || trigger.path ? <div><Label className="text-xs font-semibold text-slate-500">URL / Endpoint</Label><p className="text-sm font-mono mt-1">{trigger.url || trigger.endpoint || trigger.path || trigger.endpoint_path}</p></div> : null}
                                {trigger.method && <div><Label className="text-xs font-semibold text-slate-500">Method</Label><Badge className={`${getMethodColor(trigger.method)} rounded-lg mt-1`}>{trigger.method}</Badge></div>}
                                {trigger.evidence && <div><Label className="text-xs font-semibold text-slate-500">Evidence</Label><p className="text-sm mt-1">{trigger.evidence}</p></div>}
                                {trigger.headers && Object.keys(trigger.headers).length > 0 && <div><Label className="text-xs font-semibold text-slate-500">Headers</Label><div className="bg-slate-900 dark:bg-slate-950 p-3 rounded-xl font-mono text-xs text-slate-100 overflow-x-auto mt-2"><pre className="whitespace-pre-wrap break-words">{JSON.stringify(trigger.headers, null, 2)}</pre></div></div>}
                                {trigger.extra && Object.keys(trigger.extra).length > 0 && <div><Label className="text-xs font-semibold text-slate-500">Extra Data</Label><div className="bg-slate-900 dark:bg-slate-950 p-3 rounded-xl font-mono text-xs text-slate-100 overflow-x-auto mt-2"><pre className="whitespace-pre-wrap break-words">{JSON.stringify(trigger.extra, null, 2)}</pre></div></div>}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Update Alert Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Update Alert Notifications</DialogTitle>
              <DialogDescription>Update notification settings for {selectedAlertForUpdate?.name || 'this alert'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">Notification Channels</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['email', 'slack', 'teams', 'webhook'].map((channel) => (
                    <div key={channel} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${updateFormData.notification_channels.includes(channel) ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200/70 dark:border-slate-700'}`} onClick={() => handleNotificationChannelToggle(channel)}>
                      <Checkbox id={`channel-${channel}`} checked={updateFormData.notification_channels.includes(channel)} onCheckedChange={() => handleNotificationChannelToggle(channel)} />
                      <Label htmlFor={`channel-${channel}`} className="text-sm capitalize cursor-pointer">{channel}</Label>
                    </div>
                  ))}
                </div>
              </div>
              {[
                { id: 'slack-webhook', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/...', field: 'slack_webhook' },
                { id: 'teams-webhook', label: 'Teams Webhook URL', placeholder: 'https://outlook.office.com/webhook/...', field: 'teams_webhook' },
                { id: 'email', label: 'Email Address', placeholder: 'alert@example.com', field: 'email', type: 'email' },
                { id: 'webhook-url', label: 'Generic Webhook URL', placeholder: 'https://example.com/webhook', field: 'webhook_url' },
              ].map(({ id, label, placeholder, field, type }) => (
                <div key={id}>
                  <Label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
                  <Input id={id} type={type || 'url'} placeholder={placeholder} value={(updateFormData as any)[field]} onChange={(e) => setUpdateFormData(prev => ({ ...prev, [field]: e.target.value }))} className="mt-1.5 rounded-xl border-slate-200/70 dark:border-slate-700" />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                <Button variant="outline" className="rounded-xl" onClick={() => { setUpdateDialogOpen(false); setSelectedAlertForUpdate(null); }}>Cancel</Button>
                <Button onClick={handleUpdateSubmit} disabled={loading} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">{loading ? 'Updating...' : 'Update Alert'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10"><Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
                <AlertDialogTitle>Delete Alert</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete
                {selectedAlertForDelete && alerts.find(a => a.id === selectedAlertForDelete) && <span className="font-semibold"> "{alerts.find(a => a.id === selectedAlertForDelete)?.name}"</span>}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl" onClick={() => setSelectedAlertForDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={loading} className="bg-red-600 hover:bg-red-700 rounded-xl">{loading ? 'Deleting...' : 'Delete Alert'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Triggers to Incident Dialog */}
        <Dialog open={showAddTriggersToIncident} onOpenChange={setShowAddTriggersToIncident}>
          <DialogContent className="max-w-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Triggers as Evidence</DialogTitle>
              <DialogDescription>Add {selectedTriggers.length} selected trigger(s) as evidence to an incident</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Select Incident</Label>
                <Select onValueChange={(value) => { if (value === 'new') { setShowAddTriggersToIncident(false); setShowCreateIncident(true); } else { handleAddTriggersToIncident(value); } }}>
                  <SelectTrigger className="rounded-xl border-slate-200/70 dark:border-slate-700"><SelectValue placeholder="Choose an incident or create new" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create New Incident</SelectItem>
                    {incidents.map((incident) => <SelectItem key={incident.id} value={incident.id}>{incident.title} ({incident.status})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-4">
                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Selected Triggers ({selectedTriggers.length})</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedTriggers.map((triggerId) => {
                    const trigger = triggers.find(t => t.id === triggerId);
                    const relatedAlert = trigger ? alerts.find(a => a.alert_type === trigger.alert_type || a.id === trigger.alert_id || a.id === trigger.alert) : null;
                    return (
                      <div key={triggerId} className="text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
                        <span className="font-medium">{relatedAlert?.name || trigger?.alert_type || triggerId}</span>
                        {trigger?.client_ip && <span className="text-slate-400 font-mono">{trigger.client_ip}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" className="rounded-xl" onClick={() => setShowAddTriggersToIncident(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Alert Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Alert Details</DialogTitle>
              <DialogDescription>View conditions and configuration for {selectedAlertForView?.name || 'this alert'}</DialogDescription>
            </DialogHeader>
            {selectedAlertForView && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Alert Name', value: selectedAlertForView.name || '-' },
                    { label: 'Alert Type', value: ALERT_TYPES[selectedAlertForView.alert_type || selectedAlertForView.type]?.name || selectedAlertForView.alert_type || '-' },
                    { label: 'Created At', value: formatDate(selectedAlertForView.created_at) },
                    { label: 'Last Triggered', value: selectedAlertForView.last_triggered || selectedAlertForView.lastTriggered ? formatDate(selectedAlertForView.last_triggered || selectedAlertForView.lastTriggered) : 'Never' },
                    { label: 'Trigger Count', value: String(selectedAlertForView.trigger_count || selectedAlertForView.triggerCount || 0) },
                    { label: 'Acknowledged', value: selectedAlertForView.acknowledged ? 'Yes' : 'No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70">
                      <Label className="text-xs text-slate-500 dark:text-slate-400">{label}</Label>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{value}</p>
                    </div>
                  ))}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70">
                    <Label className="text-xs text-slate-500 dark:text-slate-400">Status</Label>
                    <div className="flex items-center gap-1.5 mt-1">{getStatusIcon(selectedAlertForView.status)}<span className="text-sm capitalize">{selectedAlertForView.status}</span></div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70">
                    <Label className="text-xs text-slate-500 dark:text-slate-400">Severity</Label>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getSeverityConfig(selectedAlertForView.severity).cls}`}>{selectedAlertForView.severity}</span>
                  </div>
                </div>
                {selectedAlertForView.description && <div><Label className="text-xs font-semibold text-slate-500">Description</Label><p className="text-sm mt-1">{selectedAlertForView.description}</p></div>}
                <div><Label className="text-xs font-semibold text-slate-500">Conditions & Configuration</Label>
                  <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 border border-slate-700/50 font-mono text-xs text-slate-100 overflow-x-auto mt-2">
                    {selectedAlertForView.configuration && Object.keys(selectedAlertForView.configuration).length > 0 ? <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedAlertForView.configuration, null, 2)}</pre> : <p className="text-slate-500">No configuration set</p>}
                  </div>
                </div>
                <div><Label className="text-xs font-semibold text-slate-500">Notification Channels</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAlertForView.notification_channels && selectedAlertForView.notification_channels.length > 0 ? selectedAlertForView.notification_channels.map((channel: string) => { const Icon = NOTIFICATION_ICONS[channel as keyof typeof NOTIFICATION_ICONS]; return <Badge key={channel} variant="outline" className="rounded-lg flex items-center gap-1">{Icon && <Icon className="h-3 w-3" />}<span className="capitalize">{channel}</span></Badge>; }) : <p className="text-sm text-slate-400">No notification channels configured</p>}
                  </div>
                </div>
                {selectedAlertForView.incident_id || selectedAlertForView.incidentId ? <div><Label className="text-xs font-semibold text-slate-500">Associated Incident</Label><Badge variant="outline" className="rounded-lg mt-1">{selectedAlertForView.incident_id || selectedAlertForView.incidentId}</Badge></div> : null}
                <div><Label className="text-xs font-semibold text-slate-500">Alert ID</Label><p className="text-xs font-mono mt-1 text-slate-500">{selectedAlertForView.id}</p></div>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-slate-200/70 dark:border-slate-700">
              <Button variant="outline" className="rounded-xl" onClick={() => { setViewDialogOpen(false); setSelectedAlertForView(null); }}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SecurityAlerts;