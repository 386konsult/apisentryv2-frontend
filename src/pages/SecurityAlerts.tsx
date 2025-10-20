import React, { useState } from 'react';
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

// Sample alert data
const SAMPLE_ALERTS = [
  {
    id: '1',
    name: 'High Volume SQL Injection Attempts',
    type: 'signature_attack',
    status: 'active',
    severity: 'high',
    description: 'Multiple SQL injection attempts detected from suspicious IPs',
    createdAt: '2024-01-15T10:30:00Z',
    lastTriggered: '2024-01-15T14:22:00Z',
    triggerCount: 47,
    sourceIPs: ['192.168.1.100', '10.0.0.45', '203.0.113.12'],
    endpoints: ['/api/users', '/api/login', '/api/search'],
    notifications: ['slack', 'email'],
    rules: ['SQL Injection Detection', 'XSS Prevention'],
    incidentId: null,
  },
  {
    id: '2',
    name: 'Brute Force Login Attempts',
    type: 'brute_force',
    status: 'active',
    severity: 'high',
    description: 'Multiple failed login attempts detected from single IP',
    createdAt: '2024-01-15T09:15:00Z',
    lastTriggered: '2024-01-15T14:18:00Z',
    triggerCount: 23,
    sourceIPs: ['198.51.100.42'],
    endpoints: ['/api/auth/login'],
    notifications: ['slack', 'teams'],
    rules: ['Brute Force Protection'],
    incidentId: null,
  },
  {
    id: '3',
    name: 'Response Time Anomaly',
    type: 'response_anomaly',
    status: 'active',
    severity: 'medium',
    description: 'API response times exceeding threshold on user endpoints',
    createdAt: '2024-01-15T08:45:00Z',
    lastTriggered: '2024-01-15T13:55:00Z',
    triggerCount: 12,
    sourceIPs: ['all'],
    endpoints: ['/api/users', '/api/profile'],
    notifications: ['email'],
    rules: ['Response Time Monitoring'],
    incidentId: 'inc-001',
  },
  {
    id: '4',
    name: 'Unauthorized Access Attempts',
    type: 'invalid_authorization',
    status: 'paused',
    severity: 'medium',
    description: '401 errors detected on admin endpoints',
    createdAt: '2024-01-14T16:20:00Z',
    lastTriggered: '2024-01-15T11:30:00Z',
    triggerCount: 8,
    sourceIPs: ['172.16.0.25', '192.168.2.100'],
    endpoints: ['/api/admin', '/api/settings'],
    notifications: ['webhook'],
    rules: ['Authorization Monitoring'],
    incidentId: null,
  },
  {
    id: '5',
    name: 'Server Error Spike',
    type: 'response_failure',
    status: 'active',
    severity: 'high',
    description: 'Increased 500 errors on payment processing endpoint',
    createdAt: '2024-01-15T12:00:00Z',
    lastTriggered: '2024-01-15T14:25:00Z',
    triggerCount: 15,
    sourceIPs: ['all'],
    endpoints: ['/api/payments'],
    notifications: ['slack', 'email', 'teams'],
    rules: ['Error Rate Monitoring'],
    incidentId: 'inc-001',
  },
  {
    id: '6',
    name: 'Rate Limit Exceeded',
    type: 'rate_anomaly',
    status: 'resolved',
    severity: 'low',
    description: 'Request rate exceeded normal patterns',
    createdAt: '2024-01-14T14:30:00Z',
    lastTriggered: '2024-01-14T18:45:00Z',
    triggerCount: 3,
    sourceIPs: ['203.0.113.50'],
    endpoints: ['/api/data'],
    notifications: ['email'],
    rules: ['Rate Limiting'],
    incidentId: null,
  },
];

const SAMPLE_INCIDENTS = [
  {
    id: 'inc-001',
    name: 'API Performance Degradation',
    status: 'investigating',
    severity: 'high',
    description: 'Multiple alerts indicating API performance issues',
    createdAt: '2024-01-15T13:00:00Z',
    alertIds: ['3', '5'],
    assignedTo: 'Security Team',
    priority: 'P1',
  },
];

