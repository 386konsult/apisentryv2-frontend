import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  X,
  Activity,
  Bell,
  Shield,
  Clock,
  Globe,
  User,
  Zap,
  Settings,
  Mail,
  MessageSquare,
  Webhook,
} from 'lucide-react';
import apiService from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ALERT_TYPES = [
  {
    id: 'rate_anomaly',
    name: 'Rate Anomaly',
    description: 'Detect unusual request patterns from specific IPs',
    icon: Zap,
    color: 'text-orange-500',
  },
  {
    id: 'response_anomaly',
    name: 'Response Anomaly',
    description: 'Monitor API response times',
    icon: Clock,
    color: 'text-blue-500',
  },
  {
    id: 'response_failure',
    name: 'Response Failure',
    description: 'Alert on 500 server errors',
    icon: AlertTriangle,
    color: 'text-red-500',
  },
  {
    id: 'invalid_authorization',
    name: 'Invalid Authorization',
    description: 'Detect 401 unauthorized access attempts',
    icon: Shield,
    color: 'text-purple-500',
  },
  {
    id: 'brute_force',
    name: 'Brute Force',
    description: 'Detect multiple failed login attempts',
    icon: User,
    color: 'text-red-600',
  },
  {
    id: 'signature_attack',
    name: 'Signature Attack',
    description: 'Detect known attack patterns',
    icon: Shield,
    color: 'text-yellow-500',
  },
  {
    id: 'custom_rules',
    name: 'Custom Rules',
    description: 'Create custom access control rules',
    icon: Settings,
    color: 'text-green-500',
  },
];

const NOTIFICATION_CHANNELS = [
  { id: 'slack', name: 'Slack', icon: MessageSquare, color: 'text-purple-500' },
  { id: 'teams', name: 'Microsoft Teams', icon: MessageSquare, color: 'text-blue-500' },
  { id: 'email', name: 'Email', icon: Mail, color: 'text-green-500' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, color: 'text-orange-500' },
];

const ATTACK_SIGNATURES = [
  'SQL Injection',
  'XSS (Cross-Site Scripting)',
  'CSRF (Cross-Site Request Forgery)',
  'Path Traversal',
  'Command Injection',
  'LDAP Injection',
  'NoSQL Injection',
  'XML External Entity (XXE)',
  'Server-Side Request Forgery (SSRF)',
  'Remote Code Execution (RCE)',
  'Local File Inclusion (LFI)',
  'Remote File Inclusion (RFI)',
];

