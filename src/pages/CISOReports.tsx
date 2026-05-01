import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Download,
  FileText,
  ChevronLeft,
  Calendar,
  Shield,
  AlertTriangle,
  Activity,
  Server,
  Lock,
  TrendingUp,
  BarChart3,
  CheckCircle,
  DollarSign,
  Gauge,
  Zap,
  PlusCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================
interface MonthlyReportMetadata {
  id: string;
  year: number;
  month: number;
  risk_index: number;
  risk_status: "Low" | "Moderate" | "High";
  generated_at: string;
  pdf_url?: string;
}

interface EndpointScore {
  name: string;
  security_score: number;
  health_score?: number;
  endpoint_id?: string;
}

interface CisoReport {
  metadata: MonthlyReportMetadata;
  total_requests: number;
  blocked_requests: number;
  weighted_loss_30d: number;
  ale: number;
  control_score: number;
  risk_index: number;
  executive_summary?: string;
  endpoint_scores?: EndpointScore[];
  threat_distribution: Array<{ name: string; value: number; financial_impact: number }>;
  risk_matrix: { high_med: number; med_high: number };
  top_countries: Array<{ country: string; requests: number }>;
  daily_trend: Array<{ date: string; count: number }>;
  api_estate: {
    total: number; production: number; shadow: number; internet_facing: number;
    internal: number; third_party: number; new_this_month: number; retired_this_month: number;
  };
  vulnerability_posture: {
    missing_auth: number; weak_auth: number; excessive_data: number; deprecated_versions: number;
    sensitive_data_leakage: number; missing_rate_limits: number; bola_findings: number;
    tls_issues: number; misconfigurations: number;
  };
  incident_summary: {
    has_incidents: boolean;
    incidents: Array<{ what: string; impact: string; duration: string; containment: string; root_cause: string; lessons: string }>;
  };
  compliance: {
    apis_handling_pii: number; third_party_review: string; owasp_alignment: number; controls: string[];
  };
  operational: { avg_response_ms: number; error_rate: number; uptime: number; rps: number };
  top_risks: Array<{ description: string; likelihood: string; impact: string; mitigation: string }>;
}

const THREAT_COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#06b6d4"];
const COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6"];

// ============================================================================
// HELPER COMPONENTS (unchanged)
// ============================================================================
const KpiCard = ({ title, value, subtitle, icon, color }: any) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
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
    <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center gap-2 bg-white dark:bg-slate-900">
      {icon && <span className="text-slate-500">{icon}</span>}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const StatItem = ({ label, value, highlight, trend }: any) => (
  <div
    className={`flex justify-between items-center p-2 rounded-lg ${highlight ? "bg-red-50 dark:bg-red-950/20" : ""}`}
  >
    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    <span className="font-mono font-semibold flex items-center gap-1">
      {value}
      {trend === "up" && <span className="text-green-600 text-xs">▲</span>}
      {trend === "down" && <span className="text-red-600 text-xs">▼</span>}
    </span>
  </div>
);

