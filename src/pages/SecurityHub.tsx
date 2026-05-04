import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
  TrendingUp,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import countriesData from "@/data/countries.json";

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedNumber component (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

const AnimatedNumber = ({ value, decimals = 0, suffix = '', className = '' }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const duration = 800;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span className={className}>
      {displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
};

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

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const SecurityHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [blockIPDialog, setBlockIPDialog] = useState<{ open: boolean; ip: string }>({ open: false, ip: "" });
  const [blockEndpointDialog, setBlockEndpointDialog] = useState<{ open: boolean; endpoint: string; endpointId: string }>({ open: false, endpoint: "", endpointId: "" });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusCodeFilter, setStatusCodeFilter] = useState("all");
  const [threatLevelFilter, setThreatLevelFilter] = useState("all");
  const [wafBlockedFilter, setWafBlockedFilter] = useState("all");
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [platformName, setPlatformName] = useState<string>("");

  // ── Paginated fetch ────────────────────────────────────────────────────────
 const fetchLogsPage = async (platformId: string, pageNum: number, append = false) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
        const response = await apiService.getPlatformRequestLogs(platformId, {
            page: pageNum,
            page_size: PAGE_SIZE,
        });
        
        // Handle different response formats
        let newLogs = [];
        if (response.results) {
            newLogs = response.results;
        } else if (response.logs) {
            newLogs = response.logs;
        } else if (Array.isArray(response)) {
            newLogs = response;
        } else if (response.data && Array.isArray(response.data)) {
            newLogs = response.data;
        } else {
            newLogs = [];
            console.warn("Unexpected response format:", response);
        }
        
        console.log("Fetched logs:", newLogs.length);
        setLogs(prev => append ? [...prev, ...newLogs] : newLogs);
        setHasMore(!!response.next);
    } catch (error) {
        console.error("Error loading logs:", error);
        toast({ title: "Error loading logs", description: "Failed to fetch request logs", variant: "destructive" });
    } finally {
        setLoadingMore(false);
        setLoading(false);
    }
};

  // Initial load
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
    setLogs([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    fetchLogsPage(platformId, 1, false);
  }, [navigate]);

  // Client‑side filtering (on loaded logs)
  useEffect(() => {
    let filtered = [...logs];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.client_ip?.toLowerCase().includes(lower) ||
        log.path?.toLowerCase().includes(lower) ||
        log.endpoint_name?.toLowerCase().includes(lower) ||
        log.user_agent?.toLowerCase().includes(lower) ||
        log.method?.toLowerCase().includes(lower)
      );
    }
    if (ipFilter) filtered = filtered.filter(log => log.client_ip?.toLowerCase().includes(ipFilter.toLowerCase()));
    if (countryFilter) {
      filtered = filtered.filter(log => {
        const c = (log as any).country || (log as any).country_code;
        if (!c) return true;
        const sel = countriesData.find(cd => cd.name === countryFilter || cd.code === countryFilter);
        return sel ? (c === sel.code || c === sel.name || c.toLowerCase() === sel.name.toLowerCase()) : true;
      });
    }
    if (endpointFilter !== "all") filtered = filtered.filter(log => `${log.method} ${log.path}` === endpointFilter);
    if (methodFilter !== "all") filtered = filtered.filter(log => log.method === methodFilter);
    if (statusCodeFilter !== "all") filtered = filtered.filter(log => log.status_code === parseInt(statusCodeFilter));
    if (threatLevelFilter !== "all") filtered = filtered.filter(log => log.threat_level === threatLevelFilter);
    if (wafBlockedFilter !== "all") {
      const blocked = wafBlockedFilter === "blocked";
      filtered = filtered.filter(log => log.waf_blocked === blocked);
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm, ipFilter, countryFilter, endpointFilter, methodFilter, statusCodeFilter, threatLevelFilter, wafBlockedFilter]);

  // Sync URL params with filter states
  useEffect(() => {
    setMethodFilter(searchParams.get("method") || "all");
    setStatusCodeFilter(searchParams.get("status_code") || "all");
    setThreatLevelFilter(searchParams.get("threat_level") || "all");
    setWafBlockedFilter(searchParams.get("blocked") || "all");
  }, [searchParams]);

  const updateQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    value ? params.set(key, value) : params.delete(key);
    setSearchParams(params);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (key === "blocked") {
      updateQueryParam(key, value);
    } else {
      params.delete("method");
      params.delete("status_code");
      params.delete("threat_level");
      if (value !== "all") params.set(key, value);
      setSearchParams(params);
    }
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchTerm("");
    setIpFilter("");
    setCountryFilter(null);
    setEndpointFilter("all");
  };

  const loadMore = () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (platformId && hasMore && !loadingMore) {
      fetchLogsPage(platformId, page + 1, true);
      setPage(p => p + 1);
    }
  };

  // Analytics (client‑side, based on filtered logs)
  const analytics = useMemo(() => {
    const totalLogs = filteredLogs.length;
    const blockedLogs = filteredLogs.filter(l => l.waf_blocked).length;
    const uniqueIPs = new Set(filteredLogs.map(l => l.client_ip)).size;
    const errorLogs = filteredLogs.filter(l => l.status_code >= 400).length;
    const avgResponseTime = filteredLogs.length ? filteredLogs.reduce((s, l) => s + (l.response_time_ms ?? 0), 0) / filteredLogs.length : 0;
    const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /postman/i];
    const botRequests = filteredLogs.filter(l => botPatterns.some(p => p.test(l.user_agent || ""))).length;
    const ipFreq: Record<string, number> = {};
    filteredLogs.forEach(l => ipFreq[l.client_ip] = (ipFreq[l.client_ip] || 0) + 1);
    const suspiciousIPs = Object.values(ipFreq).filter(c => c > 10).length;
    const uniqueCountries = new Set(filteredLogs.map(l => (l as any).country || (l as any).country_code).filter(Boolean)).size;
    return { totalLogs, blockedLogs, uniqueIPs, errorLogs, avgResponseTime, botRequests, suspiciousIPs, uniqueCountries };
  }, [filteredLogs]);

  const handleBlockIP = async (ip: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      await apiService.addToBlacklist({ platform_uuid: platformId, ip });
      toast({ title: "IP Blocked", description: `${ip} added to blacklist.` });
      setBlockIPDialog({ open: false, ip: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to block IP.", variant: "destructive" });
    }
  };

  const handleBlockEndpoint = async (endpointString: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      const [method, ...pathParts] = endpointString.split(" ");
      const path = pathParts.join(" ");
      const res = await apiService.getPlatformEndpoints(platformId);
      const endpointsArr = Array.isArray(res) ? res : res.results || [];
      const endpoint = endpointsArr.find((ep: any) => ep.method === method && ep.path === path);
      if (endpoint?.id) {
        await apiService.updateEndpoint(endpoint.id, { is_protected: true });
        toast({ title: "Endpoint Protected", description: `${endpointString} is now protected.` });
      } else throw new Error("Endpoint not found");
      setBlockEndpointDialog({ open: false, endpoint: "", endpointId: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to block endpoint.", variant: "destructive" });
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
    if (statusCode >= 200 && statusCode < 300) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (statusCode >= 300 && statusCode < 400) return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    if (statusCode >= 400 && statusCode < 500) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
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
    const patterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /postman/i];
    return patterns.some(p => p.test(userAgent || ""));
  };

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "Method", "Path", "Status Code", "IP", "User Agent", "WAF Blocked", "Threat Level"],
      ...filteredLogs.map(log => [
        log.timestamp, log.method, log.path, log.status_code.toString(), log.client_ip, log.user_agent,
        log.waf_blocked ? "Yes" : "No", log.threat_level || "none"
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-hub-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // JSX – redesigned to match PlatformDetails
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        {/* Header – gradient banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  Security Hub
                </span>
                {platformName && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                    {platformName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">
                Security Hub
              </h1>
              <p className="text-sm text-blue-100 max-w-xl">
                Comprehensive request log analysis and security investigation
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics (3 cards) – same style as PlatformDetails */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Total Requests */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">total_requests</span>
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-4"><AnimatedNumber value={analytics.totalLogs} className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" /></div>
              <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">Filtered results</p>
              <div className="mt-4 h-1.5 rounded-full bg-blue-50 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-700" style={{ width: analytics.totalLogs > 0 ? "100%" : "0%" }} />
              </div>
            </div>
          </div>

          {/* Blocked Requests */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">blocked_requests</span>
                <Ban className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <div className="mt-4"><AnimatedNumber value={analytics.blockedLogs} className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" /></div>
              <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">Threats blocked</p>
              <div className="mt-4 h-1.5 rounded-full bg-red-50 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-red-500 transition-all duration-700" style={{ width: analytics.totalLogs > 0 ? `${(analytics.blockedLogs / analytics.totalLogs) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>

          {/* Unique IPs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">unique_ips</span>
                <MapPin className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="mt-4"><AnimatedNumber value={analytics.uniqueIPs} className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" /></div>
              <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">Source addresses</p>
              <div className="mt-4 h-1.5 rounded-full bg-emerald-50 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: analytics.uniqueIPs > 0 ? "100%" : "0%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats (5 cards) */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Errors</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.errorLogs} /></p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-4">
            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Response</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={Math.round(analytics.avgResponseTime)} />ms</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-4">
            <Bot className="h-5 w-5 text-orange-600 dark:text-orange-400 mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bot Requests</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.botRequests} /></p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{analytics.totalLogs > 0 ? ((analytics.botRequests / analytics.totalLogs) * 100).toFixed(1) : 0}%</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-4">
            <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400 mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Suspicious IPs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.suspiciousIPs} /></p>
            <p className="text-xs text-slate-500 dark:text-slate-400">&gt;10 req/IP</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-4">
            <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Unique Countries</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.uniqueCountries} /></p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Refine your request log analysis</p>
            </div>
            {Array.from(searchParams.keys()).length > 0 && (
              <button onClick={clearAllFilters} className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg">
                Clear All
              </button>
            )}
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search logs by IP, path, endpoint, user agent..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); updateQueryParam("search", e.target.value); }}
              className="pl-10 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={methodFilter} onValueChange={(v) => handleFilterChange("method", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusCodeFilter} onValueChange={(v) => handleFilterChange("status_code", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Status Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status Codes</SelectItem>
                <SelectItem value="200">200 OK</SelectItem>
                <SelectItem value="400">400 Bad Request</SelectItem>
                <SelectItem value="401">401 Unauthorized</SelectItem>
                <SelectItem value="403">403 Forbidden</SelectItem>
                <SelectItem value="404">404 Not Found</SelectItem>
                <SelectItem value="500">500 Server Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={threatLevelFilter} onValueChange={(v) => handleFilterChange("threat_level", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Threat Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <Select value={wafBlockedFilter} onValueChange={(v) => handleFilterChange("blocked", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="WAF Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="blocked">🚫 Blocked</SelectItem>
                <SelectItem value="allowed">✅ Allowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs Table Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Request Logs</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredLogs.length > 0 ? `Showing ${filteredLogs.length} requests` : "No logs to display"}
            </p>
          </div>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                <p className="text-lg font-semibold text-slate-900 dark:text-white">No logs match your filters</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Timestamp</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Method</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Path</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">IP</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Response</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">WAF</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Threat</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{log.timestamp}</td>
                          <td className="px-4 py-3"><Badge className={getMethodColor(log.method)}>{log.method}</Badge></td>
                          <td className="px-4 py-3"><span className="font-mono text-xs truncate max-w-xs block text-slate-700 dark:text-slate-300" title={log.path}>{log.path}</span></td>
                          <td className="px-4 py-3"><Badge className={getStatusCodeColor(log.status_code)}>{log.status_code}</Badge></td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{log.client_ip}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{log.response_time_ms ? log.response_time_ms.toFixed(0) : '-'}ms</td>
                          <td className="px-4 py-3">{log.waf_blocked ? <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">🚫 Blocked</Badge> : <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">✓ Allowed</Badge>}</td>
                          <td className="px-4 py-3">{log.threat_level && log.threat_level !== "none" ? <Badge className={getThreatLevelColor(log.threat_level)}>{log.threat_level}</Badge> : <Badge variant="outline">-</Badge>}</td>
                          <td className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedLog(log); setIsDetailsOpen(true); }}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBlockIPDialog({ open: true, ip: log.client_ip })} className="text-red-600"><Ban className="h-4 w-4 mr-2" /> Block IP</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBlockEndpointDialog({ open: true, endpoint: `${log.method} ${log.path}`, endpointId: log.endpoint })} className="text-orange-600"><Shield className="h-4 w-4 mr-2" /> Protect Endpoint</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards – simplified */}
                <div className="lg:hidden space-y-3">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-4 bg-white dark:bg-slate-900">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getMethodColor(log.method)}>{log.method}</Badge>
                        <Badge className={getStatusCodeColor(log.status_code)}>{log.status_code}</Badge>
                      </div>
                      <p className="font-mono text-sm truncate text-slate-700 dark:text-slate-300 mb-2">{log.path}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-mono">{log.client_ip}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>Details</Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && !loading && (
                  <div className="text-center mt-6">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Details Dialog (unchanged) */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedLog?.method} {selectedLog?.path}</DialogTitle>
              <DialogDescription>Complete request and response details</DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Status Code</Label><p>{selectedLog.status_code}</p></div>
                  <div><Label>Response Time</Label><p>{selectedLog.response_time_ms ?? 0}ms</p></div>
                  <div><Label>Client IP</Label><p>{selectedLog.client_ip}</p></div>
                  <div><Label>User Agent</Label><p>{selectedLog.user_agent}</p></div>
                </div>
                <div><Label>Request Headers</Label><pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{JSON.stringify(selectedLog.headers, null, 2)}</pre></div>
                <div><Label>Request Body</Label><pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{typeof selectedLog.request_body === 'object' ? JSON.stringify(selectedLog.request_body, null, 2) : selectedLog.request_body}</pre></div>
                <div><Label>Response Headers</Label><pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{JSON.stringify(selectedLog.response_headers, null, 2)}</pre></div>
                <div><Label>Response Body</Label><pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{typeof selectedLog.response_body === 'object' ? JSON.stringify(selectedLog.response_body, null, 2) : selectedLog.response_body}</pre></div>
                {selectedLog.waf_rule_triggered && <div><Label>WAF Rule</Label><p className="text-red-600">{selectedLog.waf_rule_triggered}</p></div>}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Block IP Dialog */}
        <AlertDialog open={blockIPDialog.open} onOpenChange={(open) => setBlockIPDialog({ open, ip: blockIPDialog.ip })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block IP Address</AlertDialogTitle>
              <AlertDialogDescription>
                {blockIPDialog.ip} will be permanently added to your IP blacklist. All requests from this address will be blocked.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBlockIP(blockIPDialog.ip)} className="bg-red-600 hover:bg-red-700">Block IP Address</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Block Endpoint Dialog */}
        <AlertDialog open={blockEndpointDialog.open} onOpenChange={(open) => setBlockEndpointDialog({ open, endpoint: blockEndpointDialog.endpoint, endpointId: blockEndpointDialog.endpointId })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Protect Endpoint</AlertDialogTitle>
              <AlertDialogDescription>
                {blockEndpointDialog.endpoint} will have enhanced protection enabled. This endpoint will require additional authentication.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBlockEndpoint(blockEndpointDialog.endpoint)} className="bg-orange-600 hover:bg-orange-700">Protect Endpoint</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SecurityHub;