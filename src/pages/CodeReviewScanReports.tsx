import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Clock, CheckCircle, AlertTriangle,
  XCircle, Eye, RefreshCw, GitBranch, Shield,
  TrendingUp, ArrowLeft,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import SecurityReportView from "@/components/SecurityReportView";

/* ─── types ────────────────────────────────────────────────────────────── */
interface ScanReport {
  id: string;
  status: "in_progress" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  openFindings: number;
  resolvedFindings: number;
  averageScore: number;
  scan_by: string;
  repositories: RepositoryScan[];
  repo_url?: string;
  analysis_run_id?: string;
}
interface RepositoryScan {
  name: string;
  status: "pending" | "scanning" | "completed" | "failed";
  risk: "Low" | "Medium" | "High" | "Critical";
  url?: string;
  html_url?: string;
  repo_url?: string;
  full_name?: string;
  analysis_run_id?: string;
}

/* ─── animated counter ─────────────────────────────────────────────────── */
function AnimatedCount({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const count   = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const c = animate(count, to, { duration, ease: "easeOut" });
    const u = rounded.on("change", setDisplay);
    return () => { c.stop(); u(); };
  }, [to]);
  return <span>{display}</span>;
}

/* ─── status pill ───────────────────────────────────────────────────────── */
const statusCfg: Record<string, { label: string; Icon: any; cls: string }> = {
  completed:   { label: "Completed",   Icon: CheckCircle, cls: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20" },
  in_progress: { label: "In Progress", Icon: RefreshCw,   cls: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20" },
  failed:      { label: "Failed",      Icon: XCircle,     cls: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20" },
};
function StatusPill({ status }: { status: string }) {
  const cfg = statusCfg[status];
  if (!cfg) return <span className="text-xs text-slate-400">{status}</span>;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-medium ${cfg.cls}`}>
      <Icon className={`w-3 h-3 ${status === "in_progress" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

/* ─── risk pill ─────────────────────────────────────────────────────────── */
const riskCfg: Record<string, string> = {
  Low:      "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
  Medium:   "bg-amber-500/10  text-amber-500  dark:text-amber-400  border-amber-500/20",
  High:     "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20",
  Critical: "bg-red-500/10    text-red-500    dark:text-red-400    border-red-500/20",
};
function RiskPill({ risk }: { risk: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border font-medium ${riskCfg[risk] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {risk}
    </span>
  );
}

/* ─── repo status icon ──────────────────────────────────────────────────── */
function RepoStatusIcon({ status }: { status: string }) {
  if (status === "scanning")  return <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
  if (status === "completed") return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === "failed")    return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  return <Clock className="w-3.5 h-3.5 text-slate-400" />;
}

/* ════════════════════════════════════════════════════════════════════════ */
const CodeReviewScanReports = () => {
  const [scanReports,          setScanReports]          = useState<ScanReport[]>([]);
  const [currentScan,          setCurrentScan]          = useState<ScanReport | null>(null);
  const [loading,              setLoading]              = useState(false);
  const [viewingReport,        setViewingReport]        = useState<ScanReport | null>(null);
  const [securityReportData,   setSecurityReportData]   = useState<any>(null);
  const [securityReportLoading,setSecurityReportLoading]= useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const inProgress = scanReports.find(r => r.status === "in_progress");
    setCurrentScan(inProgress || null);
  }, [scanReports]);

  const loadScanReports = async () => {
    setLoading(true);
    try {
      const token      = localStorage.getItem("auth_token");
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected. Please select a platform first.");
      const res = await fetch(`${API_BASE_URL}/scan-reports/?platform_id=${platformId}`, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Failed to fetch scan reports: ${res.status}`);
      setScanReports(await res.json());
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error loading scan reports", description: error.message, variant: "destructive" });
      setScanReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScanReports(); }, []);

  const formatDate = (d: string) => {
    try { return new Date(d.replace(/\+00:00Z$/, "+00:00")).toLocaleString(); }
    catch { return "Invalid Date"; }
  };

  const calculateDuration = (start: string, end?: string) => {
    try {
      const s = new Date(start.replace(/\+00:00Z$/, "+00:00"));
      if (!end) return "In Progress";
      const e   = new Date(end.replace(/\+00:00Z$/, "+00:00"));
      const min = Math.round((e.getTime() - s.getTime()) / 60000);
      if (min < 1)  return "< 1m";
      if (min < 60) return `${min}m`;
      return `${Math.floor(min / 60)}h ${min % 60}m`;
    } catch { return "Unknown"; }
  };

  /* ── transform + fetch report data (logic unchanged) ────────────────── */
  const transformReportData = (report: ScanReport) => {
    const repo = report.repositories[0] || { name: "Unknown", risk: "Low" };
    const open = Math.max(0, report.openFindings || 0);
    const resolved = Math.max(0, report.resolvedFindings || 0);
    const has = open > 0;
    const ow = {
      A01: has ? Math.max(1, Math.floor(open * 0.30)) : 11,
      A02: has ? Math.max(1, Math.floor(open * 0.10)) : 4,
      A03: has ? Math.max(1, Math.floor(open * 0.20)) : 7,
      A04: has ? Math.max(1, Math.floor(open * 0.05)) : 3,
      A05: has ? Math.max(1, Math.floor(open * 0.15)) : 9,
      A06: has ? Math.max(1, Math.floor(open * 0.08)) : 5,
      A07: has ? Math.max(1, Math.floor(open * 0.05)) : 6,
      A08: has ? Math.max(1, Math.floor(open * 0.04)) : 4,
      A09: has ? Math.max(1, Math.floor(open * 0.02)) : 3,
      A10: has ? Math.max(1, Math.floor(open * 0.01)) : 2,
    };
    const crit = has ? Math.max(1, Math.floor(open * 0.10)) : 3;
    const high = has ? Math.max(1, Math.floor(open * 0.25)) : 7;
    const med  = has ? Math.max(1, Math.floor(open * 0.35)) : 21;
    const low  = has ? Math.max(0, open - crit - high - med) : 45;
    return {
      repository: repo.name || "Unknown Repository", branch: "main", scanId: report.id,
      generatedAt: report.endTime || report.startTime,
      totalFilesScanned: 1248, totalFindings: open + resolved,
      criticalFindings: crit, highFindings: high, mediumFindings: med, lowFindings: low,
      owaspFindings: ow,
      severityTrend: { criticalHigh: [16, 15, 13, 12, Math.max(1, crit + high)], mediumLow: [80, 72, 69, 62, Math.max(1, med + low)] },
      dependencies: { total: 134, withCVEs: 9, outdated: 4 },
      compliance: { owaspAsvs: 82, soc2: 74, iso27001: 69, pciDss: 63, gdpr: 76, custom: 64 },
      frameworks: "Express, Django, React", languages: "TypeScript, Python, JavaScript",
      estimated_lines_of_code: "85,000+", estimated_files_scanned: "1,200+",
      exclusions: "Test fixtures, vendor directories, generated code",
      custom_compliance_mapping: "SOC 2, ISO 27001, PCI DSS (partial)",
      owasp_top3_mapping: [
        { code: "A01", title: "Broken Access Control" },
        { code: "A03", title: "Injection" },
        { code: "A05", title: "Security Misconfiguration" },
      ],
      issues_by_category: [
        { title: "Broken Access Control",         count: ow.A01, severity: "Critical" as const },
        { title: "Cryptographic Failures",         count: ow.A02, severity: "High"     as const },
        { title: "Injection",                      count: ow.A03, severity: "Critical" as const },
        { title: "Insecure Design",                count: ow.A04, severity: "Medium"   as const },
        { title: "Security Misconfiguration",      count: ow.A05, severity: "High"     as const },
        { title: "Vulnerable Components",          count: ow.A06, severity: "High"     as const },
        { title: "Authentication Failures",        count: ow.A07, severity: "Medium"   as const },
        { title: "Software and Data Integrity",    count: ow.A08, severity: "Low"      as const },
        { title: "Security Logging Failures",      count: ow.A09, severity: "Medium"   as const },
        { title: "Server-Side Request Forgery",    count: ow.A10, severity: "Low"      as const },
      ],
    };
  };

  const fetchSecurityReport = async (analysisRunId: string) => {
    setSecurityReportLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res   = await fetch(`${API_BASE_URL}/analysis-runs/${analysisRunId}/security-report/`, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Failed to fetch security report: ${res.status}`);
      setSecurityReportData(await res.json());
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error loading security report", description: error.message, variant: "destructive" });
      setSecurityReportData(null);
    } finally {
      setSecurityReportLoading(false);
    }
  };

  const viewReport = async (report: ScanReport) => {
    setViewingReport(report);
    setSecurityReportData(null);
    const id = report.analysis_run_id || (report.repositories[0] as any)?.analysis_run_id;
    await fetchSecurityReport(id || report.id);
  };

  const closeReport = () => { setViewingReport(null); setSecurityReportData(null); };

  /* ── security report view ───────────────────────────────────────────── */
  if (viewingReport) {
    return (
      <SecurityReportView
        reportData={securityReportData ?? transformReportData(viewingReport)}
        onClose={closeReport}
        loading={securityReportLoading}
      />
    );
  }

  /* ── derived stats ──────────────────────────────────────────────────── */
  const totalFindings  = scanReports.reduce((s, r) => s + r.openFindings + r.resolvedFindings, 0);
  const activeScans    = scanReports.filter(r => r.status === "in_progress").length;
  const avgScore       = scanReports.length
    ? Math.round(scanReports.reduce((s, r) => s + (r.averageScore || 0), 0) / scanReports.length)
    : 0;

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ══ HERO BANNER ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="relative overflow-hidden rounded-2xl min-h-[148px]"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-48 h-32 rounded-full bg-cyan-300/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col px-6 sm:px-8 pt-6 pb-5 gap-4 h-full">
            {/* breadcrumbs */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate("/code-review-dashboard")}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-colors duration-150"
              >
                ← Dashboard
              </button>
              <div className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-blue-700 border border-white/10 shadow-sm">
                Scan Reports
              </div>
            </div>

            {/* title + actions */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                  Scan Reports
                </h1>
                <p className="mt-1 text-sm text-blue-100/80 max-w-lg">
                  View and manage code review scan reports and security findings.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={loadScanReports}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-blue-700 text-xs font-semibold shadow-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══ STAT CARDS ═══════════════════════════════════════════════════ */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Scans",    value: scanReports.length, icon: FileText,     numCls: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50"          },
          { label: "Active Scans",   value: activeScans,        icon: RefreshCw,    numCls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50" },
          { label: "Total Findings", value: totalFindings,      icon: AlertTriangle, numCls: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50"       },
          { label: "Avg Score",      value: avgScore,           icon: TrendingUp,   numCls: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50"   },
        ].map(({ label, value, icon: Icon, numCls, bg }, i) => (
          <motion.div
            key={label}
            variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.35 } } }}
            whileHover={{ scale: 1.04, y: -3, boxShadow: "0 8px 28px rgba(37,99,235,0.10)" }}
            className={`rounded-2xl border p-5 flex items-center gap-4 cursor-default transition-shadow duration-200 ${bg}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-white dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${numCls}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${numCls}`}><AnimatedCount to={value} duration={1.2} /></p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ══ CURRENT SCAN PROGRESS ══════════════════════════════════════════ */}
      {currentScan && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 overflow-hidden"
        >
          {/* top accent */}
          <div className="h-[3px] bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Scan In Progress</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Started: {formatDate(currentScan.startTime)} · By: {currentScan.scan_by}
                </p>
              </div>
            </div>

            {/* 3 mini stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Repos Scanned",      value: `${currentScan.repositories.filter(r => r.status === "completed").length}/${currentScan.repositories.length}` },
                { label: "Open Findings",      value: String(currentScan.openFindings) },
                { label: "Currently Scanning", value: String(currentScan.repositories.filter(r => r.status === "scanning").length) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/60 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* repo progress list */}
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Repository Progress</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentScan.repositories.map((repo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-900/50 bg-white dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{repo.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <RepoStatusIcon status={repo.status} />
                    <span className="text-[10px] text-slate-400 capitalize">{repo.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ══ REPORTS TABLE ══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        {/* table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Scan Reports</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {loading ? "Loading…" : `${scanReports.length} report${scanReports.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>
        </div>

        {/* body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-blue-100 dark:border-blue-900" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">Loading scan reports…</p>
          </div>
        ) : scanReports.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-300 dark:text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No scan reports found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No scan reports have been generated yet.</p>
            </div>
          </div>
        ) : (
          <>
            {/* column headings */}
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {["Repository", "Status", "Findings", "Actions"].map((h, i) => (
                <p key={h} className={`text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide ${i === 3 ? "text-right" : ""}`}>{h}</p>
              ))}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {scanReports.flatMap((report) =>
                report.repositories.length > 0
                  ? report.repositories.map((repo, ri) => {
                      const repoUrl      = repo.html_url || repo.repo_url || repo.url || "";
                      const analysisRunId = repo.analysis_run_id || report.analysis_run_id || report.id;

                      return (
                        <motion.div
                          key={`${report.id}-${ri}`}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: ri * 0.04 }}
                          whileHover={{ backgroundColor: "rgba(37,99,235,0.03)" }}
                          className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 transition-colors duration-150"
                        >
                          {/* repo */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                              <GitBranch className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{repo.name}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {formatDate(report.startTime)} · {calculateDuration(report.startTime, report.endTime)}
                              </p>
                            </div>
                          </div>

                          {/* status */}
                          <StatusPill status={report.status} />

                          {/* findings */}
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{report.openFindings + report.resolvedFindings} total</p>
                            <p className="text-[11px] text-red-500 dark:text-red-400">{report.openFindings} open</p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{report.resolvedFindings} resolved</p>
                          </div>

                          {/* actions */}
                          <div className="flex gap-2 justify-end">
                            <motion.button
                              whileHover={report.status === "completed" ? { scale: 1.04 } : {}}
                              whileTap={report.status === "completed"  ? { scale: 0.96 } : {}}
                              onClick={() => viewReport(report)}
                              disabled={report.status !== "completed"}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                            >
                              <Eye className="w-3.5 h-3.5" />View Report
                            </motion.button>
                            <motion.button
                              whileHover={repoUrl ? { scale: 1.04 } : {}}
                              whileTap={repoUrl  ? { scale: 0.96 } : {}}
                              onClick={() => {
                                if (!repoUrl) return;
                                const p = new URLSearchParams();
                                p.set("repo_url", repoUrl);
                                if (analysisRunId) p.set("analysis_run_id", analysisRunId);
                                navigate(`/code-review-repos/${repo.name}?${p.toString()}`);
                              }}
                              disabled={!repoUrl}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                            >
                              <FileText className="w-3.5 h-3.5" />Details
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })
                  : [
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        whileHover={{ backgroundColor: "rgba(37,99,235,0.03)" }}
                        className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          <span className="text-sm text-slate-400 dark:text-slate-500">No repositories</span>
                        </div>
                        <StatusPill status={report.status} />
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{report.openFindings + report.resolvedFindings} total</p>
                          <p className="text-[11px] text-red-500">{report.openFindings} open</p>
                          <p className="text-[11px] text-emerald-600">{report.resolvedFindings} resolved</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <motion.button
                            whileHover={report.status === "completed" ? { scale: 1.04 } : {}}
                            whileTap={report.status === "completed"  ? { scale: 0.96 } : {}}
                            onClick={() => viewReport(report)}
                            disabled={report.status !== "completed"}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                          >
                            <Eye className="w-3.5 h-3.5" />View Report
                          </motion.button>
                          <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 text-xs font-medium opacity-40 cursor-not-allowed">
                            <FileText className="w-3.5 h-3.5" />Details
                          </button>
                        </div>
                      </motion.div>,
                    ]
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default CodeReviewScanReports;
