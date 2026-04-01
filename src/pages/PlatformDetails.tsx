import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Globe,
  Eye,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '@/services/api';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const TIME_RANGES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Year', value: '1y' },
  { label: 'Custom', value: 'custom' },
];

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

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

const AnimatedNumber = ({
  value,
  decimals = 0,
  suffix = '',
  className = '',
}: AnimatedNumberProps) => {
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

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
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

const PlatformDetails = () => {
  const { id } = useParams();
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
  const [trafficTimeRange, setTrafficTimeRange] = useState('7d');
  const [threatTimeRange, setThreatTimeRange] = useState('7d');
  const [trafficCustomRange, setTrafficCustomRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [threatCustomRange, setThreatCustomRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [isAlertClicked, setIsAlertClicked] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    if (!id) return;
    setLoading(true);

    apiService
      .getPlatformDetails(id)
      .then((data: any) => {
        setPlatform(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message);
        setLoading(false);
      });

    apiService
      .getAnalytics(id)
      .then((data: any) => {
        if (data.success && data.analytics) {
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

    apiService
      .getPlatformEndpoints(id)
      .then((res: any) => {
        const endpointsArr = Array.isArray(res) ? res : res.results || [];
        setEndpoints(endpointsArr);
      })
      .catch(() => setEndpoints([]));

    apiService
      .getPlatformWAFRules(id)
      .then((data: any) => setWafRules(data))
      .catch(() => {});
  };

  const fetchTrafficData = () => {
    if (!id) return;

    const params =
      trafficTimeRange === 'custom' && trafficCustomRange.start && trafficCustomRange.end
        ? {
            start: trafficCustomRange.start.toISOString(),
            end: trafficCustomRange.end.toISOString(),
          }
        : { range: trafficTimeRange };

    apiService
      .getAnalytics(id, params)
      .then((data: any) => {
        if (data.success && data.analytics) {
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && trafficTimeRange in data.analytics) {
            analyticsData = data.analytics[trafficTimeRange];
          } else {
            analyticsData = data.analytics;
          }

          if (analyticsData.method_status_breakdown) {
            const trafficArr = HTTP_METHODS.map((method) => {
              const methodData = analyticsData.method_status_breakdown[method] || {};
              return {
                method,
                ...methodData,
              };
            });
            setTrafficData(trafficArr);
          } else {
            setTrafficData([]);
          }
        }
      })
      .catch(() => setTrafficData([]));

    apiService
      .getPlatformRequestLogs(id, { num: '10' })
      .then((logs: any) => {
        if (Array.isArray(logs)) {
          setThreatLogs(logs);
        } else if (logs?.logs && Array.isArray(logs.logs)) {
          setThreatLogs(logs.logs);
        } else {
          setThreatLogs([]);
        }
      })
      .catch(() => setThreatLogs([]));
  };

  const fetchThreatData = () => {
    if (!id) return;

    const params =
      threatTimeRange === 'custom' && threatCustomRange.start && threatCustomRange.end
        ? {
            start: threatCustomRange.start.toISOString(),
            end: threatCustomRange.end.toISOString(),
          }
        : { range: threatTimeRange };

    apiService
      .getAnalytics(id, params)
      .then((data: any) => {
        if (data.success && data.analytics) {
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && threatTimeRange in data.analytics) {
            analyticsData = data.analytics[threatTimeRange];
          } else {
            analyticsData = data.analytics;
          }

          if (analyticsData.status_code_breakdown) {
            const colors: Record<string, string> = {
              '200': '#22c55e',
              '201': '#16a34a',
              '204': '#10b981',
              '400': '#f97316',
              '403': '#ef4444',
              '404': '#6366f1',
              '500': '#eab308',
              '504': '#06b6d4',
              other: '#9ca3af',
            };

            const responseCodeArr = Object.entries(analyticsData.status_code_breakdown).map(([name, value]) => ({
              name,
              value: Number(value),
              color: colors[name] || colors.other,
            }));

            setThreatTypes(responseCodeArr);
          } else {
            setThreatTypes([]);
          }

          if (analyticsData.threat_type_summary && typeof analyticsData.threat_type_summary === 'object') {
            const threatTypeColors: Record<string, string> = {
              'Malicious Payload': '#ef4444',
              'XSS Attack Detected': '#f59e0b',
              'Suspicious User Agent': '#8b5cf6',
              'Brute Force Attempt': '#dc2626',
              'SQL Injection Detection': '#ec4899',
              'Command Injection': '#06b6d4',
              'Path Traversal': '#10b981',
              'Rate Limit Exceeded': '#3b82f6',
              'Security Misconfiguration': '#f97316',
              'Insecure Direct Object Reference': '#eab308',
              'Broken Authentication': '#14b8a6',
              'SQL Injection': '#ef4444',
              XSS: '#f59e0b',
              'Brute Force': '#dc2626',
              CSRF: '#06b6d4',
              XXE: '#10b981',
              SSRF: '#3b82f6',
              LFI: '#f97316',
              RFI: '#eab308',
            };

            const threatTypeArr = Object.entries(analyticsData.threat_type_summary)
              .map(([name, value]) => ({
                name,
                value: Number(value),
                color: threatTypeColors[name] || '#9ca3af',
              }))
              .filter((item) => item.value > 0)
              .sort((a, b) => b.value - a.value);

            setThreatTypesByCategory(threatTypeArr);
          } else if (analyticsData.threat_types && typeof analyticsData.threat_types === 'object') {
            const threatTypeColors: Record<string, string> = {
              'SQL Injection': '#ef4444',
              XSS: '#f59e0b',
              'Path Traversal': '#8b5cf6',
              'Brute Force': '#dc2626',
              'Command Injection': '#ec4899',
              CSRF: '#06b6d4',
              XXE: '#10b981',
              SSRF: '#3b82f6',
              LFI: '#f97316',
              RFI: '#eab308',
            };

            const threatTypeArr = Object.entries(analyticsData.threat_types)
              .map(([name, value]) => ({
                name,
                value: Number(value),
                color: threatTypeColors[name] || '#9ca3af',
              }))
              .filter((item) => item.value > 0)
              .sort((a, b) => b.value - a.value);

            setThreatTypesByCategory(threatTypeArr);
          } else {
            setThreatTypesByCategory([]);
          }

          if (analyticsData.country_summary && Array.isArray(analyticsData.country_summary)) {
            const countryArr = analyticsData.country_summary
              .map((item: any) => ({
                code: item.country_code?.toUpperCase() || '',
                name: item.country_name || item.country_code || '',
                count: Number(item.total_requests || 0),
              }))
              .filter((item: CountryData) => item.count > 0 && item.code)
              .sort((a: CountryData, b: CountryData) => b.count - a.count);

            setCountryData(countryArr);
          } else if (analyticsData.country_breakdown || analyticsData.geographic_breakdown) {
            const countryBreakdown = analyticsData.country_breakdown || analyticsData.geographic_breakdown;
            const countryCodeToName: Record<string, string> = {
              US: 'United States',
              CN: 'China',
              RU: 'Russia',
              GB: 'United Kingdom',
              DE: 'Germany',
              FR: 'France',
              IN: 'India',
              BR: 'Brazil',
              JP: 'Japan',
              CA: 'Canada',
              AU: 'Australia',
              KR: 'South Korea',
              IT: 'Italy',
              ES: 'Spain',
              NL: 'Netherlands',
              MX: 'Mexico',
              ID: 'Indonesia',
              TR: 'Turkey',
              SA: 'Saudi Arabia',
              PL: 'Poland',
              EG: 'Egypt',
              CH: 'Switzerland',
              NG: 'Nigeria',
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

          if (analyticsData.owasp_top10_summary && Array.isArray(analyticsData.owasp_top10_summary)) {
            const owaspCategoryMap: Record<
              string,
              { name: string; category: string; severity: 'critical' | 'high' | 'medium' | 'low' }
            > = {
              'A01:2021 – Broken Access Control': {
                name: 'Broken Access Control',
                category: 'Access Control',
                severity: 'critical',
              },
              'A02:2021 – Cryptographic Failures': {
                name: 'Cryptographic Failures',
                category: 'Cryptography',
                severity: 'high',
              },
              'A03:2021 – Injection': {
                name: 'Injection',
                category: 'Injection',
                severity: 'critical',
              },
              'A04:2021 – Insecure Design': {
                name: 'Insecure Design',
                category: 'Design',
                severity: 'high',
              },
              'A05:2021 – Security Misconfiguration': {
                name: 'Security Misconfiguration',
                category: 'Configuration',
                severity: 'medium',
              },
              'A06:2021 – Vulnerable Components': {
                name: 'Vulnerable Components',
                category: 'Components',
                severity: 'high',
              },
              'A07:2021 – Identification and Authentication Failures': {
                name: 'Authentication Failures',
                category: 'Authentication',
                severity: 'critical',
              },
              'A08:2021 – Software and Data Integrity Failures': {
                name: 'Software & Data Integrity',
                category: 'Integrity',
                severity: 'high',
              },
              'A09:2021 – Security Logging and Monitoring Failures': {
                name: 'Security Logging Failures',
                category: 'Logging',
                severity: 'medium',
              },
              'A10:2021 – Server-Side Request Forgery': {
                name: 'Server-Side Request Forgery',
                category: 'SSRF',
                severity: 'high',
              },
            };

            const owaspArr = analyticsData.owasp_top10_summary
              .map((item: any) => {
                const categoryInfo = owaspCategoryMap[item.category] || {
                  name: item.category,
                  category: item.category.split(':')[0] || item.category,
                  severity: 'medium' as const,
                };

                return {
                  name: categoryInfo.name,
                  category: categoryInfo.category,
                  count: Number(item.threat_count || 0),
                  severity: categoryInfo.severity,
                };
              })
              .filter((item: OWASPThreat) => item.count > 0)
              .sort((a: OWASPThreat, b: OWASPThreat) => b.count - a.count);

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

            setOwaspThreats(
              allOwaspItems.map((defaultItem) => {
                const apiItem = owaspArr.find((item) => item.name === defaultItem.name);
                return apiItem || defaultItem;
              })
            );
          } else {
            setOwaspThreats([
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
          }
        }
      })
      .catch(() => {
        setThreatTypes([]);
        setThreatTypesByCategory([]);
        setCountryData([]);
      });
  };

  const getOtherRequests = (a: any) => {
    if (!a) return null;

    if (typeof a.failed_requests === 'number' && typeof a.blocked_requests === 'number') {
      return Number(a.failed_requests) - Number(a.blocked_requests);
    }

    if (a.status_code_breakdown && typeof a.status_code_breakdown === 'object') {
      const blockedCodes = ['403'];
      return Object.entries(a.status_code_breakdown).reduce((sum: number, [code, val]) => {
        if (code === '200' || code === '201' || code === '204' || blockedCodes.includes(code)) return sum;
        return sum + Number(val || 0);
      }, 0);
    }

    if (
      typeof a.total_requests === 'number' &&
      typeof a.successful_requests === 'number' &&
      typeof a.blocked_requests === 'number'
    ) {
      const inferred = Number(a.total_requests) - Number(a.successful_requests) - Number(a.blocked_requests);
      return inferred >= 0 ? inferred : 0;
    }

    return null;
  };

  const getCleanRequests = (a: any) => {
    if (!a) return null;
    const total = typeof a.total_requests === 'number' ? Number(a.total_requests) : null;
    const blocked = typeof a.blocked_requests === 'number' ? Number(a.blocked_requests) : 0;
    const other = getOtherRequests(a);

    if (total !== null && other !== null) {
      const clean = total - blocked - other;
      return clean >= 0 ? clean : 0;
    }

    if (typeof a.successful_requests === 'number') {
      return Number(a.successful_requests);
    }

    return null;
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    fetchTrafficData();
  }, [id, trafficTimeRange, trafficCustomRange]);

  useEffect(() => {
    fetchThreatData();
  }, [id, threatTimeRange, threatCustomRange]);

  const totalRequests = analytics ? Number(analytics.total_requests ?? 0) : 0;
  const blockedRequests = analytics ? Number(analytics.blocked_requests ?? 0) : 0;
  const cleanRequests = getCleanRequests(analytics);
  const otherRequests = getOtherRequests(analytics);
  const successRate =
    analytics && typeof analytics.success_rate === 'number' ? Number(analytics.success_rate) : 0;
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

  const hasTrafficData = trafficOverviewData.some((item) => item.total > 0);

  const trafficChartDisplayData = hasTrafficData
    ? trafficOverviewData
    : HTTP_METHODS.map((method) => ({
        method,
        total: method === 'PUT' ? 4 : 0,
      }));

  const maxTraffic = Math.max(...trafficOverviewData.map((item) => item.total), 1);
  const topThreats = threatTypesByCategory.slice(0, 4);
  const maxThreat = Math.max(...topThreats.map((item: any) => Number(item.value || 0)), 1);
  const activeOwaspThreats = owaspThreats.filter((item) => item.count > 0);

  const recentRows =
    threatLogs.length > 0
      ? threatLogs.slice(0, 4).map((log: any) => ({
          id: log.id,
          path: log.path || '-',
          attack:
            log.waf_rule_triggered ||
            (log.threat_level && log.threat_level !== 'none'
              ? `${String(log.threat_level).toUpperCase()} Threat`
              : log.waf_blocked
                ? 'Suspicious Request'
                : 'Clean'),
          source: log.client_ip || '-',
          status: log.waf_blocked ? 'blocked' : Number(log.status_code) >= 400 ? 'warning' : 'allowed',
        }))
      : [
          { id: 'row-1', path: '/api/v1/users', attack: 'SQL Injection', source: '192.168.1.45', status: 'blocked' },
          { id: 'row-2', path: '/api/v1/auth/login', attack: 'Brute Force', source: '10.0.0.12', status: 'warning' },
          { id: 'row-3', path: '/api/v1/products', attack: 'Clean', source: '203.45.67.89', status: 'allowed' },
          { id: 'row-4', path: '/api/v1/exec', attack: 'RCE Attempt', source: '45.33.32.156', status: 'blocked' },
        ];

  const alertCount =
    threatLogs.length > 0
      ? threatLogs.filter((log) => log.waf_blocked || (log.threat_level && log.threat_level !== 'none')).length
      : 3;

  const panelClass =
    'border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#111827] dark:shadow-none';

  const softPanelClass =
    'border border-slate-200/70 bg-white dark:border-slate-800/80 dark:bg-[#111827]';

  const controlClass =
    'rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-[#172033] dark:text-white dark:focus:border-blue-400';

  const metricNumberClass =
    'font-sans tabular-nums text-[2.35rem] font-semibold leading-none tracking-[-0.05em] text-slate-950 dark:text-white';

  const secondaryButtonClass =
    'border-blue-200/60 bg-white text-slate-900 hover:!bg-slate-50 hover:!text-slate-900 dark:border-white/10 dark:bg-[#172033] dark:text-white dark:hover:!bg-[#1d2940] dark:hover:!text-white';

  const primaryButtonClass =
    'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md hover:from-blue-500 hover:to-cyan-400 hover:text-white';

  const getThreatBadgeClass = (name: string) => {
    const value = name.toLowerCase();
    if (value.includes('sql')) {
      return 'border border-red-200/60 bg-red-50 text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300';
    }
    if (value.includes('xss') || value.includes('script')) {
      return 'border border-amber-200/60 bg-amber-50 text-amber-500 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300';
    }
    if (value.includes('brute') || value.includes('auth') || value.includes('rate')) {
      return 'border border-blue-200/60 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';
    }
    return 'border border-cyan-200/60 bg-cyan-50 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300';
  };

  const getThreatCode = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.map((word) => word[0]).join('').slice(0, 3).toUpperCase();
  };

  const getStatusClass = (status: string) => {
    if (status === 'blocked') {
      return 'border border-red-200/60 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300';
    }
    if (status === 'allowed') {
      return 'border border-emerald-200/60 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';
    }
    return 'border border-amber-200/60 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300';
  };

  const getAttackTextClass = (attack: string) => {
    const value = attack.toLowerCase();
    if (value.includes('clean')) return 'text-emerald-600 dark:text-emerald-300';
    if (value.includes('brute') || value.includes('warning')) return 'text-amber-600 dark:text-amber-300';
    return 'text-red-500 dark:text-red-300';
  };

  if (loading) {
    return (
      <div className="-mx-4 -mt-4 min-h-[calc(100vh-64px)] bg-[#f4f8ff] px-4 py-10 dark:bg-[#0f1724] sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className={`flex h-72 items-center justify-center rounded-[24px] ${panelClass}`}>
          <div className="text-center">
            <Activity className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600 dark:text-blue-300" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 dark:text-red-300">Error: {error}</div>;
  }

  if (!platform) {
    return <div className="p-8 text-center text-slate-900 dark:text-white">Workspace not found.</div>;
  }

  return (
    <div className="-mx-4 -mt-4 min-h-[calc(100vh-64px)] bg-[#f4f8ff] px-4 pb-10 pt-6 dark:bg-[#0f1724] sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>


              <motion.button
                onClick={() => {
                  setIsAlertClicked(true);
                  navigate('/security-hub');
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-300 hover:shadow-md ${
                  !isAlertClicked
                    ? 'border-red-300/70 bg-red-50/90 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300'
                    : 'border-red-300/70 bg-red-50/90 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300'
                }`}
              >
                <motion.span
                  className="relative flex h-2 w-2"
                  animate={!isAlertClicked ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={
                    !isAlertClicked
                      ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0 }
                  }
                >
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-red-500"
                    animate={!isAlertClicked ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                    transition={
                      !isAlertClicked
                        ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0 }
                    }
                    style={{ opacity: 0.5 }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </motion.span>
                {alertCount || 0} alerts
              </motion.button>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 dark:border-white/10 dark:bg-[#172033] dark:text-blue-300">
                <Activity className="h-3 w-3" />
                AI analysing
              </span>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <h1 className="text-[2.4rem] font-bold tracking-[-0.04em] text-slate-950 dark:text-white">
                Security Dashboard
              </h1>
              <span className="mb-[0.42rem] text-[0.95rem] font-normal text-slate-500 dark:text-slate-400">
                · {platform?.name || 'Sample Backend 2'}
              </span>
            </div>

                       <p className="mt-2 font-mono text-[11px] tracking-[0.03em] text-slate-400 dark:text-slate-500">
              real_time - updated just now
            </p>



            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-200/60 bg-white px-3 py-1 text-[11px] font-mono text-slate-600 dark:border-white/10 dark:bg-[#172033] dark:text-slate-300">
                clean_requests {typeof cleanRequests === 'number' ? cleanRequests.toLocaleString() : '--'}
              </span>
              <span className="rounded-full border border-blue-200/60 bg-white px-3 py-1 text-[11px] font-mono text-slate-600 dark:border-white/10 dark:bg-[#172033] dark:text-slate-300">
                other_requests {typeof otherRequests === 'number' ? otherRequests.toLocaleString() : '--'}
              </span>
              <span className="rounded-full border border-blue-200/60 bg-white px-3 py-1 text-[11px] font-mono text-slate-600 dark:border-white/10 dark:bg-[#172033] dark:text-slate-300">
                waf_rules {Array.isArray(wafRules) ? wafRules.length : 0}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/platforms')} className={secondaryButtonClass}>
              <Eye className="mr-2 h-4 w-4" />
              View Workspaces
            </Button>

            <Button onClick={() => navigate('/onboarding')} className={primaryButtonClass}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </div>
        </motion.div>

    

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: 'easeOut' }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <Card className={`rounded-[22px] transition-all duration-300 hover:shadow-lg ${panelClass}`}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  total_requests
                </span>
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>

              <AnimatedNumber value={totalRequests} className={metricNumberClass} />

              <p className="mt-3 flex items-center text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                +12.4% today
              </p>

              <div className="mt-4 h-[3px] rounded-full bg-blue-100 dark:bg-white/10">
                <div className="h-[3px] w-[72%] rounded-full bg-gradient-to-r from-blue-600 to-sky-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-[22px] transition-all duration-300 hover:shadow-lg ${panelClass}`}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  threats_blocked
                </span>
                <Shield className="h-4 w-4 text-red-500" />
              </div>

              <AnimatedNumber value={blockedRequests} className={metricNumberClass} />

              <p className="mt-3 text-sm font-semibold text-red-500 dark:text-red-300">
                +{Math.max(1, Math.floor(blockedRequests * 0.1))} new
              </p>

              <div className="mt-4 h-[3px] rounded-full bg-red-100 dark:bg-white/10">
                <div className="h-[3px] w-[28%] rounded-full bg-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-[22px] transition-all duration-300 hover:shadow-lg ${panelClass}`}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  blocked_rate
                </span>
                <AlertTriangle className="h-4 w-4 text-cyan-500" />
              </div>

              <AnimatedNumber value={blockedRate} decimals={2} suffix="%" className={metricNumberClass} />

              <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                <AnimatedNumber value={successRate} decimals={2} suffix="% success rate" />
              </p>

              <div className="mt-4 h-[3px] rounded-full bg-cyan-100 dark:bg-white/10">
                <div className="h-[3px] w-[18%] rounded-full bg-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-[22px] transition-all duration-300 hover:shadow-lg ${panelClass}`}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  active_endpoints
                </span>
                <Globe className="h-4 w-4 text-emerald-500" />
              </div>

              <AnimatedNumber value={activeEndpointCount} className={metricNumberClass} />

              <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                Monitoring active
              </p>

              <div className="mt-4 h-[3px] rounded-full bg-emerald-100 dark:bg-white/10">
                <div className="h-[3px] w-[96%] rounded-full bg-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: 'easeOut' }}
          className="grid gap-4 xl:grid-cols-[1.55fr_.9fr]"
        >
          <Card className={`rounded-[22px] ${panelClass}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-0">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                  Traffic overview
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Request volume by HTTP method
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select className={controlClass} value={trafficTimeRange} onChange={(e) => setTrafficTimeRange(e.target.value)}>
                  {TIME_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>

                {trafficTimeRange === 'custom' && (
                  <>
                    <input
                      type="date"
                      className={controlClass}
                      value={trafficCustomRange.start ? trafficCustomRange.start.toISOString().slice(0, 10) : ''}
                      onChange={(e) =>
                        setTrafficCustomRange((prev) => ({
                          ...prev,
                          start: e.target.value ? new Date(e.target.value) : null,
                        }))
                      }
                    />
                    <input
                      type="date"
                      className={controlClass}
                      value={trafficCustomRange.end ? trafficCustomRange.end.toISOString().slice(0, 10) : ''}
                      onChange={(e) =>
                        setTrafficCustomRange((prev) => ({
                          ...prev,
                          end: e.target.value ? new Date(e.target.value) : null,
                        }))
                      }
                    />
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 min-h-[340px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trafficChartDisplayData} barSize={58}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
                  <XAxis
                    dataKey="method"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748B' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    domain={hasTrafficData ? ['auto', 'auto'] : [0, 4]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: '1px solid rgba(37,99,235,0.12)',
                      background: 'rgba(255,255,255,0.98)',
                      boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                    }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[0, 0, 0, 0]}
                    isAnimationActive={true}
                    animationBegin={120}
                    animationDuration={700}
                    animationEasing="ease-out"
                  >
                    {trafficChartDisplayData.map((entry, index) => (
                      <Cell
                        key={`traffic-${index}`}
                        fill={
                          hasTrafficData
                            ? entry.total === maxTraffic
                              ? '#2563EB'
                              : 'rgba(37,99,235,0.28)'
                            : entry.method === 'PUT'
                              ? '#cfcfcf'
                              : 'rgba(15,23,42,0.04)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className={`rounded-[22px] ${panelClass}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-0">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                  Top threats
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Highest-volume attack patterns
                </CardDescription>
              </div>

              <button onClick={() => navigate('/threat-logs')} className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                view_all()
              </button>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {topThreats.length > 0 ? (
                topThreats.map((threat: any) => (
                  <div key={threat.name} className="flex items-center gap-3">
                    <span className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold ${getThreatBadgeClass(threat.name)}`}>
                      {getThreatCode(threat.name)}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                      {threat.name}
                    </span>

                    <div className="h-[3px] w-16 overflow-hidden rounded-full bg-blue-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(Number(threat.value) / maxThreat) * 100}%`,
                          backgroundColor: threat.color,
                        }}
                      />
                    </div>

                    <span className="w-8 text-right font-sans tabular-nums text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      {threat.value}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Shield className="mx-auto mb-4 h-10 w-10 opacity-35" />
                    <p className="text-sm">No threat data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div> 

        {/* --- UI ONLY: Live Threat Activity section restored (design only, no logic touched) --- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.11, ease: 'easeOut' }}
        >
          <Card className={`rounded-[22px] ${panelClass}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-0">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mr-1" />
                    Live Threat Activity
                  </span>
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Real-time API requests and security events
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex items-center justify-center min-h-[110px]">
              {/* This is a placeholder for live threat logs. No logic or API connection here. */}
              <span className="text-slate-500 dark:text-slate-400 text-base">No threat logs found.</span>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
        >
          <Card className={`rounded-[22px] ${panelClass}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-0">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                  Recent threat events
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Real-time security events
                </CardDescription>
              </div>

              <button onClick={() => navigate('/threat-logs')} className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                view_logs()
              </button>
            </CardHeader>

            <CardContent className="p-5">
              <div className="overflow-hidden rounded-xl border border-blue-100/70 dark:border-white/10">
                <div className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] gap-3 border-b border-blue-100/70 bg-blue-50/50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Endpoint
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Attack Type
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Source IP
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Status
                  </span>
                </div>

                <div className="divide-y divide-blue-100/70 dark:divide-white/10">
                  {recentRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50/40 dark:hover:bg-white/5"
                    >
                      <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-300">
                        {row.path}
                      </span>

                      <span className={`text-sm font-semibold ${getAttackTextClass(row.attack)}`}>
                        {row.attack}
                      </span>

                      <span className="font-mono text-sm text-slate-400 dark:text-slate-500">{row.source}</span>

                      <span className={`inline-flex w-fit rounded-md px-3 py-1 text-[11px] font-bold ${getStatusClass(row.status)}`}>
                        {row.status === 'blocked' ? 'Blocked' : row.status === 'allowed' ? 'Allowed' : 'Warning'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.16, ease: 'easeOut' }}
          className="grid gap-4 xl:grid-cols-3"
        >
          <Card className={`rounded-[22px] ${panelClass}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-0">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                  Response Code Breakdown
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Distribution of response codes
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select className={controlClass} value={threatTimeRange} onChange={(e) => setThreatTimeRange(e.target.value)}>
                  {TIME_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>

                {threatTimeRange === 'custom' && (
                  <>
                    <input
                      type="date"
                      className={controlClass}
                      value={threatCustomRange.start ? threatCustomRange.start.toISOString().slice(0, 10) : ''}
                      onChange={(e) =>
                        setThreatCustomRange((prev) => ({
                          ...prev,
                          start: e.target.value ? new Date(e.target.value) : null,
                        }))
                      }
                    />
                    <input
                      type="date"
                      className={controlClass}
                      value={threatCustomRange.end ? threatCustomRange.end.toISOString().slice(0, 10) : ''}
                      onChange={(e) =>
                        setThreatCustomRange((prev) => ({
                          ...prev,
                          end: e.target.value ? new Date(e.target.value) : null,
                        }))
                      }
                    />
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {threatTypes.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={threatTypes}
                        dataKey="value"
                        innerRadius={48}
                        outerRadius={82}
                        paddingAngle={3}
                        isAnimationActive={false}
                      >
                        {threatTypes.map((entry: any, index: number) => (
                          <Cell key={`resp-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {threatTypes.slice(0, 5).map((item: any) => (
                      <div key={item.name} className={`flex items-center justify-between rounded-xl px-3 py-2 ${softPanelClass}`}>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
                        </div>
                        <span className="font-sans tabular-nums text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="mx-auto mb-4 h-10 w-10 opacity-35" />
                    <p className="text-sm">No response code data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`rounded-[22px] ${panelClass}`}>
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                Requests by Countries
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Geographic distribution of API requests
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 p-5">
              {countryData.length > 0 ? (
                countryData.slice(0, 6).map((country) => (
                  <div
                    key={country.code}
                    className={`rounded-xl px-3 py-3 ${softPanelClass} ${
                      hoveredCountry === country.code ? 'border-blue-400/70' : ''
                    }`}
                    onMouseEnter={() => setHoveredCountry(country.code)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-300">
                          {country.code}
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{country.name}</span>
                      </div>

                      <span className="font-sans tabular-nums text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {country.count.toLocaleString()}
                      </span>
                    </div>

                    <div className="h-[3px] rounded-full bg-blue-100 dark:bg-white/10">
                      <div
                        className="h-[3px] rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                        style={{
                          width: `${(country.count / Math.max(...countryData.map((item) => item.count), 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Globe className="mx-auto mb-4 h-10 w-10 opacity-35" />
                    <p className="text-sm">No country data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`rounded-[22px] ${panelClass}`}>
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                OWASP Top 10
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Detected risks by OWASP category
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              {activeOwaspThreats.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={activeOwaspThreats}>
                    <defs>
                      <linearGradient id="owaspFillPlatform" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.52} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563EB"
                      fill="url(#owaspFillPlatform)"
                      strokeWidth={2.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Shield className="mx-auto mb-4 h-10 w-10 opacity-35" />
                    <p className="text-sm">No OWASP threat data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {/* Added 4 more dashboard boxes below, UI only, no logic changed */}
          {[
            {
              title: 'Security Hub',
              description: 'Triage security logs and alerts',
              icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
              url: '/security-hub',
            },
            {
              title: 'Threat Logs',
              description: 'Review detailed security events',
              icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
              url: '/threat-logs',
            },
            {
              title: 'API Endpoints',
              description: 'Manage and monitor API endpoints',
              icon: <Globe className="h-5 w-5 text-cyan-500" />,
              url: '/api-endpoints',
            },
            {
              title: 'WAF Rules',
              description: 'Configure security rules and policies',
              icon: <Shield className="h-5 w-5 text-red-500" />,
              url: '/waf-rules',
            },
            {
              title: 'User Management',
              description: 'Manage team access and permissions',
              icon: <span className="inline-block"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="#22c55e"/></svg></span>,
              url: '/users',
            },
            {
              title: 'Audit Logs',
              description: 'View system activity and changes',
              icon: <span className="inline-block"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H7V5h10v14Zm-5-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4h-2V7h2v6Z" fill="#a78bfa"/></svg></span>,
              url: '/audit-logs',
            },
            {
              title: 'IP Blacklist',
              description: 'Manage blocked IP addresses',
              icon: <span className="inline-block"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59Z" fill="#ef4444"/></svg></span>,
              url: '/ip-blacklist',
            },
            {
              title: 'Security Alerts',
              description: 'Configure and manage security alerts',
              icon: <span className="inline-block"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" fill="#6366f1"/></svg></span>,
              url: '/security-alerts',
            },
          ].map((action) => (
            <Card
              key={action.title}
              className={`cursor-pointer rounded-[20px] transition-colors hover:bg-slate-50 dark:hover:bg-[#161f32] ${panelClass}`}
              onClick={() => navigate(action.url)}
            >
              <CardContent className="p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100/70 bg-white dark:border-white/10 dark:bg-[#172033]">
                  {action.icon}
                </div>

                <h3 className="text-base font-semibold text-slate-950 dark:text-white">{action.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{action.description}</p>

                <div className="mt-4">
                  <Button variant="outline" size="sm" className={`w-full ${secondaryButtonClass}`}>
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default PlatformDetails;
