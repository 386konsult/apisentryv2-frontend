
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Globe,
  Search,
  Filter,
  Plus,
  Settings,
  BarChart3,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const APIEndpoints = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const mockEndpoints = [
    {
      id: 1,
      path: "/api/v1/users",
      method: "GET",
      status: "healthy",
      requestCount: 125847,
      avgResponseTime: 45,
      errorRate: 0.02,
      lastAccessed: "2 minutes ago",
      protection: true,
      rulesApplied: 12,
    },
    {
      id: 2,
      path: "/api/v1/auth/login",
      method: "POST",
      status: "healthy",
      requestCount: 89234,
      avgResponseTime: 123,
      errorRate: 0.15,
      lastAccessed: "1 minute ago",
      protection: true,
      rulesApplied: 8,
    },
    {
      id: 3,
      path: "/api/v1/payments",
      method: "POST",
      status: "warning",
      requestCount: 45621,
      avgResponseTime: 234,
      errorRate: 2.34,
      lastAccessed: "5 minutes ago",
      protection: true,
      rulesApplied: 15,
    },
    {
      id: 4,
      path: "/api/v1/upload",
      method: "POST",
      status: "error",
      requestCount: 12456,
      avgResponseTime: 456,
      errorRate: 5.67,
      lastAccessed: "10 minutes ago",
      protection: false,
      rulesApplied: 0,
    },
  ];

  const trafficData = [
    { hour: "00", requests: 1200 },
    { hour: "04", requests: 800 },
    { hour: "08", requests: 2400 },
    { hour: "12", requests: 3200 },
    { hour: "16", requests: 2800 },
    { hour: "20", requests: 1800 },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Endpoints</h1>
          <p className="text-muted-foreground">
            Monitor and manage your API endpoints and their security
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Endpoint</DialogTitle>
                <DialogDescription>
                  Register a new API endpoint for monitoring and protection
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method">Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="path">Endpoint Path</Label>
                    <Input id="path" placeholder="/api/v1/resource" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="protection" />
                  <Label htmlFor="protection">Enable Protection</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Add Endpoint</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">12 added this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">234</div>
            <p className="text-xs text-muted-foreground">94.7% uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">198</div>
            <p className="text-xs text-muted-foreground">80.2% coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127ms</div>
            <p className="text-xs text-muted-foreground">-15ms from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle>API Traffic Overview</CardTitle>
          <CardDescription>
            Request volume across all endpoints over the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="requests" 
                stroke="hsl(217 91% 60%)" 
                strokeWidth={2}
                dot={{ fill: "hsl(217 91% 60%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search endpoints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints List */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Status</CardTitle>
          <CardDescription>
            Monitor the health and security of your API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEndpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(endpoint.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <span className="font-mono text-sm">{endpoint.path}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last accessed: {endpoint.lastAccessed}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(endpoint.status)}>
                      {endpoint.status}
                    </Badge>
                    {endpoint.protection ? (
                      <Badge variant="outline" className="text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Protected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        Unprotected
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Requests</Label>
                    <div className="text-sm font-medium">
                      {endpoint.requestCount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Avg Response</Label>
                    <div className="text-sm font-medium">{endpoint.avgResponseTime}ms</div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Error Rate</Label>
                    <div className="text-sm font-medium">{endpoint.errorRate}%</div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rules Applied</Label>
                    <div className="text-sm font-medium">{endpoint.rulesApplied}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Switch checked={endpoint.protection} />
                    <Label className="text-sm">Protection enabled</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIEndpoints;
