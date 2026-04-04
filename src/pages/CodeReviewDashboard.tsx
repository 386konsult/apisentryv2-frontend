import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield,
  GitBranch,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Activity,
  Target,
  BarChart3,
  FileWarning,
  Lock,
  Clock,
  XCircle,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from "recharts";
import { API_BASE_URL } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";

/* ─── Counting animation hook ─── */
function useCountUp(target: number, duration = 1200, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) { setValue(target); return; }
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ─── Animated number component ─── */
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const count = useCountUp(value, 1000, inView);
  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Hover card wrapper ─── */
const HoverCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);

interface DashboardData {
  scan_status: { completed: number; in_progress: number; queued: number; failed: number };
  scores: { security_score: number; performance_score: number };
  issues_summary: { total_issues: number; resolved_issues: number; open_issues: number; security_issues: number; performance_issues: number; other_issues: number };
  severity_breakdown: { critical: number; high: number; medium: number; low: number };
  affected_security_frameworks: Array<{ name: string; count: number; percentage: number }>;
  affected_compliance_frameworks: Array<{ name: string; count: number; percentage: number }>;
  top_owasp_findings: Array<{ category: string; count: number }>;
  total_scanned_repositories: number;
  top_api_endpoints: Array<{ id: string; name: string; path: string; method: string; total_issues: number; security_percentage: number; performance_percentage: number; other_percentage: number; risk_level: string }>;
}

const CodeReviewDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedPlatformId } = usePlatform();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Token ${token}` } : {};
      if (!selectedPlatformId) throw new Error("No platform selected. Please select a platform first.");
      const response = await fetch(`${API_BASE_URL}/dashboard/?platform_id=${selectedPlatformId}`, { headers });
      if (!response.ok) throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setDashboardData(null);
    }
  };

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchDashboardData(); setLoading(false); };
    load();
  }, [selectedPlatformId]);

  const startScan = async () => {
    setScanning(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Token ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      if (!selectedPlatformId) throw new Error("No platform selected.");
      const response = await fetch(`${API_BASE_URL}/github/scan-all/?platform_id=${selectedPlatformId}`, { method: "POST", headers, body: JSON.stringify({}) });
      if (!response.ok) throw new Error("Failed to start code review scan.");
      const result = await response.json();
      try {
        const reposResponse = await fetch(`${API_BASE_URL}/github/repos/?platform_id=${selectedPlatformId}`, { method: "GET", headers: token ? { Authorization: `Token ${token}` } : {} });
        if (reposResponse.ok) {
          const reposData = await reposResponse.json();
          const repos = Array.isArray(reposData) ? reposData : (reposData.results || []);
          const repoUrls = repos.map((repo: any) => repo.html_url || repo.url).filter(Boolean);
          if (repoUrls.length > 0) {
            const branches: Record<string, string> = {};
            repos.forEach((repo: any) => {
              const repoUrl = repo.html_url || repo.url;
              if (repoUrl) branches[repoUrl] = repo.default_branch || (repo.branches?.[0] ?? 'main');
            });
            await fetch(`${API_BASE_URL}/admin/manual-scan-alert/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }, body: JSON.stringify({ repo_urls: repoUrls, platform_id: selectedPlatformId, branches }) });
          }
        }
      } catch (alertError) { console.error("Manual scan alert error:", alertError); }
      toast({ title: "Scan Started", description: `Code review scan started. Scan ID: ${result.scanId || "N/A"}` });
      await fetchDashboardData();
      navigate('/code-review-scan-reports');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start scan.", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      Low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      High: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      Critical: "bg-red-500 text-white",
    };
    return <Badge className={styles[risk] || "bg-slate-100 text-slate-700"}>{risk}</Badge>;
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      PATCH: "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400",
    };
    return colors[method] || "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="relative mb-4 h-14 w-14">
          <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
        <p className="font-medium text-slate-700 dark:text-slate-300">Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const severityData = [
    { name: 'Critical', value: dashboardData.severity_breakdown.critical, color: '#ef4444' },
    { name: 'High', value: dashboardData.severity_breakdown.high, color: '#f97316' },
    { name: 'Medium', value: dashboardData.severity_breakdown.medium, color: '#eab308' },
    { name: 'Low', value: dashboardData.severity_breakdown.low, color: '#22c55e' },
  ];

  const issuesTypeData = [
    { name: 'Security', value: dashboardData.issues_summary.security_issues, color: '#ef4444' },
    { name: 'Performance', value: dashboardData.issues_summary.performance_issues, color: '#f97316' },
    { name: 'Other', value: dashboardData.issues_summary.other_issues, color: '#6b7280' },
  ];

  const securityFrameworksData = dashboardData.affected_security_frameworks.map(f => ({ ...f, fill: '#3b82f6' }));
  const complianceFrameworksData = dashboardData.affected_compliance_frameworks.map(f => ({ ...f, fill: '#8b5cf6' }));
  const owaspData = dashboardData.top_owasp_findings.map((f, i) => ({
    name: f.category,
    value: f.count,
    fill: ['#3b82f6','#8b5cf6','#f97316','#ef4444','#22c55e','#eab308','#06b6d4','#ec4899','#14b8a6','#f59e0b'][i % 10],
  }));

  const scanCards = [
    { label: "Completed", value: dashboardData.scan_status.completed, icon: CheckCircle2, color: "green" },
    { label: "In Progress", value: dashboardData.scan_status.in_progress, icon: PlayCircle, color: "blue" },
    { label: "Queued", value: dashboardData.scan_status.queued, icon: Clock, color: "amber" },
    { label: "Failed", value: dashboardData.scan_status.failed, icon: XCircle, color: "red" },
  ];

  const colorMap: Record<string, { card: string; icon: string; via: string }> = {
    green:  { card: "border-green-200/50 dark:border-green-800/30",  icon: "bg-green-50 dark:bg-green-500/10 text-green-500",  via: "via-green-500/30"  },
    blue:   { card: "border-blue-200/50 dark:border-blue-800/30",    icon: "bg-blue-50 dark:bg-blue-500/10 text-blue-500",     via: "via-blue-500/30"   },
    amber:  { card: "border-amber-200/50 dark:border-amber-800/30",  icon: "bg-amber-50 dark:bg-amber-500/10 text-amber-500",  via: "via-amber-500/30"  },
    red:    { card: "border-red-200/50 dark:border-red-800/30",      icon: "bg-red-50 dark:bg-red-500/10 text-red-500",        via: "via-red-500/30"    },
  };

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* Error banner */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200/50 bg-red-50/60 dark:border-red-800/30 dark:bg-red-900/10 px-5 py-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Error</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
        </motion.div>
      )}

      {/* ── Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
    
    {/* dynamic blue light orbs */}
    <div className="absolute -top-6 -right-6 w-48 h-48 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 left-1/3 w-40 h-32 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />
    <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-blue-700/20 blur-2xl pointer-events-none" />

    {/* shine sweep */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />

    {/* subtle grid texture */}
    <div
      className="absolute inset-0 opacity-[0.06] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 flex flex-col justify-between h-full gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full backdrop-blur-sm">
          Code Review
        </Badge>
        <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full backdrop-blur-sm">
          Security Analysis
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words drop-shadow-sm">
            Source Code Review
          </h1>
          <p className="mt-1 text-sm text-blue-100/90 max-w-xl">
            Comprehensive security and performance analysis across all repositories.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            onClick={startScan}
            disabled={true}
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-md shadow-blue-900/20 rounded-full px-5 text-sm font-semibold transition-colors duration-150"
          >
            {scanning ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" />Run All Scans</>
            )}
          </Button>
        </div>
      </div>
    </div>
  </div>
