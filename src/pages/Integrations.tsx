
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Puzzle,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Zap,
  MessageSquare,
  BarChart3,
  Shield,
  Webhook,
  Cloud,
} from "lucide-react";
import { useState } from "react";

const Integrations = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const integrations = [
    {
      id: "slack",
      name: "Slack",
      description: "Get real-time security alerts in your Slack channels",
      icon: MessageSquare,
      status: "connected",
      color: "text-purple-600",
      category: "Messaging",
      config: { webhook: "https://hooks.slack.com/...", channel: "#security" },
    },
    {
      id: "datadog",
      name: "Datadog",
      description: "Send metrics and logs to Datadog for monitoring",
      icon: BarChart3,
      status: "connected",
      color: "text-blue-600",
      category: "Monitoring",
      config: { apiKey: "***********", site: "datadoghq.com" },
    },
    {
      id: "aws-waf",
      name: "AWS WAF",
      description: "Sync rules with AWS Web Application Firewall",
      icon: Shield,
      status: "available",
      color: "text-orange-600",
      category: "Security",
      config: {},
    },
    {
      id: "splunk",
      name: "Splunk",
      description: "Forward security events to Splunk SIEM",
      icon: BarChart3,
      status: "available",
      color: "text-green-600",
      category: "SIEM",
      config: {},
    },
    {
      id: "grafana",
      name: "Grafana",
      description: "Visualize security metrics in Grafana dashboards",
      icon: BarChart3,
      status: "connected",
      color: "text-red-600",
      category: "Monitoring",
      config: { url: "https://grafana.company.com", token: "***********" },
    },
    {
      id: "webhooks",
      name: "Custom Webhooks",
      description: "Send events to custom webhook endpoints",
      icon: Webhook,
      status: "configured",
      color: "text-indigo-600",
      category: "Custom",
      config: { endpoints: ["https://api.company.com/security"] },
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Connected</Badge>;
      case "configured":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Configured</Badge>;
      case "available":
        return <Badge variant="outline">Available</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "configured":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "available":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external tools and services to enhance your security workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Webhook className="h-4 w-4 mr-2" />
            Test Webhook
          </Button>
          <Button size="sm" className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">6 categories available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">4</div>
            <p className="text-xs text-muted-foreground">Currently connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Sent</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47,392</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">Delivery success</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const IconComponent = integration.icon;
          return (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${integration.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(integration.status)}
                    <Switch checked={integration.status === "connected"} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {integration.description}
                </p>
                
                <div className="flex items-center justify-between">
                  {getStatusBadge(integration.status)}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedIntegration(integration.id)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configure {integration.name}</DialogTitle>
                        <DialogDescription>
                          Set up and configure your {integration.name} integration
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {integration.id === "slack" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="webhook">Webhook URL</Label>
                              <Input
                                id="webhook"
                                placeholder="https://hooks.slack.com/services/..."
                                defaultValue={integration.config.webhook}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="channel">Channel</Label>
                              <Input
                                id="channel"
                                placeholder="#security"
                                defaultValue={integration.config.channel}
                              />
                            </div>
                          </>
                        )}
                        
                        {integration.id === "datadog" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="apiKey">API Key</Label>
                              <Input
                                id="apiKey"
                                type="password"
                                placeholder="Enter your Datadog API key"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="site">Site</Label>
                              <Input
                                id="site"
                                placeholder="datadoghq.com"
                                defaultValue={integration.config.site}
                              />
                            </div>
                          </>
                        )}
                        
                        {integration.id === "webhooks" && (
                          <div className="space-y-2">
                            <Label htmlFor="endpoint">Webhook Endpoint</Label>
                            <Input
                              id="endpoint"
                              placeholder="https://api.company.com/webhooks/security"
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Test Connection</Button>
                          <Button>Save Configuration</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Integration Activity</CardTitle>
          <CardDescription>
            Latest events and notifications sent to external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                integration: "Slack",
                event: "High severity threat detected",
                timestamp: "2 minutes ago",
                status: "delivered",
              },
              {
                integration: "Datadog",
                event: "Metric: threat_count updated",
                timestamp: "5 minutes ago",
                status: "delivered",
              },
              {
                integration: "Grafana",
                event: "Dashboard data refreshed",
                timestamp: "10 minutes ago",
                status: "delivered",
              },
              {
                integration: "Custom Webhook",
                event: "API security alert",
                timestamp: "15 minutes ago",
                status: "failed",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{activity.integration}</span>
                    <span className="text-xs text-muted-foreground">{activity.event}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                  <Badge 
                    variant={activity.status === "delivered" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Integrations;
