
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Download,
  Shield,
  Clock,
  MapPin,
  Code,
} from "lucide-react";

const ThreatLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [threatType, setThreatType] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  const mockThreats = [
    {
      id: 1,
      timestamp: "2024-01-15 14:32:21",
      sourceIp: "192.168.1.45",
      endpoint: "/api/users",
      method: "POST",
      threatType: "SQL Injection",
      severity: "high",
      status: "blocked",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      payload: "SELECT * FROM users WHERE id = 1 OR 1=1 --",
      location: "New York, US",
      ruleId: "RULE001",
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:31:45",
      sourceIp: "10.0.0.123",
      endpoint: "/api/login",
      method: "POST",
      threatType: "Brute Force",
      severity: "medium",
      status: "blocked",
      userAgent: "curl/7.68.0",
      payload: "Multiple failed login attempts detected",
      location: "London, UK",
      ruleId: "RULE007",
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:30:12",
      sourceIp: "172.16.0.89",
      endpoint: "/api/comments",
      method: "POST",
      threatType: "XSS",
      severity: "high",
      status: "blocked",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      payload: "<script>alert('XSS')</script>",
      location: "Tokyo, JP",
      ruleId: "RULE003",
    },
    {
      id: 4,
      timestamp: "2024-01-15 14:28:33",
      sourceIp: "203.0.113.42",
      endpoint: "/api/upload",
      method: "POST",
      threatType: "Malicious File",
      severity: "high",
      status: "quarantined",
      userAgent: "PostmanRuntime/7.26.8",
      payload: "suspicious.exe file upload attempt",
      location: "Sydney, AU",
      ruleId: "RULE012",
    },
  ];

  const getSeverityColor = (severity: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    return colors[severity as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      blocked: "destructive",
      quarantined: "secondary",
      allowed: "default",
    } as const;
    return colors[status as keyof typeof colors] || "default";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Threat Logs</h1>
          <p className="text-muted-foreground">
            Security events and threat detection history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button size="sm" className="gradient-primary">
            <Shield className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+18% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1,189</div>
            <p className="text-xs text-muted-foreground">95.3% success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">From 45 countries</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={threatType} onValueChange={setThreatType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Threat Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Threats</SelectItem>
                  <SelectItem value="sql">SQL Injection</SelectItem>
                  <SelectItem value="xss">Cross-Site Scripting</SelectItem>
                  <SelectItem value="brute">Brute Force</SelectItem>
                  <SelectItem value="malware">Malware</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[120px]">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threat Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>
            Detailed view of detected threats and security incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockThreats.map((threat) => (
              <div
                key={threat.id}
                className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="font-medium">{threat.threatType}</h3>
                      <p className="text-sm text-muted-foreground">{threat.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(threat.severity)}>
                      {threat.severity}
                    </Badge>
                    <Badge variant={getStatusColor(threat.status)}>
                      {threat.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Source</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm">{threat.sourceIp}</span>
                      <span className="text-xs text-muted-foreground">({threat.location})</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Endpoint</Label>
                    <div className="flex items-center gap-2">
                      <Code className="h-3 w-3" />
                      <span className="text-sm font-mono">{threat.method} {threat.endpoint}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rule</Label>
                    <span className="text-sm">{threat.ruleId}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Payload</Label>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                    {threat.payload}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    User Agent: {threat.userAgent.substring(0, 50)}...
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Threat Details - {threat.threatType}</DialogTitle>
                        <DialogDescription>
                          Complete information about this security event
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Timestamp</Label>
                            <p className="text-sm">{threat.timestamp}</p>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Badge variant={getStatusColor(threat.status)}>
                              {threat.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label>Complete Payload</Label>
                          <div className="bg-muted p-4 rounded font-mono text-sm mt-2">
                            {threat.payload}
                          </div>
                        </div>
                        <div>
                          <Label>Full User Agent</Label>
                          <p className="text-sm bg-muted p-2 rounded">{threat.userAgent}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatLogs;