const CreateAlert = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string>('');
  const [notificationChannels, setNotificationChannels] = useState<string[]>([]);
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [allowedIPs, setAllowedIPs] = useState<string[]>(['']);
  const [disallowedIPs, setDisallowedIPs] = useState<string[]>(['']);

  // Form state for different alert types
  const [formData, setFormData] = useState({
    // Rate Anomaly
    rateAnomalyIP: '',
    rateAnomalyAllIPs: false,
    rateAnomalyPercentage: '',
    rateAnomalyTimeWindow: '',
    
    // Response Anomaly
    responseAnomalyEndpoint: '',
    responseAnomalyAllEndpoints: false,
    responseAnomalyTime: '',
    
    // Response Failure
    responseFailureEndpoint: '',
    responseFailureAllEndpoints: false,
    responseFailureTimeWindow: '',
    
    // Invalid Authorization
    invalidAuthEndpoint: '',
    invalidAuthAllEndpoints: false,
    invalidAuthTimeWindow: '',
    
    // Brute Force
    bruteForceLoginURL: '',
    bruteForceIP: '',
    bruteForceAllIPs: false,
    bruteForceAttempts: '',
    bruteForceTimeWindow: '60',
    
    // Custom Rules
    customRulesEndpoint: '',
    
    // Notification settings
    slackWebhook: '',
    teamsWebhook: '',
    emailAddress: '',
    webhookURL: '',
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (channel: string) => {
    setNotificationChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleAttackToggle = (attack: string) => {
    setSelectedAttacks(prev => 
      prev.includes(attack) 
        ? prev.filter(a => a !== attack)
        : [...prev, attack]
    );
  };

  const addIPField = (type: 'allowed' | 'disallowed') => {
    if (type === 'allowed') {
      setAllowedIPs(prev => [...prev, '']);
    } else {
      setDisallowedIPs(prev => [...prev, '']);
    }
  };

  const removeIPField = (type: 'allowed' | 'disallowed', index: number) => {
    if (type === 'allowed') {
      setAllowedIPs(prev => prev.filter((_, i) => i !== index));
    } else {
      setDisallowedIPs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateIPField = (type: 'allowed' | 'disallowed', index: number, value: string) => {
    if (type === 'allowed') {
      setAllowedIPs(prev => prev.map((ip, i) => i === index ? value : ip));
    } else {
      setDisallowedIPs(prev => prev.map((ip, i) => i === index ? value : ip));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const platformId = localStorage.getItem('selected_platform_id');
      if (!platformId) throw new Error('No platform selected');

      const alertData = {
        platform_uuid: platformId,
        alert_type: selectedAlertType,
        name: `${ALERT_TYPES.find(t => t.id === selectedAlertType)?.name} Alert`,
        description: `Alert for ${ALERT_TYPES.find(t => t.id === selectedAlertType)?.description}`,
        severity: 'medium', // Default, could be configurable
        configuration: {
          // Map formData to configuration based on alert type
          ...formData,
          attack_signatures: selectedAttacks,
          allowed_ips: allowedIPs.filter(ip => ip.trim()),
          disallowed_ips: disallowedIPs.filter(ip => ip.trim()),
        },
        notification_channels: notificationChannels,
        notification_settings: {
          slack_webhook: formData.slackWebhook,
          teams_webhook: formData.teamsWebhook,
          email: formData.emailAddress,
          webhook_url: formData.webhookURL,
        },
      };

      await apiService.createAlert(alertData);

      toast({
        title: 'Alert created',
        description: 'The alert was created successfully.',
        variant: 'default',
      });

      navigate('/security-alerts');
    } catch (error: any) {
      if (error?.body) {
        const body = error.body;
        let message = '';

        if (typeof body === 'string') {
          message = body;
        } else if (body.detail) {
          message = String(body.detail);
        } else if (body.non_field_errors && Array.isArray(body.non_field_errors)) {
          message = String(body.non_field_errors[0]);
        } else {
          const keys = Object.keys(body || {});
          if (keys.length > 0) {
            const first = body[keys[0]];
            if (Array.isArray(first) && first.length > 0) {
              message = `${keys[0]}: ${first[0]}`;
            } else if (typeof first === 'string') {
              message = `${keys[0]}: ${first}`;
            } else {
              message = JSON.stringify(body);
            }
          } else {
            message = error.message || 'Failed to create alert.';
          }
        }

        toast({
          title: 'Error creating alert',
          description: message.length > 200 ? message.slice(0,200) + '…' : message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error creating alert',
          description: error?.message || 'Failed to create alert.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAlertTypeConfig = () => {
    if (!selectedAlertType) return null;

    switch (selectedAlertType) {
      case 'rate_anomaly':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">IP Address Configuration</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rateAnomalyAllIPs"
                    checked={formData.rateAnomalyAllIPs}
                    onCheckedChange={(checked) => handleInputChange('rateAnomalyAllIPs', checked as boolean)}
                  />
                  <Label htmlFor="rateAnomalyAllIPs" className="text-sm">Monitor all IP addresses</Label>
                </div>
                {!formData.rateAnomalyAllIPs && (
                  <Input
                    placeholder="Enter specific IP address (e.g., 192.168.1.1)"
                    value={formData.rateAnomalyIP}
                    onChange={(e) => handleInputChange('rateAnomalyIP', e.target.value)}
                  />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rateAnomalyPercentage" className="text-sm font-medium">Increase Percentage</Label>
                <Input
                  id="rateAnomalyPercentage"
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.rateAnomalyPercentage}
                  onChange={(e) => handleInputChange('rateAnomalyPercentage', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rateAnomalyTimeWindow" className="text-sm font-medium">Time Window (seconds)</Label>
                <Input
                  id="rateAnomalyTimeWindow"
                  type="number"
                  placeholder="e.g., 300"
                  value={formData.rateAnomalyTimeWindow}
                  onChange={(e) => handleInputChange('rateAnomalyTimeWindow', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'response_anomaly':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">API Endpoint Configuration</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="responseAnomalyAllEndpoints"
                    checked={formData.responseAnomalyAllEndpoints}
                    onCheckedChange={(checked) => handleInputChange('responseAnomalyAllEndpoints', checked as boolean)}
                  />
                  <Label htmlFor="responseAnomalyAllEndpoints" className="text-sm">Monitor all API endpoints</Label>
                </div>
                {!formData.responseAnomalyAllEndpoints && (
                  <Input
                    placeholder="Enter specific API endpoint (e.g., /api/users)"
                    value={formData.responseAnomalyEndpoint}
                    onChange={(e) => handleInputChange('responseAnomalyEndpoint', e.target.value)}
                  />
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="responseAnomalyTime" className="text-sm font-medium">Response Time Threshold (seconds)</Label>
              <Input
                id="responseAnomalyTime"
                type="number"
                placeholder="e.g., 5"
                value={formData.responseAnomalyTime}
                onChange={(e) => handleInputChange('responseAnomalyTime', e.target.value)}
              />
            </div>
          </div>
        );

      case 'response_failure':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">API Endpoint Configuration</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="responseFailureAllEndpoints"
                    checked={formData.responseFailureAllEndpoints}
                    onCheckedChange={(checked) => handleInputChange('responseFailureAllEndpoints', checked as boolean)}
                  />
                  <Label htmlFor="responseFailureAllEndpoints" className="text-sm">Monitor all API endpoints</Label>
                </div>
                {!formData.responseFailureAllEndpoints && (
                  <Input
                    placeholder="Enter specific API endpoint (e.g., /api/users)"
                    value={formData.responseFailureEndpoint}
                    onChange={(e) => handleInputChange('responseFailureEndpoint', e.target.value)}
                  />
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="responseFailureTimeWindow" className="text-sm font-medium">Time Window (seconds) - Leave blank for all 500 errors</Label>
              <Input
                id="responseFailureTimeWindow"
                type="number"
                placeholder="e.g., 60 (optional)"
                value={formData.responseFailureTimeWindow}
                onChange={(e) => handleInputChange('responseFailureTimeWindow', e.target.value)}
              />
            </div>
          </div>
        );

      case 'invalid_authorization':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">API Endpoint Configuration</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invalidAuthAllEndpoints"
                    checked={formData.invalidAuthAllEndpoints}
                    onCheckedChange={(checked) => handleInputChange('invalidAuthAllEndpoints', checked as boolean)}
                  />
                  <Label htmlFor="invalidAuthAllEndpoints" className="text-sm">Monitor all API endpoints</Label>
                </div>
                {!formData.invalidAuthAllEndpoints && (
                  <Input
                    placeholder="Enter specific API endpoint (e.g., /api/users)"
                    value={formData.invalidAuthEndpoint}
                    onChange={(e) => handleInputChange('invalidAuthEndpoint', e.target.value)}
                  />
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="invalidAuthTimeWindow" className="text-sm font-medium">Time Window (seconds) - Leave blank for all 401 errors</Label>
              <Input
                id="invalidAuthTimeWindow"
                type="number"
                placeholder="e.g., 60 (optional)"
                value={formData.invalidAuthTimeWindow}
                onChange={(e) => handleInputChange('invalidAuthTimeWindow', e.target.value)}
              />
            </div>
          </div>
        );

      case 'brute_force':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bruteForceLoginURL" className="text-sm font-medium">Login API URL</Label>
              <Input
                id="bruteForceLoginURL"
                placeholder="e.g., /api/auth/login"
                value={formData.bruteForceLoginURL}
                onChange={(e) => handleInputChange('bruteForceLoginURL', e.target.value)}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">IP Address Configuration</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bruteForceAllIPs"
                    checked={formData.bruteForceAllIPs}
                    onCheckedChange={(checked) => handleInputChange('bruteForceAllIPs', checked as boolean)}
                  />
                  <Label htmlFor="bruteForceAllIPs" className="text-sm">Monitor all IP addresses</Label>
                </div>
                {!formData.bruteForceAllIPs && (
                  <Input
                    placeholder="Enter specific IP address (e.g., 192.168.1.1)"
                    value={formData.bruteForceIP}
                    onChange={(e) => handleInputChange('bruteForceIP', e.target.value)}
                  />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bruteForceAttempts" className="text-sm font-medium">Allowed Attempts</Label>
                <Input
                  id="bruteForceAttempts"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.bruteForceAttempts}
                  onChange={(e) => handleInputChange('bruteForceAttempts', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bruteForceTimeWindow" className="text-sm font-medium">Time Window (seconds)</Label>
                <Input
                  id="bruteForceTimeWindow"
                  type="number"
                  placeholder="60"
                  value={formData.bruteForceTimeWindow}
                  onChange={(e) => handleInputChange('bruteForceTimeWindow', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'signature_attack':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select Attack Signatures</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ATTACK_SIGNATURES.map((attack) => (
                  <div key={attack} className="flex items-center space-x-2">
                    <Checkbox
                      id={`attack-${attack}`}
                      checked={selectedAttacks.includes(attack)}
                      onCheckedChange={() => handleAttackToggle(attack)}
                    />
                    <Label htmlFor={`attack-${attack}`} className="text-sm">{attack}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'custom_rules':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="customRulesEndpoint" className="text-sm font-medium">API Endpoint</Label>
              <Input
                id="customRulesEndpoint"
                placeholder="e.g., /api/admin"
                value={formData.customRulesEndpoint}
                onChange={(e) => handleInputChange('customRulesEndpoint', e.target.value)}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Allowed IP Addresses</Label>
              <div className="mt-2 space-y-2">
                {allowedIPs.map((ip, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter IP address (e.g., 192.168.1.1)"
                      value={ip}
                      onChange={(e) => updateIPField('allowed', index, e.target.value)}
                    />
                    {allowedIPs.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIPField('allowed', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addIPField('allowed')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allowed IP
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Disallowed IP Addresses</Label>
              <div className="mt-2 space-y-2">
                {disallowedIPs.map((ip, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter IP address (e.g., 192.168.1.1)"
                      value={ip}
                      onChange={(e) => updateIPField('disallowed', index, e.target.value)}
                    />
                    {disallowedIPs.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIPField('disallowed', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addIPField('disallowed')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Disallowed IP
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderNotificationConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Select Notification Channels</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {NOTIFICATION_CHANNELS.map((channel) => (
              <div key={channel.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`notification-${channel.id}`}
                  checked={notificationChannels.includes(channel.id)}
                  onCheckedChange={() => handleNotificationToggle(channel.id)}
                />
                <channel.icon className={`h-4 w-4 ${channel.color}`} />
                <Label htmlFor={`notification-${channel.id}`} className="text-sm">{channel.name}</Label>
              </div>
            ))}
          </div>
        </div>

        {notificationChannels.includes('slack') && (
          <div>
            <Label htmlFor="slackWebhook" className="text-sm font-medium">Slack Webhook URL</Label>
            <Input
              id="slackWebhook"
              placeholder="https://hooks.slack.com/services/..."
              value={formData.slackWebhook}
              onChange={(e) => handleInputChange('slackWebhook', e.target.value)}
            />
          </div>
        )}

        {notificationChannels.includes('teams') && (
          <div>
            <Label htmlFor="teamsWebhook" className="text-sm font-medium">Teams Webhook URL</Label>
            <Input
              id="teamsWebhook"
              placeholder="https://outlook.office.com/webhook/..."
              value={formData.teamsWebhook}
              onChange={(e) => handleInputChange('teamsWebhook', e.target.value)}
            />
          </div>
        )}

        {notificationChannels.includes('email') && (
          <div>
            <Label htmlFor="emailAddress" className="text-sm font-medium">Email Address</Label>
            <Input
              id="emailAddress"
              type="email"
              placeholder="admin@company.com"
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
            />
          </div>
        )}

        {notificationChannels.includes('webhook') && (
          <div>
            <Label htmlFor="webhookURL" className="text-sm font-medium">Webhook URL</Label>
            <Input
              id="webhookURL"
              placeholder="https://your-server.com/webhook"
              value={formData.webhookURL}
              onChange={(e) => handleInputChange('webhookURL', e.target.value)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 max-w-full overflow-hidden">
      {/* Loading overlay while submitting */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="p-4 rounded-md bg-white dark:bg-slate-800 shadow flex items-center space-x-3">
            <Activity className="h-5 w-5 animate-spin" />
            <span className="font-medium">Creating alert…</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/threat-logs')}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Threat Logs
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Alert</h1>
            <p className="text-muted-foreground">
              Configure security alerts and notification channels
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Alert Type
            </CardTitle>
            <CardDescription>
              Select the type of security alert you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {ALERT_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAlertType === type.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-border hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedAlertType(type.id)}
                >
                  <div className="flex items-center space-x-3">
                    <type.icon className={`h-5 w-5 ${type.color}`} />
                    <div className="flex-1">
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    {selectedAlertType === type.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-500" />
              Alert Configuration
            </CardTitle>
            <CardDescription>
              Configure the parameters for your selected alert type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAlertType ? (
              renderAlertTypeConfig()
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an alert type to configure</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-500" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how you want to be notified when this alert is triggered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderNotificationConfig()}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/threat-logs')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedAlertType || notificationChannels.length === 0 || isSubmitting}
          className="gradient-primary"
        >
          {isSubmitting ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Create Alert
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateAlert;
