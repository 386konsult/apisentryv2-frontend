import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  CheckCircle2,
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
    color: 'text-violet-500',
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
    color: 'text-amber-500',
  },
  {
    id: 'custom_rules',
    name: 'Custom Rules',
    description: 'Create custom access control rules',
    icon: Settings,
    color: 'text-emerald-500',
  },
];

const NOTIFICATION_CHANNELS = [
  { id: 'slack', name: 'Slack', icon: MessageSquare, color: 'text-violet-500' },
  { id: 'teams', name: 'Microsoft Teams', icon: MessageSquare, color: 'text-blue-500' },
  { id: 'email', name: 'Email', icon: Mail, color: 'text-emerald-500' },
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

const getSafeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const CreateAlert = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string>('');
  const [notificationChannels, setNotificationChannels] = useState<string[]>([]);
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [allowedIPs, setAllowedIPs] = useState<string[]>(['']);
  const [disallowedIPs, setDisallowedIPs] = useState<string[]>(['']);

  const [formData, setFormData] = useState({
    rateAnomalyIP: '',
    rateAnomalyAllIPs: false,
    rateAnomalyPercentage: '',
    rateAnomalyTimeWindow: '',

    responseAnomalyEndpoint: '',
    responseAnomalyAllEndpoints: false,
    responseAnomalyTime: '',

    responseFailureEndpoint: '',
    responseFailureAllEndpoints: false,
    responseFailureTimeWindow: '',

    invalidAuthEndpoint: '',
    invalidAuthAllEndpoints: false,
    invalidAuthTimeWindow: '',

    bruteForceLoginURL: '',
    bruteForceIP: '',
    bruteForceAllIPs: false,
    bruteForceAttempts: '',
    bruteForceTimeWindow: '60',

    customRulesEndpoint: '',

    slackWebhook: '',
    teamsWebhook: '',
    emailAddress: '',
    webhookURL: '',
  });

  const selectedAlert = ALERT_TYPES.find((type) => type.id === selectedAlertType);
  const SelectedIcon = selectedAlert?.icon || Bell;
  const selectedNotificationLabels = NOTIFICATION_CHANNELS.filter((channel) =>
    notificationChannels.includes(channel.id)
  ).map((channel) => channel.name);

  const activeAllowedIPs = allowedIPs.filter((ip) => ip.trim());
  const activeDisallowedIPs = disallowedIPs.filter((ip) => ip.trim());
  const emailSelected = notificationChannels.includes('email');

  const inputClassName =
    'mt-2 rounded-xl border-slate-200/70 bg-white/90 shadow-sm placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20 dark:border-slate-700/70 dark:bg-slate-900/80';

  const panelClassName =
    'rounded-2xl border border-slate-200/60 bg-slate-50/80 p-5 dark:border-slate-700/60 dark:bg-slate-800/40';

  const configurationCount = (() => {
    switch (selectedAlertType) {
      case 'rate_anomaly':
        return [
          formData.rateAnomalyAllIPs || Boolean(formData.rateAnomalyIP.trim()),
          Boolean(formData.rateAnomalyPercentage),
          Boolean(formData.rateAnomalyTimeWindow),
        ].filter(Boolean).length;
      case 'response_anomaly':
        return [
          formData.responseAnomalyAllEndpoints || Boolean(formData.responseAnomalyEndpoint.trim()),
          Boolean(formData.responseAnomalyTime),
        ].filter(Boolean).length;
      case 'response_failure':
        return [
          formData.responseFailureAllEndpoints || Boolean(formData.responseFailureEndpoint.trim()),
          Boolean(formData.responseFailureTimeWindow),
        ].filter(Boolean).length;
      case 'invalid_authorization':
        return [
          formData.invalidAuthAllEndpoints || Boolean(formData.invalidAuthEndpoint.trim()),
          Boolean(formData.invalidAuthTimeWindow),
        ].filter(Boolean).length;
      case 'brute_force':
        return [
          Boolean(formData.bruteForceLoginURL.trim()),
          formData.bruteForceAllIPs || Boolean(formData.bruteForceIP.trim()),
          Boolean(formData.bruteForceAttempts),
          Boolean(formData.bruteForceTimeWindow),
        ].filter(Boolean).length;
      case 'signature_attack':
        return selectedAttacks.length;
      case 'custom_rules':
        return Number(Boolean(formData.customRulesEndpoint.trim())) + activeAllowedIPs.length + activeDisallowedIPs.length;
      default:
        return 0;
    }
  })();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (channel: string) => {
    setNotificationChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleAttackToggle = (attack: string) => {
    setSelectedAttacks((prev) =>
      prev.includes(attack)
        ? prev.filter((a) => a !== attack)
        : [...prev, attack]
    );
  };

  const addIPField = (type: 'allowed' | 'disallowed') => {
    if (type === 'allowed') {
      setAllowedIPs((prev) => [...prev, '']);
    } else {
      setDisallowedIPs((prev) => [...prev, '']);
    }
  };

  const removeIPField = (type: 'allowed' | 'disallowed', index: number) => {
    if (type === 'allowed') {
      setAllowedIPs((prev) => prev.filter((_, i) => i !== index));
    } else {
      setDisallowedIPs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateIPField = (type: 'allowed' | 'disallowed', index: number, value: string) => {
    if (type === 'allowed') {
      setAllowedIPs((prev) => prev.map((ip, i) => (i === index ? value : ip)));
    } else {
      setDisallowedIPs((prev) => prev.map((ip, i) => (i === index ? value : ip)));
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
        name: `${ALERT_TYPES.find((t) => t.id === selectedAlertType)?.name} Alert`,
        description: `Alert for ${ALERT_TYPES.find((t) => t.id === selectedAlertType)?.description}`,
        severity: 'medium',
        configuration: {
          ...formData,
          attack_signatures: selectedAttacks,
          allowed_ips: allowedIPs.filter((ip) => ip.trim()),
          disallowed_ips: disallowedIPs.filter((ip) => ip.trim()),
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
          description: message.length > 200 ? message.slice(0, 200) + '...' : message,
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

  const renderIPList = (
    title: string,
    description: string,
    type: 'allowed' | 'disallowed',
    values: string[]
  ) => {
    const isAllowed = type === 'allowed';

    return (
      <div className={panelClassName}>
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <div className="space-y-3">
          {values.map((ip, index) => (
            <div key={`${type}-${index}`} className="flex items-center gap-2">
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={ip}
                onChange={(e) => updateIPField(type, index, e.target.value)}
                className="rounded-xl border-slate-200/70 bg-white/90 shadow-sm placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20 dark:border-slate-700/70 dark:bg-slate-900/80"
              />
              {values.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeIPField(type, index)}
                  className="h-10 w-10 rounded-xl border-slate-200/70 dark:border-slate-700/70"
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
            onClick={() => addIPField(type)}
            className={`w-full rounded-xl border-dashed ${
              isAllowed
                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10'
                : 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10'
            }`}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAllowed ? 'Add Allowed IP' : 'Add Disallowed IP'}
          </Button>
        </div>
      </div>
    );
  };

  const renderAlertTypeConfig = () => {
    if (!selectedAlertType) return null;

    switch (selectedAlertType) {
      case 'rate_anomaly':
        return (
          <motion.div
            key={selectedAlertType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className={panelClassName}>
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-500/10">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">IP Monitoring Scope</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Track a single address or apply the anomaly rule across all traffic.
                  </p>
                </div>
              </div>

              <label
                htmlFor="rateAnomalyAllIPs"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60"
              >
                <Checkbox
                  id="rateAnomalyAllIPs"
                  checked={formData.rateAnomalyAllIPs}
                  onCheckedChange={(checked) => handleInputChange('rateAnomalyAllIPs', checked as boolean)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="rateAnomalyAllIPs" className="text-sm font-medium text-slate-900 dark:text-white">
                    Monitor all IP addresses
                  </Label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Useful when you want broader anomaly detection across your platform.
                  </p>
                </div>
              </label>

              {!formData.rateAnomalyAllIPs && (
                <div className="mt-4">
                  <Label htmlFor="rateAnomalyIP" className="text-sm font-medium text-slate-900 dark:text-white">
                    Specific IP Address
                  </Label>
                  <Input
                    id="rateAnomalyIP"
                    placeholder="Enter specific IP address (e.g., 192.168.1.1)"
                    value={formData.rateAnomalyIP}
                    onChange={(e) => handleInputChange('rateAnomalyIP', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={panelClassName}>
                <Label htmlFor="rateAnomalyPercentage" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Increase Percentage
                </Label>
                <Input
                  id="rateAnomalyPercentage"
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.rateAnomalyPercentage}
                  onChange={(e) => handleInputChange('rateAnomalyPercentage', e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div className={panelClassName}>
                <Label htmlFor="rateAnomalyTimeWindow" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Time Window (seconds)
                </Label>
                <Input
                  id="rateAnomalyTimeWindow"
                  type="number"
                  placeholder="e.g., 300"
                  value={formData.rateAnomalyTimeWindow}
                  onChange={(e) => handleInputChange('rateAnomalyTimeWindow', e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </motion.div>
        );
      case 'response_anomaly':
        return (
          <motion.div
            key={selectedAlertType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className={panelClassName}>
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Endpoint Scope</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Monitor one endpoint or apply latency detection across the full API.
                  </p>
                </div>
              </div>

              <label
                htmlFor="responseAnomalyAllEndpoints"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60"
              >
                <Checkbox
                  id="responseAnomalyAllEndpoints"
                  checked={formData.responseAnomalyAllEndpoints}
                  onCheckedChange={(checked) => handleInputChange('responseAnomalyAllEndpoints', checked as boolean)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="responseAnomalyAllEndpoints" className="text-sm font-medium text-slate-900 dark:text-white">
                    Monitor all API endpoints
                  </Label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Best for catching slowdowns anywhere in the application.
                  </p>
                </div>
              </label>

              {!formData.responseAnomalyAllEndpoints && (
                <div className="mt-4">
                  <Label htmlFor="responseAnomalyEndpoint" className="text-sm font-medium text-slate-900 dark:text-white">
                    API Endpoint
                  </Label>
                  <Input
                    id="responseAnomalyEndpoint"
                    placeholder="Enter specific API endpoint (e.g., /api/users)"
                    value={formData.responseAnomalyEndpoint}
                    onChange={(e) => handleInputChange('responseAnomalyEndpoint', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              )}
            </div>

            <div className={panelClassName}>
              <Label htmlFor="responseAnomalyTime" className="text-sm font-semibold text-slate-900 dark:text-white">
                Response Time Threshold (seconds)
              </Label>
              <Input
                id="responseAnomalyTime"
                type="number"
                placeholder="e.g., 5"
                value={formData.responseAnomalyTime}
                onChange={(e) => handleInputChange('responseAnomalyTime', e.target.value)}
                className={inputClassName}
              />
            </div>
          </motion.div>
        );
      case 'response_failure':
        return (
          <motion.div
            key={selectedAlertType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className={panelClassName}>
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Failure Coverage</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Choose one endpoint or detect failures globally.
                  </p>
                </div>
              </div>

              <label
                htmlFor="responseFailureAllEndpoints"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60"
              >
                <Checkbox
                  id="responseFailureAllEndpoints"
                  checked={formData.responseFailureAllEndpoints}
                  onCheckedChange={(checked) => handleInputChange('responseFailureAllEndpoints', checked as boolean)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="responseFailureAllEndpoints" className="text-sm font-medium text-slate-900 dark:text-white">
                    Monitor all API endpoints
                  </Label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Alert on server failures across every route.
                  </p>
                </div>
              </label>

              {!formData.responseFailureAllEndpoints && (
                <div className="mt-4">
                  <Label htmlFor="responseFailureEndpoint" className="text-sm font-medium text-slate-900 dark:text-white">
                    API Endpoint
                  </Label>
                  <Input
                    id="responseFailureEndpoint"
                    placeholder="Enter specific API endpoint (e.g., /api/users)"
                    value={formData.responseFailureEndpoint}
                    onChange={(e) => handleInputChange('responseFailureEndpoint', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              )}
            </div>

            <div className={panelClassName}>
              <Label htmlFor="responseFailureTimeWindow" className="text-sm font-semibold text-slate-900 dark:text-white">
                Time Window (seconds)
              </Label>
              <Input
                id="responseFailureTimeWindow"
                type="number"
                placeholder="e.g., 60 (optional)"
                value={formData.responseFailureTimeWindow}
                onChange={(e) => handleInputChange('responseFailureTimeWindow', e.target.value)}
                className={inputClassName}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Leave blank to alert on every 500 error.
              </p>
            </div>
          </motion.div>
        );
      case 'invalid_authorization':
        return (
          <motion.div
            key={selectedAlertType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className={panelClassName}>
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-500/10">
                  <Shield className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Authorization Scope</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Detect unauthorized access attempts on one route or everywhere.
                  </p>
                </div>
              </div>

              <label
                htmlFor="invalidAuthAllEndpoints"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60"
              >
                <Checkbox
                  id="invalidAuthAllEndpoints"
                  checked={formData.invalidAuthAllEndpoints}
                  onCheckedChange={(checked) => handleInputChange('invalidAuthAllEndpoints', checked as boolean)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="invalidAuthAllEndpoints" className="text-sm font-medium text-slate-900 dark:text-white">
                    Monitor all API endpoints
                  </Label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Broader coverage for suspicious authentication failures.
                  </p>
                </div>
              </label>

              {!formData.invalidAuthAllEndpoints && (
                <div className="mt-4">
                  <Label htmlFor="invalidAuthEndpoint" className="text-sm font-medium text-slate-900 dark:text-white">
                    API Endpoint
                  </Label>
                  <Input
                    id="invalidAuthEndpoint"
                    placeholder="Enter specific API endpoint (e.g., /api/users)"
                    value={formData.invalidAuthEndpoint}
                    onChange={(e) => handleInputChange('invalidAuthEndpoint', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              )}
            </div>

            <div className={panelClassName}>
              <Label htmlFor="invalidAuthTimeWindow" className="text-sm font-semibold text-slate-900 dark:text-white">
                Time Window (seconds)
              </Label>
              <Input
                id="invalidAuthTimeWindow"
                type="number"
                placeholder="e.g., 60 (optional)"
                value={formData.invalidAuthTimeWindow}
                onChange={(e) => handleInputChange('invalidAuthTimeWindow', e.target.value)}
                className={inputClassName}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Leave blank to alert on every 401 event.
              </p>
            </div>
          </motion.div>
        );
      case 'brute_force':
        return (
          <motion.div
            key={selectedAlertType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className={panelClassName}>
              <Label htmlFor="bruteForceLoginURL" className="text-sm font-semibold text-slate-900 dark:text-white">
                Login API URL
              </Label>
              <Input
                id="bruteForceLoginURL"
                placeholder="e.g., /api/auth/login"
                value={formData.bruteForceLoginURL}
                onChange={(e) => handleInputChange('bruteForceLoginURL', e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className={panelClassName}>
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/10">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Source Monitoring</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Focus on a single IP or watch all login traffic.
                  </p>
                </div>
              </div>

              <label
                htmlFor="bruteForceAllIPs"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60"
              >
                <Checkbox
                  id="bruteForceAllIPs"
                  checked={formData.bruteForceAllIPs}
                  onCheckedChange={(checked) => handleInputChange('bruteForceAllIPs', checked as boolean)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="bruteForceAllIPs" className="text-sm font-medium text-slate-900 dark:text-white">
                    Monitor all IP addresses
                  </Label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Ideal for full login abuse coverage.
                  </p>
                </div>
              </label>

              {!formData.bruteForceAllIPs && (
                <div className="mt-4">
                  <Label htmlFor="bruteForceIP" className="text-sm font-medium text-slate-900 dark:text-white">
                    Specific IP Address
                  </Label>
                  <Input
                    id="bruteForceIP"
                    placeholder="Enter specific IP address (e.g., 192.168.1.1)"
                    value={formData.bruteForceIP}
                    onChange={(e) => handleInputChange('bruteForceIP', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={panelClassName}>
                <Label htmlFor="bruteForceAttempts" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Allowed Attempts
                </Label>
                <Input
                  id="bruteForceAttempts"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.bruteForceAttempts}
                  onChange={(e) => handleInputChange('bruteForceAttempts', e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div className={panelClassName}>
                <Label htmlFor="bruteForceTimeWindow" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Time Window (seconds)
                </Label>
                <Input
                  id="bruteForceTimeWindow"
                  type="number"
                  placeholder="60"
                  value={formData.bruteForceTimeWindow}
                  onChange={(e) => handleInputChange('bruteForceTimeWindow', e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </motion.div>
        );
      case 'signature_attack':
        return (
          <motion.div
            key={selectedAlertType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className={panelClassName}>
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
                  <Shield className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Signature Library</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Select the attack patterns you want this rule to watch.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {ATTACK_SIGNATURES.map((attack) => {
                  const attackId = `attack-${getSafeId(attack)}`;
                  const isSelected = selectedAttacks.includes(attack);

                  return (
                    <label
                      key={attack}
                      htmlFor={attackId}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/10'
                          : 'border-slate-200/60 bg-white/80 hover:border-cyan-200 dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-cyan-500/20'
                      }`}
                    >
                      <Checkbox
                        id={attackId}
                        checked={isSelected}
                        onCheckedChange={() => handleAttackToggle(attack)}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor={attackId} className="text-sm font-medium text-slate-900 dark:text-white">
                          {attack}
                        </Label>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Trigger this alert whenever the pattern is detected.
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      case 'custom_rules':
        return (
          <motion.div
            key={selectedAlertType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className={panelClassName}>
              <Label htmlFor="customRulesEndpoint" className="text-sm font-semibold text-slate-900 dark:text-white">
                API Endpoint
              </Label>
              <Input
                id="customRulesEndpoint"
                placeholder="e.g., /api/admin"
                value={formData.customRulesEndpoint}
                onChange={(e) => handleInputChange('customRulesEndpoint', e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {renderIPList(
                'Allowed IP Addresses',
                'These addresses will be explicitly permitted on the selected endpoint.',
                'allowed',
                allowedIPs
              )}
              {renderIPList(
                'Disallowed IP Addresses',
                'These addresses will be explicitly blocked on the selected endpoint.',
                'disallowed',
                disallowedIPs
              )}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

    const renderNotificationConfig = () => {
    return (
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-semibold text-slate-900 dark:text-white">
            Select Notification Channels
          </Label>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Email is currently active. The other channels stay visible for future rollout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {NOTIFICATION_CHANNELS.map((channel) => {
            const isEmail = channel.id === 'email';
            const isDisabled = !isEmail;
            const isSelected = notificationChannels.includes(channel.id);
            const channelId = `notification-${channel.id}`;

            return (
              <label
                key={channel.id}
                htmlFor={channelId}
                className={`flex min-h-[148px] cursor-pointer gap-4 rounded-2xl border p-5 transition-all ${
                  isDisabled
                    ? 'border-slate-200/70 bg-slate-50/80 opacity-70 dark:border-slate-700/60 dark:bg-slate-800/40'
                    : isSelected
                      ? 'border-cyan-300 bg-cyan-50 shadow-sm ring-1 ring-cyan-200 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:ring-cyan-500/20'
                      : 'border-slate-200/70 bg-white/90 hover:border-cyan-200 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-cyan-500/20'
                }`}
              >
                <div className="pt-0.5">
                  <Checkbox
                    id={channelId}
                    checked={isSelected}
                    onCheckedChange={() => {
                      if (!isDisabled) {
                        handleNotificationToggle(channel.id);
                      }
                    }}
                    disabled={isDisabled}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <channel.icon className={`h-4 w-4 shrink-0 ${channel.color}`} />
                      <span className="text-base font-semibold text-slate-900 dark:text-white">
                        {channel.name}
                      </span>
                    </div>

                    {isDisabled && (
                      <Badge className="mt-3 w-fit rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Coming soon
                      </Badge>
                    )}

                    {isSelected && !isDisabled && (
                      <Badge className="mt-3 w-fit rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                        Selected
                      </Badge>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {channel.id === 'email'
                      ? 'Send alerts directly to your team inbox.'
                      : 'Reserved for a later release.'}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {notificationChannels.includes('email') && (
          <div className={`${panelClassName} border border-slate-200/70`}>
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <Mail className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  Email Delivery
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Alerts will be sent here when the rule is triggered.
                </p>
              </div>
            </div>

            <Label htmlFor="emailAddress" className="text-sm font-medium text-slate-900 dark:text-white">
              Email Address
            </Label>
            <Input
              id="emailAddress"
              type="email"
              placeholder="admin@company.com"
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
              className={inputClassName}
            />
          </div>
        )}
      </div>
    );
  };


  const stats = [
    {
      label: 'Alert Types',
      value: ALERT_TYPES.length,
      sub: 'Detection templates',
      icon: Bell,
      iconColor: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Selected Type',
      value: selectedAlert ? selectedAlert.name : 'None',
      sub: 'Current detector',
      icon: SelectedIcon,
      iconColor: 'text-cyan-500',
      bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    },
    {
      label: 'Channels',
      value: notificationChannels.length,
      sub: 'Delivery methods',
      icon: Mail,
      iconColor: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Configured',
      value: configurationCount,
      sub: 'Fields completed',
      icon: Settings,
      iconColor: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/95 px-5 py-4 shadow-2xl dark:bg-slate-900/95">
            <Activity className="h-5 w-5 animate-spin text-cyan-500" />
            <span className="font-medium text-slate-900 dark:text-white">Creating alert...</span>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_32%)]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/threat-logs')}
              disabled={isSubmitting}
              className="border-white/40 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Threat Logs
            </Button>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Create Alert
            </h1>
            <p className="mt-2 max-w-2xl text-blue-100">
              Design your detection rule with the same premium look and structure used across Security Hub.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                {selectedAlert ? selectedAlert.name : 'No alert type selected'}
              </Badge>
              <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                {selectedNotificationLabels.length > 0
                  ? `${selectedNotificationLabels.length} channel selected`
                  : 'No channel selected'}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px]">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-100">Selected Detector</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <SelectedIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selectedAlert ? selectedAlert.name : 'Waiting for selection'}
                  </p>
                  <p className="text-xs text-blue-100">
                    {selectedAlert ? selectedAlert.description : 'Pick a rule from the alert catalog.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-slate-950/20 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-100">Submission Status</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="rounded-full bg-white/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {!selectedAlertType || notificationChannels.length === 0 ? 'Setup in progress' : 'Ready to create'}
                  </p>
                  <p className="text-xs text-blue-100">
                    Select a type and at least one notification channel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-xl p-3 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stat.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <Card className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800/60 dark:bg-slate-900/60">
          <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/60 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
              <Bell className="h-5 w-5 text-blue-500" />
              Alert Type
            </CardTitle>
            <CardDescription>
              Choose the security detection pattern you want to activate.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-3">
              {ALERT_TYPES.map((type) => {
                const isSelected = selectedAlertType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedAlertType(type.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-cyan-300 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-sm dark:border-cyan-500/30 dark:from-cyan-500/10 dark:to-blue-500/10'
                        : 'border-slate-200/60 bg-slate-50/70 hover:border-cyan-200 hover:bg-white hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-800/30 dark:hover:border-cyan-500/20 dark:hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-xl p-3 ${isSelected ? 'bg-white dark:bg-slate-900' : 'bg-white dark:bg-slate-900/70'}`}>
                        <type.icon className={`h-5 w-5 ${type.color}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {type.name}
                          </h3>
                          {isSelected && (
                            <Badge className="rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800/60 dark:bg-slate-900/60">
          <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/60 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
              <Settings className="h-5 w-5 text-emerald-500" />
              Alert Configuration
            </CardTitle>
            <CardDescription>
              Adjust the thresholds, scope, and rule settings for your chosen alert.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {selectedAlertType ? (
              renderAlertTypeConfig()
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
                <div className="rounded-full bg-cyan-50 p-5 dark:bg-cyan-500/10">
                  <Bell className="h-10 w-10 text-cyan-500" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  Select an alert type to configure it
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  The configuration panel updates automatically based on the alert you choose.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800/60 dark:bg-slate-900/60">
          <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/60 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-emerald-500" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Define how your team should receive alerts when this rule triggers.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {renderNotificationConfig()}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800/60 dark:bg-slate-900/60">
          <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/60 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-cyan-500" />
              Alert Summary
            </CardTitle>
            <CardDescription>
              Clean preview of the rule before creation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <SelectedIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-300">Preview</p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {selectedAlert ? `${selectedAlert.name} Alert` : 'No alert type selected'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {selectedAlert
                      ? selectedAlert.description
                      : 'Choose an alert type to see a live summary here.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Current Type
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedAlert ? selectedAlert.name : 'Not selected'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Notifications
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedNotificationLabels.length > 0 ? selectedNotificationLabels.join(', ') : 'None selected'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Completion
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {configurationCount} configuration field{configurationCount === 1 ? '' : 's'} completed
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className={`h-4 w-4 ${selectedAlertType ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                <span className="text-slate-700 dark:text-slate-300">Alert type selected</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className={`h-4 w-4 ${notificationChannels.length > 0 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                <span className="text-slate-700 dark:text-slate-300">Notification channel selected</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className={`h-4 w-4 ${!emailSelected || Boolean(formData.emailAddress.trim()) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                <span className="text-slate-700 dark:text-slate-300">Email destination ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-4 z-20">
        <div className="rounded-2xl border border-slate-200/60 bg-white/90 px-4 py-4 shadow-xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/85">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {!selectedAlertType || notificationChannels.length === 0 ? 'Setup in progress' : 'Ready to create alert'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The page is visually redesigned only. Your original logic and functionality stay the same.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/threat-logs')}
                disabled={isSubmitting}
                className="rounded-xl border-slate-200/70 dark:border-slate-700/70"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedAlertType || notificationChannels.length === 0 || isSubmitting}
                className="rounded-xl bg-cyan-600 text-white shadow-lg hover:bg-cyan-700"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Create Alert
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAlert;
