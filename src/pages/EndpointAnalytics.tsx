import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
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
  ArrowLeft,
  Activity,
  Shield,
  AlertTriangle,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  Eye,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

// ============================================================================
// Types (unchanged)
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
    id: number;
    type: string;
    severity: string;
    description: string;
    file: string;
    status: string;
    discovered: string;
  }>;
  performance_issues: Array<{
    id: number;
    type: string;
    severity: string;
    description: string;
    file: string;
    status: string;
    discovered: string;
  }>;
  request_logs: Array<{
    id: number;
    timestamp: string;
    ip: string;
    country: string;
    status: number;
    method: string;
    response_time: number;
    user_agent: string;
  }>;
  top_ip_addresses: Array<{
    ip: string;
    country: string;
    country_code?: string;
    requests: number;
    flag?: string;
  }>;
}

// Helper: animated number (same as PlatformDetails)
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

// Helper components for consistent cards
const KpiCard = ({ title, value, subtitle, icon, color }: any) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
    green: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm p-5">
      <div className={`p-2 rounded-xl w-fit ${colorClasses[color]}`}>{icon}</div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};

const ChartCard = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm overflow-hidden">
    <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center gap-2">
      {icon && <span className="text-slate-500">{icon}</span>}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const EndpointAnalytics = () => {
  const { endpointId } = useParams<{ endpointId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<"30d" | "1y">("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ipFilter, setIpFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Fetch analytics (same as before)
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!endpointId) {
        setError("Endpoint ID is required");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/api-endpoints/${endpointId}/analytics/`, { headers });
        if (!response.ok) throw new Error(`Failed to fetch analytics: ${response.status}`);
        const data = await response.json();
        setAnalyticsData(data);
        setError("");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load analytics data");
        toast({ title: "Error", description: err.message || "Failed to load analytics data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [endpointId, toast]);

  // Derived data
  const trafficData30d = analyticsData?.traffic_data?.["30d"] || [];
  const trafficData1y = analyticsData?.traffic_data?.["1y"] || [];
  const securityIssues = analyticsData?.security_issues || [];
  const performanceIssues = analyticsData?.performance_issues || [];
  const requestLogs = (analyticsData?.request_logs || []).map(log => ({ ...log, responseTime: log.response_time ?? 0 }));
  const topIPs = analyticsData?.top_ip_addresses || [];

  const metrics = analyticsData?.metrics || {
    security_score: 0, health_score: 0, error_rate: 0, error_rate_change: 0,
    avg_response_time: 0, avg_response_time_change: 0, performance_score: 0,
  };

  // Filter logs
  const filteredLogs = requestLogs.filter(log => {
    const matchesSearch = searchTerm === "" || log.ip.includes(searchTerm) || log.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || String(log.status).startsWith(statusFilter);
    const matchesIP = ipFilter === "" || log.ip.includes(ipFilter);
    const matchesDate = dateFilter === "" || log.timestamp.includes(dateFilter);
    return matchesSearch && matchesStatus && matchesIP && matchesDate;
  });

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600 dark:text-green-400";
    if (status >= 300 && status < 400) return "text-yellow-600 dark:text-yellow-400";
    if (status >= 400 && status < 500) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const getStatusBadge = (status: string) => (
    <Badge variant={status === "Resolved" ? "outline" : "secondary"} className={status === "Resolved" ? "border-green-500 text-green-600" : ""}>
      {status}
    </Badge>
  );

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/api-endpoints")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card className="bg-white dark:bg-slate-900 border-red-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        {/* Gradient Header (PlatformDetails style) */}
        <div className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/api-endpoints")}
                  className="border-white/50 bg-white/15 text-white hover:!bg-white/25 rounded-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Endpoints
                </Button>
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  {analyticsData?.endpoint_method || "GET"} {analyticsData?.endpoint_path || `/api/v1/users/${endpointId}`}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-medium border border-emerald-400/50">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Endpoint Analytics</h1>
              <p className="text-sm text-blue-100 mt-1">Detailed performance and security metrics</p>
            </div>
          </div>
        </div>

        {/* KPI Cards (5) */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard title="Security Score" value={metrics.security_score} suffix="/100" icon={<Shield />} color="blue" />
          <KpiCard title="Health Score" value={metrics.health_score} suffix="/100" icon={<Activity />} color="green" />
          <KpiCard
            title="Error Rate"
            value={`${metrics.error_rate}%`}
            subtitle={metrics.error_rate_change !== undefined && metrics.error_rate_change !== 0 ? (
              <span className={metrics.error_rate_change < 0 ? "text-green-500" : "text-red-500"}>
                {metrics.error_rate_change < 0 ? "▼" : "▲"} {Math.abs(metrics.error_rate_change)}% from last week
              </span>
            ) : undefined}
            icon={<AlertTriangle />}
            color="red"
          />
          <KpiCard
            title="Avg Response Time"
            value={`${metrics.avg_response_time}ms`}
            subtitle={metrics.avg_response_time_change !== undefined && metrics.avg_response_time_change !== 0 ? (
              <span className={metrics.avg_response_time_change < 0 ? "text-green-500" : "text-red-500"}>
                {metrics.avg_response_time_change < 0 ? "▼" : "▲"} {Math.abs(metrics.avg_response_time_change)}ms
              </span>
            ) : undefined}
            icon={<Clock />}
            color="purple"
          />
          <KpiCard title="Performance Score" value={`${metrics.performance_score}%`} suffix="/100" icon={<TrendingUp />} color="orange" />
        </div>

        {/* Traffic Chart */}
        <ChartCard title="Traffic Overview" icon={<Globe />}>
          <div className="flex justify-end mb-4">
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeRange === "30d" ? trafficData30d : trafficData1y}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip />
              <Area type="monotone" dataKey="requests" stroke="#2563EB" fill="url(#trafficGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Security & Performance Issues */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Security Issues" icon={<Shield />}>
            {securityIssues.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-slate-400">No security issues found</div>
            ) : (
              <div className="space-y-3">
                {securityIssues.map(issue => (
                  <div key={issue.id} className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                          <span className="font-medium text-sm">{issue.type}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{issue.description}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{issue.file}</p>
                      </div>
                      {getStatusBadge(issue.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Discovered: {issue.discovered}</p>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
          <ChartCard title="Performance Issues" icon={<Activity />}>
            {performanceIssues.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-slate-400">No performance issues found</div>
            ) : (
              <div className="space-y-3">
                {performanceIssues.map(issue => (
                  <div key={issue.id} className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                          <span className="font-medium text-sm">{issue.type}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{issue.description}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{issue.file}</p>
                      </div>
                      {getStatusBadge(issue.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Discovered: {issue.discovered}</p>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Top IP Addresses */}
        {topIPs.length > 0 && (
          <ChartCard title="Top IP Addresses by Request Volume" icon={<Globe />}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                {topIPs.map((item, idx) => (
                  <div key={item.ip} className="flex items-center justify-between p-3 border rounded-lg border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.flag || "🌍"}</span>
                      <div>
                        <p className="font-medium">{item.country}</p>
                        <p className="text-sm text-slate-400 font-mono">{item.ip}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.requests.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">requests</p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={topIPs} cx="50%" cy="50%" labelLine={false} label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="requests">
                      {topIPs.map((_, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        )}

        {/* Request Logs */}
        <ChartCard title="Request Logs" icon={<Activity />}>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search IP or country..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="2">2xx Success</SelectItem>
                <SelectItem value="3">3xx Redirect</SelectItem>
                <SelectItem value="4">4xx Client Error</SelectItem>
                <SelectItem value="5">5xx Server Error</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Filter by IP..." value={ipFilter} onChange={e => setIpFilter(e.target.value)} className="w-[150px]" />
            <Input type="date" placeholder="Filter by date..." value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-[150px]" />
          </div>

          {/* Logs table */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No logs found matching the filters</div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <div key={log.id} className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(log.status)} bg-transparent border`}>{log.status}</Badge>
                      <Badge variant="outline">{log.method}</Badge>
                      <span className="font-mono text-sm">{log.ip}</span>
                      <span className="text-sm text-slate-500">{log.country}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm font-mono">{log.response_time}ms</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-400 truncate">{log.user_agent}</div>
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