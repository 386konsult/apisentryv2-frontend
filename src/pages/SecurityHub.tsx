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
  Lock,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import countriesData from "@/data/countries.json";

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedNumber — UNCHANGED
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

// ─────────────────────────────────────────────────────────────────────────────
// Types — UNCHANGED
// ─────────────────────────────────────────────────────────────────────────────
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
// Time range options
// ─────────────────────────────────────────────────────────────────────────────
type TimeRangeKey = "today" | "week" | "month" | "3months" | "6months" | "1year";

const TIME_RANGE_OPTIONS: { label: string; value: TimeRangeKey }[] = [
  { label: "Today",    value: "today"   },
  { label: "This Week",  value: "week"    },
  { label: "This Month", value: "month"   },
  { label: "3 Months",   value: "3months" },
  { label: "6 Months",   value: "6months" },
  { label: "1 Year",     value: "1year"   },
];

/** Returns the start-of-range Date in local time */
const getRangeStart = (range: TimeRangeKey): Date => {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "3months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "6months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "1year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Disclaimer tile for suppressed request/response data
// ─────────────────────────────────────────────────────────────────────────────
const DataDisclaimer = () => (
  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
    <Lock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
    <span>
      This data was not saved. For security and compliance reasons, Heimdall does not persist
      raw request or response payloads — this prevents sensitive data (credentials, PII, tokens)
      from being stored in our logs.
    </span>
  </div>
);

/** Returns true if the value is "empty" — null, undefined, empty object, empty string */
const isEmpty = (v: any) =>
  v === null || v === undefined || v === "" ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

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

  // ── NEW: time range for stats panel ────────────────────────────────────────
  const [statsRange, setStatsRange] = useState<TimeRangeKey>("1year");

  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [blockIPDialog, setBlockIPDialog] = useState<{ open: boolean; ip: string }>({ open: false, ip: "" });
  const [blockEndpointDialog, setBlockEndpointDialog] = useState<{ open: boolean; endpoint: string; endpointId: string }>({ open: false, endpoint: "", endpointId: "" });

  // Filters — UNCHANGED
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

  // ── Paginated fetch — UNCHANGED ────────────────────────────────────────────
  const fetchLogsPage = async (platformId: string, pageNum: number, append = false) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await apiService.getPlatformRequestLogs(platformId, {
        page: pageNum,
        page_size: PAGE_SIZE,
      });
      let newLogs = [];
      if (response.results)                           newLogs = response.results;
      else if (response.logs)                         newLogs = response.logs;
      else if (Array.isArray(response))               newLogs = response;
      else if (response.data && Array.isArray(response.data)) newLogs = response.data;
      else                                            console.warn("Unexpected response format:", response);

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

  // Initial load — UNCHANGED
  useEffect(() => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) { navigate("/platforms"); return; }
    const platforms = localStorage.getItem("user_platforms");
    if (platforms) {
      try {
        const arr = JSON.parse(platforms);
        const found = arr.find((p: any) => p.id === platformId);
        if (found) setPlatformName(found.name);
      } catch {}
    }
    setLogs([]); setPage(1); setHasMore(true); setLoading(true);
    fetchLogsPage(platformId, 1, false);
  }, [navigate]);

  // Client-side filtering — UNCHANGED
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
    if (ipFilter)    filtered = filtered.filter(log => log.client_ip?.toLowerCase().includes(ipFilter.toLowerCase()));
    if (countryFilter) {
      filtered = filtered.filter(log => {
        const c = (log as any).country || (log as any).country_code;
        if (!c) return true;
        const sel = countriesData.find(cd => cd.name === countryFilter || cd.code === countryFilter);
        return sel ? (c === sel.code || c === sel.name || c.toLowerCase() === sel.name.toLowerCase()) : true;
      });
    }
    if (endpointFilter !== "all")    filtered = filtered.filter(log => `${log.method} ${log.path}` === endpointFilter);
    if (methodFilter !== "all")      filtered = filtered.filter(log => log.method === methodFilter);
    if (statusCodeFilter !== "all")  filtered = filtered.filter(log => log.status_code === parseInt(statusCodeFilter));
    if (threatLevelFilter !== "all") filtered = filtered.filter(log => log.threat_level === threatLevelFilter);
    if (wafBlockedFilter !== "all") {
      const blocked = wafBlockedFilter === "blocked";
      filtered = filtered.filter(log => log.waf_blocked === blocked);
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm, ipFilter, countryFilter, endpointFilter, methodFilter, statusCodeFilter, threatLevelFilter, wafBlockedFilter]);

  // Sync URL params — UNCHANGED
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
      params.delete("method"); params.delete("status_code"); params.delete("threat_level");
      if (value !== "all") params.set(key, value);
      setSearchParams(params);
    }
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchTerm(""); setIpFilter(""); setCountryFilter(null); setEndpointFilter("all");
  };

  const loadMore = () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (platformId && hasMore && !loadingMore) {
      fetchLogsPage(platformId, page + 1, true);
      setPage(p => p + 1);
    }
  };

  // ── NEW: logs filtered to the stats time range ─────────────────────────────
  const rangeFilteredLogs = useMemo(() => {
    const rangeStart = getRangeStart(statsRange);
    return logs.filter(log => {
      if (!log.timestamp) return false;
      // Normalize "2026-05-19 15:09" → "2026-05-19T15:09" so all browsers parse it
// Backend returns "DD-MM-YYYY HH:MM" — convert to "YYYY-MM-DDTHH:MM"
let ts: Date;
const ddmmyyyy = log.timestamp.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2})/);
if (ddmmyyyy) {
  ts = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}T${ddmmyyyy[4]}`);
} else {
  // Fallback: try replacing space with T for ISO-like formats
  ts = new Date(log.timestamp.replace(" ", "T"));
}
return !isNaN(ts.getTime()) && ts >= rangeStart;
    });
  }, [logs, statsRange]);

  // ── UPDATED: analytics computed from rangeFilteredLogs ────────────────────
  const analytics = useMemo(() => {
    const src = rangeFilteredLogs;
    const totalLogs      = src.length;
    const blockedLogs    = src.filter(l => l.waf_blocked).length;
    const uniqueIPs      = new Set(src.map(l => l.client_ip)).size;
    const errorLogs      = src.filter(l => l.status_code >= 400).length;
    const avgResponseTime = src.length ? src.reduce((s, l) => s + (l.response_time_ms ?? 0), 0) / src.length : 0;
    const botPatterns    = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /postman/i];
    const botRequests    = src.filter(l => botPatterns.some(p => p.test(l.user_agent || ""))).length;
    const ipFreq: Record<string, number> = {};
    src.forEach(l => ipFreq[l.client_ip] = (ipFreq[l.client_ip] || 0) + 1);
    const suspiciousIPs  = Object.values(ipFreq).filter(c => c > 10).length;
    const uniqueCountries = new Set(src.map(l => (l as any).country || (l as any).country_code).filter(Boolean)).size;
    return { totalLogs, blockedLogs, uniqueIPs, errorLogs, avgResponseTime, botRequests, suspiciousIPs, uniqueCountries };
  }, [rangeFilteredLogs]);

  // ── UPDATED: Export CSV uses rangeFilteredLogs ─────────────────────────────
  const exportLogs = () => {
    const src = rangeFilteredLogs.length > 0 ? rangeFilteredLogs : filteredLogs;
    const csv = [
      ["Timestamp", "Method", "Path", "Status Code", "IP", "User Agent", "WAF Blocked", "Threat Level"],
      ...src.map(log => [
        log.timestamp, log.method, log.path, log.status_code.toString(),
        log.client_ip, log.user_agent, log.waf_blocked ? "Yes" : "No", log.threat_level || "none",
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `security-hub-${statsRange}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handlers — UNCHANGED
  const handleBlockIP = async (ip: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      await apiService.addToBlacklist({ platform_uuid: platformId, ip });
      toast({ title: "IP Blocked", description: `${ip} added to blacklist.` });
      setBlockIPDialog({ open: false, ip: "" });
    } catch {
      toast({ title: "Error", description: "Failed to block IP.", variant: "destructive" });
    }
  };

  const handleBlockEndpoint = async (endpointString: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      const [method, ...pathParts] = endpointString.split(" ");
      const path = pathParts.join(" ");
      const res  = await apiService.getPlatformEndpoints(platformId);
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

  // Colour helpers — UNCHANGED
  const getMethodColor = (method: string) => ({
    GET:    "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    POST:   "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    PUT:    "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    PATCH:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  }[method] || "bg-gray-100 text-gray-800");

  const getStatusCodeColor = (s: number) =>
    s < 300 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    : s < 400 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    : s < 500 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";

  const getThreatLevelColor = (t: string) => ({
    high:   "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    low:    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    none:   "bg-gray-100 text-gray-800",
  }[t] || "bg-gray-100 text-gray-800");

  const rangeLabel = TIME_RANGE_OPTIONS.find(o => o.value === statsRange)?.label ?? "Today";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              {platformName && (
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">{platformName}</span>
                </div>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">Security Hub</h1>
              <p className="text-sm text-blue-100 max-w-xl">Comprehensive request log analysis and security investigation</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={exportLogs}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white">
                <Download className="mr-2 h-4 w-4" />Export CSV ({rangeLabel})
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── NEW: Stats time range selector ─────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Statistics — {rangeLabel}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">From loaded data · switch range to recalculate</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TIME_RANGE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setStatsRange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  statsRange === opt.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-[#0d1829] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500/40"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics — stats now from rangeFilteredLogs */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "total_requests",   value: analytics.totalLogs,   sub: `Total requests — ${rangeLabel}`,   icon: <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />,   bar: "from-blue-600 to-sky-500",   barBg: "bg-blue-50 dark:bg-slate-800",   pct: analytics.totalLogs > 0 ? 100 : 0 },
            { label: "blocked_requests", value: analytics.blockedLogs,  sub: `Threats blocked — ${rangeLabel}`, icon: <Ban className="h-4 w-4 text-red-500 dark:text-red-400" />,          bar: "from-red-500 to-rose-500",   barBg: "bg-red-50 dark:bg-slate-800",    pct: analytics.totalLogs > 0 ? (analytics.blockedLogs / analytics.totalLogs) * 100 : 0 },
            { label: "unique_ips",       value: analytics.uniqueIPs,    sub: `Source addresses — ${rangeLabel}`, icon: <MapPin className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />, bar: "from-emerald-500 to-teal-500", barBg: "bg-emerald-50 dark:bg-slate-800", pct: analytics.uniqueIPs > 0 ? 100 : 0 },
          ].map(m => (
            <div key={m.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{m.label}</span>
                  {m.icon}
                </div>
                <div className="mt-4">
                  <AnimatedNumber value={m.value} className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">{m.sub}</p>
                <div className={`mt-4 h-1.5 rounded-full ${m.barBg}`}>
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${m.bar} transition-all duration-700`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[
            { icon: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />, label: "Errors",           value: analytics.errorLogs,       sub: null },
            { icon: <Clock         className="h-5 w-5 text-purple-600 dark:text-purple-400" />, label: "Avg Response",     value: Math.round(analytics.avgResponseTime), sub: "ms" },
            { icon: <Bot          className="h-5 w-5 text-orange-600 dark:text-orange-400" />, label: "Bot Requests",     value: analytics.botRequests,      sub: analytics.totalLogs > 0 ? `${((analytics.botRequests / analytics.totalLogs) * 100).toFixed(1)}%` : null },
            { icon: <TrendingUp   className="h-5 w-5 text-rose-600 dark:text-rose-400" />,     label: "Suspicious IPs",   value: analytics.suspiciousIPs,    sub: ">10 req/IP" },
            { icon: <Globe        className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />, label: "Unique Countries", value: analytics.uniqueCountries,  sub: null },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-4">
              {s.icon}
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedNumber value={s.value} />{s.label === "Avg Response" ? "ms" : ""}
              </p>
              {s.sub && s.label !== "Avg Response" && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filters Card — UNCHANGED */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Refine your request log analysis</p>
            </div>
            {Array.from(searchParams.keys()).length > 0 && (
              <button onClick={clearAllFilters} className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg">Clear All</button>
            )}
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input placeholder="Search logs by IP, path, endpoint, user agent..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); updateQueryParam("search", e.target.value); }}
              className="pl-10 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={methodFilter}      onValueChange={v => handleFilterChange("method",       v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="GET">GET</SelectItem><SelectItem value="POST">POST</SelectItem><SelectItem value="PUT">PUT</SelectItem><SelectItem value="PATCH">PATCH</SelectItem><SelectItem value="DELETE">DELETE</SelectItem></SelectContent>
            </Select>
            <Select value={statusCodeFilter}  onValueChange={v => handleFilterChange("status_code",  v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="Status Code" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status Codes</SelectItem><SelectItem value="200">200 OK</SelectItem><SelectItem value="400">400 Bad Request</SelectItem><SelectItem value="401">401 Unauthorized</SelectItem><SelectItem value="403">403 Forbidden</SelectItem><SelectItem value="404">404 Not Found</SelectItem><SelectItem value="500">500 Server Error</SelectItem></SelectContent>
            </Select>
            <Select value={threatLevelFilter} onValueChange={v => handleFilterChange("threat_level", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="Threat Level" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="high">🔴 High</SelectItem><SelectItem value="medium">🟡 Medium</SelectItem><SelectItem value="low">🟢 Low</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
            </Select>
            <Select value={wafBlockedFilter}  onValueChange={v => handleFilterChange("blocked",      v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="WAF Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Requests</SelectItem><SelectItem value="blocked">🚫 Blocked</SelectItem><SelectItem value="allowed">✅ Allowed</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs Table — UNCHANGED */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Request Logs</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{filteredLogs.length > 0 ? `Showing ${filteredLogs.length} requests` : "No logs to display"}</p>
          </div>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16"><Shield className="h-12 w-12 mx-auto text-blue-400 mb-4" /><p className="text-lg font-semibold text-slate-900 dark:text-white">No logs match your filters</p></div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        {["Timestamp","Method","Path","Status","IP","Response","WAF","Threat","Actions"].map(h => (
                          <th key={h} className={`px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 ${h==="Actions"?"text-center":""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                      {filteredLogs.map(log => (
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
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
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

                {/* Mobile */}
                <div className="lg:hidden space-y-3">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-4 bg-white dark:bg-slate-900">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getMethodColor(log.method)}>{log.method}</Badge>
                        <Badge className={getStatusCodeColor(log.status_code)}>{log.status_code}</Badge>
                      </div>
                      <p className="font-mono text-sm truncate text-slate-700 dark:text-slate-300 mb-2">{log.path}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                        <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-400" /><span className="text-xs font-mono">{log.client_ip}</span></div>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setIsDetailsOpen(true); }}>Details</Button>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && !loading && (
                  <div className="text-center mt-6">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading..." : "Load more"}</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── UPDATED: Details Dialog with disclaimers ─────────────────────── */}
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

                <div>
                  <Label>Request Headers</Label>
                  {isEmpty(selectedLog.headers)
                    ? <DataDisclaimer />
                    : <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{JSON.stringify(selectedLog.headers, null, 2)}</pre>
                  }
                </div>

                <div>
                  <Label>Request Body</Label>
                  {isEmpty(selectedLog.request_body)
                    ? <DataDisclaimer />
                    : <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{typeof selectedLog.request_body === "object" ? JSON.stringify(selectedLog.request_body, null, 2) : selectedLog.request_body}</pre>
                  }
                </div>

                <div>
                  <Label>Response Headers</Label>
                  {isEmpty(selectedLog.response_headers)
                    ? <DataDisclaimer />
                    : <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{JSON.stringify(selectedLog.response_headers, null, 2)}</pre>
                  }
                </div>

                <div>
                  <Label>Response Body</Label>
                  {isEmpty(selectedLog.response_body)
                    ? <DataDisclaimer />
                    : <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">{typeof selectedLog.response_body === "object" ? JSON.stringify(selectedLog.response_body, null, 2) : selectedLog.response_body}</pre>
                  }
                </div>

                {selectedLog.waf_rule_triggered && (
                  <div><Label>WAF Rule</Label><p className="text-red-600">{selectedLog.waf_rule_triggered}</p></div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Block IP Dialog — UNCHANGED */}
        <AlertDialog open={blockIPDialog.open} onOpenChange={open => setBlockIPDialog({ open, ip: blockIPDialog.ip })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block IP Address</AlertDialogTitle>
              <AlertDialogDescription>{blockIPDialog.ip} will be permanently added to your IP blacklist. All requests from this address will be blocked.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBlockIP(blockIPDialog.ip)} className="bg-red-600 hover:bg-red-700">Block IP Address</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Block Endpoint Dialog — UNCHANGED */}
        <AlertDialog open={blockEndpointDialog.open} onOpenChange={open => setBlockEndpointDialog({ open, endpoint: blockEndpointDialog.endpoint, endpointId: blockEndpointDialog.endpointId })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Protect Endpoint</AlertDialogTitle>
              <AlertDialogDescription>{blockEndpointDialog.endpoint} will have enhanced protection enabled.</AlertDialogDescription>
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