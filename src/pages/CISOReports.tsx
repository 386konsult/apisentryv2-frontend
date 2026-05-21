import { useEffect, useState, useRef } from "react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Download, FileText, ChevronLeft, Calendar, Shield, AlertTriangle,
  Activity, Server, Lock, TrendingUp, BarChart3, CheckCircle,
  DollarSign, Gauge, Zap, Sparkles, X, ChevronRight, Globe,
  Clock, Database, Cpu, PlusCircle, TrendingDown, ArrowUpRight,
  ArrowDownRight, Minus,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MonthlyReportMetadata {
  id: string; year: number; month: number;
  risk_index: number; risk_status: "Low" | "Moderate" | "High" | "Critical";
  generated_at: string;
}

interface ThreatItem {
  name: string; value: number; financial_impact: number;
  prev_value?: number; change?: number; change_label?: string;
}

interface CisoReport {
  metadata: MonthlyReportMetadata;
  total_requests: number; blocked_requests: number;
  prev_total_requests?: number; prev_blocked_requests?: number;
  weighted_loss_30d: number; ale: number;
  control_score: number; risk_index: number;
  executive_summary?: string; estate_summary?: string;
  endpoint_scores?: Array<{ name: string; security_score: number; endpoint_id?: string }>;
  threat_distribution: ThreatItem[];
  risk_matrix: { high_med: number; med_high: number };
  top_countries: Array<{ country: string; requests: number }>;
  daily_trend: Array<{ date: string; count: number }>;
  api_estate: {
    total: number; production: number; shadow: number;
    internet_facing: number; internal: number; third_party: number;
    new_this_month: number; retired_this_month: number;
  };
  vulnerability_posture: {
    missing_auth: number; weak_auth: number; excessive_data: number;
    deprecated_versions: number; sensitive_data_leakage: number;
    missing_rate_limits: number; bola_findings: number;
    tls_issues: number; misconfigurations: number;
  };
  incident_summary: {
    has_incidents: boolean;
    incidents: Array<{ what: string; impact: string; duration: string; containment: string; root_cause: string; lessons: string }>;
  };
  compliance: { apis_handling_pii: number; third_party_review: string; owasp_alignment: number; controls: string[] };
  operational: { avg_response_ms: number; error_rate: number; error_rate_change?: number; uptime: number; rps: number; total_requests_change?: number; blocked_requests_change?: number };
  top_risks: Array<{ description: string; likelihood: string; impact: string; mitigation: string }>;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CHART_COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6", "#06b6d4"];
const R = "rounded-[22px]";
const Rsub = "rounded-[14px]";

const GEN_STEPS = [
  { icon: Database,    label: "Initialising report engine",       detail: "Connecting to data sources…" },
  { icon: Activity,    label: "Analysing API traffic & threats",   detail: "Processing request logs & WAF events…" },
  { icon: Cpu,         label: "Computing risk & financial scores", detail: "Running quantitative risk models…" },
  { icon: Sparkles,    label: "Generating AI executive summary",   detail: "Consulting Heimdall AI…" },
  { icon: CheckCircle, label: "Finalising & saving report",        detail: "Persisting to secure storage…" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatMonthYear = (year: number, month: number) =>
  new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });

const riskAccent = (risk: string) => {
  if (risk === "Low") return { bar: "#10b981", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30", left: "from-emerald-500 to-teal-500", dot: "bg-emerald-500" };
  if (risk === "Moderate") return { bar: "#f59e0b", badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30", left: "from-amber-500 to-orange-500", dot: "bg-amber-500" };
  return { bar: "#ef4444", badge: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30", left: "from-red-500 to-rose-600", dot: "bg-red-500" };
};

// ── Small UI pieces ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-blue-900/20">
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const Section = ({ icon, title, subtitle, children }: any) => (
  <div className={`bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 ${R} overflow-hidden`}>
    <SectionHeader icon={icon} title={title} subtitle={subtitle} />
    <div className="p-5">{children}</div>
  </div>
);

const StatRow = ({ label, value, highlight, change }: { label: string; value: any; highlight?: boolean; change?: number }) => (
  <div className={`flex justify-between items-center px-3 py-2.5 ${Rsub} border ${highlight ? "border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5" : "border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40"}`}>
    <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{value}</span>
      {change !== undefined && change !== 0 && (
        <span className={`text-[10px] font-bold ${change > 0 ? "text-red-500" : "text-emerald-500"}`}>
          {change > 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
        </span>
      )}
    </div>
  </div>
);

const VulnRow = ({ label, value }: { label: string; value: number }) => (
  <div className={`flex justify-between items-center px-3 py-2.5 ${Rsub} border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40`}>
    <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    <span className={`font-mono text-xs font-bold ${value > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{value}</span>
  </div>
);

const KpiTile = ({ label, value, sub, icon, accent, change }: any) => (
  <div className={`relative overflow-hidden bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 ${R} p-5`}>
    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[22px] bg-gradient-to-b ${accent}`} />
    <div className="pl-1">
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 dark:bg-[#0F1724]/60 border border-slate-100 dark:border-blue-900/20">{icon}</div>
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        {change !== undefined && (
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${change > 0 ? "text-red-500" : change < 0 ? "text-emerald-500" : "text-slate-400"}`}>
            {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : change < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(change).toLocaleString()} vs last month
          </span>
        )}
      </div>
    </div>
  </div>
);

// ── Generation Modal ──────────────────────────────────────────────────────────
const GenerationModal = ({ open, onClose, onDone, platformId, token }: {
  open: boolean; onClose: () => void; onDone: (r: CisoReport) => void;
  platformId: string; token: string;
}) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [aiNotes, setAiNotes] = useState("");
  const [phase, setPhase] = useState<"form"|"running"|"done"|"error">("form");
  const [step, setStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => { setPhase("form"); setStep(0); setStepProgress(0); setErrorMsg(""); };
  const handleClose = () => { reset(); onClose(); };

  const handleGenerate = async () => {
    let s = 0, p = 0;
    setPhase("running"); setStep(0); setStepProgress(0);
    timerRef.current = setInterval(() => {
      p += 4;
      if (p >= 100) { p = 0; s += 1; }
      if (s >= GEN_STEPS.length) { if (timerRef.current) clearInterval(timerRef.current); return; }
      setStep(s); setStepProgress(p);
    }, 80);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://staging.breachnet.io/api/v1";
      const res = await fetch(`${baseUrl}/ciso-reports/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Token ${token}`, "X-Platform-Id": platformId },
        body: JSON.stringify({ year, month, ai_notes: aiNotes }),
      });
      if (!res.ok) throw new Error(await res.text() || "Generation failed");
      const data: CisoReport = await res.json();
      await new Promise(r => setTimeout(r, 1500));
      if (timerRef.current) clearInterval(timerRef.current);
      setStep(GEN_STEPS.length - 1); setStepProgress(100); setPhase("done");
      setTimeout(() => { reset(); onDone(data); }, 700);
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setErrorMsg(e?.message || "Something went wrong"); setPhase("error");
    }
  };

  const totalProgress = Math.round(((step + stepProgress / 100) / GEN_STEPS.length) * 100);
  const inp = "bg-slate-50 dark:bg-[#0F1724]/60 border border-slate-200 dark:border-blue-900/30 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl h-10 text-sm";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md rounded-[22px] overflow-hidden shadow-xl bg-white dark:bg-[#0d1829] border border-slate-200/80 dark:border-blue-900/30">
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-blue-900/20 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Generate CISO Report</h2>
                  <p className="text-xs text-slate-400 mt-0.5">AI-powered security intelligence</p>
                </div>
              </div>
              {phase === "form" && (
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
            <div className="px-6 py-5">
              <AnimatePresence mode="wait">
                {phase === "form" && (
                  <motion.div key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[{ id: "yr", label: "Year", v: year, min: 2020, max: 2030, set: setYear }, { id: "mo", label: "Month", v: month, min: 1, max: 12, set: setMonth }].map(f => (
                        <div key={f.id}>
                          <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">{f.label}</Label>
                          <Input type="number" min={f.min} max={f.max} value={f.v} onChange={e => f.set(parseInt(e.target.value))} className={inp} />
                        </div>
                      ))}
                    </div>
                    <div className="mb-5">
                      <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">AI Context <span className="normal-case font-normal text-slate-400">(optional)</span></Label>
                      <Textarea rows={3} value={aiNotes} onChange={e => setAiNotes(e.target.value)}
                        placeholder="e.g. major incident this month, PCI compliance review pending…"
                        className="bg-slate-50 dark:bg-[#0F1724]/60 border border-slate-200 dark:border-blue-900/30 rounded-xl resize-none text-sm" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#0F1724]/60 hover:bg-slate-100 transition-colors">Cancel</button>
                      <button onClick={handleGenerate} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition-opacity shadow-sm">
                        <Sparkles className="h-4 w-4" /> Generate
                      </button>
                    </div>
                  </motion.div>
                )}
                {phase === "running" && (
                  <motion.div key="running" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
                        <span className="text-xs font-mono font-bold text-blue-600">{totalProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" animate={{ width: `${totalProgress}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {GEN_STEPS.map((s, i) => {
                        const done = i < step, active = i === step;
                        const Icon = s.icon;
                        return (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] border transition-colors ${active ? "border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/5" : done ? "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5" : "border-slate-100 dark:border-blue-900/20 opacity-40"}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-100 dark:bg-emerald-500/15" : active ? "bg-blue-100 dark:bg-blue-500/15" : "bg-slate-100 dark:bg-slate-800/60"}`}>
                              {done ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : active ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}><Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></motion.div> : <Icon className="h-3.5 w-3.5 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${done ? "text-emerald-600 dark:text-emerald-400" : active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{s.label}</p>
                              {active && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.detail}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-center text-[11px] text-slate-400 mt-4">Heimdall AI is processing your security data…</p>
                  </motion.div>
                )}
                {phase === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50 dark:bg-emerald-500/10">
                      <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">Report Generated</p>
                    <p className="text-xs text-slate-400 mt-1">Opening report…</p>
                  </motion.div>
                )}
                {phase === "error" && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50 dark:bg-red-500/10">
                      <X className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Generation Failed</p>
                    <p className="text-xs text-slate-400 mb-5 px-4 break-words">{errorMsg}</p>
                    <div className="flex gap-3">
                      <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">Close</button>
                      <button onClick={reset} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition-opacity">Try Again</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── PDF Report Card (list view) ───────────────────────────────────────────────
const ReportCard = ({ report, onView, onDownload, downloading }: {
  report: MonthlyReportMetadata;
  onView: () => void;
  onDownload: () => void;
  downloading: boolean;
}) => {
  const acc = riskAccent(report.risk_status);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 ${R} group hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${acc.left}`} />

      {/* PDF icon area */}
      <div className="pl-5 pr-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          {/* Document icon */}
          <div className="relative flex h-14 w-11 flex-shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/50" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-white dark:bg-[#0d1829] border-l border-b border-slate-200/70 dark:border-slate-700/50 rounded-bl-sm" />
            <FileText className="relative h-5 w-5 text-slate-400 dark:text-slate-500" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-black text-slate-400 tracking-widest">PDF</div>
          </div>

          {/* Risk badge */}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${acc.badge}`}>
            {report.risk_status} Risk
          </span>
        </div>

        {/* Month/Year */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          {formatMonthYear(report.year, report.month)}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">CISO Security Report</p>

        {/* Risk index bar */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Risk Index</span>
          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {report.risk_index}<span className="text-slate-400">/100</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
          <motion.div initial={{ width: 0 }} animate={{ width: `${report.risk_index}%` }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full" style={{ backgroundColor: acc.bar }} />
        </div>

        {/* Generated date */}
        <p className="text-[10px] text-slate-400 mb-4">
          Generated {new Date(report.generated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors">
            <FileText className="h-3.5 w-3.5" /> View Report
          </button>
          <button onClick={onDownload} disabled={downloading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#0F1724]/60 hover:bg-slate-100 transition-colors disabled:opacity-50">
            {downloading ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CISOReports = () => {
  const [reports, setReports] = useState<MonthlyReportMetadata[]>([]);
  const [selectedReport, setSelectedReport] = useState<CisoReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const reportCache = useRef<Record<string, CisoReport>>({});
  const { toast } = useToast();

  const platformId = localStorage.getItem("selected_platform_id") || "";
  const token = localStorage.getItem("auth_token") || "";

  const loadReports = async () => {
    if (!platformId) { setLoading(false); return; }
    try {
      const data = await apiService.request(`/ciso-reports/?platform_id=${platformId}`);
      const fetched: MonthlyReportMetadata[] = data.results || data;
      setReports([...fetched].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month));
    } catch { toast({ title: "Error", description: "Failed to load reports", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  const loadDetail = async (id: string) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    // Use cache if available — instant load
    if (reportCache.current[id]) {
      setSelectedReport(reportCache.current[id]);
      return;
    }
    setLoading(true);
    try {
      const res = await (apiService as any).request(`/ciso-reports/${id}/`);
      const data = (res as any)?.report_data ?? res;
      // Guard: if the fetched object is missing required shape, bail out cleanly
      if (!data || !data.metadata) {
        toast({ title: "Report Unavailable", description: "Report data is incomplete or could not be loaded. Try regenerating the report.", variant: "destructive" });
        return;
      }
      reportCache.current[id] = data;
      setSelectedReport(data);
    } catch { toast({ title: "Error", description: "Failed to load report", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleGenerateDone = (report: CisoReport) => {
    setSelectedReport(report);
    loadReports();
  };

  const exportPDF = async (reportId?: string) => {
    if (reportId) setDownloadingId(reportId);
    else setExporting(true);

    const el = document.getElementById("ciso-report-content");
    if (!el) { setExporting(false); setDownloadingId(null); return; }
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const w = 210, h = (canvas.height * w) / canvas.width;
      const pageH = 297;
      let yOffset = 0;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, yOffset, w, h);
      let remaining = h - pageH;
      while (remaining > 0) {
        yOffset = -(h - remaining);
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, yOffset, w, h);
        remaining -= pageH;
      }
      const r = selectedReport?.metadata || reports.find(r => r.id === reportId);
      pdf.save(`CISO-Report-${r?.year || ""}-${String(r?.month || "").padStart(2, "0")}.pdf`);
      toast({ title: "PDF downloaded" });
    } catch { window.print(); }
    finally { setExporting(false); setDownloadingId(null); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && !selectedReport) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F2F6FE] dark:bg-[#0F1724]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Activity className="h-7 w-7 animate-spin text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading Reports</p>
          <p className="text-xs text-slate-400">Fetching security intelligence…</p>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  if (!selectedReport) {
    return (
      <div className="w-full min-h-screen bg-[#F2F6FE] dark:bg-[#0F1724] px-5 pb-12 pt-0.5">
        <div className="w-full space-y-5">
          <GenerationModal open={generateOpen} onClose={() => setGenerateOpen(false)}
            onDone={handleGenerateDone} platformId={platformId} token={token} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-[28px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-7 py-7 text-white overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute -left-8 -bottom-8 h-48 w-48 rounded-full bg-blue-800/30 blur-2xl" />
            </div>
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <Shield className="h-3 w-3" /> Security Intelligence
                </div>
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">CISO Monthly Reports</h1>
                <p className="mt-1.5 text-sm text-blue-100/70">AI-generated executive security reports — one per month</p>
              </div>
              <button onClick={() => setGenerateOpen(true)}
                className="self-start flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-white/90 transition-colors shadow-sm">
                <Sparkles className="h-4 w-4" /> Generate Report
              </button>
            </div>
          </motion.div>

          {/* Report grid */}
          {reports.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-300 dark:border-blue-900/30 ${R}`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 mb-4">
                <FileText className="h-7 w-7 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-base font-bold text-slate-700 dark:text-slate-200">No reports yet</p>
              <p className="text-sm text-slate-400 mt-1">Generate your first monthly CISO report</p>
              <button onClick={() => setGenerateOpen(true)}
                className="mt-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                <PlusCircle className="h-4 w-4" /> Generate now
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {reports.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ReportCard
                    report={r}
                    onView={() => loadDetail(r.id)}
                    onDownload={async () => {
                      await loadDetail(r.id);
                      setTimeout(() => exportPDF(r.id), 800);
                    }}
                    downloading={downloadingId === r.id}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Detail View ───────────────────────────────────────────────────────────
  const report = selectedReport;
  if (!report || !report.metadata) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F2F6FE] dark:bg-[#0F1724]">
        <div className="flex flex-col items-center gap-3 text-center px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Report data unavailable</p>
          <p className="text-xs text-slate-400 max-w-xs">This report's data could not be loaded. Try regenerating it using the "New Report" button.</p>
          <button onClick={() => setSelectedReport(null)} className="mt-2 text-xs text-blue-600 underline">← Back to reports</button>
        </div>
      </div>
    );
  }
  const acc = riskAccent(report.metadata.risk_status);
  const blockedPct = report.total_requests ? ((report.blocked_requests / report.total_requests) * 100).toFixed(1) : "0";
  const postureScore = Math.round((report.control_score + (100 - report.risk_index)) / 2);
  const hasTrafficData = (report.total_requests ?? 0) > 0;

  return (
    <div className="w-full min-h-screen bg-[#F2F6FE] dark:bg-[#0F1724] px-5 pb-12 pt-0.5 print:bg-white">
      <div className="w-full space-y-5">
        <GenerationModal open={generateOpen} onClose={() => setGenerateOpen(false)}
          onDone={handleGenerateDone} platformId={platformId} token={token} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[28px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-7 py-7 text-white overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <Calendar className="h-3 w-3" />{formatMonthYear(report.metadata.year, report.metadata.month)}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border backdrop-blur-sm ${report.metadata.risk_status === "Low" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200" : report.metadata.risk_status === "Moderate" ? "bg-amber-500/20 border-amber-500/40 text-amber-200" : "bg-red-500/20 border-red-500/40 text-red-200"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${acc.dot}`} />
                  {report.metadata.risk_status} Risk
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">CISO Executive Report</h1>
              <p className="mt-1.5 text-sm text-blue-100/70">API Security Posture & Risk Analysis · {formatMonthYear(report.metadata.year, report.metadata.month)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={() => exportPDF()} disabled={exporting}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm disabled:opacity-50">
                {exporting ? <Activity className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? "Exporting…" : "Download PDF"}
              </button>
              <button onClick={() => { setSelectedReport(null); window.scrollTo({ top: 0, behavior: "instant" }); }}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronLeft className="h-4 w-4" /> All Reports
              </button>
              <button onClick={() => setGenerateOpen(true)}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-white/90 transition-colors shadow-sm">
                <Sparkles className="h-4 w-4" /> New Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── REPORT BODY ── */}
        <div id="ciso-report-content" className="space-y-5">

          {/* No-data notice */}
          {!hasTrafficData && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 px-5 py-4 border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/8 ${R}`}>
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No traffic data recorded for this period</p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5">
                  No API requests were logged for {formatMonthYear(report.metadata.year, report.metadata.month)}. Charts will appear empty. If this is unexpected, check that your platform is correctly connected and receiving traffic.
                </p>
              </div>
            </motion.div>
          )}

          {/* 1. Executive Summary */}
          <Section icon={<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="Executive Summary" subtitle="AI-generated narrative — one page overview">
            <div className="grid gap-4 sm:grid-cols-3 mb-5">
              {/* Risk Index gauge */}
              <div className={`flex flex-col items-center justify-center py-5 ${Rsub} border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40`}>
                <div className="relative w-20 h-20 mb-2">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={acc.bar} strokeWidth="3"
                      strokeDasharray={`${report.risk_index} ${100 - report.risk_index}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{report.risk_index}</span>
                    <span className="text-[9px] text-slate-400">/100</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">API Risk Index</span>
                <span className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${acc.badge}`}>{report.metadata.risk_status}</span>
              </div>
              {/* Security posture */}
              <div className={`flex flex-col justify-center px-4 py-4 ${Rsub} border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40`}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Security Posture</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{postureScore}<span className="text-sm font-normal text-slate-400">/100</span></span>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${postureScore}%` }} />
                </div>
                <span className="mt-1 text-[10px] text-slate-400">{postureScore >= 80 ? "Strong" : postureScore >= 50 ? "Moderate" : "Needs Attention"}</span>
              </div>
              {/* Key numbers */}
              <div className={`flex flex-col justify-center px-4 py-4 ${Rsub} border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40 space-y-2`}>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Total requests</span><span className="font-bold text-slate-900 dark:text-white">{report.total_requests.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Threats blocked</span><span className="font-bold text-red-500">{report.blocked_requests.toLocaleString()} ({blockedPct}%)</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Est. financial loss</span><span className="font-bold text-amber-600">${report.weighted_loss_30d.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Annual exposure</span><span className="font-bold text-slate-700 dark:text-slate-300">${report.ale.toLocaleString()}</span></div>
              </div>
            </div>
            {/* AI summary text */}
            <div className={`px-4 py-4 ${Rsub} border border-blue-100 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">AI Summary Statement</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {report.executive_summary || `Risk status: ${report.metadata.risk_status}. Risk index ${report.risk_index}/100. ${report.total_requests.toLocaleString()} total requests with ${report.blocked_requests.toLocaleString()} threats blocked (${blockedPct}%). Estimated 30-day financial exposure: $${report.weighted_loss_30d.toLocaleString()}.`}
              </p>
            </div>
          </Section>

          {/* 2. API Estate Overview */}
          <Section icon={<Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="API Estate Overview" subtitle="Total API inventory and changes this month">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { label: "Total APIs", value: report.api_estate.total, accent: "text-slate-900 dark:text-white" },
                { label: "Production", value: report.api_estate.production, accent: "text-blue-600 dark:text-blue-400" },
                { label: "Shadow / Undocumented", value: report.api_estate.shadow, accent: report.api_estate.shadow > 0 ? "text-red-500" : "text-emerald-500" },
                { label: "Internet-facing", value: report.api_estate.internet_facing, accent: "text-amber-600 dark:text-amber-400" },
                { label: "Internal", value: report.api_estate.internal, accent: "text-slate-600 dark:text-slate-400" },
                { label: "Third-party", value: report.api_estate.third_party, accent: "text-purple-600 dark:text-purple-400" },
                { label: "New this month", value: report.api_estate.new_this_month, accent: "text-emerald-600 dark:text-emerald-400" },
                { label: "Retired this month", value: report.api_estate.retired_this_month, accent: "text-slate-500" },
              ].map(item => (
                <div key={item.label} className={`p-3 ${Rsub} border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40`}>
                  <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
                  <p className={`text-xl font-black tabular-nums ${item.accent}`}>{item.value}</p>
                </div>
              ))}
            </div>
            {report.estate_summary && (
              <div className={`px-4 py-3 ${Rsub} border border-blue-100 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">AI Summary</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.estate_summary}</p>
              </div>
            )}
          </Section>

          {/* 3. Threat Activity & Attack Trends */}
          <Section icon={<AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="Threat Activity & Attack Trends" subtitle="With month-over-month comparison">
            {!hasTrafficData ? (
              <div className={`flex flex-col items-center justify-center py-10 ${Rsub} border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40`}>
                <Shield className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No threats recorded this period</p>
                <p className="text-xs text-slate-400 mt-1">Charts will populate once traffic data is available</p>
              </div>
            ) : (
            <div className="grid gap-5 lg:grid-cols-2 mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Distribution</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={report.threat_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {report.threat_distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Financial Impact</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.threat_distribution} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => `$${(v as number).toLocaleString()}`} />
                    <Bar dataKey="financial_impact" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}
            {/* Month-over-month table — only when there's real threat data */}
            {hasTrafficData && (
              <div className={`overflow-hidden border border-slate-100 dark:border-blue-900/20 ${Rsub} mt-4`}>
                <div className="grid grid-cols-4 px-4 py-2.5 bg-slate-50 dark:bg-[#0F1724]/60 border-b border-slate-100 dark:border-blue-900/20">
                  {["Threat Type", "This Month", "Last Month", "Change"].map(h => (
                    <span key={h} className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">{h}</span>
                  ))}
                </div>
                {report.threat_distribution.map((t, i) => (
                  <div key={i} className="grid grid-cols-4 px-4 py-2.5 border-b border-slate-50 dark:border-blue-900/10 last:border-0 hover:bg-slate-50/80 dark:hover:bg-blue-900/5 transition-colors">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{t.name}</span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{t.value}%</span>
                    <span className="text-xs font-mono text-slate-400">{t.prev_value ?? "—"}%</span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${(t.change || 0) > 0 ? "text-red-500" : (t.change || 0) < 0 ? "text-emerald-500" : "text-slate-400"}`}>
                      {(t.change || 0) > 0 ? <ArrowUpRight className="h-3 w-3" /> : (t.change || 0) < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {t.change_label || "0%"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Daily trend — only when there are blocked requests */}
            {hasTrafficData && report.daily_trend.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Daily Blocked Threats</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={report.daily_trend}>
                    <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#tg)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* 4. Vulnerability & Exposure Posture */}
          <Section icon={<Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="Vulnerability & Exposure Posture" subtitle="Where are the weaknesses?">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <VulnRow label="Missing authentication" value={report.vulnerability_posture.missing_auth} />
              <VulnRow label="Weak auth flows" value={report.vulnerability_posture.weak_auth} />
              <VulnRow label="Excessive data exposure" value={report.vulnerability_posture.excessive_data} />
              <VulnRow label="Deprecated versions" value={report.vulnerability_posture.deprecated_versions} />
              <VulnRow label="Sensitive data leakage" value={report.vulnerability_posture.sensitive_data_leakage} />
              <VulnRow label="Missing rate limits" value={report.vulnerability_posture.missing_rate_limits} />
              <VulnRow label="BOLA findings" value={report.vulnerability_posture.bola_findings} />
              <VulnRow label="TLS / cert issues" value={report.vulnerability_posture.tls_issues} />
              <VulnRow label="Misconfigurations" value={report.vulnerability_posture.misconfigurations} />
            </div>
          </Section>

          {/* 5. Incident Summary */}
          <Section icon={<Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="Incident Summary" subtitle="Only material security events">
            {!report.incident_summary.has_incidents ? (
              <div className={`flex items-center gap-3 px-4 py-4 border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 ${Rsub}`}>
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">No material API security incidents this month.</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">All endpoints operated within normal security thresholds.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {report.incident_summary.incidents.map((inc, i) => (
                  <div key={i} className={`border-l-4 border-red-400 pl-4 py-4 border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 ${Rsub}`}>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{inc.what}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[["Impact", inc.impact], ["Duration", inc.duration], ["Containment", inc.containment], ["Root Cause", inc.root_cause], ["Lessons Learned", inc.lessons]].map(([k, v]) => (
                        <div key={k as string}>
                          <span className="font-semibold text-slate-500 block">{k}</span>
                          <span className="text-slate-600 dark:text-slate-400">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* 6. Compliance / Governance */}
          <Section icon={<CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="Compliance / Governance" subtitle="Especially useful for regulated organisations">
            <div className="grid gap-2 sm:grid-cols-3 mb-4">
              <StatRow label="APIs handling PII" value={report.compliance.apis_handling_pii} highlight={report.compliance.apis_handling_pii > 0} />
              <StatRow label="Third-party review" value={report.compliance.third_party_review} />
              <StatRow label="OWASP Top 10 alignment" value={`${report.compliance.owasp_alignment}%`} />
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700" style={{ width: `${report.compliance.owasp_alignment}%` }} />
            </div>
            {report.compliance.controls.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Active Controls</p>
                <div className="flex flex-wrap gap-2">
                  {report.compliance.controls.map((c, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 ${Rsub} border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 text-xs font-medium text-emerald-700 dark:text-emerald-400`}>
                      <CheckCircle className="h-3 w-3" /> {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* 7. Operational Performance */}
          <Section icon={<BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="Operational Performance" subtitle="Average response time, error rate and uptime">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiTile label="Avg Response" value={`${report.operational.avg_response_ms}ms`} accent="from-blue-500 to-cyan-500" icon={<Clock className="h-3.5 w-3.5 text-blue-500" />} />
              <KpiTile label="Error Rate" value={`${report.operational.error_rate}%`} accent="from-amber-500 to-orange-500" icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} change={report.operational.error_rate_change} />
              <KpiTile label="Uptime" value={`${report.operational.uptime}%`} accent="from-emerald-500 to-teal-500" icon={<Activity className="h-3.5 w-3.5 text-emerald-500" />} />
              <KpiTile label="Req / sec" value={report.operational.rps} accent="from-purple-500 to-violet-500" icon={<Zap className="h-3.5 w-3.5 text-purple-500" />} />
            </div>
            {/* Geo breakdown */}
            {hasTrafficData && report.top_countries.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Request Origins</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={report.top_countries} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="country" width={90} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* 8. Top Risks */}
          <Section icon={<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />} title="Top Risks" subtitle="Business risks from active alerts">
            {report.top_risks.length === 0 ? (
              <div className={`flex items-center gap-3 px-4 py-4 border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 ${Rsub}`}>
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">No outstanding top risks identified this month.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.top_risks.map((r, i) => (
                  <div key={i} className={`px-4 py-4 border border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 ${Rsub}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{r.description}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">L:{r.likelihood}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">I:{r.impact}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold">Mitigation:</span> {r.mitigation}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

        </div>

        <div className="text-center text-[11px] text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-blue-900/20 pt-5">
          Automatically generated by Heimdall AI · {formatMonthYear(report.metadata.year, report.metadata.month)} · Based on WAF traffic logs, alert triggers & incident data
        </div>
      </div>
    </div>
  );
};

export default CISOReports;