const VulnItem = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between items-center p-1">
    <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    <span className={`text-xs font-mono font-bold ${value > 0 ? "text-red-600" : "text-green-600"}`}>{value}</span>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const CISOReports = () => {
  const [reports, setReports] = useState<MonthlyReportMetadata[]>([]);
  const [selectedReport, setSelectedReport] = useState<CisoReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [aiNotes, setAiNotes] = useState("");
  const { toast } = useToast();

  const loadReports = async () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) {
      toast({ title: "Error", description: "No platform selected", variant: "destructive" });
      setLoading(false);
      return;
    }
    try {
      const data = await apiService.request(`/ciso-reports/?platform_id=${platformId}`, { method: "GET" });
      const fetchedReports = data.results || data;
      const sortedReports = [...fetchedReports].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      setReports(sortedReports);
      const savedReportId = localStorage.getItem("selected_ciso_report_id");
      if (savedReportId && sortedReports.some((r: MonthlyReportMetadata) => r.id === savedReportId)) {
        loadReportDetail(savedReportId);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load report list", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [toast]);

  const loadReportDetail = async (reportId: string) => {
    setLoading(true);
    try {
      const report = await apiService.request(`/ciso-reports/${reportId}/`, { method: "GET" });
      setSelectedReport(report.report_data || report);
      localStorage.setItem("selected_ciso_report_id", reportId);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) {
      toast({ title: "Error", description: "No platform selected", variant: "destructive" });
      return;
    }
    const token = localStorage.getItem("auth_token");
    if (!token) {
      toast({ title: "Error", description: "Authentication token missing. Please log out and back in.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://staging.breachnet.io/api/v1";
      const response = await fetch(`${baseUrl}/ciso-reports/generate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
          "X-Platform-Id": platformId,
        },
        body: JSON.stringify({
          year: genYear,
          month: genMonth,
          ai_notes: aiNotes,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Generation failed");
      }

      toast({ title: "Report generation started", description: "The report will appear shortly." });
      setGenerateOpen(false);
      setAiNotes("");
      setTimeout(() => loadReports(), 2000);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error?.message || "Failed to generate report", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // IMPROVED PDF EXPORT (multi-page, waits for charts, white background)
  const exportToPDF = async () => {
    const element = document.getElementById("ciso-report-content");
    if (!element) {
      toast({ title: "Error", description: "Report content not found", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      // Wait for any pending layout / recharts rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force all images to load (if any)
      const images = Array.from(element.querySelectorAll('img'));
      await Promise.all(images.map(img => img.decode().catch(() => {})));

      // Extra delay for SVG charts (recharts)
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const imgWidth = 210;
      const pageHeight = 297;
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

      pdf.save(`ciso-report-${report.metadata.year}-${report.metadata.month}.pdf`);
      toast({ title: "PDF Ready", description: "Report downloaded successfully" });
    } catch (error) {
      console.error("PDF generation failed, falling back to print:", error);
      window.print();
      toast({ title: "Print dialog opened", description: "Use 'Save as PDF' in the print dialog." });
    } finally {
      setExporting(false);
    }
  };

  const formatMonthYear = (year: number, month: number) =>
    new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });

  const handleBackToList = () => {
    localStorage.removeItem("selected_ciso_report_id");
    setSelectedReport(null);
  };

  // --------------------------------------------------------------------------
  // LIST VIEW (with Generate button + shimmer card)
  // --------------------------------------------------------------------------
  if (!selectedReport) {
    if (typeof document !== "undefined" && !document.querySelector("#shimmer-keyframes")) {
      const style = document.createElement("style");
      style.id = "shimmer-keyframes";
      style.textContent = `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }

    return (
      <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">CISO Monthly Reports</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Select a month to view the security dashboard</p>
            </div>
            <Button onClick={() => setGenerateOpen(true)} className="rounded-full shadow-md">
              <PlusCircle className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => loadReportDetail(report.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Calendar className="h-5 w-5 text-indigo-500 mb-2" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {formatMonthYear(report.year, report.month)}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          report.risk_status === "Low"
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                            : report.risk_status === "Moderate"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                        }
                      >
                        {report.risk_status} Risk
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Risk Index</span>
                      <span className="font-mono font-semibold">{report.risk_index}/100</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Generated {new Date(report.generated_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}

              {generating && (
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm overflow-hidden cursor-wait">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="h-5 w-5 bg-indigo-200 dark:bg-indigo-800 rounded-full mb-2 animate-pulse" />
                        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </div>
                      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                      <div className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 top-1 left-1" />
                      </div>
                      <span className="animate-pulse font-medium">AI generating report...</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
                </div>
              )}
            </div>
          )}
        </div>

        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Monthly CISO Report</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={genYear}
                    onChange={(e) => setGenYear(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="number"
                    min={1}
                    max={12}
                    value={genMonth}
                    onChange={(e) => setGenMonth(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="aiNotes">AI Notes (optional)</Label>
                <Textarea
                  id="aiNotes"
                  placeholder="Add context for the AI summary (e.g., major incidents, business priorities)..."
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerateReport} disabled={generating}>
                {generating ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DETAIL DASHBOARD (wrapped with id="ciso-report-content" for PDF export)
  // --------------------------------------------------------------------------
  const report = selectedReport;
  const blockedPercent = report.total_requests
    ? ((report.blocked_requests / report.total_requests) * 100).toFixed(1)
    : "0";

  const remediationProjects = (report.endpoint_scores || []).slice(0, 5).map((ep) => {
    const estCost = ep.security_score < 30 ? 10000 : ep.security_score < 70 ? 5000 : 2000;
    const rosi = estCost > 0 ? ((100 - ep.security_score) / 100 * 100).toFixed(0) : "0";
    return { name: ep.name, security_score: ep.security_score, estCost, rosi };
  });

  const riskGaugeData = [
    { name: "Risk Index", value: report.risk_index, fill: report.risk_index < 30 ? "#10b981" : report.risk_index < 70 ? "#f59e0b" : "#ef4444" },
  ];
  const postureScore = Math.round((report.control_score + (100 - report.risk_index)) / 2);

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6 print:bg-white">
      <div className="w-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  {formatMonthYear(report.metadata.year, report.metadata.month)}
                </span>
                <Badge variant="outline" className="border-white/30 bg-white/15 text-white">
                  {report.metadata.risk_status} Risk
                </Badge>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-medium border border-emerald-400/50">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">CISO Executive Dashboard</h1>
              <p className="text-sm text-blue-100 mt-1">API Security Posture & Financial Risk – Last 30 Days</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={exportToPDF} disabled={exporting} className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25">
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" onClick={handleBackToList} className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25">
                <ChevronLeft className="mr-2 h-4 w-4" /> All Reports
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Wrap the entire dashboard content for PDF export */}
        <div id="ciso-report-content" className="space-y-8">
          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Threat Type Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={report.threat_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {report.threat_distribution.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Threats by Financial Impact">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={report.threat_distribution} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(val) => `$${val.toLocaleString()}`} />
                  <Bar dataKey="financial_impact" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Security Posture Overview */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-purple-500" /> Risk Index
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={140}>
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={riskGaugeData} startAngle={180} endAngle={0}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} fill={riskGaugeData[0].fill} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-slate-900 dark:fill-white">
                      {report.risk_index}
                    </text>
                    <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-slate-500 dark:fill-slate-400">
                      /100
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" /> Security Posture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">{postureScore}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">/100 – Composite score</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    {postureScore >= 80 ? "Strong" : postureScore >= 50 ? "Moderate" : "Weak"}
                  </div>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${postureScore}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" /> Compliance Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 dark:text-white">{report.compliance.owasp_alignment}%</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">OWASP Top 10 Alignment</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Third‑party review:</span> {report.compliance.third_party_review}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Requests" value={report.total_requests.toLocaleString()} icon={<Activity />} color="blue" />
            <KpiCard title="Blocked Threats" value={report.blocked_requests.toLocaleString()} subtitle={`${blockedPercent}% of traffic`} icon={<AlertTriangle />} color="red" />
            <KpiCard title="Weighted Loss (30d)" value={`$${report.weighted_loss_30d.toLocaleString()}`} subtitle={`ALE: $${report.ale.toLocaleString()}`} icon={<DollarSign />} color="emerald" />
            <KpiCard title="Control Score / Risk Index" value={`${report.control_score}% / ${report.risk_index}%`} subtitle="Effectiveness vs Residual Risk" icon={<Shield />} color="purple" />
          </div>

          {/* Executive Summary */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" /> Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.executive_summary ||
                  `Overall API risk status is ${report.metadata.risk_status} with a risk index of ${report.risk_index}/100. 
                  Total requests: ${report.total_requests}, blocked threats: ${report.blocked_requests}. 
                  Estimated financial loss (30d): $${report.weighted_loss_30d.toLocaleString()}. 
                  Control score: ${report.control_score}%.`}
              </p>
            </CardContent>
          </Card>

          {/* Risk Matrix & Top Countries */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Risk Matrix (Likelihood × Impact)">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border p-2 text-left">Likelihood \ Impact</th>
                    <th className="border p-2">Low</th>
                    <th className="border p-2">Medium</th>
                    <th className="border p-2">High</th>
                   </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-medium">High</td>
                    <td className="border p-2 text-center">—</td>
                    <td className="border p-2 text-center bg-yellow-50 dark:bg-yellow-950/30">{report.risk_matrix.high_med} med</td>
                    <td className="border p-2 text-center">—</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Medium</td>
                    <td className="border p-2 text-center">—</td>
                    <td className="border p-2 text-center">—</td>
                    <td className="border p-2 text-center bg-orange-50 dark:bg-orange-950/30">{report.risk_matrix.med_high} med</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Low</td>
                    <td className="border p-2 text-center">—</td>
                    <td className="border p-2 text-center">—</td>
                    <td className="border p-2 text-center">—</td>
                  </tr>
                </tbody>
              </table>
            </ChartCard>
            <ChartCard title="Top Request Origins">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={report.top_countries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="country" width={80} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Remediation Projects */}
          {remediationProjects.length > 0 && (
            <ChartCard title="Remediation Projects" icon={<TrendingUp />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 text-left font-semibold">Endpoint</th>
                      <th className="p-3 text-left font-semibold">Security Score</th>
                      <th className="p-3 text-left font-semibold">Est. Project Cost</th>
                      <th className="p-3 text-left font-semibold">RoSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remediationProjects.map((proj, idx) => (
                      <tr key={idx} className="border-b border-slate-200 dark:border-slate-700">
                        <td className="p-3 font-mono text-xs">{proj.name}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{proj.security_score}</span>
                            <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${proj.security_score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">${proj.estCost.toLocaleString()}</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">{proj.rosi}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}

          {/* Discovered Endpoints */}
          {report.endpoint_scores && report.endpoint_scores.length > 0 && (
            <ChartCard title="Discovered Endpoints (from API Discovery)" icon={<Server />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 text-left font-semibold">Endpoint</th>
                      <th className="p-3 text-left font-semibold">Security Score</th>
                      <th className="p-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.endpoint_scores.slice(0, 10).map((ep, idx) => (
                      <tr key={idx} className="border-b border-slate-200 dark:border-slate-700">
                        <td className="p-3 font-mono text-xs">{ep.name}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{ep.security_score}</span>
                            <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ep.security_score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" className="text-xs">Protect</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}

          {/* Blocked Threats Trend */}
          {report.daily_trend.length > 0 && (
            <ChartCard title="Blocked Threats Trend (Last 30 days)">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={report.daily_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* API Estate & Vulnerability */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="API Estate Overview" icon={<Server />}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <StatItem label="Total APIs" value={report.api_estate.total} />
                <StatItem label="Production" value={report.api_estate.production} />
                <StatItem label="Shadow / Undocumented" value={report.api_estate.shadow} highlight />
                <StatItem label="Internet‑facing" value={report.api_estate.internet_facing} />
                <StatItem label="Internal" value={report.api_estate.internal} />
                <StatItem label="Third‑party" value={report.api_estate.third_party} />
                <StatItem label="New this month" value={report.api_estate.new_this_month} trend="up" />
                <StatItem label="Retired" value={report.api_estate.retired_this_month} trend="down" />
              </div>
            </ChartCard>
            <ChartCard title="Vulnerability & Exposure Posture" icon={<Lock />}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <VulnItem label="Missing Auth" value={report.vulnerability_posture.missing_auth} />
                <VulnItem label="Weak Auth Flows" value={report.vulnerability_posture.weak_auth} />
                <VulnItem label="Excessive Data Exposure" value={report.vulnerability_posture.excessive_data} />
                <VulnItem label="Deprecated Versions" value={report.vulnerability_posture.deprecated_versions} />
                <VulnItem label="Sensitive Data Leakage" value={report.vulnerability_posture.sensitive_data_leakage} />
                <VulnItem label="Missing Rate Limits" value={report.vulnerability_posture.missing_rate_limits} />
                <VulnItem label="BOLA Findings" value={report.vulnerability_posture.bola_findings} />
                <VulnItem label="TLS/Cert Issues" value={report.vulnerability_posture.tls_issues} />
                <VulnItem label="Misconfigurations" value={report.vulnerability_posture.misconfigurations} />
              </div>
            </ChartCard>
          </div>

          {/* Incident Summary */}
          <ChartCard title="Incident Summary" icon={<AlertTriangle />}>
            {!report.incident_summary.has_incidents ? (
              <p className="text-green-600">No material API security incidents this month.</p>
            ) : (
              report.incident_summary.incidents.map((inc, idx) => (
                <div key={idx} className="border-l-4 border-red-400 pl-4 py-2 bg-red-50/30 dark:bg-red-950/20 rounded mb-3">
                  <p><strong>What happened:</strong> {inc.what}</p>
                  <p><strong>Impact:</strong> {inc.impact}</p>
                  <p><strong>Duration:</strong> {inc.duration} | <strong>Containment:</strong> {inc.containment}</p>
                  <p><strong>Root cause:</strong> {inc.root_cause}</p>
                  <p><strong>Lessons learned:</strong> {inc.lessons}</p>
                </div>
              ))
            )}
          </ChartCard>

          {/* Compliance & Governance + Operational Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Compliance / Governance" icon={<CheckCircle />}>
              <StatItem label="APIs handling PII" value={report.compliance.apis_handling_pii} />
              <StatItem label="Third‑party review" value={report.compliance.third_party_review} />
              <StatItem label="OWASP API Top 10 alignment" value={`${report.compliance.owasp_alignment}%`} />
              <div className="mt-2">
                <span className="font-medium">Detected controls:</span>
                <ul className="list-disc list-inside mt-1 text-slate-600 dark:text-slate-400">
                  {report.compliance.controls.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </ChartCard>
            <ChartCard title="Operational Performance" icon={<BarChart3 />}>
              <StatItem label="Avg Response Time" value={`${report.operational.avg_response_ms} ms`} />
              <StatItem label="Error Rate" value={`${report.operational.error_rate}%`} />
              <StatItem label="Uptime" value={`${report.operational.uptime}%`} />
              <StatItem label="Requests/sec" value={report.operational.rps} />
            </ChartCard>
          </div>

          {/* Top Risks */}
          <ChartCard title="Top Risks (if any)" icon={<TrendingUp />}>
            {report.top_risks.length === 0 ? (
              <p className="text-green-600">No outstanding top risks identified.</p>
            ) : (
              report.top_risks.map((risk, i) => (
                <div key={i} className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg mb-3">
                  <p className="font-semibold">{risk.description}</p>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span>Likelihood: {risk.likelihood}</span>
                    <span>Impact: {risk.impact}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Mitigation: {risk.mitigation}</p>
                </div>
              ))
            )}
          </ChartCard>

          {/* AI Incident Summary Card */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" /> AI‑Powered Incident Summary
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Automatically generated insights based on alert triggers and incidents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {!report.incident_summary.has_incidents ? (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    ✅ <strong>No incidents detected</strong> – The API estate operated without any material security incidents this month.
                    All monitored endpoints remained within defined security thresholds.
                  </p>
                  <p className="text-xs text-slate-400 mt-2 italic">
                    *Generated by Heimdall AI – based on zero trigger events and no incident reports.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    ⚠️ <strong>Incident activity detected.</strong> During {formatMonthYear(report.metadata.year, report.metadata.month)},
                    the system recorded <span className="font-bold text-amber-600">{report.incident_summary.incidents.length}</span> material incident(s).
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    {report.incident_summary.incidents.slice(0, 3).map((inc, idx) => (
                      <li key={idx}><span className="font-medium">{inc.what}</span> – {inc.impact} (Root cause: {inc.root_cause})</li>
                    ))}
                    {report.incident_summary.incidents.length > 3 && (
                      <li className="text-xs italic">+ {report.incident_summary.incidents.length - 3} more incident(s)</li>
                    )}
                  </ul>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      🔍 <strong>AI Recommendation:</strong> Prioritise remediation of the root causes above.
                      Implement additional monitoring for affected endpoints.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div> {/* end ciso-report-content */}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 border-t pt-6 mt-4">
          This report is automatically generated based on API traffic, discovery scans, and security alerts.
        </div>
      </div>
    </div>
  );
};

export default CISOReports;