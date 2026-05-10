import { useEffect, useState, useRef } from "react";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Download, FileText, ChevronLeft, Calendar, Shield, AlertTriangle,
  Activity, Server, Lock, TrendingUp, BarChart3,
  CheckCircle, DollarSign, Gauge, Zap, Sparkles, X, ChevronRight,
  Globe, Clock, Database, Cpu, PlusCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================
interface MonthlyReportMetadata {
  id: string; year: number; month: number;
  risk_index: number; risk_status: "Low" | "Moderate" | "High" | "Critical";
  generated_at: string; pdf_url?: string;
}
interface EndpointScore { name: string; security_score: number; health_score?: number; endpoint_id?: string; }
interface CisoReport {
  metadata: MonthlyReportMetadata;
  total_requests: number; blocked_requests: number; weighted_loss_30d: number;
  ale: number; control_score: number; risk_index: number; executive_summary?: string;
  endpoint_scores?: EndpointScore[];
  threat_distribution: Array<{ name: string; value: number; financial_impact: number }>;
  risk_matrix: { high_med: number; med_high: number };
  top_countries: Array<{ country: string; requests: number }>;
  daily_trend: Array<{ date: string; count: number }>;
  api_estate: { total: number; production: number; shadow: number; internet_facing: number; internal: number; third_party: number; new_this_month: number; retired_this_month: number; };
  vulnerability_posture: { missing_auth: number; weak_auth: number; excessive_data: number; deprecated_versions: number; sensitive_data_leakage: number; missing_rate_limits: number; bola_findings: number; tls_issues: number; misconfigurations: number; };
  incident_summary: { has_incidents: boolean; incidents: Array<{ what: string; impact: string; duration: string; containment: string; root_cause: string; lessons: string }>; };
  compliance: { apis_handling_pii: number; third_party_review: string; owasp_alignment: number; controls: string[]; };
  operational: { avg_response_ms: number; error_rate: number; uptime: number; rps: number };
  top_risks: Array<{ description: string; likelihood: string; impact: string; mitigation: string }>;
}

const CHART_COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6"];

// ============================================================================
// GENERATION STEPS
// ============================================================================
const GEN_STEPS = [
  { icon: Database,    label: "Initialising report engine",       detail: "Connecting to data sources…" },
  { icon: Activity,    label: "Analysing API traffic & threats",   detail: "Processing request logs & WAF events…" },
  { icon: Cpu,         label: "Computing risk & financial scores", detail: "Running quantitative risk models…" },
  { icon: Sparkles,    label: "Generating AI executive summary",   detail: "Consulting Heimdall AI…" },
  { icon: CheckCircle, label: "Finalising & saving report",        detail: "Persisting to secure storage…" },
];

