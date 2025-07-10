
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Globe,
  Users,
  Settings,
  Eye,
} from "lucide-react";

const Dashboard = () => {
  // Mock data for demonstrations
  const trafficData = [
    { name: "Mon", requests: 2400, blocked: 400, allowed: 2000 },
    { name: "Tue", requests: 1398, blocked: 298, allowed: 1100 },
    { name: "Wed", requests: 9800, blocked: 1200, allowed: 8600 },
    { name: "Thu", requests: 3908, blocked: 508, allowed: 3400 },
    { name: "Fri", requests: 4800, blocked: 600, allowed: 4200 },
    { name: "Sat", requests: 3800, blocked: 480, allowed: 3320 },
    { name: "Sun", requests: 4300, blocked: 530, allowed: 3770 },
  ];

  const threatTypes = [
    { name: "SQL Injection", value: 45, color: "#ef4444" },
    { name: "XSS", value: 30, color: "#f97316" },
    { name: "CSRF", value: 15, color: "#eab308" },
    { name: "Brute Force", value: 10, color: "#8b5cf6" },
  ];

  const recentThreats = [
    {
      id: 1,
      timestamp: "2024-01-15 14:32:21",
      source: "192.168.1.45",
      endpoint: "/api/users",
      threat: "SQL Injection",
      status: "blocked",
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:31:45",
      source: "10.0.0.123",
      endpoint: "/api/login",
      threat: "Brute Force",
      status: "blocked",
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:30:12",
      source: "172.16.0.89",
      endpoint: "/api/comments",
      threat: "XSS",
      status: "blocked",
    },
    {
      id: 4,
      timestamp: "2024-01-15 14:28:33",
      source: "203.0.113.42",
      endpoint: "/api/upload",
      threat: "Malicious File",
      status: "quarantined",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      blocked: "destructive",
      quarantined: "secondary",
      allowed: "default",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time API security monitoring and threat analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button size="sm" className="gradient-primary">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847,392</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Threats</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">18,742</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              -8.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2,828,650</div>
            <p className="text-xs text-muted-foreground">
              99.34% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              12 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Traffic Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>
              Request volume and threat blocking over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="allowed" stackId="a" fill="hsl(142 71% 45%)" />
                <Bar dataKey="blocked" stackId="a" fill="hsl(0 84% 60%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threat Types */}
        <Card>
          <CardHeader>
            <CardTitle>Threats by Type</CardTitle>
            <CardDescription>
              Distribution of detected threat categories
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {threatTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Live Threat Activity
          </CardTitle>
          <CardDescription>
            Real-time security events and threat detections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentThreats.map((threat) => (
              <div
                key={threat.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{threat.threat}</span>
                    <span className="text-xs text-muted-foreground">
                      {threat.timestamp}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{threat.endpoint}</span>
                    <span className="text-xs text-muted-foreground">
                      from {threat.source}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(threat.status)}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              WAF Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage security rules and policies
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Configure Rules
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Threat Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Review detailed security events
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage team access and tokens
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Connect external tools and alerts
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Setup Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
