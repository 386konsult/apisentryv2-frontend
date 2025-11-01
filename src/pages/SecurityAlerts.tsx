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

  useEffect(() => {
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
        const mappedAlerts = apiAlerts.map(alert => ({
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
          notification_channels: alert.notification_channels,
          acknowledged: alert.acknowledged,
          incident_id: alert.incident_id,
          // Additional derived fields for component
          type: alert.alert_type,
          lastTriggered: alert.last_triggered,
          triggerCount: alert.trigger_count,
          notifications: alert.notification_channels,
          incidentId: alert.incident_id,
        }));
        
        setAlerts(mappedAlerts);
        
        // Triggers API endpoint doesn't exist yet - set to empty array for now
        setTriggers([]);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
        setTriggers([]);
      } finally {
        setLoading(false);
      }
    };
    
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

  const handleCreateIncident = (data: IncidentFormData) => {
    // Note: Incident creation may need backend API call in production
    // TODO: Implement incident creation via API if needed
    console.log('Creating incident:', {
      ...data,
      alertIds: selectedAlerts,
    });

    toast({
      title: "Incident Created",
      description: "New incident has been created successfully.",
      variant: "default",
    });

    setSelectedAlerts([]);
    setShowCreateIncident(false);
  };

  const handleAlertStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await apiService.updateAlertStatus(alertId, newStatus);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      ));
      // Removed incident update logic to keep incidents separate
    } catch (error) {
      console.error('Error updating alert status:', error);
    }
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
    dateString = dateString.replace(/\+00:00Z$/, 'Z');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
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
                          {alert.lastTriggered ? new Date(alert.lastTriggered).toLocaleDateString() : '-'}
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
                            <DropdownMenuItem onClick={() => handleAlertStatusChange(alert.id, 'paused')}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAlertStatusChange(alert.id, 'active')}>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAlertStatusChange(alert.id, 'resolved')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
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
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[80px]">Status Code</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map((trigger) => {
                    const relatedAlert = alerts.find(a => a.id === trigger.alert_id || a.id === trigger.alert);
                    
                    return (
                      <tr key={trigger.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          <span className="text-xs whitespace-nowrap">
                            {trigger.timestamp ? formatDate(trigger.timestamp) : trigger.created_at ? formatDate(trigger.created_at) : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[200px]" title={relatedAlert?.name || trigger.alert_name || 'Unknown Alert'}>
                              {relatedAlert?.name || trigger.alert_name || 'Unknown Alert'}
                            </div>
                            {relatedAlert?.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={relatedAlert.description}>
                                {relatedAlert.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`${getSeverityColor(trigger.severity || relatedAlert?.severity || 'medium')} text-xs`}>
                            {trigger.severity || relatedAlert?.severity || 'medium'}
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
                          <span className="text-xs font-mono truncate max-w-[150px]" title={trigger.endpoint || trigger.path || trigger.endpoint_path || '-'}>
                            {trigger.endpoint || trigger.path || trigger.endpoint_path || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {trigger.method || '-'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {trigger.status_code ? (
                            <Badge variant={trigger.status_code >= 400 ? "destructive" : "outline"} className="text-xs">
                              {trigger.status_code}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
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
                                    <p className="text-sm">{trigger.timestamp ? formatDate(trigger.timestamp) : trigger.created_at ? formatDate(trigger.created_at) : '-'}</p>
                                  </div>
                                  <div>
                                    <Label>Alert</Label>
                                    <p className="text-sm font-medium">{relatedAlert?.name || trigger.alert_name || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <Label>Severity</Label>
                                    <Badge className={getSeverityColor(trigger.severity || relatedAlert?.severity || 'medium')}>
                                      {trigger.severity || relatedAlert?.severity || 'medium'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Status Code</Label>
                                    <p className="text-sm">{trigger.status_code || '-'}</p>
                                  </div>
                                </div>
                                
                                {trigger.client_ip || trigger.ip ? (
                                  <div>
                                    <Label>Client IP</Label>
                                    <p className="text-sm font-mono">{trigger.client_ip || trigger.ip}</p>
                                  </div>
                                ) : null}
                                
                                {trigger.endpoint || trigger.path || trigger.endpoint_path ? (
                                  <div>
                                    <Label>Endpoint</Label>
                                    <p className="text-sm font-mono">{trigger.endpoint || trigger.path || trigger.endpoint_path}</p>
                                  </div>
                                ) : null}
                                
                                {trigger.method && (
                                  <div>
                                    <Label>Method</Label>
                                    <Badge variant="outline">{trigger.method}</Badge>
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
    </div>
  );
};

export default SecurityAlerts;
