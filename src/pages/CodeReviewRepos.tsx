import { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  GitBranch, Zap, Loader2, CheckCircle, AlertCircle,
  Clock, Building2, Settings, Shield,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiService } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";
import { RepositoryScanConfig } from "@/components/RepositoryScanConfig";
import { ScanRepositoryDialog } from "@/components/ScanRepositoryDialog";

/* ─── types ────────────────────────────────────────────────────────────── */
type Provider = "github" | "bitbucket";
interface Workspace { uuid: string; slug: string; name: string; }
interface Repository {
  id: number | string; name: string; full_name: string; html_url: string;
  score?: number; risk?: "Low" | "Medium" | "High" | "Critical";
  lastScan?: string; scan_status?: "queued" | "in progress" | "completed" | "failed";
  scan_run_id?: string; status?: string;
  totalSuggestions?: number; openSuggestions?: number; resolvedSuggestions?: number;
  branches?: string[]; default_branch?: string;
}
interface ScanConfig {
  is_active: boolean; scan_on_push: boolean; scan_on_pr_created: boolean; scan_on_pr_updated: boolean;
  push_scan_branches: string[]; pr_target_branches: string[];
  auto_post_comments: boolean; min_severity_for_comments: string;
}
interface ScanJob {
  analysis_run_id: string; status: string; repo_url: string;
  total_files_scanned?: number; total_issues?: number; created_at: string; completed_at?: string;
}
interface BatchScanJob {
  scan_batch_id: string; total_repositories: number; completed_repositories: number;
  failed_repositories: number; queued_repositories: number; total_issues_found: number; status: string;
}

/* ─── animated counter ─────────────────────────────────────────────────── */
function AnimatedCount({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const c = animate(count, to, { duration, ease: "easeOut" });
    const u = rounded.on("change", setDisplay);
    return () => { c.stop(); u(); };
  }, [to]);
  return <span>{display}</span>;
}

