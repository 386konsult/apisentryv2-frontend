import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Activity, Shield, AlertTriangle, Clock,
  Globe, TrendingUp, TrendingDown, CheckCircle, XCircle,
  Search, Filter, Calendar, Eye, Plus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  Area, AreaChart,
} from "recharts";
import { motion } from "framer-motion";

// ============================================================================
// Types — UNCHANGED
// ============================================================================
interface AnalyticsData {
  endpoint_id: string;
  endpoint_name: string;
  endpoint_path: string;
  endpoint_method: string;
  metrics: {
    security_score: number;
    health_score: number;
    error_rate: number;
    error_rate_change?: number;
    avg_response_time: number;
    avg_response_time_change?: number;
    performance_score: number;
  };
  traffic_data: {
    "30d": Array<{ date: string; requests: number }>;
    "1y": Array<{ date: string; requests: number }>;
  };
  security_issues: Array<{
    id: number; type: string; severity: string; description: string;
    file: string; status: string; discovered: string;
  }>;
  performance_issues: Array<{
    id: number; type: string; severity: string; description: string;
    file: string; status: string; discovered: string;
  }>;
  request_logs: Array<{
    id: number; timestamp: string; ip: string; country: string;
    status: number; method: string; response_time: number; user_agent: string;
  }>;
  top_ip_addresses: Array<{
    ip: string; country: string; country_code?: string; requests: number; flag?: string;
  }>;
}

// ── Design tokens (mirrors PlatformDetails exactly) ──────────────────────────
const R    = 'rounded-[22px]';
const Rsub = 'rounded-[14px]';
const cardClass  = `bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 ${R}`;
const headerLine = `border-b border-slate-100 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]`;

