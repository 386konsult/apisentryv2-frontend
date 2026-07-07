import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, Download, Shield, Ban, Globe, Eye, MoreVertical, MapPin,
  Bot, Activity, AlertTriangle, Clock, TrendingUp, Lock, RefreshCw,
  Building2, Server, Network, X, CheckCircle2, AlertOctagon,
  Wifi, WifiOff, ExternalLink,
} from "lucide-react";
import HeimdallAILogo from '@/components/HeimdallAILogo';
import { apiService } from "@/services/api";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import countriesData from "@/data/countries.json";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RequestLog {
  id: string;
  endpoint_name: string;
  platform_name: string;
  timestamp: string;
  method: string;
  path: string;
  query_params: Record<string, any>;
  headers: Record<string, any>;
  request_body: any;
  status_code: number;
  response_headers: Record<string, any>;
  response_body: any;
  response_time_ms: number;
  client_ip: string;
  user_agent: string;
  waf_blocked: boolean;
  waf_rule_triggered: string | null;
  threat_level: string;
  platform: string;
  endpoint: string;
}

const countryFlag = (code?: string | null): string => {
  if (!code || code.length !== 2) return '';
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
  } catch { return ''; }
};

type TimeRangeKey = "today" | "week" | "month" | "3months" | "6months" | "1year";

const TIME_RANGE_OPTIONS: { label: string; value: TimeRangeKey }[] = [
  { label: "Today",      value: "today"   },
  { label: "This Week",  value: "week"    },
  { label: "This Month", value: "month"   },
  { label: "3 Months",   value: "3months" },
  { label: "6 Months",   value: "6months" },
  { label: "1 Year",     value: "1year"   },
];

interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  country_name?: string;
  org?: string;
  hostname?: string;
  bogon?: boolean;
  timezone?: string;
  error?: boolean;
}

interface AbuseData {
  abuseConfidenceScore: number;
  countryCode: string;
  usageType: string;
  isp: string;
  domain: string;
  isTor: boolean;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
  isWhitelisted: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getRangeStart = (range: TimeRangeKey): Date => {
  const now = new Date();
  switch (range) {
    case "today":   { const d = new Date(now); d.setHours(0,0,0,0); return d; }
    case "week":    { const d = new Date(now); const day = d.getDay(); const daysSinceMonday = day === 0 ? 6 : day - 1; d.setDate(d.getDate() - daysSinceMonday); d.setHours(0,0,0,0); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); return d < monthStart ? monthStart : d; }
    case "month":   { const d = new Date(now); d.setDate(1); d.setHours(0,0,0,0); return d; }
    case "3months": { const d = new Date(now); d.setMonth(d.getMonth()-3); d.setHours(0,0,0,0); return d; }
    case "6months": { const d = new Date(now); d.setMonth(d.getMonth()-6); d.setHours(0,0,0,0); return d; }
    case "1year":   { const d = new Date(now); d.setFullYear(d.getFullYear()-1); d.setHours(0,0,0,0); return d; }
  }
};