/* ─── risk map ─────────────────────────────────────────────────────────── */
const riskMap: Record<string, { pill: string; dot: string }> = {
  Low:      { pill: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  Medium:   { pill: "bg-amber-500/10  text-amber-500  dark:text-amber-400  border-amber-500/20",  dot: "bg-amber-400"   },
  High:     { pill: "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20", dot: "bg-orange-400"  },
  Critical: { pill: "bg-red-500/10    text-red-500    dark:text-red-400    border-red-500/20",    dot: "bg-red-500"     },
};

/* ─── scan status pill ──────────────────────────────────────────────────── */
const scanStatusCfg: Record<string, { label: string; Icon: any; cls: string }> = {
  queued:        { label: "Queued",        Icon: Clock,       cls: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700" },
  "in progress": { label: "Scanning",      Icon: Loader2,     cls: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20" },
  completed:     { label: "Scan Complete", Icon: CheckCircle, cls: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20" },
  failed:        { label: "Scan Failed",   Icon: AlertCircle, cls: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20" },
};
function ScanStatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const cfg = scanStatusCfg[status];
  if (!cfg) return <span className="text-xs text-slate-400">{status}</span>;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-medium ${cfg.cls}`}>
      <Icon className={`w-3 h-3 ${status === "in progress" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
const CodeReviewRepos = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider>("github");
  const [repos, setRepos]       = useState<Repository[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [scanningRepos,  setScanningRepos]  = useState<Set<string>>(new Set());
  const [activeScanJobs, setActiveScanJobs] = useState<Map<string, ScanJob>>(new Map());
  const [batchScan,   setBatchScan]   = useState<BatchScanJob | null>(null);
  const [scanningAll, setScanningAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize]      = useState(20);
  const { selectedPlatformId } = usePlatform();

  const [workspaces,        setWorkspaces]        = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [selectedBranches,  setSelectedBranches]  = useState<Map<string, string>>(new Map());

  const [configDialogOpen,      setConfigDialogOpen]      = useState(false);
  const [selectedRepoForConfig, setSelectedRepoForConfig] = useState<Repository | null>(null);
  const [repoScanConfigs,       setRepoScanConfigs]       = useState<Map<string, ScanConfig>>(new Map());
  const [loadingConfigs,        setLoadingConfigs]        = useState<Set<string>>(new Set());
  const [scanDialogOpen,        setScanDialogOpen]        = useState(false);
  const [selectedRepoForScan,   setSelectedRepoForScan]   = useState<Repository | null>(null);

  const fetchWorkspaces = async () => {
    if (provider !== "bitbucket" || !selectedPlatformId) { setWorkspaces([]); return; }
    setLoadingWorkspaces(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${API_BASE_URL}/bitbucket/workspaces/?platform_id=${selectedPlatformId}`, { method: "GET", credentials: "include", headers: token ? { Authorization: `Token ${token}` } : {} });
      if (res.ok) {
        const data = await res.json();
        let list: Workspace[] = [];
        let bs: string | null = null;
        if (Array.isArray(data)) list = data;
        else if (data.results && Array.isArray(data.results)) list = data.results;
        else if (data.workspaces && Array.isArray(data.workspaces)) list = data.workspaces;
        if (data.selected_workspace) bs = data.selected_workspace.slug || data.selected_workspace.uuid || data.selected_workspace;
        else if (data.selected_workspace_slug) bs = data.selected_workspace_slug;
        setWorkspaces(list);
        if (bs) setSelectedWorkspace(bs);
        else if (list.length > 0 && !selectedWorkspace) setSelectedWorkspace(list[0].slug || list[0].uuid);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingWorkspaces(false); }
  };

  const fetchRepos = useCallback(async () => {
    if (!selectedPlatformId) { setError("No platform selected"); setLoading(false); return; }
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const pn = provider === "github" ? "github" : "bitbucket";
      let url  = `${API_BASE_URL}/${pn}/repos/?page=${page}&page_size=${pageSize}&platform_id=${selectedPlatformId}`;
      if (provider === "bitbucket" && selectedWorkspace) url += `&workspace_slug=${encodeURIComponent(selectedWorkspace)}`;
      const res = await fetch(url, { method: "GET", credentials: "include", headers: token ? { Authorization: `Token ${token}` } : {} });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      let list: Repository[] = Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);
      const br = new Map(selectedBranches);
      list.forEach((r: Repository) => { if (r.html_url && !br.has(r.html_url)) br.set(r.html_url, r.default_branch || r.branches?.[0] || "main"); });
      setSelectedBranches(br);
      setRepos(list); setError("");
      if (selectedPlatformId && list.length > 0) fetchScanConfigs(list);
    } catch { setError("Could not load repositories."); }
    finally { setLoading(false); }
  }, [selectedPlatformId, provider, page, pageSize, selectedWorkspace]);

  const fetchScanConfigs = async (repoList: Repository[]) => {
    if (!selectedPlatformId) return;
    const map = new Map<string, ScanConfig>();
    const lset = new Set(repoList.map(r => String(r.id)));
    setLoadingConfigs(new Set(lset));
    await Promise.all(repoList.map(async (repo) => {
      try {
        const repoId = repo.id ? String(repo.id).replace(/[{}]/g, "") : "";
        const cfg = await apiService.getRepositoryScanConfig(repoId, selectedPlatformId, repo.html_url);
        if (cfg) map.set(String(repo.id), { is_active: cfg.is_active ?? false, scan_on_push: cfg.scan_on_push ?? false, scan_on_pr_created: cfg.scan_on_pr_created ?? false, scan_on_pr_updated: cfg.scan_on_pr_updated ?? false, push_scan_branches: cfg.push_scan_branches || [], pr_target_branches: cfg.pr_target_branches || [], auto_post_comments: cfg.auto_post_comments ?? false, min_severity_for_comments: cfg.min_severity_for_comments || "medium" });
      } catch { /* no config */ }
      finally { lset.delete(String(repo.id)); }
    }));
    setRepoScanConfigs(map); setLoadingConfigs(new Set());
  };

  const pollScanStatus = useCallback(async (analysisRunId: string) => {
    const token = localStorage.getItem("auth_token");
    const pn = provider === "github" ? "github" : "bitbucket";
    try {
      const res = await fetch(`${API_BASE_URL}/${pn}/scan-status/${analysisRunId}/`, { method: "GET", headers: token ? { Authorization: `Token ${token}` } : {} });
      if (!res.ok) return null;
      const job: ScanJob = await res.json();
      setActiveScanJobs(p => { const u = new Map(p); u.set(analysisRunId, job); return u; });
      if (job.status === "completed" || job.status === "failed") { setActiveScanJobs(p => { const u = new Map(p); u.delete(analysisRunId); return u; }); setScanningRepos(p => { const u = new Set(p); u.delete(job.repo_url); return u; }); fetchRepos(); }
      return job;
    } catch { return null; }
  }, [provider]);

  const pollBatchScanStatus = useCallback(async (batchId: string) => {
    const token = localStorage.getItem("auth_token");
    const pn = provider === "github" ? "github" : "bitbucket";
    try {
      const res = await fetch(`${API_BASE_URL}/${pn}/batch-scan-status/${batchId}/?platform_id=${selectedPlatformId}`, { method: "GET", headers: token ? { Authorization: `Token ${token}` } : {} });
      if (!res.ok) return null;
      const job: BatchScanJob = await res.json();
      setBatchScan(job);
      if (job.status === "completed") { setBatchScan(null); setScanningAll(false); fetchRepos(); }
      return job;
    } catch { return null; }
  }, [selectedPlatformId, provider]);

  useEffect(() => {
    if (provider === "bitbucket" && selectedPlatformId) fetchWorkspaces();
    else { setWorkspaces([]); setSelectedWorkspace(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, selectedPlatformId]);

  useEffect(() => {
    if (provider === "bitbucket" && !selectedWorkspace) { setRepos([]); return; }
    fetchRepos();
  }, [fetchRepos, provider, selectedWorkspace]);

  const handleScanClick = (repo: Repository) => { setSelectedRepoForScan(repo); setScanDialogOpen(true); };

  const handleScan = async (branch: string) => {
    if (!selectedRepoForScan) return;
    const repo = selectedRepoForScan;
    setScanningRepos(p => new Set(p).add(repo.html_url));
    const token = localStorage.getItem("auth_token");
    try {
      if (!selectedPlatformId) throw new Error("No platform selected");
      const res = await fetch(`${API_BASE_URL}/admin/manual-scan-alert/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Token ${token}` }, body: JSON.stringify({ repo_urls: [repo.html_url], platform_id: selectedPlatformId, branches: { [repo.html_url]: branch } }) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || e.message || "Scan initiation failed"); }
      setError(""); setSuccessMessage(`Scan request submitted for ${repo.name} (${branch}). You'll receive an email when complete.`);
      setTimeout(() => setSuccessMessage(""), 5000);
      setTimeout(() => setScanningRepos(p => { const u = new Set(p); u.delete(repo.html_url); return u; }), 2000);
    } catch (e: any) { setError(e.message || "Failed to initiate scan."); setScanningRepos(p => { const u = new Set(p); u.delete(repo.html_url); return u; }); }
  };

  const handleScanAll = async () => {
    setScanningAll(true);
    const token = localStorage.getItem("auth_token");
    const pn = provider === "github" ? "github" : "bitbucket";
    try {
      if (!selectedPlatformId) throw new Error("No platform selected");
      let url = `${API_BASE_URL}/${pn}/scan-all/?platform_id=${selectedPlatformId}`;
      if (provider === "bitbucket" && selectedWorkspace) url += `&workspace=${encodeURIComponent(selectedWorkspace)}`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Token ${token}` } });
      if (!res.ok) throw new Error("Batch scan initiation failed");
      const result = await res.json();
      const repoUrls = repos.map(r => r.html_url);
      if (repoUrls.length > 0) { const branches: Record<string, string> = {}; repos.forEach(r => { branches[r.html_url] = selectedBranches.get(r.html_url) || r.default_branch || "main"; }); await fetch(`${API_BASE_URL}/admin/manual-scan-alert/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Token ${token}` }, body: JSON.stringify({ repo_urls: repoUrls, platform_id: selectedPlatformId, branches }) }).catch(console.error); }
      setBatchScan({ scan_batch_id: result.scanId, total_repositories: result.totalRepositoriesQueued, completed_repositories: 0, failed_repositories: 0, queued_repositories: result.totalRepositoriesQueued, total_issues_found: 0, status: "in_progress" });
    } catch { setError("Failed to initiate batch scan. Please try again."); setScanningAll(false); }
  };

  const getRepoScanJob = (url: string) => { for (const [, j] of activeScanJobs) { if (j.repo_url === url) return j; } return undefined; };

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ══ HERO BANNER ══════════════════════════════════════════════════
          CHANGES: gradient is now pure blue→cyan (no purple), dot grid removed
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="relative overflow-hidden rounded-2xl min-h-[148px]"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)" }}
        >
          {/* soft radial shine — top right */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)] pointer-events-none" />
          {/* subtle bottom-left glow blob */}
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          {/* cyan glow right-centre */}
          <div className="absolute top-0 right-1/4 w-48 h-32 rounded-full bg-cyan-300/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col px-6 sm:px-8 pt-6 pb-5 gap-4 h-full">
            {/* breadcrumb tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate("/connect-repo")}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-colors duration-150"
              >
                Repository Connect
              </button>
              <div className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-blue-700 border border-white/10 shadow-sm">
                Code Review
              </div>
            </div>

            {/* title + right controls */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                  Repositories
                </h1>
                <p className="mt-1 text-sm text-blue-100/80 max-w-lg">
                  View and manage connected repositories for code review and security scanning.
                </p>
              </div>

              {/* provider tabs + scan button */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <div className="flex rounded-full bg-white/10 border border-white/20 p-0.5 gap-0.5 backdrop-blur-sm">
                  {(["github", "bitbucket"] as Provider[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        provider === p ? "bg-white text-blue-700 shadow-sm" : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {p === "github" ? "GitHub" : "Bitbucket"}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleScanAll}
                  disabled={true}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-blue-700 text-xs font-semibold shadow-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {scanningAll || batchScan
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scanning…</>
                    : <><Zap className="w-3.5 h-3.5" />Scan All</>}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Bitbucket workspace bar ──────────────────────────────────────── */}
      {provider === "bitbucket" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30"
        >
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
            <Building2 className="w-4 h-4 text-blue-500" />Workspace
          </div>
          {loadingWorkspaces ? (
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />Loading…</div>
          ) : workspaces.length > 0 ? (
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger className="w-[220px] h-8 rounded-lg border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-blue-100 dark:border-slate-700">
                {workspaces.map((ws) => (
                  <SelectItem key={ws.uuid || ws.slug} value={ws.slug || ws.uuid} className="text-sm">{ws.name || ws.slug}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : <span className="text-sm text-slate-400">No workspaces available</span>}
          {!selectedWorkspace && workspaces.length > 0 && <span className="text-xs text-amber-500 font-medium ml-1">Select a workspace to view repos</span>}
        </motion.div>
      )}

      {/* ── Batch scan progress ──────────────────────────────────────────── */}
      {batchScan && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Batch Scan In Progress</p></div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-700">{batchScan.completed_repositories + batchScan.failed_repositories} / {batchScan.total_repositories}</span>
          </div>
          <Progress value={(batchScan.completed_repositories + batchScan.failed_repositories) / batchScan.total_repositories * 100} className="h-1.5 mb-4 bg-blue-100 dark:bg-blue-900" />
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Completed", val: batchScan.completed_repositories, cls: "text-emerald-500" },
              { label: "Failed",    val: batchScan.failed_repositories,    cls: "text-red-500"     },
              { label: "Queued",    val: batchScan.queued_repositories,    cls: "text-amber-500"   },
              { label: "Issues",    val: batchScan.total_issues_found,     cls: "text-blue-500"    },
            ].map(({ label, val, cls }) => (
              <div key={label} className="rounded-lg border border-white dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2 text-center">
                <p className={`text-base font-bold ${cls}`}>{val}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Toasts ───────────────────────────────────────────────────────── */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm"
        ><AlertCircle className="w-4 h-4 shrink-0" />{error}</motion.div>
      )}
      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm"
        ><CheckCircle className="w-4 h-4 shrink-0" />{successMessage}</motion.div>
      )}

      {/* ── Repo list ────────────────────────────────────────────────────── */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
        className="space-y-3"
      >
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 rounded-full border-2 border-blue-100 dark:border-blue-900" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading repositories…</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Please wait while we fetch your data</p>
            </div>
          </div>
        ) : repos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <GitBranch className="w-7 h-7 text-blue-300 dark:text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No repositories found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Connect your provider to see repositories here</p>
            </div>
          </div>
        ) : (
          repos.map((repo) => {
            const repoScanJob      = getRepoScanJob(repo.html_url);
            const isScanning       = scanningRepos.has(repo.html_url) || repoScanJob !== undefined;
            const isScanInProgress = repo.scan_status === "queued" || repo.scan_status === "in progress";
            const canScan          = !isScanInProgress && !isScanning && batchScan === null;
            const risk             = riskMap[repo.risk ?? ""] ?? null;
            const config           = repoScanConfigs.get(String(repo.id));
            const configLoading    = loadingConfigs.has(String(repo.id));
            const totalSugg        = repoScanJob?.total_issues    ?? repo.totalSuggestions ?? 0;
            const openSugg         = repo.openSuggestions         ?? 0;
            const resolvedSugg     = repo.resolvedSuggestions     ?? 0;
            const score            = repoScanJob?.total_files_scanned ?? repo.score ?? 0;

            return (
              <motion.div
                key={repo.id || repo.name}
                variants={{ hidden: { y: 14, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.38 } } }}
                whileHover={{ scale: 1.005, y: -2, boxShadow: "0 8px 32px rgba(37,99,235,0.10)" }}
                className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden cursor-default transition-shadow duration-200"
              >
                {/* top accent */}
                <div className="h-[3px] bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400" />

                <div className="p-5">
                  {/* header row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                        <GitBranch className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-tight truncate">{repo.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Last scan: {repo.lastScan || "N/A"}</p>
                      </div>
                    </div>

                    {/* badges + actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {risk && !repo.scan_status && !repoScanJob && (
                        <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${risk.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />{repo.risk} Risk
                        </span>
                      )}
                      {repo.scan_status ? <ScanStatusPill status={repo.scan_status} /> : repoScanJob ? <ScanStatusPill status={repoScanJob.status} /> : null}

                      {configLoading ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" />Config…
                        </span>
                      ) : config?.is_active ? (
                        <div className="relative group">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-medium cursor-help">
                            <Shield className="w-3 h-3" />Auto Scan: On
                          </span>
                          <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 min-w-[260px]">
                            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2 text-xs">Automated Scan Config</p>
                            <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <p>Triggers: <span className="font-medium text-slate-700 dark:text-slate-200">{[config.scan_on_push && "Push", config.scan_on_pr_created && "PR Created", config.scan_on_pr_updated && "PR Updated"].filter(Boolean).join(", ") || "None"}</span></p>
                              {config.push_scan_branches.length > 0 && <p>Push Branches: <span className="font-medium text-slate-700 dark:text-slate-200">{config.push_scan_branches.join(", ")}</span></p>}
                              {config.pr_target_branches.length > 0 && <p>PR Targets: <span className="font-medium text-slate-700 dark:text-slate-200">{config.pr_target_branches.join(", ")}</span></p>}
                              {config.auto_post_comments && <p>Comments: <span className="font-medium text-slate-700 dark:text-slate-200">Enabled ({config.min_severity_for_comments})</span></p>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium cursor-help">
                            <Shield className="w-3 h-3" />Auto Scan: Off
                          </span>
                          <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 min-w-[220px] text-[11px] text-slate-500 dark:text-slate-400">
                            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Not Configured</p>
                            <p>Configure to scan automatically on push or pull requests.</p>
                          </div>
                        </div>
                      )}

                      <motion.button whileHover={canScan ? { scale: 1.04 } : {}} whileTap={canScan ? { scale: 0.96 } : {}} onClick={() => handleScanClick(repo)} disabled={!canScan}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                      >
                        {isScanning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scanning…</>
                          : isScanInProgress ? <><Clock className="w-3.5 h-3.5" />In Progress</>
                          : <><Zap className="w-3.5 h-3.5" />Scan Now</>}
                      </motion.button>

                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => { setSelectedRepoForConfig(repo); setConfigDialogOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150"
                      ><Settings className="w-3.5 h-3.5" />Configure</motion.button>

                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate(`/code-review-repos/${repo.name}?repo_url=${repo.html_url}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150"
                      >View Details</motion.button>
                    </div>
                  </div>

                  {/* stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Suggestions", value: totalSugg,    numCls: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50"          },
                      { label: "Open Suggestions",  value: openSugg,     numCls: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50"       },
                      { label: "Resolved",          value: resolvedSugg, numCls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50" },
                      { label: repoScanJob ? "Files Scanned" : "Security Score", value: score, numCls: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50" },
                    ].map(({ label, value, numCls, bg }) => (
                      <motion.div key={label} whileHover={{ scale: 1.04, y: -2 }} className={`rounded-xl border p-3 cursor-default transition-shadow duration-150 ${bg}`}>
                        <p className={`text-xl font-bold ${numCls}`}><AnimatedCount to={value} duration={1.1} /></p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* scan progress */}
                  {repoScanJob?.status === "in progress" && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span>Scanning files…</span><span>{repoScanJob.total_files_scanned ?? 0} processed</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 animate-pulse" style={{ width: "45%" }} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {repos.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-between pt-1"
        >
          <span className="text-xs text-slate-400 dark:text-slate-500">Page {page}</span>
          <div className="flex gap-2">
            {[
              { label: "Previous", action: () => setPage(page - 1), disabled: page === 1 || loading },
              { label: "Next",     action: () => setPage(page + 1), disabled: repos.length < pageSize || loading },
            ].map((btn) => (
              <motion.button key={btn.label} whileHover={!btn.disabled ? { scale: 1.04 } : {}} whileTap={!btn.disabled ? { scale: 0.96 } : {}} onClick={btn.action} disabled={btn.disabled}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >{btn.label}</motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      {selectedRepoForConfig && (
        <RepositoryScanConfig
          open={configDialogOpen}
          onOpenChange={(open) => { setConfigDialogOpen(open); if (!open && repos.length > 0) fetchScanConfigs(repos); }}
          repoId={selectedRepoForConfig.id ? String(selectedRepoForConfig.id) : undefined}
          repoUrl={selectedRepoForConfig.html_url}
          repoName={selectedRepoForConfig.name}
          branches={selectedRepoForConfig.branches || []}
        />
      )}
      {selectedRepoForScan && (
        <ScanRepositoryDialog
          open={scanDialogOpen}
          onOpenChange={setScanDialogOpen}
          repoName={selectedRepoForScan.name}
          branches={selectedRepoForScan.branches || []}
          defaultBranch={selectedRepoForScan.default_branch || selectedBranches.get(selectedRepoForScan.html_url) || "main"}
          onConfirm={handleScan}
          isScanning={scanningRepos.has(selectedRepoForScan.html_url)}
        />
      )}
    </div>
  );
};

export default CodeReviewRepos;
