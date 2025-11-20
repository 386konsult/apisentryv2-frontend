import { useState, useEffect, useMemo } from "react";
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
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ThreatLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [threatType, setThreatType] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [ipFilter, setIpFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // pagination state
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(100);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [platformName, setPlatformName] = useState<string>('');

  // Reset page to 1 when endpoint filter changes
  useEffect(() => {
    if (endpointFilter) {
      setPage(1);
    }
  }, [endpointFilter]);

  useEffect(() => {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) {
      navigate('/platforms');
      return;
    }
    // Get platform name from localStorage user_platforms
    const platforms = localStorage.getItem('user_platforms');
    if (platforms) {
      const arr = JSON.parse(platforms);
      const found = arr.find((p: any) => p.id === platformId);
      if (found) setPlatformName(found.name);
    }

    const fetchThreats = async () => {
      setLoading(true);
      try {
        const platformId = localStorage.getItem('selected_platform_id');
        if (!platformId) {
          navigate('/platforms');
          return;
        }

        // Fetch last 100 blocked logs
        const response = await apiService.getBlockedThreatLogs(platformId);
        if (Array.isArray(response)) {
          setAllLogs(response); // Set logs directly if response is an array
        } else if (response && Array.isArray(response.logs)) {
          setAllLogs(response.logs); // Extract logs if nested in `logs`
        } else {
          console.error('Unexpected response format for threat logs:', response);
          setAllLogs([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error('Error fetching threat logs:', error);
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
  }, [toast, navigate, timeRange, page, endpointFilter]); // depend on page and endpointFilter so changing them re-fetches

  // Get all blocked threats (unfiltered for stats - from current time range)
  const allBlockedThreats = allLogs.filter(t => t.waf_blocked);

  // Extract unique values for dropdowns
  const uniqueThreatTypes = useMemo(() => {
    const types = new Set<string>();
    allBlockedThreats.forEach(log => {
      if (log.waf_rule_triggered) {
        // Extract threat type from rule name (e.g., "SQL Injection", "XSS", etc.)
        const ruleName = log.waf_rule_triggered.toLowerCase();
        if (ruleName.includes('sql')) types.add('SQL Injection');
        else if (ruleName.includes('xss')) types.add('XSS');
        else if (ruleName.includes('path') || ruleName.includes('traversal')) types.add('Path Traversal');
        else if (ruleName.includes('brute')) types.add('Brute Force');
        else if (ruleName.includes('malware')) types.add('Malware');
        else types.add(log.waf_rule_triggered);
      }
    });
    return Array.from(types).sort();
  }, [allBlockedThreats]);

  const uniqueIPs = useMemo(() => {
    return Array.from(new Set(allBlockedThreats.map(t => t.client_ip))).sort();
  }, [allBlockedThreats]);

  const uniqueEndpoints = useMemo(() => {
    return Array.from(new Set(allBlockedThreats.map(t => `${t.method} ${t.path}`))).sort();
  }, [allBlockedThreats]);

  const uniqueSeverities = useMemo(() => {
    return Array.from(new Set(allBlockedThreats.map(t => t.threat_level).filter(Boolean))).sort();
  }, [allBlockedThreats]);

  // Filter threats based on filters EXCEPT time range (already handled by backend)
  const filteredThreats = allBlockedThreats.filter(log => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      log.client_ip?.toLowerCase().includes(searchLower) ||
      log.path?.toLowerCase().includes(searchLower) ||
      log.waf_rule_triggered?.toLowerCase().includes(searchLower) ||
      log.user_agent?.toLowerCase().includes(searchLower);

    // Severity filter
    const matchesSeverity = severityFilter === 'all' || 
      log.threat_level === severityFilter;

    // IP filter
    const matchesIP = ipFilter === 'all' || 
      log.client_ip === ipFilter;

    // Endpoint filter - backend handles filtering, but we can also do client-side partial matching as fallback
    const matchesEndpoint = !endpointFilter || !endpointFilter.trim() || 
      log.path?.toLowerCase().includes(endpointFilter.toLowerCase()) ||
      `${log.method} ${log.path}`.toLowerCase().includes(endpointFilter.toLowerCase());

    // Threat type filter
    let matchesThreatType = true;
    if (threatType !== 'all') {
      const ruleName = (log.waf_rule_triggered || '').toLowerCase();
      if (threatType === 'SQL Injection') {
        matchesThreatType = ruleName.includes('sql');
      } else if (threatType === 'XSS') {
        matchesThreatType = ruleName.includes('xss');
      } else if (threatType === 'Path Traversal') {
        matchesThreatType = ruleName.includes('path') || ruleName.includes('traversal');
      } else if (threatType === 'Brute Force') {
        matchesThreatType = ruleName.includes('brute');
      } else if (threatType === 'Malware') {
        matchesThreatType = ruleName.includes('malware');
      } else {
        matchesThreatType = log.waf_rule_triggered === threatType;
      }
    }

    return matchesSearch && matchesSeverity && matchesIP && matchesEndpoint && matchesThreatType;
  });

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

  const getRangeDates = (range: string) => {
    if (!range || range === 'all') return null;
    const now = new Date();
    let start: Date;
    switch (range) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return null;
    }
    return { start, end: now };
  };

  // Robust timestamp parser: supports numeric (s or ms) and common string formats
  const parseLogTimestamp = (log: any): number | null => {
    const raw = log?.timestamp ?? log?.created_at ?? log?.createdAt;
    if (raw == null) return null;

    // numeric timestamps (seconds or milliseconds)
    if (typeof raw === "number") {
      // seconds -> convert to ms, milliseconds -> keep
      return raw < 1e12 ? raw * 1000 : raw;
    }

    if (typeof raw === "string") {
      let s = raw.trim();
      // handle weird "+00:00Z" occurrences by normalizing trailing tokens
      s = s.replace(/\+00:00Z$/, "Z");

      // Handle common "DD-MM-YYYY HH:MM" or "D-M-YYYY H:MM" pattern explicitly (e.g. "06-11-2025 17:50")
      const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/;
      const m = s.match(ddmmyyyyRegex);
      if (m) {
        const day = Number(m[1]);
        const month = Number(m[2]);
        const year = Number(m[3]);
        const hour = Number(m[4]);
        const minute = Number(m[5]);
        const second = m[6] ? Number(m[6]) : 0;
        // Construct as UTC to avoid local timezone surprises
        const ms = Date.UTC(year, month - 1, day, hour, minute, second);
        return ms;
      }

      // If format is "YYYY-MM-DD HH:MM:SS" convert to ISO "YYYY-MM-DDTHH:MM:SS"
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
        s = s.replace(" ", "T");
      }

      // If there's no timezone information, assume UTC by appending "Z"
      if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) {
        s = `${s}Z`;
      }

      const ms = Date.parse(s);
      if (!isNaN(ms)) return ms;

      // Fallback: strip fractional seconds and retry
      const stripped = s.replace(/\.\d+/, "");
      const ms2 = Date.parse(stripped);
      if (!isNaN(ms2)) return ms2;
    }

    return null;
  };

  const applyClientRangeFilter = (logs: any[], range: string) => {
    const dates = getRangeDates(range);
    if (!dates) return logs;
    const { start, end } = dates;
    const startMs = start.getTime();
    const endMs = end.getTime();

    return logs.filter((l) => {
      const ts = parseLogTimestamp(l);
      if (ts == null) return false;
      return ts >= startMs && ts <= endMs;
    });
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Threat Logs
            {platformName && (
              <span className="text-base sm:text-lg font-normal text-muted-foreground ml-2">
                • {platformName}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Security events and threat detection history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button 
            size="sm" 
            className="gradient-primary"
            onClick={() => navigate('/create-alert')}
          >
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
            <div className="text-2xl font-bold">{allBlockedThreats.length}</div>
            <p className="text-xs text-muted-foreground">Blocked requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allBlockedThreats.filter(t => t.threat_level === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allBlockedThreats.filter(t => t.threat_level === 'medium').length}
            </div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(allBlockedThreats.map(t => t.client_ip)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique source IPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* First Row: Search and Time Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by IP, path, rule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Second Row: Type Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {uniqueSeverities.map(severity => (
                    <SelectItem key={severity} value={severity}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={threatType} onValueChange={setThreatType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Threat Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Threats</SelectItem>
                  {uniqueThreatTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ipFilter} onValueChange={setIpFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="IP Address" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All IPs</SelectItem>
                  {uniqueIPs.map(ip => (
                    <SelectItem key={ip} value={ip}>
                      {ip}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[250px]">
                <Code className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by endpoint path..."
                  value={endpointFilter}
                  onChange={(e) => setEndpointFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Filter Summary */}
            {(searchTerm || severityFilter !== 'all' || threatType !== 'all' || ipFilter !== 'all' || (endpointFilter && endpointFilter.trim()) || timeRange !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchTerm}
                  </Badge>
                )}
                {timeRange !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Time: {TIME_RANGES.find(r => r.value === timeRange)?.label || timeRange}
                  </Badge>
                )}
                {severityFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Severity: {severityFilter}
                  </Badge>
                )}
                {threatType !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {threatType}
                  </Badge>
                )}
                {ipFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    IP: {ipFilter}
                  </Badge>
                )}
                {endpointFilter && endpointFilter.trim() && (
                  <Badge variant="secondary" className="gap-1">
                    Endpoint: {endpointFilter.length > 20 ? endpointFilter.substring(0, 20) + '...' : endpointFilter}
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setSeverityFilter('all');
                    setThreatType('all');
                    setIpFilter('all');
                    setEndpointFilter('');
                    setTimeRange('all');
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Threat Logs Table */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle>Security Events ({filteredThreats.length})</CardTitle>
          <CardDescription>
            Detailed view of detected threats and security incidents
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-hidden">
          <div className="space-y-4 w-full">
            {loading ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading threat logs...</p>
              </div>
            ) : filteredThreats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No threat logs match your filters</p>
              </div>
            ) : (
              filteredThreats.map((threat) => (
                <div
                  key={threat.id}
                  className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors w-full overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">
                          {threat.waf_rule_triggered || 'Security Event'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{threat.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getSeverityColor(threat.threat_level || 'low')}>
                        {threat.threat_level || 'low'}
                      </Badge>
                      <Badge variant="destructive">
                        Blocked
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Source IP</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="text-sm truncate">{threat.client_ip}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Request</Label>
                      <div className="flex items-center gap-2">
                        <Code className="h-3 w-3 flex-shrink-0" />
                        <span className="text-sm font-mono truncate">{threat.method} {threat.path}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Status Code</Label>
                      <span className="text-sm">{threat.status_code || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground truncate max-w-md">
                      {threat.user_agent ? threat.user_agent.substring(0, 60) + '...' : 'Unknown User Agent'}
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
                          <DialogTitle>Threat Details - {threat.waf_rule_triggered || 'Security Event'}</DialogTitle>
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
                              <Badge variant="destructive">Blocked</Badge>
                            </div>
                            <div>
                              <Label>Severity</Label>
                              <Badge className={getSeverityColor(threat.threat_level || 'low')}>
                                {threat.threat_level || 'low'}
                              </Badge>
                            </div>
                            <div>
                              <Label>Status Code</Label>
                              <p className="text-sm">{threat.status_code || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <Label>Source IP</Label>
                            <p className="text-sm font-mono">{threat.client_ip}</p>
                          </div>
                          <div>
                            <Label>Request</Label>
                            <p className="text-sm font-mono">{threat.method} {threat.path}</p>
                          </div>
                          <div>
                            <Label>WAF Rule Triggered</Label>
                            <p className="text-sm">{threat.waf_rule_triggered || 'None'}</p>
                          </div>
                          {threat.user_agent && (
                            <div>
                              <Label>User Agent</Label>
                              <p className="text-sm bg-muted p-2 rounded break-all">{threat.user_agent}</p>
                            </div>
                          )}
                          {threat.query_params && Object.keys(threat.query_params).length > 0 && (
                            <div>
                              <Label>Query Parameters</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto max-w-full">
                                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(threat.query_params, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                          {threat.headers && Object.keys(threat.headers).length > 0 && (
                            <div>
                              <Label>Request Headers</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto max-w-full">
                                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(threat.headers, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                          {threat.request_body && (
                            <div>
                              <Label>Request Body</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto max-w-full">
                                <pre className="whitespace-pre-wrap break-words">
                                  {typeof threat.request_body === 'object' 
                                    ? JSON.stringify(threat.request_body, null, 2) 
                                    : threat.request_body}
                                </pre>
                              </div>
                            </div>
                          )}
                          {threat.response_headers && Object.keys(threat.response_headers).length > 0 && (
                            <div>
                              <Label>Response Headers</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto max-w-full">
                                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(threat.response_headers, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                          {threat.response_body && (
                            <div>
                              <Label>Response Body</Label>
                              <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto max-w-full">
                                <pre className="whitespace-pre-wrap break-words">
                                  {typeof threat.response_body === 'object' 
                                    ? JSON.stringify(threat.response_body, null, 2) 
                                    : threat.response_body}
                                </pre>
                              </div>
                            </div>
                          )}
                          {typeof threat.response_time_ms === 'number' && (
                            <div>
                              <Label>Response Time</Label>
                              <p className="text-sm">{threat.response_time_ms} ms</p>
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

      {/* Pagination controls for paged blocked logs */}
      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={totalPages !== null && page >= (totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

const TIME_RANGES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Year', value: '1y' },
  { label: 'All Time', value: 'all' },
];

export default ThreatLogs;