</motion.div>


      {/* ── Scan Status Cards ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {scanCards.map(({ label, value, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <HoverCard key={label}>
              <Card className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm ${c.card}`}>
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${c.via} to-transparent`} />
                <CardHeader className="pb-2">
                  <div className={`rounded-xl p-3 w-fit ${c.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    <AnimatedNumber value={value} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">scan{value !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
            </HoverCard>
          );
        })}
      </motion.div>

      {/* ── Scores + Issues Summary ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Security Score */}
        <HoverCard>
          <Card className="relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <CardHeader className="pb-2">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 w-fit">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Security Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-2">
                <div className="relative w-36 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                      data={[{ value: dashboardData.scores.security_score, fill: '#22c55e' }]}
                      startAngle={180} endAngle={0}
                    >
                      <RadialBar dataKey="value" cornerRadius={10} fill="#22c55e" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        <AnimatedNumber value={dashboardData.scores.security_score} />
                      </div>
                      <div className="text-xs text-slate-400">/ 100</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </HoverCard>

        {/* Performance Score */}
        <HoverCard>
          <Card className="relative overflow-hidden rounded-2xl border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardHeader className="pb-2">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-3 w-fit">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Performance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-2">
                <div className="relative w-36 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                      data={[{ value: dashboardData.scores.performance_score, fill: '#3b82f6' }]}
                      startAngle={180} endAngle={0}
                    >
                      <RadialBar dataKey="value" cornerRadius={10} fill="#3b82f6" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        <AnimatedNumber value={dashboardData.scores.performance_score} />
                      </div>
                      <div className="text-xs text-slate-400">/ 100</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </HoverCard>

        {/* Issues Summary */}
        <HoverCard>
          <Card className="relative overflow-hidden rounded-2xl border border-orange-200/50 dark:border-orange-800/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
            <CardHeader className="pb-2">
              <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 p-3 w-fit">
                <FileWarning className="h-5 w-5 text-orange-500" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Issues Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Total Issues</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  <AnimatedNumber value={dashboardData.issues_summary.total_issues} />
                </p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Open", value: dashboardData.issues_summary.open_issues, color: "bg-red-500" },
                  { label: "Resolved", value: dashboardData.issues_summary.resolved_issues, color: "bg-green-500" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        <AnimatedNumber value={value} />
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                      <motion.div
                        className={`h-1.5 rounded-full ${color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(value / dashboardData.issues_summary.total_issues) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: "Security", value: dashboardData.issues_summary.security_issues, bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
                  { label: "Perf", value: dashboardData.issues_summary.performance_issues, bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400" },
                  { label: "Other", value: dashboardData.issues_summary.other_issues, bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
                ].map(({ label, value, bg, text }) => (
                  <div key={label} className={`text-center rounded-xl p-2 ${bg}`}>
                    <p className={`text-sm font-bold ${text}`}><AnimatedNumber value={value} /></p>
                    <p className={`text-xs mt-0.5 ${text}`}>{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </HoverCard>
      </motion.div>

      {/* ── Severity + Repositories ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <HoverCard>
          <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md h-full">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
                <div className="rounded-xl bg-purple-50 dark:bg-purple-500/10 p-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </div>
                Severity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={severityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)", boxShadow: "0 8px 20px rgba(15,23,42,0.1)", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {severityData.map(({ name, value, color }) => (
                  <div key={name} className="text-center rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/30 p-2">
                    <div className="text-sm font-bold text-slate-900 dark:text-white"><AnimatedNumber value={value} /></div>
                    <div className="text-xs mt-0.5" style={{ color }}>{name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </HoverCard>

        <HoverCard>
          <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md h-full">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
                <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                </div>
                Repositories & Issue Types
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="rounded-xl border border-slate-200/50 bg-gradient-to-br from-blue-50/60 to-violet-50/60 dark:from-blue-900/10 dark:to-violet-900/10 dark:border-slate-700/50 p-4 text-center">
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  <AnimatedNumber value={dashboardData.total_scanned_repositories} />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Scanned Repositories</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Issue Types</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={issuesTypeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)", fontSize: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {issuesTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </HoverCard>
      </motion.div>

      {/* ── Frameworks ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {[
          { title: "Affected Security Frameworks", icon: Shield, iconClass: "bg-red-50 dark:bg-red-500/10 text-red-500", data: securityFrameworksData, barColor: "#3b82f6" },
          { title: "Affected Compliance Frameworks", icon: Lock, iconClass: "bg-violet-50 dark:bg-violet-500/10 text-violet-500", data: complianceFrameworksData, barColor: "#8b5cf6" },
        ].map(({ title, icon: Icon, iconClass, data, barColor }) => (
          <HoverCard key={title}>
            <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
              <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
                  <div className={`rounded-xl p-2 ${iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)", fontSize: 12 }} />
                    <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
                      {data.map((_, i) => <Cell key={i} fill={barColor} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {data.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white"><AnimatedNumber value={f.count} /> issues</span>
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs px-1.5 py-0">
                          {f.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </HoverCard>
        ))}
      </motion.div>

      {/* ── OWASP Findings ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <HoverCard>
          <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
                <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 p-2">
                  <Target className="h-4 w-4 text-orange-500" />
                </div>
                Top OWASP Findings
              </CardTitle>
              <CardDescription>Most common OWASP Top 10 categories found in scans</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={owaspData} layout="vertical" margin={{ top: 0, right: 20, left: 110, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                    {owaspData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {owaspData.map((item, i) => (
                  <div key={i} className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/30 p-2.5 text-center">
                    <div className="text-sm font-bold text-slate-900 dark:text-white"><AnimatedNumber value={item.value} /></div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={item.name}>{item.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </HoverCard>
      </motion.div>

      {/* ── Top API Endpoints ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
          <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-2">
                <Activity className="h-4 w-4 text-indigo-500" />
              </div>
              Top API Endpoints with Issues
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                {dashboardData.top_api_endpoints.length}
              </span>
            </CardTitle>
            <CardDescription>Endpoints with the most security and performance issues</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                    <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[220px]">Endpoint</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[90px]">Method</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[100px]">Total Issues</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">Security</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">Performance</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">Other</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[100px]">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.top_api_endpoints.map((ep) => (
                    <motion.tr
                      key={ep.id}
                      className="border-b border-slate-200/40 transition-colors hover:bg-blue-50/40 dark:border-slate-800/40 dark:hover:bg-slate-800/30 cursor-pointer"
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <td className="px-5 py-4 align-middle">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{ep.name}</p>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{ep.path}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <Badge className={`${getMethodColor(ep.method)} text-xs font-mono`}>{ep.method}</Badge>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="font-semibold text-slate-900 dark:text-white">{ep.total_issues}</span>
                      </td>
                      {[
                        { pct: ep.security_percentage, color: "bg-red-500" },
                        { pct: ep.performance_percentage, color: "bg-orange-500" },
                        { pct: ep.other_percentage, color: "bg-slate-400" },
                      ].map(({ pct, color }, i) => (
                        <td key={i} className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <motion.div
                                className={`h-1.5 rounded-full ${color}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                              />
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400">{pct}%</span>
                          </div>
                        </td>
                      ))}
                      <td className="px-5 py-4 align-middle">{getRiskBadge(ep.risk_level)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewDashboard;
 