// ── AnimatedNumber — UNCHANGED logic ─────────────────────────────────────────
const AnimatedNumber = ({ value, decimals = 0, suffix = "", className = "" }: any) => {
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

// ── KpiCard — same props, PlatformDetails metric-card visual ─────────────────
const ACCENT_MAP: Record<string, { accent: string; iconBg: string; bar: string }> = {
  blue:    { accent: 'from-blue-600 to-cyan-500',     iconBg: 'bg-blue-50 dark:bg-blue-500/10',     bar: 'bg-blue-50 dark:bg-slate-800/80'    },
  red:     { accent: 'from-red-500 to-rose-600',      iconBg: 'bg-red-50 dark:bg-red-500/10',       bar: 'bg-red-50 dark:bg-slate-800/80'     },
  green:   { accent: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',bar: 'bg-emerald-50 dark:bg-slate-800/80' },
  purple:  { accent: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-50 dark:bg-violet-500/10', bar: 'bg-violet-50 dark:bg-slate-800/80'  },
  orange:  { accent: 'from-amber-500 to-orange-500',  iconBg: 'bg-amber-50 dark:bg-amber-500/10',   bar: 'bg-amber-50 dark:bg-slate-800/80'   },
  emerald: { accent: 'from-emerald-500 to-teal-500',  iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',bar: 'bg-emerald-50 dark:bg-slate-800/80'},
};

const KpiCard = ({ title, value, suffix = "", subtitle, icon, color }: any) => {
  const tokens = ACCENT_MAP[color] ?? ACCENT_MAP.blue;
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const barWidth = Math.min(100, Math.max(0, isNaN(numericValue) ? 0 : numericValue > 100 ? 100 : numericValue));
  return (
    <div className={`relative overflow-hidden ${cardClass}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[22px] bg-gradient-to-b ${tokens.accent}`} />
      <div className="p-6 pl-7">
        <div className="flex items-start justify-between mb-4">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{title}</span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${tokens.iconBg} [&>svg]:h-3.5 [&>svg]:w-3.5`}>{icon}</div>
        </div>
        <p className="font-mono tabular-nums text-[2.25rem] font-bold leading-none tracking-[-0.04em] text-slate-900 dark:text-white">
          {isNaN(numericValue) ? value : <AnimatedNumber value={numericValue} suffix={suffix} />}
        </p>
        {subtitle && <div className="mt-2 text-xs">{subtitle}</div>}
        <div className={`mt-4 h-1 rounded-full ${tokens.bar}`}>
          <div className={`h-1 rounded-full bg-gradient-to-r ${tokens.accent} transition-all duration-700`} style={{ width: `${barWidth}%` }} />
        </div>
      </div>
    </div>
  );
};

// ── ChartCard — same children API, PlatformDetails card shell ────────────────
const ChartCard = ({ title, icon, children, action }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) => (
  <div className={`${cardClass} overflow-hidden`}>
    <div className={`flex items-center justify-between p-5 pb-4 ${headerLine}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 dark:bg-blue-500/10 ring-1 ring-slate-100 dark:ring-blue-900/20 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-slate-500 dark:[&>svg]:text-slate-400">
            {icon}
          </div>
        )}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ============================================================================
// Main — ALL state, fetching, filtering, derived data UNCHANGED
// ============================================================================
const EndpointAnalytics = () => {
  const { endpointId } = useParams<{ endpointId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeRange, setTimeRange]     = useState<"30d" | "1y">("30d");
  const [searchTerm, setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ipFilter, setIpFilter]       = useState("");
  const [dateFilter, setDateFilter]   = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Fetch — UNCHANGED
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!endpointId) { setError("Endpoint ID is required"); setLoading(false); return; }
      try {
        setLoading(true);
        const data = await apiService.getEndpointAnalytics(endpointId);
        setAnalyticsData(data);
        setError("");
      } catch (err: any) {
        console.error(err);
        const msg = err.message || "Failed to load analytics data";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [endpointId, toast]);

  // Derived — UNCHANGED
  const trafficData30d    = analyticsData?.traffic_data?.["30d"] || [];
  const trafficData1y     = analyticsData?.traffic_data?.["1y"]  || [];
  const securityIssues    = analyticsData?.security_issues    || [];
  const performanceIssues = analyticsData?.performance_issues || [];
  const requestLogs       = (analyticsData?.request_logs || []).map(log => ({ ...log, responseTime: log.response_time ?? 0 }));
  const topIPs            = analyticsData?.top_ip_addresses   || [];
  const metrics           = analyticsData?.metrics || {
    security_score: 0, health_score: 0, error_rate: 0, error_rate_change: 0,
    avg_response_time: 0, avg_response_time_change: 0, performance_score: 0,
  };

  // Filter — UNCHANGED
  const filteredLogs = requestLogs.filter(log => {
    const matchesSearch = searchTerm === "" || log.ip.includes(searchTerm) || log.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || String(log.status).startsWith(statusFilter);
    const matchesIP     = ipFilter   === "" || log.ip.includes(ipFilter);
    const matchesDate   = dateFilter === "" || log.timestamp.includes(dateFilter);
    return matchesSearch && matchesStatus && matchesIP && matchesDate;
  });

  // Helpers — UNCHANGED logic
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-600 dark:text-emerald-400";
    if (status >= 300 && status < 400) return "text-blue-600 dark:text-blue-400";
    if (status >= 400 && status < 500) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "border border-red-200/60 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
      case "high":     return "border border-orange-200/60 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400";
      case "medium":   return "border border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
      default:         return "border border-blue-200/60 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";
    }
  };

  const getStatusBadge = (status: string) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
      status === "Resolved"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-blue-900/20 dark:bg-slate-800 dark:text-slate-400"
    }`}>{status}</span>
  );

  const COLORS = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F2F6FE] dark:bg-[#0F1724]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Activity className="h-7 w-7 animate-spin text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading Analytics</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Fetching endpoint telemetry…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && !analyticsData) {
    return (
      <div className="w-full min-h-screen bg-[#F2F6FE] dark:bg-[#0F1724] p-6">
        <Button variant="ghost" onClick={() => navigate("/api-endpoints")} className="mb-6 rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className={`${cardClass} flex flex-col items-center justify-center py-12`}>
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#F2F6FE] dark:bg-[#0F1724] px-5 pb-12 pt-0.5">
      <div className="w-full space-y-5">

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[28px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-7 py-7 text-white overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => navigate("/api-endpoints")}
                className="rounded-full border-white/30 bg-white/10 text-white font-medium hover:!bg-white/20 hover:!text-white backdrop-blur-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Endpoints
              </Button>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                {analyticsData?.endpoint_method || "GET"} {analyticsData?.endpoint_path || ""}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">Endpoint Analytics</h1>
            <p className="mt-1.5 text-sm text-blue-100/70">Detailed performance and security metrics</p>
          </div>
        </motion.div>

        {/* ── KPI Cards — same data, PlatformDetails visual ────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard title="Security Score"  value={metrics.security_score}    suffix="/100" icon={<Shield />}     color="blue"   />
          <KpiCard title="Health Score"    value={metrics.health_score}      suffix="/100" icon={<Activity />}   color="green"  />
          <KpiCard
            title="Error Rate" value={metrics.error_rate} suffix="%"
            subtitle={metrics.error_rate_change !== undefined && metrics.error_rate_change !== 0 ? (
              <span className={metrics.error_rate_change < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                {metrics.error_rate_change < 0 ? "▼" : "▲"} {Math.abs(metrics.error_rate_change)}% from last week
              </span>
            ) : undefined}
            icon={<AlertTriangle />} color="red"
          />
          <KpiCard
            title="Avg Response" value={metrics.avg_response_time} suffix="ms"
            subtitle={metrics.avg_response_time_change !== undefined && metrics.avg_response_time_change !== 0 ? (
              <span className={metrics.avg_response_time_change < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                {metrics.avg_response_time_change < 0 ? "▼" : "▲"} {Math.abs(metrics.avg_response_time_change)}ms
              </span>
            ) : undefined}
            icon={<Clock />} color="purple"
          />
          <KpiCard title="Performance"     value={metrics.performance_score} suffix="%"    icon={<TrendingUp />} color="orange" />
        </div>

        {/* ── Traffic chart — UNCHANGED logic ─────────────────────────────── */}
        <ChartCard
          title="Traffic Overview"
          icon={<Globe />}
          action={
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="rounded-full border border-slate-200 dark:border-blue-900/30 bg-white dark:bg-[#0a1220] px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-[140px]">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeRange === "30d" ? trafficData30d : trafficData1y}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ background: '#0d1829', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '12px', fontSize: '12px', color: '#e2e8f0' }} cursor={{ stroke: 'rgba(37,99,235,0.3)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="requests" stroke="#2563EB" fill="url(#trafficGradient)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Top IPs — UNCHANGED logic ────────────────────────────────────── */}
        {topIPs.length > 0 && (
          <ChartCard title="Top IP Addresses by Request Volume" icon={<Globe />}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                {topIPs.map((item, idx) => (
                  <div key={item.ip} className={`flex items-center justify-between border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-3 py-2.5 ${Rsub}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.flag || "🌍"}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.country}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{item.ip}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{item.requests.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">requests</p>
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={topIPs} cx="50%" cy="50%" labelLine={false} label={({ country, percent }: any) => `${country} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="requests">
                    {topIPs.map((_, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1829', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '12px', fontSize: '11px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* ── Security & Performance Issues — UNCHANGED logic ──────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard
            title="Security Issues"
            icon={<Shield />}
            action={
              securityIssues.length > 0 && (securityIssues[0] as any)?.source === 'waf' ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">WAF Detected</span>
              ) : securityIssues.length > 0 ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">Code Review</span>
              ) : null
            }
          >
            {securityIssues.length === 0 ? (
              <div className={`flex h-40 items-center justify-center border border-dashed border-slate-200 dark:border-blue-900/20 ${Rsub}`}>
                <div className="text-center">
                  <Shield className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">No security issues found</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Run a code review scan to detect vulnerabilities</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {securityIssues.map(issue => (
                  <div key={issue.id} className={`border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 p-3 ${Rsub}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${getSeverityColor(issue.severity)}`}>{issue.severity}</span>
                          <span className="font-medium text-xs text-slate-900 dark:text-white truncate">{issue.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{issue.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">{issue.file}</p>
                      </div>
                      {getStatusBadge(issue.status)}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Discovered: {issue.discovered}</p>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Performance Issues" icon={<Activity />}>
            {performanceIssues.length === 0 ? (
              <div className={`flex h-40 items-center justify-center border border-dashed border-slate-200 dark:border-blue-900/20 ${Rsub}`}>
                <div className="text-center">
                  <Activity className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">No performance issues found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {performanceIssues.map(issue => (
                  <div key={issue.id} className={`border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 p-3 ${Rsub}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${getSeverityColor(issue.severity)}`}>{issue.severity}</span>
                          <span className="font-medium text-xs text-slate-900 dark:text-white truncate">{issue.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{issue.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">{issue.file}</p>
                      </div>
                      {getStatusBadge(issue.status)}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Discovered: {issue.discovered}</p>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        

        {/* ── Request Logs — UNCHANGED logic ──────────────────────────────── */}
        <ChartCard title="Request Logs" icon={<Activity />}>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search IP or country..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 rounded-xl border-slate-200/70 bg-slate-50 dark:border-blue-900/30 dark:bg-[#0a1220]" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] rounded-xl border-slate-200/70 bg-slate-50 dark:border-blue-900/30 dark:bg-[#0a1220]">
                <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" /><SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="2">2xx Success</SelectItem>
                <SelectItem value="3">3xx Redirect</SelectItem>
                <SelectItem value="4">4xx Client Error</SelectItem>
                <SelectItem value="5">5xx Server Error</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Filter by IP..." value={ipFilter} onChange={e => setIpFilter(e.target.value)} className="w-[150px] rounded-xl border-slate-200/70 bg-slate-50 dark:border-blue-900/30 dark:bg-[#0a1220]" />
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-[150px] rounded-xl border-slate-200/70 bg-slate-50 dark:border-blue-900/30 dark:bg-[#0a1220]" />
          </div>

          {filteredLogs.length === 0 ? (
            <div className={`flex h-28 items-center justify-center border border-dashed border-slate-200 dark:border-blue-900/20 ${Rsub}`}>
              <p className="text-xs text-slate-400 dark:text-slate-500">No logs found matching the filters</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map(log => (
                <div key={log.id} className={`border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-4 py-3 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors ${Rsub}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono text-xs font-bold ${getStatusColor(log.status)}`}>{log.status}</span>
                      <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">{log.method}</span>
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{log.ip}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{log.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] font-semibold text-slate-400 dark:text-slate-500">{log.response_time}ms</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono mt-1">{log.user_agent}</p>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

      </div>
    </div>
  );
};

export default EndpointAnalytics;