const parseTimestamp = (ts: string): Date => {
  if (!ts) return new Date(NaN);
  const m = ts.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}`);
  return new Date(ts.replace(" ", "T"));
};

const isEmpty = (v: any) =>
  v === null || v === undefined || v === "" ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

// ── AnimatedNumber ────────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, className = "" }: { value: number; className?: string }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const start  = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 800, 1);
      setDisplay(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{Math.round(display).toLocaleString()}</span>;
};

// ── DataDisclaimer ────────────────────────────────────────────────────────────
const DataDisclaimer = () => (
  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 mt-1">
    <Lock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
    <span>Not saved — Heimdall does not persist raw request or response payloads to protect sensitive data (credentials, PII, tokens).</span>
  </div>
);

// ── Abuse score badge ─────────────────────────────────────────────────────────
const AbuseBadge = ({ score }: { score: number }) => {
  if (score === 0) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Clean (0%)
    </span>
  );
  if (score < 25) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
      <AlertTriangle className="h-3 w-3" /> Low risk ({score}%)
    </span>
  );
  if (score < 75) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
      <AlertOctagon className="h-3 w-3" /> Suspicious ({score}%)
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
      <AlertOctagon className="h-3 w-3" /> Malicious ({score}%)
    </span>
  );
};

// ── IP Intelligence Panel ─────────────────────────────────────────────────────
const IPIntelPanel = ({
  ip, info, abuse, loading,
}: {
  ip: string;
  info: IPInfo | null;
  abuse: AbuseData | null;
  loading: boolean;
}) => {
  const hasAbuseKey = true; // key lives on the backend — always attempt the lookup

  if (loading) return (
    <div className="rounded-[14px] border border-blue-100 dark:border-blue-900/20 bg-blue-50/30 dark:bg-blue-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-blue-500 animate-pulse" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">IP Intelligence</span>
        <span className="text-[10px] text-slate-400">looking up…</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-200 dark:bg-slate-700/50 animate-pulse" />)}
      </div>
    </div>
  );

  const org      = info?.org || "";
  const asnMatch = org.match(/^(AS\d+)\s+(.*)/);
  const asn      = asnMatch ? asnMatch[1] : null;
  const orgName  = asnMatch ? asnMatch[2] : (org || abuse?.isp || "—");
  const location = [info?.city, info?.region, info?.country_name || info?.country].filter(Boolean).join(", ") || "—";

  return (
    <div className="rounded-[14px] border border-blue-100 dark:border-blue-900/20 bg-gradient-to-br from-blue-50/60 to-cyan-50/30 dark:from-blue-500/5 dark:to-cyan-500/5 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 dark:bg-blue-500/15">
            <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">IP Intelligence</span>
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{ip}</span>
        </div>
        {info?.bogon && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Private / Reserved
          </span>
        )}
      </div>

      {/* Geo tiles */}
      {info && !info.error && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <MapPin    className="h-3.5 w-3.5 text-blue-500"   />, label: "Location",     value: location,           mono: false },
            { icon: <Building2 className="h-3.5 w-3.5 text-cyan-500"   />, label: "Organisation", value: orgName,            mono: false },
            { icon: <Network   className="h-3.5 w-3.5 text-violet-500" />, label: "ASN",           value: asn || "—",         mono: true  },
            { icon: <Server    className="h-3.5 w-3.5 text-slate-400"  />, label: "Hostname",      value: info.hostname || "—", mono: true },
          ].map(({ icon, label, value, mono }) => (
            <div key={label} className="rounded-xl border border-white dark:border-blue-900/20 bg-white dark:bg-[#0d1829] px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">{label}</p>
              <div className="flex items-center gap-1.5">
                {icon}
                <span className={`${mono ? "font-mono" : ""} text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate`} title={value}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {(!info || info.error) && !loading && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Geo lookup unavailable for this IP.</p>
      )}

      {/* AbuseIPDB section */}
      {!hasAbuseKey ? (
        <div className="rounded-xl border border-dashed border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 px-3 py-2.5">
          <p className="text-[10px] text-amber-700 dark:text-amber-400">
            Add <span className="font-mono font-bold bg-amber-100 dark:bg-amber-500/10 px-1 rounded">VITE_ABUSEIPDB_KEY</span> to enable abuse score, VPN/Tor detection, and report history.
          </p>
        </div>
      ) : abuse ? (
        <div className="space-y-3">
          {/* Divider */}
          <div className="border-t border-blue-100 dark:border-blue-900/20" />

          {/* Score row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Abuse Score</span>
            <AbuseBadge score={abuse.abuseConfidenceScore} />
          </div>

          {/* Score bar */}
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                abuse.abuseConfidenceScore === 0 ? "bg-emerald-500"
                : abuse.abuseConfidenceScore < 25 ? "bg-amber-500"
                : abuse.abuseConfidenceScore < 75 ? "bg-orange-500"
                : "bg-red-500"
              }`}
              style={{ width: `${abuse.abuseConfidenceScore}%` }}
            />
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-1.5">
            {abuse.isTor && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                🧅 Tor Exit Node
              </span>
            )}
            {abuse.usageType?.toLowerCase().includes("data center") || abuse.usageType?.toLowerCase().includes("hosting") ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-100 text-slate-600 dark:border-blue-900/20 dark:bg-slate-800 dark:text-slate-300">
                <WifiOff className="h-3 w-3" /> Data Centre / Hosting
              </span>
            ) : abuse.usageType?.toLowerCase().includes("vpn") ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-100 text-slate-600 dark:border-blue-900/20 dark:bg-slate-800 dark:text-slate-300">
                <Wifi className="h-3 w-3" /> VPN
              </span>
            ) : abuse.usageType ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-100 text-slate-600 dark:border-blue-900/20 dark:bg-slate-800 dark:text-slate-300">
                {abuse.usageType}
              </span>
            ) : null}
            {abuse.isWhitelisted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Whitelisted
              </span>
            )}
          </div>

          {/* Report stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total Reports",  value: abuse.totalReports.toLocaleString() },
              { label: "Distinct Users", value: abuse.numDistinctUsers.toLocaleString() },
              { label: "Last Reported",  value: abuse.lastReportedAt ? new Date(abuse.lastReportedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "Never" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white dark:border-blue-900/20 bg-white dark:bg-[#0d1829] px-3 py-2.5 text-center">
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <a href={`https://www.abuseipdb.com/check/${ip}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <ExternalLink className="h-3 w-3" /> View full report on AbuseIPDB
          </a>
        </div>
      ) : null}
    </div>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const LogDetailModal = ({
  log, open, onClose, ipInfo, abuse, ipLoading, onBlockIP,
}: {
  log: RequestLog | null;
  open: boolean;
  onClose: () => void;
  ipInfo: IPInfo | null;
  abuse: AbuseData | null;
  ipLoading: boolean;
  onBlockIP: (ip: string) => void;
}) => {
  if (!log) return null;

  const methodColor: Record<string, string> = {
    GET:    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    POST:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    PUT:    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    PATCH:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  };

  const statusColor =
    log.status_code < 300 ? "text-emerald-600 dark:text-emerald-400"
    : log.status_code < 400 ? "text-blue-600 dark:text-blue-400"
    : log.status_code < 500 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  const threatColor: Record<string, string> = {
    high:   "text-red-600 dark:text-red-400",
    medium: "text-amber-600 dark:text-amber-400",
    low:    "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-[22px] border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829] [&>button:first-of-type]:hidden">

        {/* Gradient banner */}
        <div className="relative rounded-t-[22px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-6 pt-6 pb-5 overflow-hidden">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
          
          {/* Close */}
          <button onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10">
            <X className="h-3.5 w-3.5 text-white" />
          </button>

          <div className="relative flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <HeimdallAILogo size={36} inverted />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${methodColor[log.method] || "bg-slate-100 text-slate-600"}`}>
                  {log.method}
                </span>
                {log.waf_blocked && (
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-red-500/25 text-red-200 border border-red-400/30">
                    🚫 WAF Blocked
                  </span>
                )}
              </div>
              <p className="font-mono text-sm font-semibold text-white leading-snug break-all">{log.path}</p>
              <p className="text-xs text-blue-100/70 mt-1">{log.timestamp}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-4 py-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Status</p>
              <p className={`text-2xl font-bold tabular-nums ${statusColor}`}>{log.status_code}</p>
            </div>
            <div className="rounded-[14px] border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-4 py-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Response</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {log.response_time_ms != null ? Math.round(log.response_time_ms) : 0}
                <span className="text-xs font-medium text-slate-400 ml-0.5">ms</span>
              </p>
            </div>
            <div className="rounded-[14px] border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-4 py-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Threat</p>
              <p className={`text-sm font-bold uppercase ${threatColor[log.threat_level] || "text-slate-400 dark:text-slate-500"}`}>
                {log.threat_level || "none"}
              </p>
            </div>
          </div>

          {/* Client IP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Client IP</p>
              <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                {countryFlag((log as any).country_code || (log as any).country) && <span className="text-base leading-none">{countryFlag((log as any).country_code || (log as any).country)}</span>}
                {log.client_ip}
              </p>
            </div>
            <div className="rounded-[14px] border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Endpoint</p>
              <p className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{log.endpoint_name || log.path}</p>
            </div>
          </div>

          {/* User Agent */}
          <div className="rounded-[14px] border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">User Agent</p>
            <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all leading-relaxed">{log.user_agent || "—"}</p>
          </div>

          {/* IP Intelligence */}
          <IPIntelPanel ip={log.client_ip} info={ipInfo} abuse={abuse} loading={ipLoading} />

          {/* Block IP button */}
          <button onClick={() => { onClose(); onBlockIP(log.client_ip); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-all active:scale-[0.99]">
            <Ban className="h-4 w-4" />
            Block IP {log.client_ip}
          </button>

          {/* Request / Response data */}
          <div className="space-y-3 pt-1">
            {[
              { label: "Request Headers",  value: log.headers },
              { label: "Request Body",     value: log.request_body },
              { label: "Response Headers", value: log.response_headers },
              { label: "Response Body",    value: log.response_body },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
                {isEmpty(value)
                  ? <DataDisclaimer />
                  : <pre className="text-xs bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 overflow-auto border border-slate-200/60 dark:border-slate-700/40 text-slate-700 dark:text-slate-300">
                      {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                    </pre>
                }
              </div>
            ))}
            {log.waf_rule_triggered && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">WAF Rule Triggered</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 border border-red-100 dark:border-red-500/20">
                  {log.waf_rule_triggered}
                </p>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const SecurityHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  // Tracks whether the filter-change useEffect is running for the first time (mount).
  // On mount the main useEffect already handles the fetch; we skip the duplicate.
  const isFilterFirstRun = React.useRef(true);

  const [tableLogs, setTableLogs]         = useState<RequestLog[]>([]);
  const [loading, setLoading]             = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 20;

  // Stats driven by backend aggregates — not client-side filtering of a capped list
  const [statsData, setStatsData] = useState({
    totalLogs: 0, blockedLogs: 0, uniqueIPs: 0,
    errorLogs: 0, avgResponseTime: 0, botRequests: 0,
    suspiciousIPs: 0, uniqueCountries: 0,
  });

  const [statsRange, setStatsRange]       = useState<TimeRangeKey>(() => {
    // Use a SecurityHub-specific key so ThreatLogs selections don't overwrite this default.
    const saved = localStorage.getItem('heimdall_securityhub_range');
    return (saved as TimeRangeKey) || '1year';
  });
  const [selectedLog, setSelectedLog]     = useState<RequestLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [blockIPDialog, setBlockIPDialog] = useState<{ open: boolean; ip: string }>({ open: false, ip: "" });
  const [blockEndpointDialog, setBlockEndpointDialog] = useState<{ open: boolean; endpoint: string; endpointId: string }>({ open: false, endpoint: "", endpointId: "" });

  // IP Intel state
  const [ipInfo, setIpInfo]   = useState<IPInfo | null>(null);
  const [abuse, setAbuse]     = useState<AbuseData | null>(null);
  const [ipLoading, setIpLoading] = useState(false);

  const [searchTerm, setSearchTerm]               = useState("");
  const [ipFilter, setIpFilter]                   = useState("");
  const [countryFilter, setCountryFilter]         = useState<string | null>(null);
  const [methodFilter, setMethodFilter]           = useState("all");
  const [statusCodeFilter, setStatusCodeFilter]   = useState("all");
  const [threatLevelFilter, setThreatLevelFilter] = useState("all");
  const [wafBlockedFilter, setWafBlockedFilter]   = useState("all");
  const [platformName, setPlatformName]           = useState<string>("");

  // Endpoint autocomplete
  const [endpointSearch, setEndpointSearch]       = useState("");
  const [endpointFilter, setEndpointFilter]       = useState("");
  const [showEndpointDropdown, setShowEndpointDropdown] = useState(false);
  const endpointRef = React.useRef<HTMLDivElement>(null);

  const endpointSuggestions = useMemo(() => {
    if (!endpointSearch.trim()) return [];
    const lower = endpointSearch.toLowerCase();
    const paths = [...new Set(tableLogs.map(l => l.path).filter(Boolean))];
    return paths.filter(p => p.toLowerCase().includes(lower)).slice(0, 10);
  }, [endpointSearch, tableLogs]);

  // ── Stats fetch — uses start_date so backend filters on full dataset ────────
  const fetchStatsForRange = async (platformId: string, range: TimeRangeKey) => {
    setStatsLoading(true);
    try {
      const startDate = getRangeStart(range).toISOString().split("T")[0];
      // page_size:100 gives a sample for secondary stats; total_count/blocked_count come from backend aggregate
      const response = await apiService.getPlatformRequestLogs(platformId, { page_size: 100, page: 1, start_date: startDate });
      const sample: RequestLog[] = response.logs ?? response.results ?? (Array.isArray(response) ? response : []);
      const totalLogs   = response.total_count  ?? sample.length;
      const blockedLogs = response.blocked_count ?? sample.filter((l: RequestLog) => l.waf_blocked).length;
      // All stats now come from backend aggregates over the full dataset.
      // Sample-based fallbacks are only used if the backend doesn't return the field.
      const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /postman/i];
      const ipFreq: Record<string, number> = {};
      sample.forEach((l: RequestLog) => { ipFreq[l.client_ip] = (ipFreq[l.client_ip] || 0) + 1; });
      setStatsData({
        totalLogs,
        blockedLogs,
        uniqueIPs:       response.unique_ips        ?? new Set(sample.map((l: RequestLog) => l.client_ip).filter(Boolean)).size,
        uniqueCountries: response.unique_countries  ?? new Set(sample.map((l: RequestLog) => (l as any).country || (l as any).country_code).filter(Boolean)).size,
        suspiciousIPs:   response.suspicious_ips    ?? Object.values(ipFreq).filter(c => c > 10).length,
        errorLogs:       response.error_count       ?? sample.filter((l: RequestLog) => l.status_code >= 400).length,
        avgResponseTime: response.avg_response_time ?? (sample.length ? sample.reduce((s: number, l: RequestLog) => s + (l.response_time_ms ?? 0), 0) / sample.length : 0),
        botRequests:     response.bot_requests_count ?? sample.filter((l: RequestLog) => botPatterns.some(p => p.test(l.user_agent || ""))).length,
      });
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTablePage = async (platformId: string, pageNum: number, append = false, overrides?: Record<string, any>) => {
    if (loadingMore && !overrides) return;
    setLoadingMore(true);
    try {
      // Build server-side filter params — searches across full dataset, not just loaded page
      const params: Record<string, any> = { page: pageNum, page_size: PAGE_SIZE };
      const s = overrides?.searchTerm  ?? searchTerm;
      const ip = overrides?.ipFilter   ?? ipFilter;
      const ep = overrides?.endpointFilter ?? endpointFilter;
      const m  = overrides?.methodFilter   ?? methodFilter;
      const sc = overrides?.statusCodeFilter ?? statusCodeFilter;
      const tl = overrides?.threatLevelFilter ?? threatLevelFilter;
      const wb = overrides?.wafBlockedFilter  ?? wafBlockedFilter;
      if (s)           params.search       = s;
      if (ip)          params.ip           = ip;
      if (ep)          params.endpoint     = ep;
      if (m  !== "all") params.method      = m;
      if (sc !== "all") params.status_code = sc;
      if (tl !== "all") params.threat_level = tl;
      if (wb !== "all") params.blocked     = wb === "blocked" ? "true" : "false";
      const response = await apiService.getPlatformRequestLogs(platformId, params);
      let newLogs: RequestLog[] = [];
      if (response.results)         newLogs = response.results;
      else if (response.logs)       newLogs = response.logs;
      else if (Array.isArray(response)) newLogs = response;
      setTableLogs(prev => append ? [...prev, ...newLogs] : newLogs);
      setHasMore(!!response.next);
    } catch (error) {
      toast({ title: "Error loading logs", description: "Failed to fetch request logs", variant: "destructive" });
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) { navigate("/platforms"); return; }
    const platforms = localStorage.getItem("user_platforms");
    if (platforms) {
      try {
        const arr = JSON.parse(platforms);
        const found = arr.find((p: any) => p.id === platformId);
        if (found) setPlatformName(found.name);
      } catch {}
    }
    // Reset filter-first-run guard so the filter useEffect doesn't double-fetch
    // on the fresh mount triggered by this navigation.
    isFilterFirstRun.current = true;
    setLoading(true); setPage(1); setHasMore(true);
    fetchStatsForRange(platformId, statsRange);
    fetchTablePage(platformId, 1, false);
  // location.key changes on every React Router navigation to this page,
  // ensuring data reloads whenever the user arrives here (not just on first mount).
  }, [location.key]);

  // Re-fetch stats whenever the time range changes
  useEffect(() => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (platformId) fetchStatsForRange(platformId, statsRange);
  }, [statsRange]);

  // Re-fetch table when any filter changes (debounce text inputs).
  // Skips the initial mount run — the main useEffect above already handles that.
  useEffect(() => {
    if (isFilterFirstRun.current) {
      isFilterFirstRun.current = false;
      return;
    }
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) return;
    setPage(1);
    const delay = (searchTerm || ipFilter || endpointFilter) ? 500 : 0;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchTablePage(platformId, 1, false);
    }, delay);
    return () => clearTimeout(timer);
  }, [searchTerm, ipFilter, endpointFilter, methodFilter, statusCodeFilter, threatLevelFilter, wafBlockedFilter]);

  useEffect(() => {
    setMethodFilter(searchParams.get("method") || "all");
    setStatusCodeFilter(searchParams.get("status_code") || "all");
    setThreatLevelFilter(searchParams.get("threat_level") || "all");
    setWafBlockedFilter(searchParams.get("blocked") || "all");
  }, [searchParams]);

  // ── IP Intel fetch — fires when modal opens ───────────────────────────────
  useEffect(() => {
    if (!selectedLog || !isDetailsOpen) { setIpInfo(null); setAbuse(null); return; }
    const ip = selectedLog.client_ip;
    if (!ip) return;

    setIpLoading(true);
    setIpInfo(null);
    setAbuse(null);
    const controller = new AbortController();
    const token      = localStorage.getItem('auth_token');

    const geoFetch = fetch(`https://ipinfo.io/${ip}/json`, { signal: controller.signal })
      .then(r => r.json())
      .catch(() => null);

    // Route through our own backend proxy — key stays server-side, no CORS issues.
    const abuseFetch = fetch(
      `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/abuseipdb-check/?ip=${encodeURIComponent(ip)}`,
      {
        signal: controller.signal,
        headers: {
          ...(token ? { Authorization: `Token ${token}` } : {}),
          Accept: 'application/json',
        },
      },
    )
      .then(r => r.json())
      .then(d => d?.data ?? null)
      .catch(() => null);

    Promise.all([geoFetch, abuseFetch]).then(([geo, ab]) => {
      setIpInfo(geo && !geo.error ? geo : null);
      setAbuse(ab);
      setIpLoading(false);
    });

    return () => controller.abort();
  }, [selectedLog, isDetailsOpen]);

  const analytics = statsData;

  // Filtering is now server-side — tableLogs already contains filtered results from the API.
  // Only country filter remains client-side (no backend param for it in this view).
  const filteredTableLogs = useMemo(() => {
    if (!countryFilter) return tableLogs;
    return tableLogs.filter(log => {
      const c = (log as any).country || (log as any).country_code;
      if (!c) return true;
      const sel = countriesData.find((cd: any) => cd.name === countryFilter || cd.code === countryFilter);
      return sel ? (c === sel.code || c === sel.name || c.toLowerCase() === sel.name.toLowerCase()) : true;
    });
  }, [tableLogs, countryFilter]);

  const updateQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    value ? params.set(key, value) : params.delete(key);
    setSearchParams(params);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (key === "blocked") { updateQueryParam(key, value); }
    else {
      params.delete("method"); params.delete("status_code"); params.delete("threat_level");
      if (value !== "all") params.set(key, value);
      setSearchParams(params);
    }
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchTerm(""); setIpFilter(""); setCountryFilter(null);
  };

  const loadMore = () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (platformId && hasMore && !loadingMore) { fetchTablePage(platformId, page + 1, true); setPage(p => p + 1); }
  };

  const handleRefresh = () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) return;
    setLoading(true); setPage(1); setHasMore(true);
    fetchStatsForRange(platformId, statsRange);
    fetchTablePage(platformId, 1, false);
  };

  const exportLogs = () => {
    const src = filteredTableLogs;
    const rangeLabel = TIME_RANGE_OPTIONS.find(o => o.value === statsRange)?.label ?? "today";
    const csv = [
      ["Timestamp","Method","Path","Status Code","IP","User Agent","WAF Blocked","Threat Level"],
      ...src.map(log => [log.timestamp, log.method, log.path, log.status_code.toString(), log.client_ip, log.user_agent, log.waf_blocked ? "Yes" : "No", log.threat_level || "none"]),
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `security-hub-${rangeLabel.toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBlockIP = async (ip: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      await apiService.addToBlacklist({ platform_uuid: platformId, ip });
      toast({ title: "IP Blocked", description: `${ip} added to blacklist.` });
      setBlockIPDialog({ open: false, ip: "" });
    } catch {
      toast({ title: "Error", description: "Failed to block IP.", variant: "destructive" });
    }
  };

  const handleBlockEndpoint = async (endpointString: string) => {
    try {
      const { endpointId } = blockEndpointDialog;
      if (!endpointId) throw new Error("Endpoint ID not found");
      await apiService.updateEndpoint(endpointId, { is_protected: true });
      toast({ title: "Endpoint Protected", description: `${endpointString} is now protected.` });
      setBlockEndpointDialog({ open: false, endpoint: "", endpointId: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to protect endpoint.", variant: "destructive" });
    }
  };

  // ── Colour helpers ────────────────────────────────────────────────────────
  const getMethodColor = (method: string) => ({
    GET:    "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    POST:   "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    PUT:    "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    PATCH:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  }[method] || "bg-gray-100 text-gray-800");

  const getStatusCodeColor = (s: number) =>
    s < 300 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    : s < 400 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    : s < 500 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";

  const getThreatLevelColor = (t: string) => ({
    high:   "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    low:    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    none:   "bg-gray-100 text-gray-800",
  }[t] || "bg-gray-100 text-gray-800");

  const rangeLabel = TIME_RANGE_OPTIONS.find(o => o.value === statsRange)?.label ?? "Today";

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              {platformName && <div className="mb-4"><span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">{platformName}</span></div>}
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">Security Hub</h1>
              <p className="text-sm text-blue-100 max-w-xl">Comprehensive request log analysis and security investigation</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh}
                className="rounded-full border-white/50 bg-white/15 px-4 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white">
                <RefreshCw className="mr-2 h-4 w-4" />Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white">
                <Download className="mr-2 h-4 w-4" />Export CSV ({rangeLabel})
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Time range selector */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Statistics — {rangeLabel}
              {statsLoading && <span className="ml-2 text-xs font-normal text-slate-400">(loading…)</span>}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {statsData.totalLogs.toLocaleString()} total requests in range
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TIME_RANGE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => { setStatsRange(opt.value); localStorage.setItem('heimdall_securityhub_range', opt.value); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  statsRange === opt.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-[#0d1829] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-blue-900/30 hover:border-blue-300"
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "total_requests",   value: analytics.totalLogs,  sub: `Total requests — ${rangeLabel}`,   icon: <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />,   bar: "from-blue-600 to-sky-500",     barBg: "bg-blue-50 dark:bg-slate-800",   pct: 100 },
            { label: "blocked_requests", value: analytics.blockedLogs, sub: `Threats blocked — ${rangeLabel}`, icon: <Ban      className="h-4 w-4 text-red-500 dark:text-red-400" />,       bar: "from-red-500 to-rose-500",     barBg: "bg-red-50 dark:bg-slate-800",    pct: analytics.totalLogs > 0 ? (analytics.blockedLogs / analytics.totalLogs) * 100 : 0 },
            { label: "unique_ips",       value: analytics.uniqueIPs,   sub: `Source addresses — ${rangeLabel}`, icon: <MapPin  className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />, bar: "from-emerald-500 to-teal-500", barBg: "bg-emerald-50 dark:bg-slate-800", pct: 100 },
          ].map(m => (
            <div key={m.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{m.label}</span>
                  {m.icon}
                </div>
                <div className="mt-4">
                  {statsLoading
                    ? <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    : <AnimatedNumber value={m.value} className="font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white" />}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">{m.sub}</p>
                <div className={`mt-4 h-1.5 rounded-full ${m.barBg}`}>
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${m.bar} transition-all duration-700`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[
            { icon: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />, label: "Errors",           value: analytics.errorLogs,                   sub: null },
            { icon: <Clock         className="h-5 w-5 text-purple-600 dark:text-purple-400" />, label: "Avg Response",     value: Math.round(analytics.avgResponseTime), sub: "ms" },
            { icon: <Bot           className="h-5 w-5 text-orange-600 dark:text-orange-400" />, label: "Bot Requests",     value: analytics.botRequests,                 sub: analytics.totalLogs > 0 ? `${((analytics.botRequests / analytics.totalLogs) * 100).toFixed(1)}%` : null },
            { icon: <TrendingUp    className="h-5 w-5 text-rose-600 dark:text-rose-400"    />, label: "Suspicious IPs",   value: analytics.suspiciousIPs,               sub: ">10 req/IP" },
            { icon: <Globe         className="h-5 w-5 text-indigo-600 dark:text-indigo-400"/>, label: "Unique Countries", value: analytics.uniqueCountries,             sub: null },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-4">
              {s.icon}
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">{s.label}</p>
              {statsLoading
                ? <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
                : <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={s.value} />{s.label === "Avg Response" ? "ms" : ""}</p>}
              {s.sub && s.label !== "Avg Response" && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Refine request log table</p>
            </div>
            {Array.from(searchParams.keys()).length > 0 && (
              <button onClick={clearAllFilters} className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg">Clear All</button>
            )}
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input placeholder="Search logs by IP, path, endpoint, user agent..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); updateQueryParam("search", e.target.value); }}
              className="pl-10 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" />
          </div>

          {/* Endpoint autocomplete search */}
          <div className="relative w-full" ref={endpointRef}>
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Filter by endpoint path (e.g. /api/users)…"
              value={endpointSearch}
              onChange={e => { setEndpointSearch(e.target.value); setShowEndpointDropdown(true); if (!e.target.value) setEndpointFilter(""); }}
              onFocus={() => setShowEndpointDropdown(true)}
              onBlur={() => setTimeout(() => setShowEndpointDropdown(false), 150)}
              className="pl-10 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
            />
            {endpointFilter && (
              <button onClick={() => { setEndpointFilter(""); setEndpointSearch(""); }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
            {showEndpointDropdown && endpointSuggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                {endpointSuggestions.map(path => (
                  <button key={path} onMouseDown={() => { setEndpointFilter(path); setEndpointSearch(path); setShowEndpointDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 truncate">
                    {path}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={methodFilter}      onValueChange={v => handleFilterChange("method", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="GET">GET</SelectItem><SelectItem value="POST">POST</SelectItem><SelectItem value="PUT">PUT</SelectItem><SelectItem value="PATCH">PATCH</SelectItem><SelectItem value="DELETE">DELETE</SelectItem></SelectContent>
            </Select>
            <Select value={statusCodeFilter}  onValueChange={v => handleFilterChange("status_code", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="Status Code" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status Codes</SelectItem><SelectItem value="200">200 OK</SelectItem><SelectItem value="400">400 Bad Request</SelectItem><SelectItem value="401">401 Unauthorized</SelectItem><SelectItem value="403">403 Forbidden</SelectItem><SelectItem value="404">404 Not Found</SelectItem><SelectItem value="500">500 Server Error</SelectItem></SelectContent>
            </Select>
            <Select value={threatLevelFilter} onValueChange={v => handleFilterChange("threat_level", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="Threat Level" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="high">🔴 High</SelectItem><SelectItem value="medium">🟡 Medium</SelectItem><SelectItem value="low">🟢 Low</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
            </Select>
            <Select value={wafBlockedFilter}  onValueChange={v => handleFilterChange("blocked", v)}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="WAF Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Requests</SelectItem><SelectItem value="blocked">🚫 Blocked</SelectItem><SelectItem value="allowed">✅ Allowed</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Request Logs</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{filteredTableLogs.length > 0 ? `Showing ${filteredTableLogs.length} requests` : "No logs to display"}</p>
          </div>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : filteredTableLogs.length === 0 ? (
              <div className="text-center py-16"><Shield className="h-12 w-12 mx-auto text-blue-400 mb-4" /><p className="text-lg font-semibold text-slate-900 dark:text-white">No logs match your filters</p></div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        {["Timestamp","Method","Path","Status","IP","Response","WAF","Threat","Actions"].map(h => (
                          <th key={h} className={`px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 ${h === "Actions" ? "text-center" : ""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                      {filteredTableLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                          <td className="px-4 py-3"><Badge className={getMethodColor(log.method)}>{log.method}</Badge></td>
                          <td className="px-4 py-3"><span className="font-mono text-xs truncate max-w-xs block text-slate-700 dark:text-slate-300" title={log.path}>{log.path}</span></td>
                          <td className="px-4 py-3"><Badge className={getStatusCodeColor(log.status_code)}>{log.status_code}</Badge></td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              {countryFlag((log as any).country_code || (log as any).country) && <span className="text-sm leading-none">{countryFlag((log as any).country_code || (log as any).country)}</span>}
                              {log.client_ip}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{log.response_time_ms ? Math.round(log.response_time_ms) : "-"}ms</td>
                          <td className="px-4 py-3">{log.waf_blocked ? <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">🚫 Blocked</Badge> : <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">✓ Allowed</Badge>}</td>
                          <td className="px-4 py-3">{log.threat_level && log.threat_level !== "none" ? <Badge className={getThreatLevelColor(log.threat_level)}>{log.threat_level}</Badge> : <Badge variant="outline">-</Badge>}</td>
                          <td className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedLog(log); setIsDetailsOpen(true); }}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBlockIPDialog({ open: true, ip: log.client_ip })} className="text-red-600"><Ban className="h-4 w-4 mr-2" /> Block IP</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBlockEndpointDialog({ open: true, endpoint: `${log.method} ${log.path}`, endpointId: log.endpoint })} className="text-orange-600"><Shield className="h-4 w-4 mr-2" /> Protect Endpoint</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden space-y-3 pt-4">
                  {filteredTableLogs.map(log => (
                    <div key={log.id} className="border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-4 bg-white dark:bg-slate-900">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getMethodColor(log.method)}>{log.method}</Badge>
                        <Badge className={getStatusCodeColor(log.status_code)}>{log.status_code}</Badge>
                      </div>
                      <p className="font-mono text-sm truncate text-slate-700 dark:text-slate-300 mb-2">{log.path}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {countryFlag((log as any).country_code || (log as any).country) && <span className="text-sm leading-none">{countryFlag((log as any).country_code || (log as any).country)}</span>}
                          <span className="text-xs font-mono">{log.client_ip}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setIsDetailsOpen(true); }}>Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMore && !loading && (
                  <div className="text-center mt-6">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading..." : "Load more"}</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        <LogDetailModal
          log={selectedLog}
          open={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          ipInfo={ipInfo}
          abuse={abuse}
          ipLoading={ipLoading}
          onBlockIP={(ip) => setBlockIPDialog({ open: true, ip })}
        />

        {/* Block IP Dialog */}
        <AlertDialog open={blockIPDialog.open} onOpenChange={open => setBlockIPDialog({ open, ip: blockIPDialog.ip })}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Block IP Address</AlertDialogTitle>
              <AlertDialogDescription>{blockIPDialog.ip} will be permanently added to your IP blacklist.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBlockIP(blockIPDialog.ip)} className="rounded-xl bg-red-600 hover:bg-red-700">Block IP Address</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Block Endpoint Dialog */}
        <AlertDialog open={blockEndpointDialog.open} onOpenChange={open => setBlockEndpointDialog({ open, endpoint: blockEndpointDialog.endpoint, endpointId: blockEndpointDialog.endpointId })}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Protect Endpoint</AlertDialogTitle>
              <AlertDialogDescription>{blockEndpointDialog.endpoint} will have enhanced protection enabled.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBlockEndpoint(blockEndpointDialog.endpoint)} className="rounded-xl bg-orange-600 hover:bg-orange-700">Protect Endpoint</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default SecurityHub;