// ============================================================================
// GENERATION MODAL  — matches dashboard overlay style
// ============================================================================
const GenerationModal = ({
  open, onClose, onDone, platformId, token,
}: {
  open: boolean; onClose: () => void; onDone: (report: CisoReport) => void;
  platformId: string; token: string;
}) => {
  const [year, setYear]         = useState(new Date().getFullYear());
  const [month, setMonth]       = useState(new Date().getMonth() + 1);
  const [aiNotes, setAiNotes]   = useState("");
  const [phase, setPhase]       = useState<"form"|"running"|"done"|"error">("form");
  const [step, setStep]         = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset      = () => { setPhase("form"); setStep(0); setStepProgress(0); setErrorMsg(""); };
  const handleClose = () => { reset(); onClose(); };

  const runAnimation = () => {
    let s = 0, p = 0;
    setPhase("running"); setStep(0); setStepProgress(0);
    timerRef.current = setInterval(() => {
      p += 4;
      if (p >= 100) { p = 0; s += 1; }
      if (s >= GEN_STEPS.length) { if (timerRef.current) clearInterval(timerRef.current); return; }
      setStep(s); setStepProgress(p);
    }, 80);
  };

  const handleGenerate = async () => {
    runAnimation();
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://staging.breachnet.io/api/v1";
      const res = await fetch(`${baseUrl}/ciso-reports/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Token ${token}`, "X-Platform-Id": platformId },
        body: JSON.stringify({ year, month, ai_notes: aiNotes }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || "Generation failed"); }
      const data: CisoReport = await res.json();
      await new Promise(r => setTimeout(r, 2200));
      if (timerRef.current) clearInterval(timerRef.current);
      setStep(GEN_STEPS.length - 1); setStepProgress(100);
      setPhase("done");
      setTimeout(() => { reset(); onDone(data); }, 800);
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setErrorMsg(e?.message || "Something went wrong"); setPhase("error");
    }
  };

  const totalProgress = Math.round(((step + stepProgress / 100) / GEN_STEPS.length) * 100);

  const inputClass = "bg-slate-50 dark:bg-[#0F1724]/60 border border-slate-200 dark:border-blue-900/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 rounded-xl h-10 text-sm";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md rounded-[22px] overflow-hidden shadow-xl bg-white dark:bg-[#0d1829] border border-slate-200/80 dark:border-blue-900/30"
          >
            {/* Header strip */}
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Generate CISO Report</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">AI-powered security intelligence</p>
                  </div>
                </div>
                {phase === "form" && (
                  <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 bg-white dark:bg-[#0d1829]">
              <AnimatePresence mode="wait">

                {/* FORM */}
                {phase === "form" && (
                  <motion.div key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { id: "year", label: "Year", value: year, min: 2020, max: 2030, setter: setYear },
                        { id: "month", label: "Month", value: month, min: 1, max: 12, setter: setMonth },
                      ].map(({ id, label, value, min, max, setter }) => (
                        <div key={id}>
                          <Label htmlFor={id} className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">{label}</Label>
                          <Input id={id} type="number" min={min} max={max} value={value}
                            onChange={e => setter(parseInt(e.target.value))}
                            className={inputClass} />
                        </div>
                      ))}
                    </div>
                    <div className="mb-5">
                      <Label htmlFor="notes" className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">
                        AI Context <span className="normal-case font-normal text-slate-400">(optional)</span>
                      </Label>
                      <Textarea id="notes" rows={3} value={aiNotes}
                        onChange={e => setAiNotes(e.target.value)}
                        placeholder="e.g. major incident this month, PCI compliance review pending…"
                        className="bg-slate-50 dark:bg-[#0F1724]/60 border border-slate-200 dark:border-blue-900/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 rounded-xl resize-none text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#0F1724]/60 hover:bg-slate-100 dark:hover:bg-blue-900/10 transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleGenerate}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition-opacity shadow-sm">
                        <Sparkles className="h-4 w-4" /> Generate
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* RUNNING */}
                {phase === "running" && (
                  <motion.div key="running" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</span>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{totalProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                          animate={{ width: `${totalProgress}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {GEN_STEPS.map((s, i) => {
                        const done = i < step, active = i === step, upcoming = i > step;
                        const Icon = s.icon;
                        return (
                          <div key={i}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] border transition-colors
                              ${active ? "border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/5"
                              : done  ? "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5"
                              : "border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40 opacity-50"}`}>
                            <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                              ${done  ? "bg-emerald-100 dark:bg-emerald-500/15"
                              : active ? "bg-blue-100 dark:bg-blue-500/15"
                              : "bg-slate-100 dark:bg-slate-800/60"}`}>
                              {done
                                ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                : active
                                  ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                                      <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    </motion.div>
                                  : <Icon className="h-3.5 w-3.5 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate
                                ${done ? "text-emerald-600 dark:text-emerald-400"
                                : active ? "text-slate-900 dark:text-white"
                                : "text-slate-400 dark:text-slate-600"}`}>{s.label}</p>
                              {active && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{s.detail}</p>}
                            </div>
                            {active && (
                              <div className="flex-shrink-0 w-14 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <motion.div className="h-full rounded-full bg-blue-500"
                                  animate={{ width: `${stepProgress}%` }} transition={{ duration: 0.1 }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4">Heimdall AI is processing your security data…</p>
                  </motion.div>
                )}

                {/* DONE */}
                {phase === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-100 dark:ring-emerald-500/20">
                      <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">Report Generated</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Opening dashboard…</p>
                  </motion.div>
                )}

                {/* ERROR */}
                {phase === "error" && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50 dark:bg-red-500/10 ring-1 ring-red-100 dark:ring-red-500/20">
                      <X className="h-6 w-6 text-red-500 dark:text-red-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Generation Failed</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 px-4 break-words">{errorMsg}</p>
                    <div className="flex gap-3">
                      <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#0F1724]/60 hover:bg-slate-100 transition-colors">Close</button>
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

// ============================================================================
// SHARED STYLE TOKENS  (mirrors PlatformDetails)
// ============================================================================
const R    = "rounded-[22px]";
const Rsub = "rounded-[14px]";
const cardClass   = `bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 ${R}`;
const headerClass = `border-b border-slate-100 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]`;

// ============================================================================
// SMALL HELPERS
// ============================================================================
const KpiCard = ({ title, value, subtitle, icon, accent }: any) => (
  <Card className={`relative overflow-hidden ${cardClass}`}>
    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[22px] bg-gradient-to-b ${accent}`} />
    <CardContent className="p-5 pl-6">
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 dark:bg-[#0F1724]/60 border border-slate-100 dark:border-blue-900/20">{icon}</div>
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

const ChartCard = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <Card className={`${cardClass} overflow-hidden`}>
    <CardHeader className={`flex flex-row items-center gap-2 p-5 pb-4 ${headerClass}`}>
      {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-5 pt-4">{children}</CardContent>
  </Card>
);

const StatRow = ({ label, value, highlight, trend }: any) => (
  <div className={`flex justify-between items-center px-3 py-2 ${Rsub} border ${
    highlight ? "border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5"
              : "border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40"}`}>
    <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
      {value}
      {trend === "up"   && <span className="text-emerald-500 text-[10px]">▲</span>}
      {trend === "down" && <span className="text-red-500 text-[10px]">▼</span>}
    </span>
  </div>
);

const VulnRow = ({ label, value }: { label: string; value: number }) => (
  <div className={`flex justify-between items-center px-3 py-2 ${Rsub} border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/40`}>
    <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    <span className={`font-mono text-xs font-bold ${value > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{value}</span>
  </div>
);

// ============================================================================
// REPORT CARD  (list view tile)
// ============================================================================
const ReportCard = ({ report, onClick, formatMonthYear }: {
  report: MonthlyReportMetadata; onClick: () => void;
  formatMonthYear: (y: number, m: number) => string;
}) => {
  const risk = report.risk_status;
  const accent =
    risk === "Low"      ? { bar: "#10b981", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30", left: "from-emerald-500 to-teal-500" }
  : risk === "Moderate" ? { bar: "#f59e0b", badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30", left: "from-amber-500 to-orange-500" }
  :                       { bar: "#ef4444", badge: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30", left: "from-red-500 to-rose-600" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer transition-shadow duration-200 ${cardClass}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[22px] bg-gradient-to-b ${accent.left}`} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 dark:bg-[#0F1724]/60 border border-slate-100 dark:border-blue-900/20">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${accent.badge}`}>{risk} Risk</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{formatMonthYear(report.year, report.month)}</h3>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Risk Index</span>
          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{report.risk_index}<span className="text-slate-400">/100</span></span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${report.risk_index}%` }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full" style={{ backgroundColor: accent.bar }} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {new Date(report.generated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </CardContent>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const CISOReports = () => {
  const [reports, setReports]           = useState<MonthlyReportMetadata[]>([]);
  const [selectedReport, setSelectedReport] = useState<CisoReport | null>(null);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const { toast } = useToast();

  const platformId = localStorage.getItem("selected_platform_id") || "";
  const token      = localStorage.getItem("auth_token") || "";

  const formatMonthYear = (year: number, month: number) =>
    new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });

  const loadReports = async () => {
    if (!platformId) { setLoading(false); return; }
    try {
      const data = await apiService.request(`/ciso-reports/?platform_id=${platformId}`, { method: "GET" });
      const fetched = data.results || data;
      setReports([...fetched].sort((a: MonthlyReportMetadata, b: MonthlyReportMetadata) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month));
    } catch { toast({ title: "Error", description: "Failed to load reports", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  const loadReportDetail = async (reportId: string) => {
    setLoading(true);
    try {
      const res = await apiService.request(`/ciso-reports/${reportId}/`, { method: "GET" });
      setSelectedReport(res.report_data || res);
    } catch { toast({ title: "Error", description: "Failed to load report", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleGenerateDone = (report: CisoReport) => {
    setSelectedReport(report);
    loadReports();
  };

  const exportToPDF = async () => {
    const el = document.getElementById("ciso-report-content");
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const w = 210, h = (canvas.height * w) / canvas.width;
      let left = h, pos = 0;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, w, h);
      left -= 297;
      while (left > 0) { pos = left - h; pdf.addPage(); pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, w, h); left -= 297; }
      pdf.save(`ciso-${selectedReport?.metadata.year}-${selectedReport?.metadata.month}.pdf`);
      toast({ title: "PDF ready" });
    } catch { window.print(); }
    finally { setExporting(false); }
  };

  // ── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading && !selectedReport) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F2F6FE] dark:bg-[#0F1724]">
        <div className={`flex h-64 w-full max-w-sm flex-col items-center justify-center gap-4 ${cardClass}`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Activity className="h-7 w-7 animate-spin text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading Reports</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Fetching security intelligence…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (!selectedReport) {
    return (
      <div className="w-full min-h-screen bg-[#F2F6FE] dark:bg-[#0F1724] px-5 pb-12 pt-0.5">
        <div className="w-full space-y-5">
          <GenerationModal open={generateOpen} onClose={() => setGenerateOpen(false)}
            onDone={handleGenerateDone} platformId={platformId} token={token} />

          {/* HEADER — matches PlatformDetails gradient header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[28px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-7 py-7 text-white"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
                  <Shield className="h-3 w-3" />Security Intelligence
                </div>
                <h1 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">CISO Monthly Reports</h1>
                <p className="mt-1.5 text-sm text-blue-100/70">AI-generated executive security dashboards</p>
              </div>
              <button
                onClick={() => setGenerateOpen(true)}
                className="self-start flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-white/90 transition-colors shadow-sm"
              >
                <Sparkles className="h-4 w-4" /> Generate Report
              </button>
            </div>
          </motion.div>

          {/* GRID */}
          {reports.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`flex flex-col items-center justify-center py-20 border border-dashed border-slate-300 dark:border-blue-900/30 ${R}`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 mb-4">
                <FileText className="h-7 w-7 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-base font-bold text-slate-700 dark:text-slate-200">No reports yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Generate your first CISO report to get started</p>
              <button onClick={() => setGenerateOpen(true)}
                className="mt-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                <PlusCircle className="h-4 w-4" /> Generate now
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ReportCard report={r} onClick={() => loadReportDetail(r.id)} formatMonthYear={formatMonthYear} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DETAIL DASHBOARD ───────────────────────────────────────────────────────
  const report = selectedReport;
  const blockedPct = report.total_requests ? ((report.blocked_requests / report.total_requests) * 100).toFixed(1) : "0";
  const postureScore = Math.round((report.control_score + (100 - report.risk_index)) / 2);
  const riskGaugeData = [{ name: "Risk", value: report.risk_index, fill: report.risk_index < 30 ? "#10b981" : report.risk_index < 70 ? "#f59e0b" : "#ef4444" }];
  const remediationProjects = (report.endpoint_scores || []).slice(0, 5).map(ep => ({
    ...ep,
    estCost: ep.security_score < 30 ? 10000 : ep.security_score < 70 ? 5000 : 2000,
    rosi: ((100 - ep.security_score) / 100 * 100).toFixed(0),
  }));

  return (
    <div className="w-full min-h-screen bg-[#F2F6FE] dark:bg-[#0F1724] px-5 pb-12 pt-0.5 print:bg-white">
      <div className="w-full space-y-5">
        <GenerationModal open={generateOpen} onClose={() => setGenerateOpen(false)}
          onDone={handleGenerateDone} platformId={platformId} token={token} />

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[28px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-7 py-7 text-white"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <Calendar className="h-3 w-3" />{formatMonthYear(report.metadata.year, report.metadata.month)}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border backdrop-blur-sm
                  ${report.metadata.risk_status === "Low"      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                  : report.metadata.risk_status === "Moderate" ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                  : "bg-red-500/20 border-red-500/40 text-red-200"}`}>
                  {report.metadata.risk_status} Risk
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>Live
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">CISO Executive Dashboard</h1>
              <p className="mt-1.5 text-sm text-blue-100/70">API Security Posture & Financial Risk Analysis</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={exportToPDF} disabled={exporting}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                <Download className="h-4 w-4" />{exporting ? "Exporting…" : "PDF"}
              </button>
              <button onClick={() => setSelectedReport(null)}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronLeft className="h-4 w-4" />All Reports
              </button>
              <button onClick={() => setGenerateOpen(true)}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-white/90 transition-colors shadow-sm">
                <Sparkles className="h-4 w-4" />New Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* REPORT BODY */}
        <div id="ciso-report-content" className="space-y-5">
          {/* Threat charts */}
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Threat Type Distribution">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={report.threat_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {report.threat_distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0d1829", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "12px", fontSize: "12px", color: "#e2e8f0" }} formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Threats by Financial Impact">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={report.threat_distribution} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis type="number" tickFormatter={v => `$${v.toLocaleString()}`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0d1829", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "12px", fontSize: "12px", color: "#e2e8f0" }} formatter={v => `$${(v as number).toLocaleString()}`} />
                  <Bar dataKey="financial_impact" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Posture row */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className={`${cardClass} overflow-hidden`}>
              <CardHeader className={`pb-0 p-5 ${headerClass}`}>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-blue-500" />Risk Index
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-5 pb-5">
                <ResponsiveContainer width="100%" height={140}>
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={riskGaugeData} startAngle={180} endAngle={0}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} fill={riskGaugeData[0].fill} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-slate-900 dark:fill-white">{report.risk_index}</text>
                    <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-slate-500">/100</text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={`${cardClass}`}>
              <CardHeader className={`pb-0 p-5 ${headerClass}`}>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />Security Posture
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{postureScore}</div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">/100 composite score</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border
                    ${postureScore >= 80 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                    : postureScore >= 50 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                    : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border-red-200 dark:border-red-500/30"}`}>
                    {postureScore >= 80 ? "Strong" : postureScore >= 50 ? "Moderate" : "Weak"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${postureScore}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${cardClass}`}>
              <CardHeader className={`pb-0 p-5 ${headerClass}`}>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-500" />Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{report.compliance.owasp_alignment}%</div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 mb-4">OWASP Top 10 Alignment</p>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${report.compliance.owasp_alignment}%` }} />
                </div>
                <StatRow label="Third-party review" value={report.compliance.third_party_review} />
              </CardContent>
            </Card>
          </div>

          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Requests"     value={report.total_requests.toLocaleString()}
              icon={<Activity className="h-4 w-4 text-blue-500" />}      accent="from-blue-600 to-cyan-500" />
            <KpiCard title="Threats Blocked"    value={report.blocked_requests.toLocaleString()}
              subtitle={`${blockedPct}% of traffic`}
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}  accent="from-red-500 to-rose-600" />
            <KpiCard title="Weighted Loss 30d"  value={`$${report.weighted_loss_30d.toLocaleString()}`}
              subtitle={`ALE: $${report.ale.toLocaleString()}`}
              icon={<DollarSign className="h-4 w-4 text-amber-500" />}   accent="from-amber-500 to-orange-500" />
            <KpiCard title="Control / Risk"     value={`${report.control_score}% / ${report.risk_index}%`}
              subtitle="Effectiveness vs Residual"
              icon={<Shield className="h-4 w-4 text-emerald-500" />}     accent="from-emerald-500 to-teal-500" />
          </div>

          {/* Executive Summary */}
          <Card className={`${cardClass} overflow-hidden`}>
            <CardHeader className={`p-5 pb-4 ${headerClass}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
                  <FileText className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Executive Summary</CardTitle>
                  <CardDescription className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">AI-generated narrative</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {report.executive_summary || `Risk status: ${report.metadata.risk_status}. Risk index ${report.risk_index}/100. ${report.total_requests.toLocaleString()} total requests, ${report.blocked_requests.toLocaleString()} threats blocked. Estimated 30-day financial loss: $${report.weighted_loss_30d.toLocaleString()}.`}
              </p>
            </CardContent>
          </Card>


          {/* Risk matrix + countries */}
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Risk Matrix" icon={<AlertTriangle className="h-4 w-4" />}>
              <div className={`overflow-hidden border border-slate-100 dark:border-blue-900/20 ${Rsub}`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0F1724]/60">
                      <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-400">Likelihood \ Impact</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Low</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Medium</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">High</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-blue-900/20">
                    <tr>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">High</td>
                      <td className="p-3 text-center text-slate-400">—</td>
                      <td className="p-3 text-center bg-amber-50 dark:bg-amber-950/20 font-mono font-bold text-amber-600 dark:text-amber-400">{report.risk_matrix.high_med}</td>
                      <td className="p-3 text-center text-slate-400">—</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">Medium</td>
                      <td className="p-3 text-center text-slate-400">—</td>
                      <td className="p-3 text-center text-slate-400">—</td>
                      <td className="p-3 text-center bg-orange-50 dark:bg-orange-950/20 font-mono font-bold text-orange-600 dark:text-orange-400">{report.risk_matrix.med_high}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">Low</td>
                      <td className="p-3 text-center text-slate-400">—</td>
                      <td className="p-3 text-center text-slate-400">—</td>
                      <td className="p-3 text-center text-slate-400">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ChartCard>

            <ChartCard title="Top Request Origins" icon={<Globe className="h-4 w-4" />}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={report.top_countries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0d1829", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "12px", fontSize: "12px", color: "#e2e8f0" }} />
                  <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Daily trend */}
          {report.daily_trend.length > 0 && (
            <ChartCard title="Blocked Threats Trend (Last 30 Days)" icon={<Clock className="h-4 w-4" />}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={report.daily_trend}>
                  <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={{ background: "#0d1829", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "12px", fontSize: "12px", color: "#e2e8f0" }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#trendGrad)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Remediation projects */}
          {remediationProjects.length > 0 && (
            <ChartCard title="Remediation Projects" icon={<TrendingUp className="h-4 w-4" />}>
              <div className={`overflow-hidden border border-slate-100 dark:border-blue-900/20 ${Rsub}`}>
                <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-[#0F1724]/60 px-4 py-3 border-b border-slate-100 dark:border-blue-900/20">
                  {["Endpoint", "Security Score", "Est. Cost", "RoSI"].map(h => (
                    <span key={h} className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{h}</span>
                  ))}
                </div>
                <div className="divide-y divide-slate-50 dark:divide-blue-900/10">
                  {remediationProjects.map((p, i) => (
                    <div key={i} className="grid grid-cols-4 items-center gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-blue-900/5 transition-colors">
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400 truncate">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{p.security_score}</span>
                        <div className="h-1.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${p.security_score}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">${p.estCost.toLocaleString()}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{p.rosi}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          )}

          {/* Discovered endpoints */}
          {report.endpoint_scores && report.endpoint_scores.length > 0 && (
            <ChartCard title="Discovered Endpoints" icon={<Server className="h-4 w-4" />}>
              <div className={`overflow-hidden border border-slate-100 dark:border-blue-900/20 ${Rsub}`}>
                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-[#0F1724]/60 px-4 py-3 border-b border-slate-100 dark:border-blue-900/20">
                  {["Endpoint", "Security Score", "Action"].map(h => (
                    <span key={h} className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{h}</span>
                  ))}
                </div>
                <div className="divide-y divide-slate-50 dark:divide-blue-900/10">
                  {report.endpoint_scores.slice(0, 10).map((ep, i) => (
                    <div key={i} className="grid grid-cols-3 items-center gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-blue-900/5 transition-colors">
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400 truncate">{ep.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{ep.security_score}</span>
                        <div className="h-1.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${ep.security_score}%` }} />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs w-fit rounded-lg border-slate-200 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/10">Protect</Button>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          )}

          {/* API Estate + Vuln Posture */}
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="API Estate Overview" icon={<Server className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-2">
                <StatRow label="Total APIs"        value={report.api_estate.total} />
                <StatRow label="Production"        value={report.api_estate.production} />
                <StatRow label="Shadow"            value={report.api_estate.shadow} highlight />
                <StatRow label="Internet-facing"   value={report.api_estate.internet_facing} />
                <StatRow label="Internal"          value={report.api_estate.internal} />
                <StatRow label="Third-party"       value={report.api_estate.third_party} />
                <StatRow label="New this month"    value={report.api_estate.new_this_month}  trend="up" />
                <StatRow label="Retired"           value={report.api_estate.retired_this_month} trend="down" />
              </div>
            </ChartCard>
            <ChartCard title="Vulnerability Posture" icon={<Lock className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-2">
                <VulnRow label="Missing Auth"    value={report.vulnerability_posture.missing_auth} />
                <VulnRow label="Weak Auth"       value={report.vulnerability_posture.weak_auth} />
                <VulnRow label="Excessive Data"  value={report.vulnerability_posture.excessive_data} />
                <VulnRow label="Deprecated"      value={report.vulnerability_posture.deprecated_versions} />
                <VulnRow label="Data Leakage"    value={report.vulnerability_posture.sensitive_data_leakage} />
                <VulnRow label="No Rate Limits"  value={report.vulnerability_posture.missing_rate_limits} />
                <VulnRow label="BOLA"            value={report.vulnerability_posture.bola_findings} />
                <VulnRow label="TLS Issues"      value={report.vulnerability_posture.tls_issues} />
                <VulnRow label="Misconfigs"      value={report.vulnerability_posture.misconfigurations} />
              </div>
            </ChartCard>
          </div>

          {/* Incidents */}
          <ChartCard title="Incident Summary" icon={<AlertTriangle className="h-4 w-4" />}>
            {!report.incident_summary.has_incidents
              ? (
                <div className={`flex items-center gap-2 px-4 py-3 border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 ${Rsub}`}>
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">No material security incidents this month.</span>
                </div>
              )
              : report.incident_summary.incidents.map((inc, i) => (
                <div key={i} className={`border-l-4 border-red-400 pl-4 py-3 mb-2 border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 text-sm ${Rsub}`}>
                  <p className="font-semibold text-slate-900 dark:text-white">{inc.what}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1"><strong>Impact:</strong> {inc.impact} · <strong>Duration:</strong> {inc.duration}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"><strong>Root cause:</strong> {inc.root_cause}</p>
                </div>
              ))}
          </ChartCard>

          {/* Compliance + Ops */}
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Compliance / Governance" icon={<CheckCircle className="h-4 w-4" />}>
              <div className="space-y-2 mb-3">
                <StatRow label="APIs handling PII"    value={report.compliance.apis_handling_pii} />
                <StatRow label="Third-party review"   value={report.compliance.third_party_review} />
                <StatRow label="OWASP alignment"      value={`${report.compliance.owasp_alignment}%`} />
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Controls</div>
              <div className="space-y-1">
                {report.compliance.controls.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 ${Rsub}`}>
                    <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{c}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Operational Performance" icon={<BarChart3 className="h-4 w-4" />}>
              <div className="space-y-2">
                <StatRow label="Avg Response" value={`${report.operational.avg_response_ms} ms`} />
                <StatRow label="Error Rate"   value={`${report.operational.error_rate}%`} />
                <StatRow label="Uptime"       value={`${report.operational.uptime}%`} />
                <StatRow label="Req/sec"      value={report.operational.rps} />
              </div>
            </ChartCard>
          </div>

          {/* Top risks */}
          <ChartCard title="Top Risks" icon={<TrendingUp className="h-4 w-4" />}>
            {report.top_risks.length === 0
              ? (
                <div className={`flex items-center gap-2 px-4 py-3 border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 ${Rsub}`}>
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">No outstanding top risks identified.</span>
                </div>
              )
              : (
                <div className="space-y-3">
                  {report.top_risks.map((r, i) => (
                    <div key={i} className={`px-4 py-3 border border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 ${Rsub}`}>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.description}</p>
                      <div className="flex gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>Likelihood: <strong>{r.likelihood}</strong></span>
                        <span>Impact: <strong>{r.impact}</strong></span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mitigation: {r.mitigation}</p>
                    </div>
                  ))}
                </div>
              )}
          </ChartCard>

          {/* AI Incident Card */}
          <Card className={`${cardClass} overflow-hidden`}>
            <CardHeader className={`p-5 pb-4 ${headerClass}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 ring-1 ring-purple-100 dark:ring-purple-500/20">
                  <Zap className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">AI-Powered Incident Summary</CardTitle>
                  <CardDescription className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Auto-generated from alert triggers and incident data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {!report.incident_summary.has_incidents
                ? (
                  <div className={`px-4 py-3 border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-sm ${Rsub}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="font-semibold text-slate-900 dark:text-white">No incidents detected</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">All endpoints operated within security thresholds during this period.</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 italic">*Generated by Heimdall AI</p>
                  </div>
                )
                : (
                  <div className={`px-4 py-3 border border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-sm ${Rsub}`}>
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">
                      ⚠️ {report.incident_summary.incidents.length} incident(s) recorded during {formatMonthYear(report.metadata.year, report.metadata.month)}.
                    </p>
                    <ul className="space-y-1">
                      {report.incident_summary.incidents.slice(0, 3).map((inc, i) => (
                        <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">•</span>{inc.what} – {inc.impact}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-[11px] text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-blue-900/20 pt-5">
          Automatically generated by Heimdall AI · Based on API traffic, discovery scans & security alerts
        </div>
      </div>
    </div>
  );
};

export default CISOReports;