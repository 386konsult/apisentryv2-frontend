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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  Download,
  Shield,
  Ban,
  Globe,
  Eye,
  MoreVertical,
  MapPin,
  Bot,
  Activity,
  AlertTriangle,
  Clock,
  Code,
  TrendingUp,
  Flag,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface RequestLog {
  id: string;
  endpoint_name: string;
  platform_name: string;
  timestamp: string;
  method: string;
  path: string;
  query_params: Record<string, any>;
  headers: Record<string, any>;
  request_body: any;
  status_code: number;
  response_headers: Record<string, any>;
  response_body: any;
  response_time_ms: number;
  client_ip: string;
  user_agent: string;
  waf_blocked: boolean;
  waf_rule_triggered: string | null;
  threat_level: string;
  platform: string;
  endpoint: string;
}

const SecurityHub = () => {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [blockIPDialog, setBlockIPDialog] = useState<{ open: boolean; ip: string }>({ open: false, ip: "" });
  const [blockEndpointDialog, setBlockEndpointDialog] = useState<{ open: boolean; endpoint: string; endpointId: string }>({ open: false, endpoint: "", endpointId: "" });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [ipFilter, setIpFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusCodeFilter, setStatusCodeFilter] = useState("all");
  const [threatLevelFilter, setThreatLevelFilter] = useState("all");
  const [wafBlockedFilter, setWafBlockedFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [platformName, setPlatformName] = useState<string>("");

  useEffect(() => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) {
      navigate("/platforms");
      return;
    }

    const platforms = localStorage.getItem("user_platforms");
    if (platforms) {
      const arr = JSON.parse(platforms);
      const found = arr.find((p: any) => p.id === platformId);
      if (found) setPlatformName(found.name);
    }

    fetchLogs(platformId);
  }, [navigate, timeRange, dateFrom, dateTo]);

  const fetchLogs = async (platformId: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (timeRange && timeRange !== "all") {
        params.range = timeRange;
      }
      if (dateFrom) params.start = dateFrom;
      if (dateTo) params.end = dateTo;

      const response = await apiService.getPlatformRequestLogs(platformId, params);
      const logsData = Array.isArray(response) ? response : response.logs || [];
      setLogs(logsData);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error loading logs",
        description: "Failed to fetch request logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filters
  const uniqueIPs = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.client_ip))).sort();
  }, [logs]);

  const uniqueEndpoints = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => `${log.method} ${log.path}`))
    ).sort();
  }, [logs]);

  const uniqueMethods = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.method))).sort();
  }, [logs]);

  const uniqueStatusCodes = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.status_code))).sort(
      (a, b) => a - b
    );
  }, [logs]);

  const uniqueThreatLevels = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => log.threat_level).filter(Boolean))
    ).sort();
  }, [logs]);

  // Apply filters
  useEffect(() => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.client_ip?.toLowerCase().includes(searchLower) ||
          log.path?.toLowerCase().includes(searchLower) ||
          log.endpoint_name?.toLowerCase().includes(searchLower) ||
          log.user_agent?.toLowerCase().includes(searchLower) ||
          log.method?.toLowerCase().includes(searchLower)
      );
    }

    // IP filter
    if (ipFilter !== "all") {
      filtered = filtered.filter((log) => log.client_ip === ipFilter);
    }

    // Endpoint filter
    if (endpointFilter !== "all") {
      filtered = filtered.filter(
        (log) => `${log.method} ${log.path}` === endpointFilter
      );
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((log) => log.method === methodFilter);
    }

    // Status code filter
    if (statusCodeFilter !== "all") {
      filtered = filtered.filter(
        (log) => log.status_code === parseInt(statusCodeFilter)
      );
    }

    // Threat level filter
    if (threatLevelFilter !== "all") {
      filtered = filtered.filter((log) => log.threat_level === threatLevelFilter);
    }

    // WAF blocked filter
    if (wafBlockedFilter !== "all") {
      const blocked = wafBlockedFilter === "blocked";
      filtered = filtered.filter((log) => log.waf_blocked === blocked);
    }

    setFilteredLogs(filtered);
  }, [
    logs,
    searchTerm,
    ipFilter,
    endpointFilter,
    methodFilter,
    statusCodeFilter,
    threatLevelFilter,
    wafBlockedFilter,
  ]);

  // Analytics
  const analytics = useMemo(() => {
    const totalLogs = filteredLogs.length;
    const blockedLogs = filteredLogs.filter((log) => log.waf_blocked).length;
    const uniqueIPs = new Set(filteredLogs.map((log) => log.client_ip)).size;
    const errorLogs = filteredLogs.filter(
      (log) => log.status_code >= 400
    ).length;
    const avgResponseTime =
      filteredLogs.length > 0
        ? filteredLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
          filteredLogs.length
        : 0;

    // Bot detection (simple heuristic based on user agent)
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i,
    ];
    const botRequests = filteredLogs.filter((log) =>
      botPatterns.some((pattern) => pattern.test(log.user_agent || ""))
    ).length;

    // IP frequency for suspicious activity detection
    const ipFrequency: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      ipFrequency[log.client_ip] = (ipFrequency[log.client_ip] || 0) + 1;
    });
    const suspiciousIPs = Object.entries(ipFrequency)
      .filter(([_, count]) => count > 10)
      .length;

    return {
      totalLogs,
      blockedLogs,
      uniqueIPs,
      errorLogs,
      avgResponseTime,
      botRequests,
      suspiciousIPs,
    };
  }, [filteredLogs]);

  const handleBlockIP = async (ip: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      
      await apiService.addToBlacklist({ platform_uuid: platformId, ip });
      toast({
        title: "IP Blocked",
        description: `${ip} has been added to the blacklist.`,
        variant: "default",
      });
      setBlockIPDialog({ open: false, ip: "" });
    } catch (error) {
      toast({
        title: "Error blocking IP",
        description: "Failed to block IP address.",
        variant: "destructive",
      });
    }
  };

  const handleBlockEndpoint = async (endpointString: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");

      // Parse method and path from endpoint string (format: "METHOD /path")
      const [method, ...pathParts] = endpointString.split(" ");
      const path = pathParts.join(" ");

      // Get endpoint details first
      const res = await apiService.getPlatformEndpoints(platformId);
      const endpointsArr = Array.isArray(res) ? res : res.results || [];
      
      // Find endpoint by matching method and path
      const endpoint = endpointsArr.find(
        (ep: any) => ep.method === method && ep.path === path
      );

      if (endpoint && endpoint.id) {
        await apiService.updateEndpoint(endpoint.id, {
          is_protected: true,
        });
        toast({
          title: "Endpoint Protected",
          description: `${endpointString} has been blocked from public access.`,
          variant: "default",
        });
      } else {
        throw new Error("Endpoint not found");
      }
      setBlockEndpointDialog({ open: false, endpoint: "", endpointId: "" });
    } catch (error: any) {
      toast({
        title: "Error blocking endpoint",
        description: error.message || "Failed to block endpoint.",
        variant: "destructive",
      });
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      PATCH: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
  };

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    } else if (statusCode >= 300 && statusCode < 400) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    }
  };

  const getThreatLevelColor = (threatLevel: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      none: "bg-gray-100 text-gray-800",
    };
    return colors[threatLevel] || "bg-gray-100 text-gray-800";
  };

  const isBot = (userAgent: string) => {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i,
    ];
    return botPatterns.some((pattern) => pattern.test(userAgent || ""));
  };

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "Method", "Path", "Status Code", "IP", "User Agent", "WAF Blocked", "Threat Level"],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.method,
        log.path,
        log.status_code.toString(),
        log.client_ip,
        log.user_agent,
        log.waf_blocked ? "Yes" : "No",
        log.threat_level || "none",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-hub-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
            Security Hub
            {platformName && (
              <span className="text-base sm:text-lg font-normal text-muted-foreground ml-2 break-words">
                • {platformName}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground break-words">
            Comprehensive request log analysis and security investigation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 w-full min-w-0">
        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0">
            <CardTitle className="text-sm font-medium truncate flex-1 min-w-0">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLogs}</div>
            <p className="text-xs text-muted-foreground">Filtered results</p>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Blocked</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.blockedLogs}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalLogs > 0
                ? ((analytics.blockedLogs / analytics.totalLogs) * 100).toFixed(1)
                : 0}
              % of requests
            </p>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Unique IPs</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueIPs}</div>
            <p className="text-xs text-muted-foreground">Source addresses</p>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.errorLogs}</div>
            <p className="text-xs text-muted-foreground">4xx/5xx responses</p>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.avgResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Bot Requests</CardTitle>
            <Bot className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.botRequests}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalLogs > 0
                ? ((analytics.botRequests / analytics.totalLogs) * 100).toFixed(1)
                : 0}
              % detected
            </p>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Suspicious IPs</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.suspiciousIPs}</div>
            <p className="text-xs text-muted-foreground">&gt;10 requests/IP</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="w-full min-w-0">
        <CardHeader className="w-full min-w-0">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter request logs for detailed analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 w-full min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative w-full min-w-0">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full min-w-0"
              />
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
            <Select value={ipFilter} onValueChange={setIpFilter}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="IP Address" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All IPs</SelectItem>
                {uniqueIPs.map((ip) => (
                  <SelectItem key={ip} value={ip}>
                    {ip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={endpointFilter} onValueChange={setEndpointFilter}>
              <SelectTrigger>
                <Code className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Endpoint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Endpoints</SelectItem>
                {uniqueEndpoints.map((endpoint) => (
                  <SelectItem key={endpoint} value={endpoint}>
                    {endpoint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {uniqueMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusCodeFilter} onValueChange={setStatusCodeFilter}>
              <SelectTrigger>
                <AlertTriangle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status Codes</SelectItem>
                {uniqueStatusCodes.map((code) => (
                  <SelectItem key={code} value={code.toString()}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select value={threatLevelFilter} onValueChange={setThreatLevelFilter}>
              <SelectTrigger>
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Threat Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Threat Levels</SelectItem>
                {uniqueThreatLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={wafBlockedFilter} onValueChange={setWafBlockedFilter}>
              <SelectTrigger>
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="WAF Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="blocked">Blocked Only</SelectItem>
                <SelectItem value="allowed">Allowed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap w-full min-w-0">
            <span className="text-sm text-muted-foreground w-full sm:w-auto flex-shrink-0">Active filters:</span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">Search: {searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}</Badge>
              )}
              {timeRange !== "all" && (
                <Badge variant="secondary" className="text-xs">Time: {timeRange}</Badge>
              )}
              {ipFilter !== "all" && (
                <Badge variant="secondary" className="text-xs truncate max-w-[150px]" title={ipFilter}>IP: {ipFilter.length > 12 ? ipFilter.substring(0, 12) + '...' : ipFilter}</Badge>
              )}
              {endpointFilter !== "all" && (
                <Badge variant="secondary" className="text-xs truncate max-w-[200px]" title={endpointFilter}>Endpoint: {endpointFilter.length > 20 ? endpointFilter.substring(0, 20) + '...' : endpointFilter}</Badge>
              )}
              {methodFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">Method: {methodFilter}</Badge>
              )}
              {statusCodeFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">Status: {statusCodeFilter}</Badge>
              )}
              {threatLevelFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">Threat: {threatLevelFilter}</Badge>
              )}
              {wafBlockedFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">WAF: {wafBlockedFilter}</Badge>
              )}
              {(searchTerm ||
                timeRange !== "all" ||
                ipFilter !== "all" ||
                endpointFilter !== "all" ||
                methodFilter !== "all" ||
                statusCodeFilter !== "all" ||
                threatLevelFilter !== "all" ||
                wafBlockedFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setSearchTerm("");
                    setIpFilter("all");
                    setEndpointFilter("all");
                    setMethodFilter("all");
                    setStatusCodeFilter("all");
                    setThreatLevelFilter("all");
                    setWafBlockedFilter("all");
                    setTimeRange("24h");
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Logs - Responsive View */}
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="w-full min-w-0">
          <CardTitle className="truncate">Request Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Detailed view of all API request logs for security analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full min-w-0 p-4">
          {loading ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading request logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No logs match your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block w-full max-w-full min-w-0 overflow-hidden">
                <div className="max-h-[60vh] overflow-auto border rounded-md w-full">
                  <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm border-collapse">
                      <thead className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                        <tr>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Timestamp</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Method</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Path</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IP Address</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden xl:table-cell">User Agent</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Response Time</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">WAF</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Threat</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle font-mono text-xs whitespace-nowrap">
                              {log.timestamp}
                            </td>
                            <td className="p-4 align-middle whitespace-nowrap">
                              <Badge className={getMethodColor(log.method)}>
                                {log.method}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle max-w-[200px]">
                              <div className="truncate" title={log.path}>
                                {log.path}
                              </div>
                            </td>
                            <td className="p-4 align-middle whitespace-nowrap">
                              <Badge className={getStatusCodeColor(log.status_code)}>
                                {log.status_code}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle max-w-[140px]">
                              <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="font-mono text-xs truncate">{log.client_ip}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle hidden xl:table-cell max-w-[200px]">
                              <div className="truncate" title={log.user_agent}>
                                <div className="flex items-center gap-2">
                                  {isBot(log.user_agent || "") && (
                                    <Bot className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                  )}
                                  <span className="text-xs truncate">
                                    {log.user_agent || "Unknown"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 align-middle whitespace-nowrap">{log.response_time_ms.toFixed(0)}ms</td>
                            <td className="p-4 align-middle whitespace-nowrap">
                              {log.waf_blocked ? (
                                <Badge variant="destructive">Blocked</Badge>
                              ) : (
                                <Badge variant="outline">Allowed</Badge>
                              )}
                            </td>
                            <td className="p-4 align-middle whitespace-nowrap">
                              {log.threat_level && log.threat_level !== "none" ? (
                                <Badge className={getThreatLevelColor(log.threat_level)}>
                                  {log.threat_level}
                                </Badge>
                              ) : (
                                <Badge variant="outline">None</Badge>
                              )}
                            </td>
                            <td className="p-4 align-middle whitespace-nowrap">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLog(log);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setBlockIPDialog({ open: true, ip: log.client_ip })
                                    }
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Block IP
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setBlockEndpointDialog({
                                        open: true,
                                        endpoint: `${log.method} ${log.path}`,
                                        endpointId: log.endpoint,
                                      })
                                    }
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Block Endpoint
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4 w-full min-w-0 max-h-[60vh] overflow-y-auto p-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge className={getMethodColor(log.method)}>
                          {log.method}
                        </Badge>
                        <div className="min-w-0">
                          <p className="font-mono text-sm truncate">{log.path}</p>
                          <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getStatusCodeColor(log.status_code)}>
                          {log.status_code}
                        </Badge>
                        {log.waf_blocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="outline">Allowed</Badge>
                        )}
                        {log.threat_level && log.threat_level !== "none" && (
                          <Badge className={getThreatLevelColor(log.threat_level)}>
                            {log.threat_level}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">IP Address</Label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="text-sm font-mono truncate">{log.client_ip}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Response Time</Label>
                        <span className="text-sm">{log.response_time_ms.toFixed(0)}ms</span>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">User Agent</Label>
                        <div className="flex items-center gap-2">
                          {isBot(log.user_agent || "") && (
                            <Bot className="h-3 w-3 text-orange-500 flex-shrink-0" />
                          )}
                          <span className="text-xs truncate">
                            {log.user_agent || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                        <span className="truncate block">
                          {log.endpoint_name || `${log.method} ${log.path}`}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLog(log);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setBlockIPDialog({ open: true, ip: log.client_ip })
                            }
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Block IP
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setBlockEndpointDialog({
                                open: true,
                                endpoint: `${log.method} ${log.path}`,
                                endpointId: log.endpoint,
                              })
                            }
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Block Endpoint
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              Request Details - {selectedLog?.method} {selectedLog?.path}
            </DialogTitle>
            <DialogDescription>
              Complete request and response information
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] pr-2 flex-1 min-h-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{selectedLog.timestamp}</p>
                </div>
                <div>
                  <Label>Status Code</Label>
                  <Badge className={getStatusCodeColor(selectedLog.status_code)}>
                    {selectedLog.status_code}
                  </Badge>
                </div>
                <div>
                  <Label>Method</Label>
                  <Badge className={getMethodColor(selectedLog.method)}>
                    {selectedLog.method}
                  </Badge>
                </div>
                <div>
                  <Label>Response Time</Label>
                  <p className="text-sm">{selectedLog.response_time_ms.toFixed(2)}ms</p>
                </div>
                <div>
                  <Label>WAF Blocked</Label>
                  <Badge
                    variant={selectedLog.waf_blocked ? "destructive" : "default"}
                  >
                    {selectedLog.waf_blocked ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <Label>Threat Level</Label>
                  <Badge className={getThreatLevelColor(selectedLog.threat_level)}>
                    {selectedLog.threat_level || "none"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Client IP</Label>
                <p className="text-sm font-mono">{selectedLog.client_ip}</p>
              </div>

              <div>
                <Label>User Agent</Label>
                <p className="text-sm bg-muted p-2 rounded break-all">
                  {selectedLog.user_agent}
                </p>
                {isBot(selectedLog.user_agent || "") && (
                  <Badge variant="outline" className="mt-2">
                    <Bot className="h-3 w-3 mr-1" />
                    Bot Detected
                  </Badge>
                )}
              </div>

              <div>
                <Label>Path</Label>
                <p className="text-sm font-mono">{selectedLog.path}</p>
              </div>

              {selectedLog.query_params &&
                Object.keys(selectedLog.query_params).length > 0 && (
                  <div>
                    <Label>Query Parameters</Label>
                    <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedLog.query_params, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              {selectedLog.headers &&
                Object.keys(selectedLog.headers).length > 0 && (
                  <div>
                    <Label>Request Headers</Label>
                    <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedLog.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              {selectedLog.request_body && (
                <div>
                  <Label>Request Body</Label>
                  <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">
                      {typeof selectedLog.request_body === "object"
                        ? JSON.stringify(selectedLog.request_body, null, 2)
                        : selectedLog.request_body}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.response_headers &&
                Object.keys(selectedLog.response_headers).length > 0 && (
                  <div>
                    <Label>Response Headers</Label>
                    <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedLog.response_headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              {selectedLog.response_body && (
                <div>
                  <Label>Response Body</Label>
                  <div className="bg-muted p-4 rounded font-mono text-sm mt-2 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">
                      {typeof selectedLog.response_body === "object"
                        ? JSON.stringify(selectedLog.response_body, null, 2)
                        : selectedLog.response_body}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.waf_rule_triggered && (
                <div>
                  <Label>WAF Rule Triggered</Label>
                  <p className="text-sm">{selectedLog.waf_rule_triggered}</p>
                </div>
              )}
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block IP Dialog */}
      <AlertDialog
        open={blockIPDialog.open}
        onOpenChange={(open) =>
          setBlockIPDialog({ open, ip: blockIPDialog.ip })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block IP Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {blockIPDialog.ip}? This will add it
              to the IP blacklist and prevent all requests from this IP.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBlockIP(blockIPDialog.ip)}
              className="bg-red-600 hover:bg-red-700"
            >
              Block IP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Endpoint Dialog */}
      <AlertDialog
        open={blockEndpointDialog.open}
        onOpenChange={(open) =>
          setBlockEndpointDialog({
            open,
            endpoint: blockEndpointDialog.endpoint,
            endpointId: blockEndpointDialog.endpointId,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {blockEndpointDialog.endpoint} from
              public access? This will enable protection on this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
              onClick={() => handleBlockEndpoint(blockEndpointDialog.endpoint)}
              className="bg-red-600 hover:bg-red-700"
            >
              Block Endpoint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecurityHub;

