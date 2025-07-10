
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Server,
  Save,
  AlertCircle,
} from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your API security platform preferences and policies
          </p>
        </div>
        <Button className="gradient-primary">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>
                  Basic platform settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" defaultValue="API Shield Security" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="cet">Central European Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Global API settings and rate limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" defaultValue="https://api.company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="globalRateLimit">Global Rate Limit (per minute)</Label>
                  <Input id="globalRateLimit" type="number" defaultValue="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPayloadSize">Max Payload Size (MB)</Label>
                  <Input id="maxPayloadSize" type="number" defaultValue="10" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Policies
                </CardTitle>
                <CardDescription>
                  Configure security rules and enforcement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Block Suspicious IPs</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically block IPs with suspicious behavior
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Geo-blocking</Label>
                    <p className="text-sm text-muted-foreground">
                      Block requests from specific countries
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require HTTPS</Label>
                    <p className="text-sm text-muted-foreground">
                      Force all API requests to use HTTPS
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blockedCountries">Blocked Countries</Label>
                  <Textarea
                    id="blockedCountries"
                    placeholder="Enter country codes separated by commas"
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Threat Detection
                </CardTitle>
                <CardDescription>
                  Advanced threat detection settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sensitivityLevel">Detection Sensitivity</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="paranoid">Paranoid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="falsePositiveThreshold">False Positive Threshold</Label>
                  <Input 
                    id="falsePositiveThreshold" 
                    type="number" 
                    defaultValue="5" 
                    min="1" 
                    max="100" 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Machine Learning Detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Use AI to detect anomalous patterns
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Behavioral Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Analyze user behavior patterns
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Preferences
                </CardTitle>
                <CardDescription>
                  Configure when and how you receive security alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>High Severity Threats</Label>
                    <p className="text-sm text-muted-foreground">
                      Immediate alerts for critical threats
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Medium Severity Threats</Label>
                    <p className="text-sm text-muted-foreground">
                      Batched alerts for medium threats
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Platform updates and maintenance
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertFrequency">Alert Frequency</Label>
                  <Select defaultValue="realtime">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Email settings for notifications and reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input 
                    id="adminEmail" 
                    type="email" 
                    defaultValue="admin@company.com" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityTeam">Security Team Email</Label>
                  <Input 
                    id="securityTeam" 
                    type="email" 
                    defaultValue="security@company.com" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input id="smtpServer" defaultValue="smtp.company.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input id="smtpPort" type="number" defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpSecurity">Security</Label>
                    <Select defaultValue="tls">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Retention
                </CardTitle>
                <CardDescription>
                  Configure how long data is stored in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="threatLogs">Threat Logs Retention (days)</Label>
                  <Input id="threatLogs" type="number" defaultValue="90" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessLogs">Access Logs Retention (days)</Label>
                  <Input id="accessLogs" type="number" defaultValue="30" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metricsData">Metrics Data Retention (days)</Label>
                  <Input id="metricsData" type="number" defaultValue="365" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-delete Old Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete data past retention period
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Backup & Export
                </CardTitle>
                <CardDescription>
                  Data backup and export settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Create daily backups of critical data
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exportFormat">Export Format</Label>
                  <Select defaultValue="json">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full">
                  Export Data Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deployment Settings */}
        <TabsContent value="deployment">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Deployment Mode
                </CardTitle>
                <CardDescription>
                  Configure deployment type and environment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deploymentType">Deployment Type</Label>
                  <Select defaultValue="cloud">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud">Cloud (SaaS)</SelectItem>
                      <SelectItem value="onprem">On-Premises</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select defaultValue="production">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>High Availability</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable redundant instances
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-scaling</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically scale based on load
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Network Configuration
                </CardTitle>
                <CardDescription>
                  Network and connectivity settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loadBalancer">Load Balancer URL</Label>
                  <Input id="loadBalancer" defaultValue="https://lb.company.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cdnEndpoint">CDN Endpoint</Label>
                  <Input id="cdnEndpoint" defaultValue="https://cdn.company.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedIps">Allowed IP Ranges</Label>
                  <Textarea
                    id="allowedIps"
                    placeholder="Enter IP ranges, one per line"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable CORS</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow cross-origin requests
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
