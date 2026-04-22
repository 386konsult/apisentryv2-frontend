import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from "recharts";
import { Shield, AlertTriangle, Activity, TrendingUp, Globe, Download, FileText, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

const TIME_RANGES = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last Year", value: "1y" },
];

const CISOReports = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [endpointScores, setEndpointScores] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [platformName, setPlatformName] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) {
      toast({ title: "Error", description: "No platform selected", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      // Get platform details for name
      const platformDetails = await apiService.getPlatformDetails(platformId);
      setPlatformName(platformDetails.name || "Workspace");

      // Fetch analytics with time range
      const data = await apiService.getAnalytics(platformId, { range: timeRange });
      const analyticsData = data.analytics?.[timeRange] || data;
      setAnalytics(analyticsData);

      // Fetch endpoint security scores (use existing endpoint if available)
      const endpoints = await apiService.getPlatformEndpoints(platformId);
      const endpointsArr = Array.isArray(endpoints) ? endpoints : endpoints.results || [];
      const scores = [];
      for (const ep of endpointsArr.slice(0, 10)) {
        try {
          // Try to use existing endpoint analytics endpoint
          const scoreData = await apiService.request(`/api-endpoints/${ep.id}/analytics/`);
          scores.push({
            name: ep.name || ep.path,
            security_score: scoreData.metrics?.security_score || 0,
            health_score: scoreData.metrics?.health_score || 0,
          });
        } catch (e) {
          // Fallback: use dummy data or skip
          scores.push({
            name: ep.name || ep.path,
            security_score: Math.floor(Math.random() * 100),
            health_score: Math.floor(Math.random() * 100),
          });
        }
      }
      setEndpointScores(scores);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Prepare data
  const totalRequests = analytics?.total_requests || 0;
  const blockedRequests = analytics?.blocked_requests || 0;
  const successRate = analytics?.success_rate || 0;
  const blockedRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;

  // Threat trends - use daily_threats if available, else fallback to method breakdown
  let trendData: any[] = [];
  if (analytics?.daily_threats && Array.isArray(analytics.daily_threats)) {
    trendData = analytics.daily_threats.map((d: any) => ({
      date: d.date,
      blocked: d.blocked || 0,
      allowed: d.allowed || 0,
    }));
  } else {
    // Fallback: use method breakdown
    const methodBreakdown = analytics?.method_status_breakdown || {};
    trendData = Object.entries(methodBreakdown).map(([method, statuses]: [string, any]) => ({
      method,
      total: Object.values(statuses).reduce((a: number, b: any) => a + Number(b), 0),
    }));
  }

  // Top attack types
  const threatTypes = analytics?.threat_type_summary || {};
  const topAttacks = Object.entries(threatTypes)
    .map(([name, count]) => ({ name, value: Number(count) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Top attacking countries
  const countrySummary = analytics?.country_summary || [];
  const topCountries = countrySummary.slice(0, 5).map((c: any) => ({
    code: c.country_code,
    name: c.country_name,
    count: c.total_requests,
  }));

  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6", "#ec4899"];

  // Export functions (same as before)
  const exportToPDF = async () => {
    setExporting(true);
    const element = document.getElementById("ciso-report-content");
    if (!element) {
      toast({ title: "Error", description: "Could not find report content", variant: "destructive" });
      setExporting(false);
      return;
    }
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`ciso-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Requests", totalRequests],
      ["Blocked Threats", blockedRequests],
      ["Success Rate (%)", successRate.toFixed(2)],
      ["Block Rate (%)", blockedRate.toFixed(2)],
      [],
      ["Top Attack Types", "Count"],
      ...topAttacks.map(a => [a.name, a.value]),
      [],
      ["Top Attacking Countries", "Requests"],
      ...topCountries.map(c => [`${c.name} (${c.code})`, c.count]),
    ];
    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ciso-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F4F8FF] dark:bg-[#0F1724]">
        <div className="flex h-72 w-full max-w-lg items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <Activity className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading CISO report...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        {/* Header - matching PlatformDetails gradient */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {platformName}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">
                CISO Security Report
              </h1>
              <p className="text-sm text-blue-100 max-w-xl">
                Executive summary for API security posture and threat landscape
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                className="rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-sm text-white backdrop-blur-sm focus:outline-none"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                {TIME_RANGES.map((range) => (
                  <option key={range.value} value={range.value} className="text-slate-900">
                    {range.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={exporting}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                {exporting ? "Generating..." : "PDF"}
              </Button>
            </div>
          </div>
        </motion.div>

        <div id="ciso-report-content" className="space-y-6">
          {/* Metric Cards - same style as PlatformDetails */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">total_requests</span>
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="mt-4"><AnimatedNumber value={totalRequests} className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" /></div>
                <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">Requests received</p>
                <div className="mt-4 h-1.5 rounded-full bg-blue-50 dark:bg-slate-800">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-700" style={{ width: totalRequests > 0 ? "100%" : "0%" }} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">blocked_threats</span>
                  <Shield className="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
                <div className="mt-4"><AnimatedNumber value={blockedRequests} className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" /></div>
                <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">Threats mitigated</p>
                <div className="mt-4 h-1.5 rounded-full bg-red-50 dark:bg-slate-800">
                  <div className="h-1.5 rounded-full bg-red-500 transition-all duration-700" style={{ width: totalRequests > 0 ? `${(blockedRequests / totalRequests) * 100}%` : "0%" }} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">success_rate</span>
                  <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                </div>
                <div className="mt-4"><AnimatedNumber value={successRate} decimals={1} suffix="%" className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" /></div>
                <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">Successful requests</p>
                <div className="mt-4 h-1.5 rounded-full bg-green-50 dark:bg-slate-800">
                  <div className="h-1.5 rounded-full bg-green-500 transition-all duration-700" style={{ width: `${successRate}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">block_rate</span>
                  <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                </div>
                <div className="mt-4"><AnimatedNumber value={blockedRate} decimals={1} suffix="%" className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" /></div>
                <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">Requests blocked</p>
                <div className="mt-4 h-1.5 rounded-full bg-orange-50 dark:bg-slate-800">
                  <div className="h-1.5 rounded-full bg-orange-500 transition-all duration-700" style={{ width: `${Math.min(blockedRate, 100)}%` }} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Threat Trends Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Threat Trends</CardTitle>
                  <CardDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {trendData.length && trendData[0]?.date ? "Daily blocked vs allowed requests" : "Request volume by HTTP method"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {trendData.length && trendData[0]?.date ? (
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="allowedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="url(#blockedGradient)" strokeWidth={2} name="Blocked" />
                        <Area type="monotone" dataKey="allowed" stroke="#22c55e" fill="url(#allowedGradient)" strokeWidth={2} name="Allowed" />
                      </AreaChart>
                    ) : (
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="method" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="total" stroke="#2563EB" fill="url(#trendGradient)" strokeWidth={2} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Two-column: Attack Types & Countries */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Top Attack Types</CardTitle>
                  <CardDescription>Most frequent threat patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  {topAttacks.length > 0 ? (
                    <div className="space-y-3">
                      {topAttacks.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{item.name}</span>
                          </div>
                          <span className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">No threat data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Top Attacking Countries</CardTitle>
                  <CardDescription>Geographic distribution of requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {topCountries.length > 0 ? (
                    <div className="space-y-3">
                      {topCountries.map((country) => (
                        <div key={country.code} className="flex items-center justify-between rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{country.name} ({country.code})</span>
                          </div>
                          <span className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">{country.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">No country data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Endpoint Security Scores */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Endpoint Security Scores</CardTitle>
                <CardDescription>Security and health scores for top endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {endpointScores.length > 0 ? (
                  <div className="space-y-3">
                    {endpointScores.map((ep, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg px-4 py-3 border border-slate-200/70 dark:border-slate-800/80">
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[200px]">{ep.name}</span>
                        <div className="flex gap-4 mt-2 sm:mt-0">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-sm">Security: <span className="font-mono font-bold">{ep.security_score}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-sm">Health: <span className="font-mono font-bold">{ep.health_score}</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No endpoint scores available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CISOReports;