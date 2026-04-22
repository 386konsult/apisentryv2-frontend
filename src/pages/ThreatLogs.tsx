import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

const AnimatedNumber = ({
  value,
  decimals = 0,
  suffix = '',
  className = '',
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const duration = 800;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(target * eased);
      if (progress < 1) { frame = requestAnimationFrame(tick); }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={className}>
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

const ThreatLogs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusCodeFilter, setStatusCodeFilter] = useState("all");
  const [threatLevelFilter, setThreatLevelFilter] = useState("all");
  const [wafBlockedFilter, setWafBlockedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [threatType, setThreatType] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [ipFilter, setIpFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(100);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [platformName, setPlatformName] = useState<string>('');

  useEffect(() => {
    if (endpointFilter) { setPage(1); }
  }, [endpointFilter]);

  useEffect(() => {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) { navigate('/platforms'); return; }
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
        if (!platformId) { navigate('/platforms'); return; }
        // 🔁 FIX: Use getPlatformThreatLogs which passes ?blocked=true
        const response = await apiService.getPlatformThreatLogs(platformId, { blocked: true });
        // Response structure: { success, logs, total_count, returned_count }
        if (response && response.logs) {
          setAllLogs(response.logs);
        } else if (Array.isArray(response)) {
          setAllLogs(response);
        } else {
          console.error('Unexpected response format for threat logs:', response);
          setAllLogs([]);
        }
      } catch (error) {
        console.error('Error fetching threat logs:', error);
        setAllLogs([]);
        toast({ title: "Error loading threat logs", description: "Failed to fetch threat logs", variant: "destructive" });
      } finally { setLoading(false); }
    };

    fetchThreats();
  }, [toast, navigate, timeRange, page, endpointFilter]);

  // allLogs already contains only blocked logs, so no extra filter needed
  const allBlockedThreats = allLogs;

  const uniqueThreatTypes = useMemo(() => {
    const types = new Set<string>();
    allBlockedThreats.forEach(log => {
      if (log.waf_rule_triggered) {
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

  const uniqueIPs = useMemo(() => Array.from(new Set(allBlockedThreats.map(t => t.client_ip))).sort(), [allBlockedThreats]);
  const uniqueEndpoints = useMemo(() => Array.from(new Set(allBlockedThreats.map(t => `${t.method} ${t.path}`))).sort(), [allBlockedThreats]);
  const uniqueSeverities = useMemo(() => Array.from(new Set(allBlockedThreats.map(t => t.threat_level).filter(Boolean))).sort(), [allBlockedThreats]);

  const filteredThreats = allBlockedThreats.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || log.client_ip?.toLowerCase().includes(searchLower) || log.path?.toLowerCase().includes(searchLower) || log.waf_rule_triggered?.toLowerCase().includes(searchLower) || log.user_agent?.toLowerCase().includes(searchLower);
    const matchesSeverity = severityFilter === 'all' || log.threat_level === severityFilter;
    const matchesIP = ipFilter === 'all' || log.client_ip === ipFilter;
    const matchesEndpoint = !endpointFilter || !endpointFilter.trim() || log.path?.toLowerCase().includes(endpointFilter.toLowerCase()) || `${log.method} ${log.path}`.toLowerCase().includes(endpointFilter.toLowerCase());
    let matchesThreatType = true;
    if (threatType !== 'all') {
      const ruleName = (log.waf_rule_triggered || '').toLowerCase();
      if (threatType === 'SQL Injection') matchesThreatType = ruleName.includes('sql');
      else if (threatType === 'XSS') matchesThreatType = ruleName.includes('xss');
      else if (threatType === 'Path Traversal') matchesThreatType = ruleName.includes('path') || ruleName.includes('traversal');
      else if (threatType === 'Brute Force') matchesThreatType = ruleName.includes('brute');
      else if (threatType === 'Malware') matchesThreatType = ruleName.includes('malware');
      else matchesThreatType = log.waf_rule_triggered === threatType;
    }
    return matchesSearch && matchesSeverity && matchesIP && matchesEndpoint && matchesThreatType;
  });

  const getSeverityConfig = (threat_level: string) => {
    switch (threat_level) {
      case 'high': return { cls: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400', dot: 'bg-red-500' };
      case 'medium': return { cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', dot: 'bg-amber-500' };
      case 'low': return { cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-500' };
      default: return { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' };
    }
  };

  const getStatusColor = (waf_blocked: boolean) => waf_blocked ? "destructive" : "default";

  const getRangeDates = (range: string) => {
    if (!range || range === 'all') return null;
    const now = new Date();
    let start: Date;
    switch (range) {
      case '7d': start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '1y': start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: return null;
    }
    return { start, end: now };
  };

  const parseLogTimestamp = (log: any): number | null => {
    const raw = log?.timestamp ?? log?.created_at ?? log?.createdAt;
    if (raw == null) return null;
    if (typeof raw === "number") return raw < 1e12 ? raw * 1000 : raw;
    if (typeof raw === "string") {
      let s = raw.trim();
      s = s.replace(/\+00:00Z$/, "Z");
      const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/;
      const m = s.match(ddmmyyyyRegex);
      if (m) { return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), m[6] ? Number(m[6]) : 0); }
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
      if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) s = `${s}Z`;
      const ms = Date.parse(s);
      if (!isNaN(ms)) return ms;
      const ms2 = Date.parse(s.replace(/\.\d+/, ""));
      if (!isNaN(ms2)) return ms2;
    }
    return null;
  };

  const applyClientRangeFilter = (logs: any[], range: string) => {
    const dates = getRangeDates(range);
    if (!dates) return logs;
    const { start, end } = dates;
    return logs.filter((l) => { const ts = parseLogTimestamp(l); if (ts == null) return false; return ts >= start.getTime() && ts <= end.getTime(); });
  };

  const updateQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) { if (key === "num" && value === "100") { params.delete("num"); } else { params.set(key, value); } } else { params.delete(key); }
    setSearchParams(params);
    console.log("Updated query parameters:", params.toString());
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === "blocked") { updateQueryParam(key, value); } else {
      const params = new URLSearchParams(searchParams);
      params.delete("method"); params.delete("status_code"); params.delete("threat_level"); params.delete("ip"); params.delete("country"); params.delete("endpoint");
      if (key !== "num" || value !== "100") params.set(key, value);
      setSearchParams(params);
    }
  };

  const clearFilter = (key: string) => updateQueryParam(key, null);
  const clearAllFilters = () => { const params = new URLSearchParams(searchParams); params.delete("num"); setSearchParams(params); };

  useEffect(() => {
    const method = searchParams.get("method") || "all";
    const statusCode = searchParams.get("status_code") || "all";
    const threatLevel = searchParams.get("threat_level") || "all";
    const blocked = searchParams.get("blocked") || "all";
    const num = searchParams.get("num") || "100";
    setMethodFilter(method); setStatusCodeFilter(statusCode); setThreatLevelFilter(threatLevel); setWafBlockedFilter(blocked);
  }, [searchParams]);

  const statsData = [
    { label: "Today's Threats", value: allBlockedThreats.length, icon: AlertTriangle, iconColor: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', sub: 'Blocked requests' },
    { label: 'High Severity', value: allBlockedThreats.filter(t => t.threat_level === 'high').length, icon: AlertTriangle, iconColor: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', sub: 'Requires attention', valueColor: 'text-red-600 dark:text-red-400' },
    { label: 'Medium Severity', value: allBlockedThreats.filter(t => t.threat_level === 'medium').length, icon: AlertTriangle, iconColor: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', sub: 'Monitor closely', valueColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Unique IPs', value: new Set(allBlockedThreats.map(t => t.client_ip)).size, icon: MapPin, iconColor: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', sub: 'Unique source IPs' },
  ];

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* ── Red Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
              Threat Logs
            </Badge>
            {platformName && (
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                {platformName}
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words">
                Threat Logs
              </h1>
              <p className="mt-1 text-sm text-red-100 break-words max-w-xl">
                Security events and threat detection history
              </p>
            </div>
            <div className="flex flex-row gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/create-alert')}
                className="bg-white text-red-600 hover:bg-white/90 shadow-md rounded-full px-4 text-sm font-semibold"
              >
                <Shield className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statsData.map((stat, i) => (
          <div key={i} className="relative rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden group cursor-default">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.valueColor || 'text-slate-900 dark:text-white'}`}>
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{stat.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Filters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Refine your threat log results</p>
          </div>
          {(searchTerm || severityFilter !== 'all' || threatType !== 'all' || ipFilter !== 'all' || (endpointFilter && endpointFilter.trim()) || timeRange !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setSeverityFilter('all'); setThreatType('all'); setIpFilter('all'); setEndpointFilter(''); setTimeRange('all'); }}
              className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Row 1: Search + Time */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by IP, path, rule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 placeholder:text-slate-400"
            />
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Clock className="h-4 w-4 mr-2 text-slate-400" />
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

        {/* Row 2: Type Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {uniqueSeverities.map(severity => (
                <SelectItem key={severity} value={severity}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={threatType} onValueChange={setThreatType}>
            <SelectTrigger className="rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Threat Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Threats</SelectItem>
              {uniqueThreatTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={ipFilter} onValueChange={setIpFilter}>
            <SelectTrigger className="rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <MapPin className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="IP Address" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All IPs</SelectItem>
              {uniqueIPs.map(ip => <SelectItem key={ip} value={ip}>{ip}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="relative">
            <Code className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter by endpoint..."
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              className="pl-9 rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Active filter badges */}
        {(searchTerm || severityFilter !== 'all' || threatType !== 'all' || ipFilter !== 'all' || (endpointFilter && endpointFilter.trim()) || timeRange !== 'all') && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-700"
          >
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active:</span>
            {searchTerm && <Badge className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-full text-xs cursor-pointer" onClick={() => setSearchTerm('')}>✕ Search: {searchTerm}</Badge>}
            {timeRange !== 'all' && <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs cursor-pointer" onClick={() => setTimeRange('all')}>✕ Time: {TIME_RANGES.find(r => r.value === timeRange)?.label}</Badge>}
            {severityFilter !== 'all' && <Badge className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-full text-xs cursor-pointer" onClick={() => setSeverityFilter('all')}>✕ Severity: {severityFilter}</Badge>}
            {threatType !== 'all' && <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30 rounded-full text-xs cursor-pointer" onClick={() => setThreatType('all')}>✕ Type: {threatType}</Badge>}
            {ipFilter !== 'all' && <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-full text-xs cursor-pointer" onClick={() => setIpFilter('all')}>✕ IP: {ipFilter}</Badge>}
            {endpointFilter && endpointFilter.trim() && <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs cursor-pointer" onClick={() => setEndpointFilter('')}>✕ Endpoint: {endpointFilter.length > 20 ? endpointFilter.substring(0, 20) + '...' : endpointFilter}</Badge>}
          </motion.div>
        )}
      </motion.div>

      {/* ── Threat Logs List ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-md overflow-hidden"
      >
        <div className="border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 bg-gradient-to-r from-slate-50 dark:from-slate-800/30 to-transparent">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Security Events
            <span className="ml-2 inline-flex items-center justify-center h-5 px-2 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-bold">
              {filteredThreats.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Detailed view of detected threats and security incidents</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative w-14 h-14 mb-4">
                <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-red-600 dark:border-t-red-400 animate-spin" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Loading threat logs...</p>
            </div>
          ) : filteredThreats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-5 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Shield className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No threat logs match your filters</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredThreats.map((threat) => {
                const sevCfg = getSeverityConfig(threat.threat_level || 'low');
                return (
                  <div
                    key={threat.id}
                    className="group rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 p-5 hover:border-red-400/40 dark:hover:border-red-500/30 hover:shadow-md transition-all duration-200"
                  >
                    {/* Top row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 flex-shrink-0 mt-0.5">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {threat.waf_rule_triggered || 'Security Event'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{threat.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sevCfg.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sevCfg.dot}`} />
                          {threat.threat_level || 'low'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/20">
                          🚫 Blocked
                        </span>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 px-3 py-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Source IP</p>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{threat.client_ip}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 px-3 py-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Request</p>
                        <div className="flex items-center gap-1.5">
                          <Code className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{threat.method} {threat.path}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 px-3 py-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status Code</p>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{threat.status_code || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs font-mono">
                        {threat.user_agent ? threat.user_agent.substring(0, 60) + '...' : 'Unknown User Agent'}
                      </span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1.5 text-xs opacity-60 group-hover:opacity-100 transition-opacity h-7">
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Threat Details — {threat.waf_rule_triggered || 'Security Event'}</DialogTitle>
                            <DialogDescription>Complete information about this security event</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { label: 'Timestamp', value: threat.timestamp },
                                { label: 'Status Code', value: String(threat.status_code || 'N/A') },
                              ].map(({ label, value }) => (
                                <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/50 dark:border-slate-700/50">
                                  <Label className="text-xs text-slate-500">{label}</Label>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 font-mono">{value}</p>
                                </div>
                              ))}
                              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/50 dark:border-slate-700/50">
                                <Label className="text-xs text-slate-500">Severity</Label>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getSeverityConfig(threat.threat_level || 'low').cls}`}>{threat.threat_level || 'low'}</span>
                              </div>
                              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/50 dark:border-slate-700/50">
                                <Label className="text-xs text-slate-500">WAF Status</Label>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 mt-1">🚫 Blocked</span>
                              </div>
                            </div>
                            <div><Label className="text-xs font-semibold text-slate-500">Source IP</Label><p className="text-sm font-mono mt-1">{threat.client_ip}</p></div>
                            <div><Label className="text-xs font-semibold text-slate-500">Request</Label><p className="text-sm font-mono mt-1">{threat.method} {threat.path}</p></div>
                            <div><Label className="text-xs font-semibold text-slate-500">WAF Rule Triggered</Label><p className="text-sm mt-1">{threat.waf_rule_triggered || 'None'}</p></div>
                            {threat.user_agent && <div><Label className="text-xs font-semibold text-slate-500">User Agent</Label><p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mt-1 break-all font-mono text-xs">{threat.user_agent}</p></div>}
                            {threat.query_params && Object.keys(threat.query_params).length > 0 && <div><Label className="text-xs font-semibold text-slate-500">Query Parameters</Label><div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2"><pre className="whitespace-pre-wrap break-words">{JSON.stringify(threat.query_params, null, 2)}</pre></div></div>}
                            {threat.headers && Object.keys(threat.headers).length > 0 && <div><Label className="text-xs font-semibold text-slate-500">Request Headers</Label><div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2"><pre className="whitespace-pre-wrap break-words">{JSON.stringify(threat.headers, null, 2)}</pre></div></div>}
                            {threat.request_body && <div><Label className="text-xs font-semibold text-slate-500">Request Body</Label><div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2"><pre className="whitespace-pre-wrap break-words">{typeof threat.request_body === 'object' ? JSON.stringify(threat.request_body, null, 2) : threat.request_body}</pre></div></div>}
                            {threat.response_headers && Object.keys(threat.response_headers).length > 0 && <div><Label className="text-xs font-semibold text-slate-500">Response Headers</Label><div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2"><pre className="whitespace-pre-wrap break-words">{JSON.stringify(threat.response_headers, null, 2)}</pre></div></div>}
                            {threat.response_body && <div><Label className="text-xs font-semibold text-slate-500">Response Body</Label><div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2"><pre className="whitespace-pre-wrap break-words">{typeof threat.response_body === 'object' ? JSON.stringify(threat.response_body, null, 2) : threat.response_body}</pre></div></div>}
                            {typeof threat.response_time_ms === 'number' && <div><Label className="text-xs font-semibold text-slate-500">Response Time</Label><p className="text-sm mt-1">{threat.response_time_ms} ms</p></div>}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Pagination ── */}
      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg">
            Prev
          </Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={totalPages !== null && page >= (totalPages || 1)} onClick={() => setPage((p) => p + 1)} className="rounded-lg">
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