const ALERT_TYPES = {
  rate_anomaly: { name: 'Rate Anomaly', icon: Zap, color: 'text-orange-500' },
  response_anomaly: { name: 'Response Anomaly', icon: Clock, color: 'text-blue-500' },
  response_failure: { name: 'Response Failure', icon: AlertTriangle, color: 'text-red-500' },
  invalid_authorization: { name: 'Invalid Authorization', icon: Shield, color: 'text-purple-500' },
  brute_force: { name: 'Brute Force', icon: User, color: 'text-red-600' },
  signature_attack: { name: 'Signature Attack', icon: Shield, color: 'text-yellow-500' },
  custom_rules: { name: 'Custom Rules', icon: Settings, color: 'text-green-500' },
};

const NOTIFICATION_ICONS = {
  slack: MessageSquare,
  teams: MessageSquare,
  email: Mail,
  webhook: Webhook,
};

const SecurityAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(SAMPLE_ALERTS);
  const [incidents, setIncidents] = useState(SAMPLE_INCIDENTS);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [newIncidentName, setNewIncidentName] = useState('');
  const [newIncidentDescription, setNewIncidentDescription] = useState('');

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

  const handleCreateIncident = () => {
    if (selectedAlerts.length === 0 || !newIncidentName.trim()) return;

    const newIncident = {
      id: `inc-${Date.now()}`,
      name: newIncidentName,
      status: 'investigating',
      severity: 'medium',
      description: newIncidentDescription,
      createdAt: new Date().toISOString(),
      alertIds: selectedAlerts,
      assignedTo: 'Security Team',
      priority: 'P2',
    };

    setIncidents(prev => [...prev, newIncident]);
    setAlerts(prev => prev.map(alert => 
      selectedAlerts.includes(alert.id) 
        ? { ...alert, incidentId: newIncident.id }
        : alert
    ));

    setSelectedAlerts([]);
    setNewIncidentName('');
    setNewIncidentDescription('');
    setShowCreateIncident(false);
  };

  const handleAlertStatusChange = (alertId: string, newStatus: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: newStatus } : alert
    ));
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
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6 p-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Security Alerts</h1>
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
          <Dialog open={showCreateIncident} onOpenChange={setShowCreateIncident}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="gradient-primary"
                disabled={selectedAlerts.length === 0}
              >
                <Users className="h-4 w-4 mr-2" />
                Create Incident ({selectedAlerts.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogDescription>
                  Group selected alerts into a security incident for investigation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="incidentName">Incident Name</Label>
                  <Input
                    id="incidentName"
                    placeholder="e.g., API Security Breach"
                    value={newIncidentName}
                    onChange={(e) => setNewIncidentName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="incidentDescription">Description</Label>
                  <Input
                    id="incidentDescription"
                    placeholder="Brief description of the incident"
                    value={newIncidentDescription}
                    onChange={(e) => setNewIncidentDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Selected Alerts ({selectedAlerts.length})</Label>
                  <div className="mt-2 space-y-1">
                    {selectedAlerts.map(alertId => {
                      const alert = alerts.find(a => a.id === alertId);
                      return alert ? (
                        <div key={alertId} className="text-sm p-2 bg-muted rounded">
                          {alert.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateIncident(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateIncident} disabled={!newIncidentName.trim()}>
                    Create Incident
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter(i => i.status === 'investigating').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Under investigation
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
                  const incident = alert.incidentId ? incidents.find(i => i.id === alert.incidentId) : null;
                  
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
                        <span className="text-xs truncate max-w-[100px]" title={formatDate(alert.lastTriggered)}>
                          {new Date(alert.lastTriggered).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex space-x-1">
                          {alert.notifications.slice(0, 3).map(notif => {
                            const Icon = NOTIFICATION_ICONS[notif as keyof typeof NOTIFICATION_ICONS];
                            return Icon ? <Icon key={notif} className="h-3 w-3 flex-shrink-0" title={notif} /> : null;
                          })}
                          {alert.notifications.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{alert.notifications.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {incident ? (
                          <Badge variant="outline" className="text-xs truncate max-w-[90px]" title={incident.name}>
                            {incident.name}
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

      {/* Incidents Section */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Active Incidents
            </CardTitle>
            <CardDescription>
              Security incidents created from grouped alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <h3 className="font-medium">{incident.name}</h3>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <Badge variant="outline">{incident.priority}</Badge>
                      <Badge variant="secondary">{incident.status}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Created</Label>
                      <p>{formatDate(incident.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Assigned To</Label>
                      <p>{incident.assignedTo}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Related Alerts</Label>
                      <p>{incident.alertIds.length} alerts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityAlerts;
