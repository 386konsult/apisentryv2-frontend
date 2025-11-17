import React, { useState, useEffect } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<any>(null); // Added for platform display
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

  // fetchAlerts is reusable so we can refresh after create/update
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const platformId = localStorage.getItem('selected_platform_id');
      const apiAlerts = await apiService.getAlerts(platformId || undefined);
      
      // Fetch platform details
      if (platformId) {
        apiService.getPlatformDetails(platformId).then(setPlatform).catch(() => {});
      }
      
      // Map API fields to component expected structure
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
        // Additional derived fields for component
        type: alert.alert_type,
        lastTriggered: alert.last_triggered,
        triggerCount: alert.trigger_count,
        notifications: alert.notification_channels || [],
        incidentId: alert.incident_id,
      }));
      
      setAlerts(mappedAlerts);
      // Fetch alert triggers (normalize paginated or array responses)
      try {
        const triggersRes = await apiService.getAlertTriggers(platformId || undefined, { page: '1', page_size: '100' });
        let triggersArray: any[] = [];
        if (Array.isArray(triggersRes)) {
          triggersArray = triggersRes;
        } else if (triggersRes && Array.isArray((triggersRes as any).triggers)) {
          triggersArray = (triggersRes as any).triggers;
        } else if (triggersRes && Array.isArray((triggersRes as any).results)) {
          triggersArray = (triggersRes as any).results;
        }
        setTriggers(triggersArray);
      } catch {
        setTriggers([]);
      }
    } catch (error) {
      setAlerts([]);
      setTriggers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesType;
  });

  const handleAlertSelect = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id));
    }
  };

  const handleCreateIncident = async (data: IncidentFormData) => {
    try {
      setLoading(true);
      const platformId = platform?.id || localStorage.getItem('selected_platform_id');
      if (!platformId) throw new Error('No platform selected');

      // Merge selected alerts (from list) with any alert ids included in the modal data
      const fromModal = Array.isArray(data.associatedAlertIds) ? [...data.associatedAlertIds] : [];
      const combinedIds = Array.from(new Set([...(selectedAlerts || []), ...fromModal]));

      // Build associated_alerts array with { alert_id, incident_type } as backend expects
      const associated_alerts = combinedIds.map((id) => {
        const found = alerts.find(a => a.id === id);
        // prefer the alert's type, otherwise allow form to provide incident_type or fallback to 'rate_anomaly'
        const incident_type = found?.alert_type || (data as any).incident_type || 'rate_anomaly';
        return { alert_id: id, incident_type };
      });

      // Build payload in snake_case (backend expected)
      const payload: Record<string, any> = {
        platform_uuid: platformId,
        title: data.title,
        severity: data.severity,
        status: data.status,
        category: data.category,
        impacted_endpoints: data.impactedEndpoints,
        source_ips: data.sourceIPs,
        // send new structured association expected by backend
        associated_alerts,
        // keep simple id array for backward compatibility (optional)
        associated_alert_ids: combinedIds,
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
 
      // Refresh alerts (and triggers) so UI reflects any incident links/changes
      await fetchAlerts();
 
      toast({
        title: "Incident Created",
        description: "New incident has been created successfully.",
        variant: "default",
      });
 
      setSelectedAlerts([]);
      setShowCreateIncident(false);
    } catch (error: any) {
      console.error('SecurityAlerts: error creating incident', error);
      toast({
        title: "Error creating incident",
        description: error?.message || "Failed to create incident.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 
  const handleAlertStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await apiService.updateAlertStatus(alertId, newStatus);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      ));
    } catch (error) {
      // removed console.error debug output
    }
  };

  const handleUpdateClick = (alert: any) => {
    setSelectedAlertForUpdate(alert);
    // Get notification settings from alert configuration or notification_settings
    const notificationSettings = alert.notification_settings || alert.configuration?.notification_settings || {};
    setUpdateFormData({
      notification_channels: alert.notification_channels || [],
      slack_webhook: notificationSettings.slack_webhook || '',
      teams_webhook: notificationSettings.teams_webhook || '',
      email: notificationSettings.email || '',
      webhook_url: notificationSettings.webhook_url || '',
    });
    setUpdateDialogOpen(true);
  };

  const handleDeleteClick = (alertId: string) => {
    setSelectedAlertForDelete(alertId);
    setDeleteDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedAlertForUpdate) return;
    
    try {
      setLoading(true);
      // Send fields as specified by user: top-level fields
      const updateData = {
        notification_channels: updateFormData.notification_channels,
        slack_webhook: updateFormData.slack_webhook || undefined,
        teams_webhook: updateFormData.teams_webhook || undefined,
        email: updateFormData.email || undefined,
        webhook_url: updateFormData.webhook_url || undefined,
        // Also include notification_settings for backward compatibility
        notification_settings: {
          slack_webhook: updateFormData.slack_webhook,
          teams_webhook: updateFormData.teams_webhook,
          email: updateFormData.email,
          webhook_url: updateFormData.webhook_url,
        },
      };
      
      await apiService.updateAlert(selectedAlertForUpdate.id, updateData);
      
      toast({
        title: "Alert Updated",
        description: "Alert notification settings have been updated successfully.",
        variant: "default",
      });
      
      setUpdateDialogOpen(false);
      setSelectedAlertForUpdate(null);
      await fetchAlerts();
    } catch (error: any) {
      toast({
        title: "Error updating alert",
        description: error?.message || "Failed to update alert.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAlertForDelete) return;
    
    try {
      setLoading(true);
      await apiService.deleteAlert(selectedAlertForDelete);
      
      toast({
        title: "Alert Deleted",
        description: "Alert has been deleted successfully.",
        variant: "default",
      });
      
      setDeleteDialogOpen(false);
      setSelectedAlertForDelete(null);
      await fetchAlerts();
    } catch (error: any) {
      toast({
        title: "Error deleting alert",
        description: error?.message || "Failed to delete alert.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChannelToggle = (channel: string) => {
    setUpdateFormData(prev => ({
      ...prev,
      notification_channels: prev.notification_channels.includes(channel)
        ? prev.notification_channels.filter(c => c !== channel)
        : [...prev.notification_channels, channel],
    }));
  };

  const handleViewClick = (alert: any) => {
    setSelectedAlertForView(alert);
    setViewDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    // Clean up invalid date formats
    // Handle cases like "2025-11-15T05:45:49.214388+00:00Z" (both timezone offset and Z)
    let cleaned = dateString.trim();
    
    // Fix invalid format: +00:00Z or -00:00Z -> remove the offset, keep Z
    // Example: "2025-11-15T05:45:49.214388+00:00Z" -> "2025-11-15T05:45:49.214388Z"
    if (cleaned.endsWith('+00:00Z')) {
      cleaned = cleaned.slice(0, -7) + 'Z'; // Remove '+00:00' before 'Z'
    } else if (cleaned.endsWith('-00:00Z')) {
      cleaned = cleaned.slice(0, -7) + 'Z'; // Remove '-00:00' before 'Z'
    }
    // Fix format: +00:00 or -00:00 (without Z) -> replace with Z
    else if (cleaned.endsWith('+00:00')) {
      cleaned = cleaned.slice(0, -6) + 'Z'; // Replace '+00:00' with 'Z'
    } else if (cleaned.endsWith('-00:00')) {
      cleaned = cleaned.slice(0, -6) + 'Z'; // Replace '-00:00' with 'Z'
    }
    // Handle any other timezone offset followed by Z (e.g., +05:30Z, -05:30Z)
    else if (cleaned.match(/[+-]\d{2}:\d{2}Z$/)) {
      // Remove the timezone offset (6 chars: +05:30 or -05:30), keep Z
      cleaned = cleaned.slice(0, -6) + 'Z';
    }
    
    try {
      const date = new Date(cleaned);
      if (isNaN(date.getTime())) {
        // Try removing Z and parsing as-is
        const withoutZ = cleaned.replace(/Z$/, '');
        const dateWithoutZ = new Date(withoutZ);
        if (!isNaN(dateWithoutZ.getTime())) {
          return dateWithoutZ.toLocaleDateString() + ' ' + dateWithoutZ.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // Last resort: try original string
        const fallbackDate = new Date(dateString);
        if (isNaN(fallbackDate.getTime())) return '-';
        return fallbackDate.toLocaleDateString() + ' ' + fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Security Alerts{platform && <span className="text-lg font-normal text-muted-foreground ml-2"> • {platform.name}</span>}</h1>
          <p className="text-muted-foreground">
            Monitor and manage security alerts and incidents
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/create-alert')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
          <Button 
            size="sm" 
            className="gradient-primary"
            disabled={selectedAlerts.length === 0}
            onClick={() => setShowCreateIncident(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Create Incident ({selectedAlerts.length})
          </Button>
          <CreateIncidentModal
            open={showCreateIncident}
            onOpenChange={setShowCreateIncident}
            onSubmit={handleCreateIncident}
            selectedAlertIds={selectedAlerts}
            alerts={alerts}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Triggers</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {triggers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Alert trigger events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.reduce((sum, alert) => sum + alert.triggerCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time triggers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full min-w-0">
              <div className="relative flex-1 max-w-sm w-full min-w-0">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
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
                <SelectTrigger className="w-full sm:w-[140px]">
                  <AlertTriangle className="h-4 w-4 mr-2" />
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
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="rate_anomaly">Rate Anomaly</SelectItem>
                  <SelectItem value="response_anomaly">Response Anomaly</SelectItem>
                  <SelectItem value="response_failure">Response Failure</SelectItem>
                  <SelectItem value="invalid_authorization">Invalid Auth</SelectItem>
                  <SelectItem value="brute_force">Brute Force</SelectItem>
                  <SelectItem value="signature_attack">Signature Attack</SelectItem>
                  <SelectItem value="custom_rules">Custom Rules</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Manage and monitor your security alerts
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <Checkbox
                checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full text-sm border-0">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[40px]"></th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[180px]">Alert</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Type</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[70px]">Status</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[70px]">Severity</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[80px]">Triggers</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Last Triggered</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Notifications</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[90px]">Incident</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap min-w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const alertType = ALERT_TYPES[alert.type as keyof typeof ALERT_TYPES];
                  
                  return (
                    <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selectedAlerts.includes(alert.id)}
                          onCheckedChange={() => handleAlertSelect(alert.id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[180px]" title={alert.name}>{alert.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={alert.description}>{alert.description}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1 min-w-0">
                          {alertType && <alertType.icon className={`h-3 w-3 ${alertType.color} flex-shrink-0`} />}
                          <span className="text-xs truncate max-w-[80px]" title={alertType?.name}>{alertType?.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1 min-w-0">
                          {getStatusIcon(alert.status)}
                          <span className="text-xs capitalize truncate max-w-[50px]">{alert.status}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={`${getSeverityColor(alert.severity)} text-xs`}>
                          {alert.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs font-mono">{alert.triggerCount}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs truncate max-w-[100px]" title={alert.lastTriggered ? formatDate(alert.lastTriggered) : '-'}>
                          {alert.lastTriggered ? formatDate(alert.lastTriggered) : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex space-x-1">
                          {alert.notifications.slice(0, 3).map(notif => {
                            const Icon = NOTIFICATION_ICONS[notif as keyof typeof NOTIFICATION_ICONS];
                            return Icon ? <Icon key={notif} className="h-3 w-3 flex-shrink-0" aria-label={notif} role="img" /> : null;
                          })}
                          {alert.notifications.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{alert.notifications.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {alert.incidentId || alert.incident_id ? (
                          <Badge variant="outline" className="text-xs truncate max-w-[90px]" title={alert.incidentId || alert.incident_id}>
                            {alert.incidentId || alert.incident_id}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewClick(alert)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateClick(alert)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Update
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(alert.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Triggers Section */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Alert Triggers
          </CardTitle>
          <CardDescription>
            Trigger events for all security alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {triggers.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No triggers</p>
              <p className="text-sm text-muted-foreground mt-2">
                Trigger events will appear here when alerts are triggered
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
              <table className="w-full text-sm border-0">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[150px]">Timestamp</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[200px]">Alert</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Severity</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[140px]">Client IP</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[150px]">Endpoint</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Method</th>
                    {/* <th className="px-3 py-2 text-left whitespace-nowrap min-w-[80px]">Status Code</th> */}
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map((trigger) => {
                    // Try to find related alert by alert_type or alert_id
                    const relatedAlert = alerts.find(a => 
                      a.alert_type === trigger.alert_type || 
                      a.id === trigger.alert_id || 
                      a.id === trigger.alert
                    );
                    
                    // Use occurred_at, timestamp, or created_at for display
                    const triggerTime = trigger.occurred_at || trigger.timestamp || trigger.created_at;
                    
                    // Use threat_level or severity
                    const threatLevel = trigger.threat_level || trigger.severity || relatedAlert?.severity || 'medium';
                    
                    return (
                      <tr key={trigger.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          <span className="text-xs whitespace-nowrap">
                            {triggerTime ? formatDate(triggerTime) : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[200px]" title={relatedAlert?.name || trigger.alert_name || trigger.alert_type || 'Unknown Alert'}>
                              {relatedAlert?.name || trigger.alert_name || trigger.alert_type || 'Unknown Alert'}
                            </div>
                            {trigger.evidence && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={trigger.evidence}>
                                {trigger.evidence}
                              </div>
                            )}
                            {!trigger.evidence && relatedAlert?.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={relatedAlert.description}>
                                {relatedAlert.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`${getSeverityColor(threatLevel)} text-xs`}>
                            {threatLevel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs font-mono truncate max-w-[140px]" title={trigger.client_ip || trigger.ip || '-'}>
                              {trigger.client_ip || trigger.ip || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs font-mono truncate max-w-[150px]" title={trigger.url || trigger.endpoint || trigger.path || trigger.endpoint_path || '-'}>
                            {trigger.url || trigger.endpoint || trigger.path || trigger.endpoint_path || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {trigger.method || '-'}
                          </Badge>
                        </td>
                        
                        <td className="px-3 py-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Trigger Details</DialogTitle>
                                <DialogDescription>
                                  Complete information about this trigger event
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Timestamp</Label>
                                    <p className="text-sm">
                                      {trigger.occurred_at ? formatDate(trigger.occurred_at) : 
                                       trigger.timestamp ? formatDate(trigger.timestamp) : 
                                       trigger.created_at ? formatDate(trigger.created_at) : '-'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Alert Type</Label>
                                    <p className="text-sm font-medium">{trigger.alert_type || relatedAlert?.name || trigger.alert_name || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <Label>Threat Level</Label>
                                    <Badge className={getSeverityColor(trigger.threat_level || trigger.severity || relatedAlert?.severity || 'medium')}>
                                      {trigger.threat_level || trigger.severity || relatedAlert?.severity || 'medium'}
                                    </Badge>
                                  </div>
                                  {trigger.status_code && (
                                    <div>
                                      <Label>Status Code</Label>
                                      <p className="text-sm">{trigger.status_code}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {trigger.evidence && (
                                  <div>
                                    <Label>Evidence</Label>
                                    <p className="text-sm">{trigger.evidence}</p>
                                  </div>
                                )}
                                
                                {trigger.client_ip || trigger.ip ? (
                                  <div>
                                    <Label>Client IP</Label>
                                    <p className="text-sm font-mono">{trigger.client_ip || trigger.ip}</p>
                                  </div>
                                ) : null}
                                
                                {trigger.url || trigger.endpoint || trigger.path || trigger.endpoint_path ? (
                                  <div>
                                    <Label>URL / Endpoint</Label>
                                    <p className="text-sm font-mono">{trigger.url || trigger.endpoint || trigger.path || trigger.endpoint_path}</p>
                                  </div>
                                ) : null}
                                
                                {trigger.method && (
                                  <div>
                                    <Label>Method</Label>
                                    <Badge variant="outline">{trigger.method}</Badge>
                                  </div>
                                )}
                                
                                {trigger.headers && Object.keys(trigger.headers).length > 0 && (
                                  <div>
                                    <Label>Headers</Label>
                                    <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(trigger.headers, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {trigger.extra && Object.keys(trigger.extra).length > 0 && (
                                  <div>
                                    <Label>Extra Data</Label>
                                    <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(trigger.extra, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {trigger.request_body && (
                                  <div>
                                    <Label>Request Body</Label>
                                    <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {typeof trigger.request_body === 'object' 
                                          ? JSON.stringify(trigger.request_body, null, 2) 
                                          : trigger.request_body}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {trigger.details && Object.keys(trigger.details).length > 0 && (
                                  <div>
                                    <Label>Additional Details</Label>
                                    <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(trigger.details, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {trigger.metadata && Object.keys(trigger.metadata).length > 0 && (
                                  <div>
                                    <Label>Metadata</Label>
                                    <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(trigger.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
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
        </CardContent>
      </Card>

      {/* Update Alert Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Alert Notifications</DialogTitle>
            <DialogDescription>
              Update notification settings for {selectedAlertForUpdate?.name || 'this alert'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Notification Channels</Label>
              <div className="mt-2 space-y-2">
                {['email', 'slack', 'teams', 'webhook'].map((channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <Checkbox
                      id={`channel-${channel}`}
                      checked={updateFormData.notification_channels.includes(channel)}
                      onCheckedChange={() => handleNotificationChannelToggle(channel)}
                    />
                    <Label htmlFor={`channel-${channel}`} className="text-sm capitalize">
                      {channel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="slack-webhook" className="text-sm font-medium">
                Slack Webhook URL
              </Label>
              <Input
                id="slack-webhook"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={updateFormData.slack_webhook}
                onChange={(e) => setUpdateFormData(prev => ({ ...prev, slack_webhook: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="teams-webhook" className="text-sm font-medium">
                Teams Webhook URL
              </Label>
              <Input
                id="teams-webhook"
                type="url"
                placeholder="https://outlook.office.com/webhook/..."
                value={updateFormData.teams_webhook}
                onChange={(e) => setUpdateFormData(prev => ({ ...prev, teams_webhook: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="alert@example.com"
                value={updateFormData.email}
                onChange={(e) => setUpdateFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="webhook-url" className="text-sm font-medium">
                Generic Webhook URL
              </Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://example.com/webhook"
                value={updateFormData.webhook_url}
                onChange={(e) => setUpdateFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateDialogOpen(false);
                  setSelectedAlertForUpdate(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSubmit} disabled={loading}>
                {loading ? 'Updating...' : 'Update Alert'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the alert
              {selectedAlertForDelete && alerts.find(a => a.id === selectedAlertForDelete) && (
                <span className="font-semibold"> "{alerts.find(a => a.id === selectedAlertForDelete)?.name}"</span>
              )}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAlertForDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Alert Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              View conditions and configuration for {selectedAlertForView?.name || 'this alert'}
            </DialogDescription>
          </DialogHeader>
          {selectedAlertForView && (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Alert Name</Label>
                  <p className="text-sm font-medium mt-1">{selectedAlertForView.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Alert Type</Label>
                  <p className="text-sm mt-1">
                    {ALERT_TYPES[selectedAlertForView.alert_type || selectedAlertForView.type]?.name || selectedAlertForView.alert_type || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedAlertForView.status)}
                    <span className="text-sm capitalize">{selectedAlertForView.status || '-'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <Badge className={`${getSeverityColor(selectedAlertForView.severity)} text-xs mt-1`}>
                    {selectedAlertForView.severity || '-'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm mt-1">{formatDate(selectedAlertForView.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Triggered</Label>
                  <p className="text-sm mt-1">
                    {selectedAlertForView.last_triggered || selectedAlertForView.lastTriggered 
                      ? formatDate(selectedAlertForView.last_triggered || selectedAlertForView.lastTriggered)
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trigger Count</Label>
                  <p className="text-sm mt-1">{selectedAlertForView.trigger_count || selectedAlertForView.triggerCount || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Acknowledged</Label>
                  <p className="text-sm mt-1">{selectedAlertForView.acknowledged ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedAlertForView.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">{selectedAlertForView.description}</p>
                </div>
              )}

              {/* Configuration/Conditions */}
              <div>
                <Label className="text-sm font-medium">Conditions & Configuration</Label>
                <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                  {selectedAlertForView.configuration && Object.keys(selectedAlertForView.configuration).length > 0 ? (
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedAlertForView.configuration, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">No configuration set</p>
                  )}
                </div>
              </div>

              {/* Notification Channels */}
              <div>
                <Label className="text-sm font-medium">Notification Channels</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAlertForView.notification_channels && selectedAlertForView.notification_channels.length > 0 ? (
                    selectedAlertForView.notification_channels.map((channel: string) => {
                      const Icon = NOTIFICATION_ICONS[channel as keyof typeof NOTIFICATION_ICONS];
                      return (
                        <Badge key={channel} variant="outline" className="flex items-center gap-1">
                          {Icon && <Icon className="h-3 w-3" />}
                          <span className="capitalize">{channel}</span>
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No notification channels configured</p>
                  )}
                </div>
              </div>

              {/* Notification Settings */}
              {(selectedAlertForView.notification_settings || (selectedAlertForView.configuration && selectedAlertForView.configuration.notification_settings)) && (
                <div>
                  <Label className="text-sm font-medium">Notification Settings</Label>
                  <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(
                        selectedAlertForView.notification_settings || selectedAlertForView.configuration?.notification_settings,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* Incident ID */}
              {selectedAlertForView.incident_id || selectedAlertForView.incidentId ? (
                <div>
                  <Label className="text-sm font-medium">Associated Incident</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedAlertForView.incident_id || selectedAlertForView.incidentId}
                  </Badge>
                </div>
              ) : null}

              {/* Alert ID */}
              <div>
                <Label className="text-sm font-medium">Alert ID</Label>
                <p className="text-sm font-mono mt-1">{selectedAlertForView.id}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setViewDialogOpen(false);
                setSelectedAlertForView(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityAlerts;
