
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
import { apiService, ThreatLog } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const ThreatLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [threatType, setThreatType] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const threatsData = await apiService.getThreatLogs();
        // Ensure threatsData is an array
        if (Array.isArray(threatsData)) {
          setThreats(threatsData);
        } else {
          console.error('Expected array but got:', threatsData);
          setThreats([]);
          toast({
            title: "Error loading threat logs",
            description: "Invalid data format received",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching threats:', error);
        setThreats([]);
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
  }, [toast]);

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
            <div className="text-2xl font-bold">{threats.length}</div>
            <p className="text-xs text-muted-foreground">+18% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {threats.filter(t => t.status === 'blocked').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {threats.length > 0 ? 
                `${((threats.filter(t => t.status === 'blocked').length / threats.length) * 100).toFixed(1)}% success rate` : 
                '0% success rate'
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
              {threats.filter(t => t.severity === 'high').length}
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
              {new Set(threats.map(t => t.source_ip)).size}
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
                <p className="text-muted-foreground">No threat logs found</p>
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
                        <h3 className="font-medium">{threat.threat_type.replace('_', ' ').toUpperCase()}</h3>
                        <p className="text-sm text-muted-foreground">{new Date(threat.timestamp).toLocaleString()}</p>
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
                        <span className="text-sm">{threat.source_ip}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Endpoint</Label>
                      <div className="flex items-center gap-2">
                        <Code className="h-3 w-3" />
                        <span className="text-sm font-mono">{threat.request_method} {threat.request_path}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Rule</Label>
                      <span className="text-sm">{threat.waf_rule_name || 'None'}</span>
                    </div>
                  </div>

                  {threat.details && Object.keys(threat.details).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Details</Label>
                      <div className="bg-muted/50 p-3 rounded font-mono text-sm overflow-x-auto">
                        {JSON.stringify(threat.details, null, 2)}
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
                          <DialogTitle>Threat Details - {threat.threat_type.replace('_', ' ').toUpperCase()}</DialogTitle>
                          <DialogDescription>
                            Complete information about this security event
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Timestamp</Label>
                              <p className="text-sm">{new Date(threat.timestamp).toLocaleString()}</p>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Badge variant={getStatusColor(threat.status)}>
                                {threat.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label>Source IP</Label>
                            <p className="text-sm">{threat.source_ip}</p>
                          </div>
                          <div>
                            <Label>Request Path</Label>
                            <p className="text-sm font-mono">{threat.request_method} {threat.request_path}</p>
                          </div>
                          {threat.details && Object.keys(threat.details).length > 0 && (
                            <div>
                              <Label>Details</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2">
                                {JSON.stringify(threat.details, null, 2)}
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
