import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Filter,
  Loader2,
  Search,
  GitPullRequest,
  GitCommit,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";
import { useToast } from "@/hooks/use-toast";

/* ─── Counting animation hook ─────────────────────────────────────────── */
function useCountUp(target: number, duration = 1000, start = true) {
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

/* ─── Animated number (fires once on scroll into view) ───────────────── */
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const count = useCountUp(value, 1000, inView);
  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Hover lift wrapper ──────────────────────────────────────────────── */
const HoverCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Types ───────────────────────────────────────────────────────────── */
interface AutomatedRun {
  id: string | number;
  repo_id?: string;
  repo_name?: string;
  repo_url?: string;
  status: 'Queued' | 'In Progress' | 'Completed' | 'Failed';
  trigger_type: 'webhook_push' | 'webhook_pr_created' | 'webhook_pr_updated';
  pr_id?: string;
  pr_number?: string;
  pr_title?: string;
  branch_name?: string;
  commit_sha?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  total_issues_found?: number;
  error_message?: string;
  analysis_run_id?: string;
  contributor_display_name?: string;
  contributor_username?: string;
}

/* ════════════════════════════════════════════════════════════════════════ */
const GitAutomatedScan = () => {
  const navigate = useNavigate();
  const { selectedPlatformId } = usePlatform();
  const { toast } = useToast();

  const [runs, setRuns] = useState<AutomatedRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [repoIdFilter, setRepoIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("all");
  const [prIdFilter, setPrIdFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const fetchAutomatedRuns = useCallback(async () => {
    if (!selectedPlatformId) { setError("No platform selected"); setRuns([]); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const params: any = { platform_id: selectedPlatformId, page, page_size: pageSize };
      if (repoIdFilter.trim())        params.repo_id      = repoIdFilter.trim();
      if (statusFilter !== "all")     params.status       = statusFilter;
      if (triggerTypeFilter !== "all") params.trigger_type = triggerTypeFilter;
      if (prIdFilter.trim())          params.pr_id        = prIdFilter.trim();

      const response = await apiService.getAutomatedRuns(params);
      let runsList: AutomatedRun[] = [];
      if (Array.isArray(response)) {
        runsList = response; setTotalCount(response.length); setHasNextPage(false); setHasPreviousPage(false);
      } else if (response.results && Array.isArray(response.results)) {
        runsList = response.results; setTotalCount(response.count || response.results.length);
        setHasNextPage(!!response.next); setHasPreviousPage(!!response.previous);
      } else {
        runsList = []; setTotalCount(0); setHasNextPage(false); setHasPreviousPage(false);
      }
      setRuns(runsList);
    } catch (err: any) {
      setError(err.message || "Failed to load automated runs");
      setRuns([]);
      toast({ title: "Error loading automated runs", description: err.message || "Failed to fetch automated runs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedPlatformId, page, pageSize, repoIdFilter, statusFilter, triggerTypeFilter, prIdFilter, toast]);

  useEffect(() => { fetchAutomatedRuns(); }, [fetchAutomatedRuns]);

  const handleResetFilters = () => {
    setRepoIdFilter(""); setStatusFilter("all"); setTriggerTypeFilter("all"); setPrIdFilter(""); setPage(1);
  };

  const hasActiveFilters = repoIdFilter.trim() !== "" || statusFilter !== "all" || triggerTypeFilter !== "all" || prIdFilter.trim() !== "";

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString.replace(/\+00:00Z$/, '+00:00')).toLocaleString();
    } catch { return 'Invalid Date'; }
  };

  /* ── status badge ────────────────────────────────────────────────────── */
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Completed:    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "In Progress":"bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      Queued:       "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      Failed:       "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    const icons: Record<string, React.ReactNode> = {
      Completed:    <CheckCircle className="w-3 h-3 mr-1" />,
      "In Progress":<Loader2 className="w-3 h-3 mr-1 animate-spin" />,
      Queued:       <Clock className="w-3 h-3 mr-1" />,
      Failed:       <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge className={`flex items-center w-fit ${styles[status] || "bg-slate-100 text-slate-700"}`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  /* ── trigger badge ───────────────────────────────────────────────────── */
  const getTriggerBadge = (triggerType: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      webhook_push:       { label: "Push",       cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
      webhook_pr_created: { label: "PR Created", cls: "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400" },
      webhook_pr_updated: { label: "PR Updated", cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400" },
    };
    const { label, cls } = map[triggerType] || { label: triggerType, cls: "bg-slate-100 text-slate-700" };
    return <Badge className={cls}>{label}</Badge>;
  };

  /* ── stat cards config ───────────────────────────────────────────────── */
  const statCards = [
    { label: "Total Runs",   value: totalCount,                                     icon: GitBranch, via: "via-blue-500/30",    iconBg: "bg-blue-50 dark:bg-blue-500/10",    iconColor: "text-blue-500",    border: "border-blue-200/50 dark:border-blue-800/30",    sub: "automated scans"    },
    { label: "Completed",    value: runs.filter(r => r.status === 'Completed').length,   icon: CheckCircle, via: "via-green-500/30",  iconBg: "bg-green-50 dark:bg-green-500/10",  iconColor: "text-green-500",   border: "border-green-200/50 dark:border-green-800/30",   sub: "successful scans"   },
    { label: "In Progress",  value: runs.filter(r => r.status === 'In Progress').length, icon: Loader2,     via: "via-orange-500/30", iconBg: "bg-orange-50 dark:bg-orange-500/10", iconColor: "text-orange-500",  border: "border-orange-200/50 dark:border-orange-800/30", sub: "currently running"  },
    { label: "Failed",       value: runs.filter(r => r.status === 'Failed').length,      icon: XCircle,     via: "via-red-500/30",    iconBg: "bg-red-50 dark:bg-red-500/10",      iconColor: "text-red-500",     border: "border-red-200/50 dark:border-red-800/30",       sub: "failed scans"       },
  ];

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* ── Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Git Automation
              </Badge>
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Webhook Scans
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words">
                  Git Automated Scan
                </h1>
                <p className="mt-1 text-sm text-blue-100 break-words max-w-xl">
                  View and manage automated scan runs triggered by webhooks across your repositories.
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  onClick={fetchAutomatedRuns}
                  disabled={loading}
                  className="bg-white text-blue-700 hover:bg-white/90 shadow-md rounded-full px-5 text-sm font-semibold"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {statCards.map(({ label, value, icon: Icon, via, iconBg, iconColor, border, sub }) => (
          <HoverCard key={label}>
            <Card className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm ${border}`}>
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${via} to-transparent`} />
              <CardHeader className="pb-2">
                <div className={`rounded-xl p-3 w-fit ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor} ${label === "In Progress" ? "animate-spin" : ""}`} />
                </div>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  <AnimatedNumber value={value} />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
              </CardContent>
            </Card>
          </HoverCard>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
          <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2">
                <Filter className="h-4 w-4 text-blue-500" />
              </div>
              Filters
            </CardTitle>
            <CardDescription>Filter runs by repository, status, trigger type, or PR ID</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Repository ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Filter by repo ID"
                    value={repoIdFilter}
                    onChange={(e) => { setRepoIdFilter(e.target.value); setPage(1); }}
                    className="pl-8 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Queued">Queued</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Trigger Type</label>
                <Select value={triggerTypeFilter} onValueChange={(v) => { setTriggerTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
                    <SelectValue placeholder="All trigger types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trigger Types</SelectItem>
                    <SelectItem value="webhook_push">Push</SelectItem>
                    <SelectItem value="webhook_pr_created">PR Created</SelectItem>
                    <SelectItem value="webhook_pr_updated">PR Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">PR ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Filter by PR ID"
                    value={prIdFilter}
                    onChange={(e) => { setPrIdFilter(e.target.value); setPage(1); }}
                    className="pl-8 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 text-sm"
                  />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="rounded-xl border-slate-200/70 dark:border-slate-700 text-sm"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Error ── */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200/50 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* ── Runs Table ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
        <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
          <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              Automated Runs
              {!loading && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <AnimatedNumber value={totalCount} />
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {loading ? "Loading automated runs…" : `${totalCount} automated run${totalCount !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-4 h-14 w-14">
                  <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Loading automated runs…</p>
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <GitBranch className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No automated runs found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {hasActiveFilters
                    ? "No runs match your filters. Try adjusting your search criteria."
                    : "No automated scan runs have been recorded yet."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 rounded-xl">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* ── Desktop table ── */}
                <div className="hidden lg:block overflow-x-auto max-h-[680px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                      <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                        {["Repository", "Status", "Trigger", "Branch / PR", "Created At", "Findings", "Contributor"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run, idx) => (
                        <motion.tr
                          key={run.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.03 * idx, duration: 0.25 }}
                          onClick={() => navigate(`/automated-scan-details/${run.id}`)}
                          className="border-b border-slate-200/40 dark:border-slate-800/40 transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/30 cursor-pointer"
                        >
                          {/* Repository */}
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                <GitBranch className="h-4 w-4 text-blue-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white truncate max-w-[160px]">
                                  {run.repo_name || run.repo_url || "Unknown"}
                                </p>
                                {run.repo_url && (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[160px]">{run.repo_url}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 align-middle">{getStatusBadge(run.status)}</td>

                          {/* Trigger */}
                          <td className="px-5 py-4 align-middle">{getTriggerBadge(run.trigger_type)}</td>

                          {/* Branch / PR */}
                          <td className="px-5 py-4 align-middle">
                            {run.trigger_type === "webhook_push" ? (
                              <div className="flex items-center gap-1.5">
                                <GitCommit className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{run.branch_name || "N/A"}</p>
                                  {run.commit_sha && (
                                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{run.commit_sha.substring(0, 7)}</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <GitPullRequest className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    PR #{run.pr_number || run.pr_id || "N/A"}
                                  </p>
                                  {run.pr_title && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[160px]">{run.pr_title}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Created At */}
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <div>
                                <p>{formatDate(run.created_at)}</p>
                                {run.completed_at && run.status === "Completed" && (
                                  <p className="text-slate-400 dark:text-slate-500">Done: {formatDate(run.completed_at)}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Findings */}
                          <td className="px-5 py-4 align-middle">
                            {run.total_issues_found !== undefined ? (
                              <span className="font-semibold text-slate-900 dark:text-white">{run.total_issues_found}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Contributor */}
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {(run.contributor_display_name || run.contributor_username || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  {run.contributor_display_name || "Unknown"}
                                </p>
                                {run.contributor_username && (
                                  <p className="text-xs text-slate-400 dark:text-slate-500">{run.contributor_username}</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile cards ── */}
                <div className="lg:hidden p-4 space-y-3">
                  {runs.map((run, idx) => (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * idx }}
                      whileHover={{ scale: 1.008, y: -2 }}
                      onClick={() => navigate(`/automated-scan-details/${run.id}`)}
                      className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/30 p-4 cursor-pointer hover:bg-blue-50/40 dark:hover:bg-slate-800/60 hover:border-blue-200/50 dark:hover:border-blue-500/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                            <GitBranch className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                              {run.repo_name || run.repo_url || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {formatDate(run.created_at)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(run.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/50 p-2.5">
                          <p className="text-xs text-slate-400 dark:text-slate-500">Trigger</p>
                          <div className="mt-1">{getTriggerBadge(run.trigger_type)}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/50 p-2.5">
                          <p className="text-xs text-slate-400 dark:text-slate-500">Findings</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                            {run.total_issues_found ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/50 p-2.5">
                          <p className="text-xs text-slate-400 dark:text-slate-500">Branch / PR</p>
                          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {run.trigger_type === "webhook_push"
                              ? (run.branch_name || "N/A")
                              : `PR #${run.pr_number || run.pr_id || "N/A"}`}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/50 p-2.5">
                          <p className="text-xs text-slate-400 dark:text-slate-500">Contributor</p>
                          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {run.contributor_display_name || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Pagination ── */}
      {!loading && runs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} runs
          </p>
          <div className="flex gap-2">
            {[
              { label: "Previous", action: () => setPage(page - 1), disabled: !hasPreviousPage || loading },
              { label: "Next",     action: () => setPage(page + 1), disabled: !hasNextPage     || loading },
            ].map((btn) => (
              <Button
                key={btn.label}
                variant="outline"
                size="sm"
                onClick={btn.action}
                disabled={btn.disabled}
                className="rounded-xl border-slate-200/70 dark:border-slate-700 text-sm"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GitAutomatedScan;
