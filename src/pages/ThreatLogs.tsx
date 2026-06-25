import { useState, useEffect, useMemo, useCallback } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  Eye,
  Download,
  Shield,
  Clock,
  MapPin,
  Code,
  ChevronDown,
  Plus,
} from "lucide-react";

import { apiService } from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const TIME_RANGES = [
  { label: "Today",      value: "today"   },
  { label: "This Week",  value: "week"    },
  { label: "This Month", value: "month"   },
  { label: "3 Months",   value: "3months" },
  { label: "6 Months",   value: "6months" },
  { label: "1 Year",     value: "1year"   },
  { label: "All Time",   value: "all"     },
];

// Helper: parse timestamp to milliseconds (client‑side filtering)
const parseLogTimestamp = (log: any): number | null => {
  const raw = log?.timestamp ?? log?.created_at ?? log?.createdAt;
  if (raw == null) return null;
  if (typeof raw === "number") return raw < 1e12 ? raw * 1000 : raw;
  if (typeof raw === "string") {
    let s = raw.trim();
    s = s.replace(/\+00:00Z$/, "Z");
    const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const m = s.match(ddmmyyyyRegex);
    if (m) {
      return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), m[6] ? Number(m[6]) : 0);
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
    if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) s = `${s}Z`;
    const ms = Date.parse(s);
    if (!isNaN(ms)) return ms;
  }
  return null;
};

