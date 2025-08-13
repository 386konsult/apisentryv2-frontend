
import { useState, useEffect } from "react";
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
  Activity,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ThreatLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [threatType, setThreatType] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const threats = allLogs.filter(t => t.waf_blocked);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { id: platformId } = useParams();

  useEffect(() => {
    const fetchThreats = async () => {
      if (!platformId) return;
      try {
  // Use the same endpoint logic as PlatformDetails
        const logs = await apiService.getPlatformRequestLogs(platformId);
        console.log('Fetched request logs:', logs);
        if (Array.isArray(logs)) {
          setAllLogs(logs);
        } else {
          setAllLogs([]);
          toast({
            title: "Error loading threat logs",
            description: "Invalid data format received",
            variant: "destructive",
          });
        }
      } catch (error) {
        setAllLogs([]);
        toast({
          title: "Error loading threat logs",
          description: "Failed to fetch threat logs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchThreats();
  }, [platformId, toast]);

  const getSeverityColor = (threat_level: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    return colors[threat_level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (waf_blocked: boolean) => {
    return waf_blocked ? "destructive" : "default";
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
            <div className="text-2xl font-bold">{threats.length}</div>
            <p className="text-xs text-muted-foreground">Blocked requests in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {threats.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {allLogs.length > 0 ? 
                `${((threats.length / allLogs.length) * 100).toFixed(1)}% blocked` : 
                '0% blocked'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threats.filter(t => t.threat_level === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(threats.map(t => t.client_ip)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique source IPs</p>
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
            {loading ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading threat logs...</p>
              </div>
            ) : threats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No blocked threat logs found</p>
              </div>
            ) : (
              threats.map((threat) => (
                <div
                  key={threat.id}
                  className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <h3 className="font-medium">{threat.waf_rule_triggered ? threat.waf_rule_triggered : (threat.threat_level && threat.threat_level !== 'none' ? threat.threat_level.toUpperCase() : 'Request')}</h3>
                        <p className="text-sm text-muted-foreground">{threat.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(threat.threat_level)}>
                        {threat.threat_level}
                      </Badge>
                      <Badge variant={getStatusColor(threat.waf_blocked)}>
                        {threat.waf_blocked ? 'Blocked' : 'Allowed'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Source</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{threat.client_ip}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Endpoint</Label>
                      <div className="flex items-center gap-2">
                        <Code className="h-3 w-3" />
                        <span className="text-sm font-mono">{threat.method} {threat.path}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Rule</Label>
                      <span className="text-sm">{threat.waf_rule_triggered || 'None'}</span>
                    </div>
                  </div>

                  {(threat.query_params && Object.keys(threat.query_params).length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Query Params</Label>
                      <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                        {JSON.stringify(threat.query_params, null, 2)}
                      </div>
                    </div>
                  )}
                  {(threat.headers && Object.keys(threat.headers).length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Headers</Label>
                      <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                        {JSON.stringify(threat.headers, null, 2)}
                      </div>
                    </div>
                  )}
                  {threat.request_body && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Request Body</Label>
                      <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                        {typeof threat.request_body === 'object' ? JSON.stringify(threat.request_body, null, 2) : threat.request_body}
                      </div>
                    </div>
                  )}
                  {(threat.response_headers && Object.keys(threat.response_headers).length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Response Headers</Label>
                      <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                        {JSON.stringify(threat.response_headers, null, 2)}
                      </div>
                    </div>
                  )}
                  {threat.response_body && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Response Body</Label>
                      <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                        {typeof threat.response_body === 'object' ? JSON.stringify(threat.response_body, null, 2) : threat.response_body}
                      </div>
                    </div>
                  )}
                  {typeof threat.response_time_ms === 'number' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Response Time (ms)</Label>
                      <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                        {threat.response_time_ms}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      User Agent: {threat.user_agent ? threat.user_agent.substring(0, 50) + '...' : 'Unknown'}
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
                          <DialogTitle>Threat Details - {threat.waf_rule_triggered ? threat.waf_rule_triggered : (threat.threat_level && threat.threat_level !== 'none' ? threat.threat_level.toUpperCase() : 'Request')}</DialogTitle>
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
                              <Badge variant={getStatusColor(threat.waf_blocked)}>
                                {threat.waf_blocked ? 'Blocked' : 'Allowed'}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label>Source IP</Label>
                            <p className="text-sm">{threat.client_ip}</p>
                          </div>
                          <div>
                            <Label>Request Path</Label>
                            <p className="text-sm font-mono">{threat.method} {threat.path}</p>
                          </div>
                          {(threat.query_params && Object.keys(threat.query_params).length > 0) && (
                            <div>
                              <Label>Query Params</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2">
                                {JSON.stringify(threat.query_params, null, 2)}
                              </div>
                            </div>
                          )}
                          {(threat.headers && Object.keys(threat.headers).length > 0) && (
                            <div>
                              <Label>Headers</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2">
                                {JSON.stringify(threat.headers, null, 2)}
                              </div>
                            </div>
                          )}
                          {threat.request_body && (
                            <div>
                              <Label>Request Body</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2">
                                {threat.request_body}
                              </div>
                            </div>
                          )}
                          {threat.user_agent && (
                            <div>
                              <Label>User Agent</Label>
                              <p className="text-sm bg-muted p-2 rounded">{threat.user_agent}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatLogs;
