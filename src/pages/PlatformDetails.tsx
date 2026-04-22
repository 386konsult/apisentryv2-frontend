import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  Shield, AlertTriangle, Activity, TrendingUp,
  Globe, Eye, Plus, Search, Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '@/services/api';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const TIME_RANGES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Year', value: '1y' },
];

// ── localStorage key scoped per platform ─────────────────────────────────────
const getStorageKey = (id: string | undefined) => `heimdall_timeRange_${id ?? 'default'}`;

interface OWASPThreat {
  name: string;
  category: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface CountryData {
  code: string;
  name: string;
  count: number;
}

interface PlatformMember {
  id: string;
  user_email: string;
  user_name: string;
  role: string;
  is_owner: boolean;
}

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
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

const PlatformDetails: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [platform, setPlatform] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [wafRules, setWafRules] = useState<any[]>([]);
  const [threatLogs, setThreatLogs] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [threatTypes, setThreatTypes] = useState<any[]>([]);
  const [threatTypesByCategory, setThreatTypesByCategory] = useState<any[]>([]);
  const [owaspThreats, setOwaspThreats] = useState<OWASPThreat[]>([
    { name: 'Broken Access Control', category: 'Access Control', count: 0, severity: 'critical' },
    { name: 'Cryptographic Failures', category: 'Cryptography', count: 0, severity: 'high' },
    { name: 'Injection', category: 'Injection', count: 0, severity: 'critical' },
    { name: 'Insecure Design', category: 'Design', count: 0, severity: 'high' },
    { name: 'Security Misconfiguration', category: 'Configuration', count: 0, severity: 'medium' },
    { name: 'Vulnerable Components', category: 'Components', count: 0, severity: 'high' },
    { name: 'Authentication Failures', category: 'Authentication', count: 0, severity: 'critical' },
    { name: 'Software & Data Integrity', category: 'Integrity', count: 0, severity: 'high' },
    { name: 'Security Logging Failures', category: 'Logging', count: 0, severity: 'medium' },
    { name: 'Server-Side Request Forgery', category: 'SSRF', count: 0, severity: 'high' },
  ]);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [platformMembers, setPlatformMembers] = useState<PlatformMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // ── Time range — initialised from localStorage, scoped per platform id ────
  const [timeRange, setTimeRange] = useState<string>(() => {
    try {
      return localStorage.getItem(getStorageKey(id)) || '7d';
    } catch {
      return '7d';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(id), timeRange);
    } catch {}
  }, [timeRange, id]);

  const [isAlertClicked, setIsAlertClicked] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    if (!id) return;
    setLoading(true);

    apiService.getPlatformDetails(id)
      .then((data: any) => { setPlatform(data); setLoading(false); })
      .catch((err: any) => { setError(err?.message ?? 'Failed to load workspace'); setLoading(false); });

    apiService.getAnalytics(id)
      .then((data: any) => {
        if (data?.success && data.analytics) {
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && '1y' in data.analytics) {
            analyticsData = data.analytics['1y'];
          } else {
            analyticsData = data.analytics;
          }
          setAnalytics(analyticsData);
        }
      })
      .catch(() => setAnalytics(null));

    apiService.getPlatformEndpoints(id)
      .then((res: any) => {
        const endpointsArr = Array.isArray(res) ? res : res?.results || [];
        setEndpoints(endpointsArr);
      })
      .catch(() => setEndpoints([]));

    apiService.getPlatformWAFRules(id)
      .then((data: any) => setWafRules(Array.isArray(data) ? data : data?.results || []))
      .catch(() => {});

    apiService.getPlatformMembers(id)
      .then((members: any[]) => {
        const formatted = members.map(m => ({
          id: m.id,
          user_email: m.user_email,
          user_name: m.user_name,
          role: m.role || (m.is_owner ? 'owner' : 'member'),
          is_owner: m.is_owner || false,
        }));
        setPlatformMembers(formatted);
      })
      .catch((err) => console.error('Failed to fetch members:', err))
      .finally(() => setMembersLoading(false));
  };

  const fetchAllRangedData = () => {
    if (!id) return;

    const params = { range: timeRange };

    apiService.getAnalytics(id, params)
      .then((data: any) => {
        if (data?.success && data.analytics) {
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && timeRange in data.analytics) {
            analyticsData = data.analytics[timeRange];
          } else {
            analyticsData = data.analytics;
          }

          // Traffic chart
          if (analyticsData?.method_status_breakdown) {
            const trafficArr = HTTP_METHODS.map((method) => {
              const methodData = analyticsData.method_status_breakdown[method] || {};
              return { method, ...methodData };
            });
            setTrafficData(trafficArr);
          } else {
            setTrafficData([]);
          }

          // Response code breakdown
          if (analyticsData?.status_code_breakdown) {
            const colors: Record<string, string> = {
              '200': '#22c55e', '201': '#16a34a', '204': '#10b981',
              '400': '#f97316', '403': '#ef4444', '404': '#6366f1',
              '500': '#eab308', '504': '#06b6d4', other: '#9ca3af',
            };
            const responseCodeArr = Object.entries(analyticsData.status_code_breakdown).map(([name, value]) => ({
              name, value: Number(value), color: colors[name] || colors.other,
            }));
            setThreatTypes(responseCodeArr);
          } else {
            setThreatTypes([]);
          }

          // Threat types by category
          const threatTypeColors: Record<string, string> = {
            'Malicious Payload': '#ef4444', 'XSS Attack Detected': '#f59e0b',
            'Suspicious User Agent': '#8b5cf6', 'Brute Force Attempt': '#dc2626',
            'SQL Injection Detection': '#ec4899', 'Command Injection': '#06b6d4',
            'Path Traversal': '#10b981', 'Rate Limit Exceeded': '#3b82f6',
            'Security Misconfiguration': '#f97316', 'Insecure Direct Object Reference': '#eab308',
            'Broken Authentication': '#14b8a6', 'SQL Injection': '#ef4444',
            XSS: '#f59e0b', 'Brute Force': '#dc2626', CSRF: '#06b6d4',
            XXE: '#10b981', SSRF: '#3b82f6', LFI: '#f97316', RFI: '#eab308',
          };

          if (analyticsData?.threat_type_summary && typeof analyticsData.threat_type_summary === 'object') {
            const threatTypeArr = Object.entries(analyticsData.threat_type_summary)
              .map(([name, value]) => ({ name, value: Number(value), color: threatTypeColors[name] || '#9ca3af' }))
              .filter((item) => item.value > 0)
              .sort((a, b) => b.value - a.value);
            setThreatTypesByCategory(threatTypeArr);
          } else if (analyticsData?.threat_types && typeof analyticsData.threat_types === 'object') {
            const threatTypeArr = Object.entries(analyticsData.threat_types)
              .map(([name, value]) => ({ name, value: Number(value), color: threatTypeColors[name] || '#9ca3af' }))
              .filter((item) => item.value > 0)
              .sort((a, b) => b.value - a.value);
            setThreatTypesByCategory(threatTypeArr);
          } else {
            setThreatTypesByCategory([]);
          }

          // Country data
          if (analyticsData?.country_summary && Array.isArray(analyticsData.country_summary)) {
            const countryArr = analyticsData.country_summary
              .map((item: any) => ({
                code: (item.country_code || '').toUpperCase(),
                name: item.country_name || item.country_code || '',
                count: Number(item.total_requests || 0),
              }))
              .filter((item: CountryData) => item.count > 0 && item.code)
              .sort((a, b) => b.count - a.count);
            setCountryData(countryArr);
          } else if (analyticsData?.country_breakdown || analyticsData?.geographic_breakdown) {
            const countryBreakdown = analyticsData.country_breakdown || analyticsData.geographic_breakdown;
            const countryCodeToName: Record<string, string> = {
              US: 'United States', CN: 'China', RU: 'Russia', GB: 'United Kingdom',
              DE: 'Germany', FR: 'France', IN: 'India', BR: 'Brazil', JP: 'Japan',
              CA: 'Canada', AU: 'Australia', KR: 'South Korea', IT: 'Italy',
              ES: 'Spain', NL: 'Netherlands', MX: 'Mexico', ID: 'Indonesia',
              TR: 'Turkey', SA: 'Saudi Arabia', PL: 'Poland', EG: 'Egypt',
              CH: 'Switzerland', NG: 'Nigeria',
            };
            const countryArr = Object.entries(countryBreakdown)
              .map(([code, count]) => ({
                code: code.toUpperCase(),
                name: countryCodeToName[code.toUpperCase()] || code,
                count: Number(count),
              }))
              .filter((item) => item.count > 0)
              .sort((a, b) => b.count - a.count);
            setCountryData(countryArr);
          } else {
            setCountryData([]);
          }

          // OWASP
          if (analyticsData?.owasp_top10_summary && Array.isArray(analyticsData.owasp_top10_summary)) {
            const owaspCategoryMap: Record<string, { name: string; category: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = {
              'A01:2021 – Broken Access Control': { name: 'Broken Access Control', category: 'Access Control', severity: 'critical' },
              'A02:2021 – Cryptographic Failures': { name: 'Cryptographic Failures', category: 'Cryptography', severity: 'high' },
              'A03:2021 – Injection': { name: 'Injection', category: 'Injection', severity: 'critical' },
              'A04:2021 – Insecure Design': { name: 'Insecure Design', category: 'Design', severity: 'high' },
              'A05:2021 – Security Misconfiguration': { name: 'Security Misconfiguration', category: 'Configuration', severity: 'medium' },
              'A06:2021 – Vulnerable Components': { name: 'Vulnerable Components', category: 'Components', severity: 'high' },
              'A07:2021 – Identification and Authentication Failures': { name: 'Authentication Failures', category: 'Authentication', severity: 'critical' },
              'A08:2021 – Software and Data Integrity Failures': { name: 'Software & Data Integrity', category: 'Integrity', severity: 'high' },
              'A09:2021 – Security Logging and Monitoring Failures': { name: 'Security Logging Failures', category: 'Logging', severity: 'medium' },
              'A10:2021 – Server-Side Request Forgery': { name: 'Server-Side Request Forgery', category: 'SSRF', severity: 'high' },
            };
            const owaspArr = analyticsData.owasp_top10_summary
              .map((item: any) => {
                const categoryInfo = owaspCategoryMap[item.category] || {
                  name: item.category,
                  category: item.category.split(':')[0] || item.category,
                  severity: 'medium' as const,
                };
                return { name: categoryInfo.name, category: categoryInfo.category, count: Number(item.threat_count || 0), severity: categoryInfo.severity } as OWASPThreat;
              })
              .filter((item: OWASPThreat) => item.count > 0)
              .sort((a, b) => b.count - a.count);

            const allOwaspItems: OWASPThreat[] = [
              { name: 'Broken Access Control', category: 'Access Control', count: 0, severity: 'critical' },
              { name: 'Cryptographic Failures', category: 'Cryptography', count: 0, severity: 'high' },
              { name: 'Injection', category: 'Injection', count: 0, severity: 'critical' },
              { name: 'Insecure Design', category: 'Design', count: 0, severity: 'high' },
              { name: 'Security Misconfiguration', category: 'Configuration', count: 0, severity: 'medium' },
              { name: 'Vulnerable Components', category: 'Components', count: 0, severity: 'high' },
              { name: 'Authentication Failures', category: 'Authentication', count: 0, severity: 'critical' },
              { name: 'Software & Data Integrity', category: 'Integrity', count: 0, severity: 'high' },
              { name: 'Security Logging Failures', category: 'Logging', count: 0, severity: 'medium' },
              { name: 'Server-Side Request Forgery', category: 'SSRF', count: 0, severity: 'high' },
            ];
            setOwaspThreats(allOwaspItems.map((defaultItem) => {
              const apiItem = owaspArr.find((item) => item.name === defaultItem.name);
              return apiItem || defaultItem;
            }));
          }
        }
      })
      .catch(() => {
        setTrafficData([]);
        setThreatTypes([]);
        setThreatTypesByCategory([]);
        setCountryData([]);
      });

    apiService.getPlatformRequestLogs(id, { num: '10' })
      .then((logs: any) => {
        if (Array.isArray(logs)) setThreatLogs(logs);
        else if (logs?.logs && Array.isArray(logs.logs)) setThreatLogs(logs.logs);
        else setThreatLogs([]);
      })
      .catch(() => setThreatLogs([]));
  };

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { fetchAllRangedData(); }, [id, timeRange]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalRequests = analytics ? Number(analytics.total_requests ?? 0) : 0;
  const blockedRequests = analytics ? Number(analytics.blocked_requests ?? 0) : 0;
  const successRate = analytics && typeof analytics.success_rate === 'number' ? Number(analytics.success_rate) : 0;
  const blockedRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;
  const activeEndpointCount = Array.isArray(endpoints)
    ? endpoints.filter((e: any) => e.status === 'active' || e.is_active).length
    : 0;

  const trafficOverviewData = HTTP_METHODS.map((method) => {
    const row = trafficData.find((item: any) => item.method === method) || { method };
    const total = Object.entries(row).reduce((sum: number, [key, value]) => {
      if (key === 'method') return sum;
      return sum + Number(value || 0);
    }, 0);
    return { method, total };
  });

  const topThreats = threatTypesByCategory.slice(0, 4);
  const maxThreat = Math.max(...topThreats.map((item: any) => Number(item.value || 0)), 1);
  const activeOwaspThreats = owaspThreats.filter((item) => item.count > 0);

  const recentRows = threatLogs.slice(0, 4).map((log: any) => ({
    id: log.id ?? `${log.path}-${Math.random()}`,
    path: log.path || '-',
    attack: log.waf_rule_triggered || (log.threat_level && log.threat_level !== 'none'
      ? `${String(log.threat_level).toUpperCase()} Threat`
      : log.waf_blocked ? 'Suspicious Request' : 'Clean'),
    source: log.client_ip || '-',
    status: log.waf_blocked ? 'blocked' : Number(log.status_code) >= 400 ? 'warning' : 'allowed',
  }));

  // ── Style constants – no backdrop blur, solid background ──────────────────
  const cardClass = 'bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl';
  const headerClass = 'border-b border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900';
  const controlClass = 'rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
  const metricNumberClass = 'font-sans tabular-nums text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white';

  const getStatusClass = (status: string) => {
    if (status === 'blocked') return 'border border-red-200/60 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400';
    if (status === 'allowed') return 'border border-emerald-200/60 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400';
    return 'border border-amber-200/60 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400';
  };

  const getAttackTextClass = (attack: string) => {
    const value = (attack || '').toLowerCase();
    if (value.includes('clean')) return 'text-emerald-600 dark:text-emerald-400';
    if (value.includes('brute') || value.includes('warning')) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F4F8FF] dark:bg-[#0F1724]">
        <div className="flex h-72 w-full max-w-lg items-center justify-center rounded-2xl bg-white shadow-md dark:bg-slate-900">
          <div className="text-center">
            <Activity className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">Error: {error}</div>;
  if (!platform) return <div className="p-8 text-center text-slate-900 dark:text-white">Workspace not found.</div>;

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">

        {/* HEADER (gradient retained for visual impact) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  {platform?.name || 'Workspace'}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">
                Security Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Updated Just Now
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/platforms')}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
              >
                <Eye className="mr-2 h-4 w-4" />
                Workspaces
              </Button>
              <Button
                onClick={() => navigate('/onboarding')}
                className="rounded-full bg-white px-5 py-2 text-blue-600 font-medium hover:bg-white/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1.5 text-xs font-medium text-white border border-emerald-400/50">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>

            <button
              onClick={() => { setIsAlertClicked(true); navigate('/threat-logs'); }}
              className="inline-flex items-center gap-2 rounded-full bg-red-500/30 px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:bg-red-500/40 border border-red-400/50"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
              </span>
              Alerts
            </button>

            <div className="relative group">
              <span className="inline-flex cursor-default items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 group-hover:bg-white/30">
                <Activity className="h-3.5 w-3.5" />
                AI analysing
              </span>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 w-64 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                <div className="relative rounded-2xl border border-white/20 bg-[#0f172a]/90 p-4 text-left shadow-xl">
                  <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border-b border-r border-white/20 bg-[#0f172a]/90" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                      <Activity className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white">AI Analysing — Coming Soon</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    A new AI-powered feature that gives you <span className="font-semibold text-cyan-400">real-time threat analysis</span>, live traffic insights, and intelligent security recommendations — all automatically.
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                    <span className="text-[10px] font-medium text-cyan-400">Actively being developed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* MAIN GRID — Traffic Overview (left) + Top Threats (right) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  {/* ── LEFT COLUMN: Traffic Overview Card (with chart fix) ── */}
  <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-4 border-b border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Traffic Overview</CardTitle>
          <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track request changes and protection metrics
          </CardDescription>
        </div>
      </div>
      <select
        className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
      >
        {TIME_RANGES.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </CardHeader>
    <CardContent className="p-6 pt-0">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div>
          <div className="text-4xl font-semibold text-slate-900 dark:text-white">
            {totalRequests.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total requests</div>
          {totalRequests > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <Activity className="h-3 w-3" />
              Active
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Blocked</div>
          <div className="mt-1 text-2xl font-semibold text-red-500 dark:text-red-400">
            {blockedRequests.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Block rate</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
            {totalRequests > 0 ? `${blockedRate.toFixed(1)}%` : "0.00%"}
          </div>
        </div>
      </div>

      {/* Chart container – fixed height + fallback */}
      <div className="h-64 w-full mt-4">
        {trafficOverviewData.length > 0 && trafficOverviewData.some((item) => item.total > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficOverviewData}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="method" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#2563EB"
                fill="url(#trafficGradient)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No traffic data available for the selected period
          </div>
        )}
      </div>
    </CardContent>
  </Card>

  {/* ── RIGHT COLUMN: Top Threats + Team Members (stacked) ── */}
  <div className="space-y-6">
    {/* Top Threats Card */}
    <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-4 border-b border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Top threats</CardTitle>
          <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Highest-volume attack patterns
          </CardDescription>
        </div>
        <button
          onClick={() => navigate("/threat-logs")}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          view_all
        </button>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {topThreats.length > 0 ? (
          (() => {
            const threat = topThreats[0];
            const getThreatCode = (name: string) => {
              const words = (name || "").split(" ");
              if (words.length === 1) return (words[0] || "").slice(0, 3).toUpperCase();
              return words
                .map((word) => word[0])
                .join("")
                .slice(0, 3)
                .toUpperCase();
            };
            const getThreatBadgeClass = (name: string) => {
              const value = (name || "").toLowerCase();
              if (value.includes("sql"))
                return "border border-red-200/60 bg-red-50 text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
              if (value.includes("xss") || value.includes("script"))
                return "border border-amber-200/60 bg-amber-50 text-amber-500 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
              if (value.includes("brute") || value.includes("auth") || value.includes("rate"))
                return "border border-blue-200/60 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";
              return "border border-cyan-200/60 bg-cyan-50 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400";
            };
            const threatCode = getThreatCode(threat.name);
            const threatBadgeClass = getThreatBadgeClass(threat.name);
            const threatValue = Number(threat.value || 0);
            const maxThreatValue = threatValue;
            const progressWidth = maxThreatValue > 0 ? (threatValue / maxThreatValue) * 100 : 0;
            return (
              <div className="flex items-center gap-3">
                <span
                  className={`flex-shrink-0 rounded-md px-2 py-1 font-mono text-[10px] font-bold ${threatBadgeClass}`}
                >
                  {threatCode}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                  {threat.name}
                </span>
                <div className="h-1.5 w-16 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(progressWidth, 100)}%`,
                      backgroundColor: threat.color || "#9ca3af",
                    }}
                  />
                </div>
                <span className="w-8 flex-shrink-0 text-right font-sans tabular-nums text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  {threatValue}
                </span>
              </div>
            );
          })()
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No threat data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Team Members Card */}
    <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4 border-b border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <button
          onClick={() => navigate("/users")}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          view_all
        </button>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {membersLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Activity className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : platformMembers.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            <Users className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No team members yet</p>
            <Button
              variant="link"
              className="mt-2 text-blue-600"
              onClick={() => navigate("/users")}
            >
              Invite users
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {platformMembers.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {member.user_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {member.user_name || member.user_email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {member.user_email}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    member.is_owner
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }
                >
                  {member.is_owner ? "Owner" : member.role || "Member"}
                </Badge>
              </div>
            ))}
            {platformMembers.length > 5 && (
              <div className="text-center mt-2">
                <button
                  onClick={() => navigate("/users")}
                  className="text-xs text-blue-600 hover:underline"
                >
                  +{platformMembers.length - 5} more
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</div>

        {/* METRIC CARDS (4) */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Total Requests */}
          <Card className={cardClass}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">total_requests</span>
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-4"><AnimatedNumber value={totalRequests} className={metricNumberClass} /></div>
              <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">
                {totalRequests > 0 ? 'Requests received' : 'No traffic yet'}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-blue-50 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-700"
                  style={{ width: totalRequests > 0 ? '100%' : '0%' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Threats Blocked */}
          <Card className={cardClass}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">threats_blocked</span>
                <Shield className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <div className="mt-4"><AnimatedNumber value={blockedRequests} className={metricNumberClass} /></div>
              <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">
                {blockedRequests > 0 ? 'Threats mitigated' : 'No threats blocked'}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-red-50 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-red-500 transition-all duration-700"
                  style={{ width: `${totalRequests > 0 ? Math.min(100, (blockedRequests / totalRequests) * 100) : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Blocked Rate */}
          <Card className={cardClass}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">blocked_rate</span>
                <AlertTriangle className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
              </div>
              <div className="mt-4">
                <AnimatedNumber value={blockedRate} decimals={2} suffix="%" className={metricNumberClass} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <AnimatedNumber value={successRate} decimals={2} suffix="% success rate" />
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-cyan-50 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-cyan-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, blockedRate ?? 0))}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Endpoints */}
          <Card className={cardClass}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">active_endpoints</span>
                <Globe className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="mt-4"><AnimatedNumber value={activeEndpointCount} className={metricNumberClass} /></div>
              <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {activeEndpointCount > 0 ? 'Monitoring active' : 'No endpoints yet'}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-emerald-50 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: activeEndpointCount > 0 ? '100%' : '0%' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* THREAT EVENTS TABLE */}
        <Card className={cardClass}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 p-6 pb-4 ${headerClass}`}>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Recent threat events</CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real-time security events</CardDescription>
            </div>
            <button onClick={() => navigate('/threat-logs')} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">view_logs()</button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {recentRows.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800">
                <div className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] gap-3 border-b border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                  {['Endpoint', 'Attack Type', 'Source IP', 'Status'].map((h) => (
                    <span key={h} className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{h}</span>
                  ))}
                </div>
                <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {recentRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">{row.path}</span>
                      <span className={`text-sm font-semibold ${getAttackTextClass(row.attack)}`}>{row.attack}</span>
                      <span className="font-mono text-sm text-slate-400 dark:text-slate-500">{row.source}</span>
                      <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-[11px] font-bold ${getStatusClass(row.status)}`}>
                        {row.status === 'blocked' ? 'Blocked' : row.status === 'allowed' ? 'Allowed' : 'Warning'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="text-center">
                  <Shield className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No threat events recorded yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LIVE THREAT ACTIVITY (full width) */}
        <Card className={cardClass}>
          <CardHeader className={`flex flex-row items-start justify-between space-y-0 p-6 pb-4 ${headerClass}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Live Threat Activity</CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real-time API requests and security events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {threatLogs && threatLogs.length > 0 ? (
              <div className="space-y-3">
                {threatLogs.slice(0, 8).map((log: any, idx: number) => {
                  const isBlocked = log.waf_blocked;
                  const threatLevel = log.threat_level || 'none';
                  const statusColor = isBlocked
                    ? 'text-red-600 dark:text-red-400'
                    : threatLevel !== 'none'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400';
                  return (
                    <div
                      key={log.id || idx}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                        isBlocked
                          ? 'border-red-200/60 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10'
                          : threatLevel !== 'none'
                          ? 'border-amber-200/60 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                          : 'border-emerald-200/60 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{log.method || 'GET'}</span>
                          <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{log.path || '/api/endpoint'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">{log.client_ip || 'Unknown IP'}</span>
                          <span className="text-slate-400 dark:text-slate-500">·</span>
                          <span className={statusColor}>
                            {isBlocked ? 'Blocked' : threatLevel !== 'none' ? `${threatLevel.toUpperCase()} Threat` : 'Clean'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{log.status_code || '200'}</span>
                        <div className={`h-2 w-2 rounded-full ${isBlocked ? 'bg-red-500' : threatLevel !== 'none' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="text-center">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-slate-400 dark:text-slate-500" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No live activity yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CHARTS (3‑column) */}
        <div className="grid gap-4 xl:grid-cols-3">
          {/* Response Code Breakdown */}
          <Card className={cardClass}>
            <CardHeader className={`flex flex-row items-start justify-between space-y-0 p-6 pb-4 ${headerClass}`}>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Response Code Breakdown</CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">Distribution of response codes</CardDescription>
              </div>
              <select className={controlClass} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                {TIME_RANGES.map((range) => (<option key={range.value} value={range.value}>{range.label}</option>))}
              </select>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {threatTypes.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={threatTypes} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2} isAnimationActive={false}>
                        {threatTypes.map((entry: any, index: number) => (<Cell key={`resp-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {threatTypes.slice(0, 4).map((item: any) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white border border-slate-200/70 dark:bg-slate-800 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-slate-700 dark:text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-sans tabular-nums text-xs font-semibold text-slate-500 dark:text-slate-400">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[240px] items-center justify-center">
                  <div className="text-center">
                    <Activity className="mx-auto mb-4 h-10 w-10 opacity-35" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requests by Countries */}
          <Card className={cardClass}>
            <CardHeader className={`p-6 pb-4 ${headerClass}`}>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Requests by Countries</CardTitle>
              <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">Geographic distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-0">
              {countryData.length > 0 ? (
                countryData.slice(0, 5).map((country) => (
                  <div
                    key={country.code}
                    className={`rounded-lg px-3 py-3 bg-white border border-slate-200/70 dark:bg-slate-800 dark:border-slate-700 ${hoveredCountry === country.code ? 'border-blue-400 dark:border-blue-500' : ''}`}
                    onMouseEnter={() => setHoveredCountry(country.code)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{country.code}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">{country.name}</span>
                      </div>
                      <span className="font-sans tabular-nums text-xs font-semibold text-slate-500 dark:text-slate-400">{country.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-blue-50 dark:bg-slate-800">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                        style={{ width: `${(country.count / Math.max(...countryData.map((item) => item.count), 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-[240px] items-center justify-center">
                  <div className="text-center">
                    <Globe className="mx-auto mb-4 h-10 w-10 opacity-35" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OWASP Top 10 */}
          <Card className={cardClass}>
            <CardHeader className={`p-6 pb-4 ${headerClass}`}>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">OWASP Top 10</CardTitle>
              <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">Detected risks</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {activeOwaspThreats.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={activeOwaspThreats}>
                    <defs>
                      <linearGradient id="owaspFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#owaspFill)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[240px] items-center justify-center">
                  <div className="text-center">
                    <Shield className="mx-auto mb-4 h-10 w-10 opacity-35" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No OWASP threats detected</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ACTION TILES */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: 'Security Hub', description: 'Triage security logs and alerts', icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />, url: '/security-hub' },
            { title: 'Threat Logs', description: 'Review detailed security events', icon: <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />, url: '/threat-logs' },
            { title: 'API Endpoints', description: 'Manage and monitor API endpoints', icon: <Globe className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />, url: '/api-endpoints' },
            { title: 'WAF Rules', description: 'Configure security rules and policies', icon: <Shield className="h-5 w-5 text-red-500 dark:text-red-400" />, url: '/waf-rules' },
            { title: 'User Management', description: 'Manage team access and permissions', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="#22c55e" /></svg>, url: '/users' },
            { title: 'Audit Logs', description: 'View system activity and changes', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H7V5h10v14Zm-5-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4h-2V7h2v6Z" fill="#a78bfa" /></svg>, url: '/audit-logs' },
            { title: 'IP Blacklist', description: 'Manage blocked IP addresses', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59Z" fill="#ef4444" /></svg>, url: '/ip-blacklist' },
            { title: 'Security Alerts', description: 'Configure and manage security alerts', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" fill="#6366f1" /></svg>, url: '/security-alerts' },
          ].map((action) => (
            <div key={action.title}>
              <Card className={`cursor-pointer transition-all hover:shadow-md ${cardClass}`} onClick={() => navigate(action.url)}>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                    {action.icon}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{action.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-lg border-slate-200/70 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                      onClick={(e) => { e.stopPropagation(); navigate(action.url); }}
                    >
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PlatformDetails;