const AnimatedNumber = ({ value, decimals = 0, suffix = "", className = "" }: any) => {
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

const ThreatLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, blocked: 0, rate: 0, uniqueIPs: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [platformName, setPlatformName] = useState<string>("");

  // Country filter from URL param (e.g. ?country=US from the map BLOCKED click)
  const [countryFilter, setCountryFilter] = useState<string>(() => searchParams.get("country") || "");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [threatType, setThreatType] = useState("all");
  const [ipFilter, setIpFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('heimdall_time_range') || 'today');

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    localStorage.setItem('heimdall_time_range', value);
  };

  // Fetch first page — all active filters are sent as server-side params
  const fetchLogs = useCallback(async (url?: string) => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) {
      navigate("/platforms");
      return { logs: [], total: 0, blocked: 0, rate: 0, next: null };
    }
    try {
      let data;
      if (url) {
        const res = await fetch(url);
        data = await res.json();
      } else {
        const apiParams: any = { blocked: 'true', page_size: 20 };
        if (countryFilter) apiParams.country = countryFilter;
        if (searchTerm) apiParams.search = searchTerm;
        if (severityFilter !== 'all') apiParams.threat_level = severityFilter;
        if (ipFilter !== 'all') apiParams.ip = ipFilter;
        if (endpointFilter.trim()) apiParams.endpoint = endpointFilter;
        // Time range → start_date sent to backend so it filters ALL records, not just the loaded page
        // Exception: when filtering by a specific IP, always search all-time history (no date cap)
        const ipSearchActive = ipFilter !== 'all';
        if (timeRange !== 'all' && !ipSearchActive) {
          const now = new Date();
          let rangeStart: Date | null = null;
          switch (timeRange) {
            case 'today':   { const d = new Date(now); d.setHours(0,0,0,0); rangeStart = d; break; }
            case 'week':    { const d = new Date(now); d.setDate(d.getDate()-6); d.setHours(0,0,0,0); rangeStart = d; break; }
            case 'month':   { const d = new Date(now); d.setDate(1); d.setHours(0,0,0,0); rangeStart = d; break; }
            case '3months': { const d = new Date(now); d.setMonth(d.getMonth()-3); d.setHours(0,0,0,0); rangeStart = d; break; }
            case '6months': { const d = new Date(now); d.setMonth(d.getMonth()-6); d.setHours(0,0,0,0); rangeStart = d; break; }
            case '1year':   { const d = new Date(now); d.setFullYear(d.getFullYear()-1); d.setHours(0,0,0,0); rangeStart = d; break; }
          }
          if (rangeStart) apiParams.start_date = rangeStart.toISOString();
        }
        // When IP filter active: no start_date → backend returns full history for that IP
        data = await apiService.getPlatformThreatLogs(platformId, apiParams);
      }
      // New response shape: { logs, total_count, blocked_count, blocked_rate, unique_ips, next, ... }
      return {
        logs: data.logs || [],
        total: data.total_count || 0,
        blocked: data.blocked_count || 0,
        rate: data.blocked_rate || 0,
        uniqueIPs: data.unique_ips || 0,
        next: data.next || null,
      };
    } catch (error) {
      console.error("Failed to fetch threat logs:", error);
      return { logs: [], total: 0, blocked: 0, rate: 0, uniqueIPs: 0, next: null };
    }
  }, [navigate, countryFilter, searchTerm, severityFilter, ipFilter, endpointFilter, timeRange]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const { logs: initialLogs, total, blocked, rate, uniqueIPs, next } = await fetchLogs();
    setLogs(initialLogs);
    setNextPageUrl(next);
    setHasMore(!!next);
    setStats({ total, blocked, rate, uniqueIPs });
    setLoading(false);
  }, [fetchLogs]);

  const loadMore = async () => {
    if (!nextPageUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(nextPageUrl);
      const data = await response.json();
      const newLogs = data.logs || [];
      setLogs(prev => [...prev, ...newLogs]);
      setNextPageUrl(data.next || null);
      setHasMore(!!data.next);
    } catch (error) {
      console.error("Failed to load more logs:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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
    // Debounce text inputs (search + endpoint), instant for dropdowns
    const isTextFilter = searchTerm !== undefined || endpointFilter !== undefined;
    const delay = isTextFilter ? 500 : 0;
    const timer = setTimeout(() => { loadInitial(); }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadInitial]);

  // All filters are now server-side. Only threatType needs client-side filtering
  // because the backend doesn't have a dedicated waf_rule_triggered category param.
  const filteredThreats = useMemo(() => {
    if (threatType === "all") return logs;
    return logs.filter(log => {
      const rule = (log.waf_rule_triggered || "").toLowerCase();
      if (threatType === "SQL Injection") return rule.includes("sql");
      if (threatType === "XSS") return rule.includes("xss");
      if (threatType === "Path Traversal") return rule.includes("path") || rule.includes("traversal");
      if (threatType === "Brute Force") return rule.includes("brute");
      if (threatType === "Malware") return rule.includes("malware");
      return log.waf_rule_triggered === threatType;
    });
  }, [logs, threatType]);

  // Client‑side stats (these only apply to currently loaded logs, not the full dataset)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter(log => {
    const ts = parseLogTimestamp(log);
    return ts != null && ts >= todayStart.getTime();
  });
  const highCount = logs.filter(l => l.threat_level === "high").length;
  const mediumCount = logs.filter(l => l.threat_level === "medium").length;
  // uniqueIPs comes from backend (full dataset), not client-side page slice
  const uniqueIPs = stats.uniqueIPs;

  const rangeLabel = TIME_RANGES.find(r => r.value === timeRange)?.label ?? "All Time";

  // Stat cards – using backend stats for Total Blocked and Blocked Rate
  const statsData = [
    { label: "Total Blocked", value: stats.total, icon: AlertTriangle, iconColor: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", sub: "All blocked threats" },
    { label: "Blocked Rate", value: stats.rate, icon: AlertTriangle, iconColor: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", sub: "% of requests blocked", suffix: "%" },
    { label: timeRange === 'today' ? "Today's Threats" : "Threats in Range", value: timeRange === 'today' ? todayLogs.length : stats.blocked, icon: AlertTriangle, iconColor: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", sub: timeRange === 'today' ? "Blocked today" : `Blocked — ${rangeLabel}` },
    { label: "High Severity", value: highCount, icon: AlertTriangle, iconColor: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", sub: "Requires attention", valueColor: "text-red-600 dark:text-red-400" },
    { label: "Medium Severity", value: mediumCount, icon: AlertTriangle, iconColor: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", sub: "Monitor closely", valueColor: "text-amber-600 dark:text-amber-400" },
    { label: "Unique IPs", value: uniqueIPs, icon: MapPin, iconColor: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", sub: "Distinct attackers" },
  ];

  // Filter options extracted from loaded logs
  const uniqueThreatTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(log => {
      if (log.waf_rule_triggered) {
        const rule = log.waf_rule_triggered.toLowerCase();
        if (rule.includes("sql")) types.add("SQL Injection");
        else if (rule.includes("xss")) types.add("XSS");
        else if (rule.includes("path") || rule.includes("traversal")) types.add("Path Traversal");
        else if (rule.includes("brute")) types.add("Brute Force");
        else if (rule.includes("malware")) types.add("Malware");
        else types.add(log.waf_rule_triggered);
      }
    });
    return Array.from(types).sort();
  }, [logs]);

  const uniqueIPsList = useMemo(() => Array.from(new Set(logs.map(l => l.client_ip))).sort(), [logs]);
  const uniqueSeverities = useMemo(() => Array.from(new Set(logs.map(l => l.threat_level).filter(Boolean))).sort(), [logs]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSeverityFilter("all");
    setThreatType("all");
    setIpFilter("all");
    setEndpointFilter("");
    setTimeRange("all");
    setCountryFilter("");
  };

  const exportFilteredLogs = () => {
    try {
      const headers = [
        "Timestamp",
        "Threat Type",
        "Severity",
        "Source IP",
        "Request",
        "Status Code",
        "User Agent",
      ];
      const rows = filteredThreats.map((t) => [
        t.timestamp || "",
        t.waf_rule_triggered || "Unknown",
        t.threat_level || "low",
        t.client_ip || "",
        `${t.method || ""} ${t.path || ""}`.trim(),
        t.status_code || "N/A",
        (t.user_agent || "").replace(/,/g, " "),
      ]);

      const escapeCsvCell = (cell: any) => {
        if (cell === undefined || cell === null) return '""';
        let str = String(cell);
        str = str.replace(/"/g, '""');
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str}"`;
        }
        return str;
      };

      const csvRows = [headers, ...rows].map((row) =>
        row.map((cell) => escapeCsvCell(cell)).join(",")
      );
      const csvString = csvRows.join("\n");

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `threat-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export successful", description: `${filteredThreats.length} rows exported.` });
    } catch (error) {
      console.error("CSV export failed:", error);
      toast({ title: "Export failed", description: "Could not generate CSV file.", variant: "destructive" });
    }
  };

  const getSeverityConfig = (level: string) => {
    switch (level) {
      case "high": return { cls: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400", dot: "bg-red-500" };
      case "medium": return { cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", dot: "bg-amber-500" };
      case "low": return { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", dot: "bg-emerald-500" };
      default: return { cls: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", dot: "bg-slate-400" };
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-red-600 to-orange-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {platformName && <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{platformName}</span>}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Threat Logs</h1>
              <p className="text-sm text-red-100">Security events and threat detection history</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={exportFilteredLogs} className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25">
                <Download className="mr-2 h-4 w-4" /> Export Logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/create-alert")} className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white">
                <Plus className="mr-2 h-4 w-4" /> Create Alert
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {statsData.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-3">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.valueColor || "text-slate-900 dark:text-white"}`}>
                  <AnimatedNumber value={stat.value} decimals={stat.label === "Blocked Rate" ? 1 : 0} suffix={stat.suffix || ""} />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Filters</h3>
              <p className="text-sm text-slate-500">Refine your threat log results</p>
            </div>
            {(searchTerm || severityFilter !== "all" || threatType !== "all" || ipFilter !== "all" || endpointFilter.trim() || timeRange !== "all" || countryFilter) && (
              <button onClick={clearAllFilters} className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">Clear All</button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by IP, path, rule..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Clock className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {uniqueSeverities.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={threatType} onValueChange={setThreatType}>
              <SelectTrigger><SelectValue placeholder="Threat Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Threats</SelectItem>
                {uniqueThreatTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter by IP address..."
                value={ipFilter === 'all' ? '' : ipFilter}
                onChange={e => setIpFilter(e.target.value.trim() || 'all')}
                className="pl-9 pr-8"
              />
              {ipFilter !== 'all' && (
                <button
                  onClick={() => setIpFilter('all')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-sm"
                >✕</button>
              )}
            </div>
            <div className="relative">
              <Code className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Filter by endpoint..." value={endpointFilter} onChange={e => setEndpointFilter(e.target.value)} className="pl-9" />
            </div>
          </div>
          {/* Active filter badges */}
          {(searchTerm || severityFilter !== "all" || threatType !== "all" || ipFilter !== "all" || endpointFilter.trim() || timeRange !== "all") && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <span className="text-xs font-medium text-slate-500">Active:</span>
              {countryFilter && (
                <Badge className="cursor-pointer bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 hover:bg-blue-200 dark:hover:bg-blue-500/30" onClick={() => setCountryFilter("")}>
                  <MapPin className="h-3 w-3 mr-1 inline-block" />
                  Country: {countryFilter} &nbsp;✕
                </Badge>
              )}
              {searchTerm && <Badge className="cursor-pointer" onClick={() => setSearchTerm("")}>✕ Search: {searchTerm}</Badge>}
              {timeRange !== "all" && <Badge className="cursor-pointer" onClick={() => handleTimeRangeChange("all")}>✕ Time: {TIME_RANGES.find(r => r.value === timeRange)?.label}</Badge>}
              {severityFilter !== "all" && <Badge className="cursor-pointer" onClick={() => setSeverityFilter("all")}>✕ Severity: {severityFilter}</Badge>}
              {threatType !== "all" && <Badge className="cursor-pointer" onClick={() => setThreatType("all")}>✕ Type: {threatType}</Badge>}
              {ipFilter !== "all" && (
                <>
                  <Badge className="cursor-pointer" onClick={() => setIpFilter("all")}>✕ IP: {ipFilter}</Badge>
                  <Badge className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs">
                    🔍 Searching all-time history for this IP
                  </Badge>
                </>
              )}
              {endpointFilter.trim() && <Badge className="cursor-pointer" onClick={() => setEndpointFilter("")}>✕ Endpoint: {endpointFilter.length > 20 ? endpointFilter.substring(0,20)+"..." : endpointFilter}</Badge>}
            </div>
          )}
        </div>

        {/* Threat List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-semibold">
              Security Events <span className="ml-2 inline-flex items-center justify-center h-5 px-2 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-bold">{filteredThreats.length}</span>
            </h3>
            <p className="text-sm text-slate-500">Detailed view of detected threats and security incidents</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
            ) : filteredThreats.length === 0 ? (
              <div className="text-center py-16"><Shield className="h-12 w-12 mx-auto text-slate-400 mb-4" /><p className="text-lg font-semibold">No threat logs match your filters</p></div>
            ) : (
              <div className="space-y-3">
                {filteredThreats.map(threat => {
                  const sevCfg = getSeverityConfig(threat.threat_level || "low");
                  return (
                    <div key={threat.id} className="group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-5 hover:border-red-400/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
                          <div>
                            <h3 className="font-semibold">{threat.waf_rule_triggered || "Security Event"}</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{threat.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sevCfg.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sevCfg.dot}`} />{threat.threat_level || "low"}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300">🚫 Blocked</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                          <p className="text-xs text-slate-500 mb-1">Source IP</p>
                          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400" /><span className="text-sm font-mono truncate">{threat.client_ip}</span></div>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                          <p className="text-xs text-slate-500 mb-1">Request</p>
                          <div className="flex items-center gap-1.5"><Code className="h-3 w-3 text-slate-400" /><span className="text-sm font-mono truncate">{threat.method} {threat.path}</span></div>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                          <p className="text-xs text-slate-500 mb-1">Status Code</p>
                          <span className="text-sm font-semibold">{threat.status_code || "N/A"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-xs text-slate-400 truncate max-w-xs font-mono">{(threat.user_agent || "").substring(0,60)}...</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs opacity-60 group-hover:opacity-100">
                              <Eye className="h-3.5 w-3.5" /> View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Threat Details — {threat.waf_rule_triggered || "Security Event"}</DialogTitle>
                              <DialogDescription>Complete information about this security event</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs text-slate-500">Timestamp</Label><p className="text-sm font-mono mt-1">{threat.timestamp}</p></div>
                                <div><Label className="text-xs text-slate-500">Status Code</Label><p className="text-sm font-mono mt-1">{threat.status_code || "N/A"}</p></div>
                                <div><Label className="text-xs text-slate-500">Severity</Label><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${sevCfg.cls}`}>{threat.threat_level || "low"}</span></div>
                                <div><Label className="text-xs text-slate-500">WAF Status</Label><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 mt-1">🚫 Blocked</span></div>
                              </div>
                              <div><Label>Source IP</Label><p className="text-sm font-mono">{threat.client_ip}</p></div>
                              <div><Label>Request</Label><p className="text-sm font-mono">{threat.method} {threat.path}</p></div>
                              <div><Label>WAF Rule Triggered</Label><p className="text-sm">{threat.waf_rule_triggered || "None"}</p></div>
                              {threat.user_agent && <div><Label>User Agent</Label><p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl break-all font-mono text-xs">{threat.user_agent}</p></div>}
                              {threat.query_params && Object.keys(threat.query_params).length > 0 && <div><Label>Query Parameters</Label><pre className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">{JSON.stringify(threat.query_params, null, 2)}</pre></div>}
                              {threat.headers && Object.keys(threat.headers).length > 0 && <div><Label>Request Headers</Label><pre className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">{JSON.stringify(threat.headers, null, 2)}</pre></div>}
                              {threat.request_body && <div><Label>Request Body</Label><pre className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">{typeof threat.request_body === "object" ? JSON.stringify(threat.request_body, null, 2) : threat.request_body}</pre></div>}
                              {threat.response_headers && Object.keys(threat.response_headers).length > 0 && <div><Label>Response Headers</Label><pre className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">{JSON.stringify(threat.response_headers, null, 2)}</pre></div>}
                              {threat.response_body && <div><Label>Response Body</Label><pre className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">{typeof threat.response_body === "object" ? JSON.stringify(threat.response_body, null, 2) : threat.response_body}</pre></div>}
                              {typeof threat.response_time_ms === "number" && <div><Label>Response Time</Label><p className="text-sm">{threat.response_time_ms} ms</p></div>}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="flex justify-center pt-6">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                      {loadingMore ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatLogs;